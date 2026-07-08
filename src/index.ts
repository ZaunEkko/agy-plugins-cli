#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import * as path from 'path';
import * as os from 'os';
import { addMarketplace, loadConfig } from './config';
import { downloadPlugin, getLatestCommitSha, listPluginsInRepo } from './fetcher';
import { recordPluginInstall, getInstalledPlugin, loadState } from './state';
import { disablePlugin, enablePlugin, removePlugin } from './manager';
import ora from 'ora';

const program = new Command();

program
  .name('agy-plugin')
  .description('Antigravity CLI Package Manager')
  .version('1.0.0');

const getTargetDir = (isLocal: boolean) => {
  return isLocal ? path.join(process.cwd(), '.agents') : path.join(os.homedir(), '.gemini', 'config');
};

const marketplaceCmd = program
  .command('marketplace')
  .description('Manage plugin marketplaces');

marketplaceCmd
  .command('add <repo>')
  .description('Add a new marketplace repository (e.g. ZaunEkko/agy-plugins)')
  .action((repo) => {
    console.log(chalk.blue(`Adding marketplace: ${repo}`));
    addMarketplace(repo);
  });

marketplaceCmd
  .command('list')
  .description('List all registered marketplace namespaces')
  .action(() => {
    const config = loadConfig();
    if (config.marketplaces.length === 0) {
      console.log(chalk.yellow('No marketplaces registered yet.'));
    } else {
      console.log(chalk.blue.bold('\n📦 Registered Namespaces:'));
      config.marketplaces.forEach((repo, index) => {
        const namespace = repo.split('/')[0].toLowerCase();
        console.log(chalk.white(`  ${index + 1}. `) + chalk.green(`@${namespace}`) + chalk.gray(` -> ${repo}`));
      });
      console.log('');
    }
  });

marketplaceCmd
  .command('check <namespace>')
  .description('Check and list all available plugins in a specific namespace (e.g. @zaunekko)')
  .action(async (namespaceArg) => {
    let namespace = namespaceArg.replace('@', '').toLowerCase();
    const config = loadConfig();
    
    const targetRepo = config.marketplaces.find(repo => repo.toLowerCase().includes(namespace));
    if (!targetRepo) {
      console.error(chalk.red(`Error: Namespace '${namespace}' not found in your marketplaces.`));
      process.exit(1);
    }

    console.log(chalk.blue(`Fetching available plugins from ${targetRepo}...`));
    const spinner = ora(`Checking namespace @${namespace}...`).start();
    
    try {
      const plugins = await listPluginsInRepo(targetRepo);
      spinner.stop();
      
      if (plugins.length === 0) {
        console.log(chalk.yellow(`No plugins found in namespace @${namespace}.`));
      } else {
        console.log(chalk.green.bold(`\n🔌 Plugins available in @${namespace}:`));
        plugins.forEach(p => {
          const dateStr = p.date ? new Date(p.date).toISOString().split('T')[0] : 'unknown';
          console.log(chalk.white(`  - `) + chalk.cyan(`${p.name}@${namespace}`) + chalk.gray(` (updated: ${dateStr})`));
        });
        console.log('');
      }
    } catch (e: any) {
      spinner.fail(chalk.red(`Failed to check namespace @${namespace}`));
    }
  });

program
  .command('add <plugin>')
  .description('Install a plugin (e.g. commit-commands@zaunekko)')
  .option('-l, --local', 'Install locally to the current project instead of globally')
  .action(async (pluginArg, options) => {
    let pluginName = pluginArg;
    let namespace = null;

    if (pluginArg.includes('@')) {
      const parts = pluginArg.split('@');
      pluginName = parts[0];
      namespace = parts[1];
    }

    const config = loadConfig();
    let targetRepo: string | undefined;

    if (namespace) {
      targetRepo = config.marketplaces.find(repo => repo.toLowerCase().includes(namespace!.toLowerCase()));
      if (!targetRepo) {
        console.error(chalk.red(`Error: Namespace '${namespace}' not found in your marketplaces.`));
        process.exit(1);
      }
    } else {
      if (config.marketplaces.length === 0) {
        console.error(chalk.red(`Error: No marketplaces configured.`));
        process.exit(1);
      }
      targetRepo = config.marketplaces[0];
    }

    console.log(chalk.green(`Installing plugin: ${pluginName} from repository: ${targetRepo}`));
    
    const spinner = ora(`Downloading ${pluginName}...`).start();
    try {
      const targetDir = getTargetDir(options.local);
      const result = await downloadPlugin(targetRepo!, pluginName, targetDir);
      
      const sha = await getLatestCommitSha(targetRepo!, pluginName);
      if (sha) {
        recordPluginInstall(pluginArg, targetRepo!, sha, result.files, result.hooks);
      }
      
      spinner.succeed(chalk.green(`Successfully installed ${pluginName} to ${targetDir}`));
    } catch (error) {
      spinner.fail(chalk.red(`Failed to install ${pluginName}.`));
      process.exit(1);
    }
  });

program
  .command('update [plugin]')
  .description('Update a specific plugin or all installed plugins')
  .option('-l, --local', 'Update locally to the current project instead of globally')
  .action(async (pluginName, options) => {
    const state = loadState();
    const pluginsToUpdate = pluginName ? [pluginName] : Object.keys(state.plugins);
    
    if (pluginsToUpdate.length === 0) {
      console.log(chalk.yellow(`No plugins installed yet.`));
      return;
    }

    for (const name of pluginsToUpdate) {
      const installed = state.plugins[name];
      if (!installed) {
        console.log(chalk.red(`Plugin ${name} is not installed.`));
        continue;
      }

      let actualPluginName = name;
      if (name.includes('@')) {
        actualPluginName = name.split('@')[0];
      }

      console.log(chalk.blue(`Checking for updates: ${name}...`));
      const latestSha = await getLatestCommitSha(installed.repo, actualPluginName);
      
      if (!latestSha) {
        console.log(chalk.yellow(`Could not fetch version info for ${name}. Skipping.`));
        continue;
      }

      if (latestSha === installed.sha) {
        console.log(chalk.green(`✓ ${name} is already up to date.`));
      } else {
        console.log(chalk.cyan(`Update found for ${name}. Downloading new version...`));
        const spinner = ora(`Updating ${name}...`).start();
        try {
          const targetDir = getTargetDir(options.local);
          const result = await downloadPlugin(installed.repo, actualPluginName, targetDir, true);
          recordPluginInstall(name, installed.repo, latestSha, result.files, result.hooks);
          spinner.succeed(chalk.green(`Successfully updated ${name}.`));
        } catch (error) {
          spinner.fail(chalk.red(`Failed to update ${name}.`));
        }
      }
    }
  });

program
  .command('disable <plugin>')
  .description('Disable an installed plugin')
  .option('-l, --local', 'Disable from the local project instead of globally')
  .action((pluginName, options) => {
    disablePlugin(pluginName, getTargetDir(options.local));
  });

program
  .command('enable <plugin>')
  .description('Enable a disabled plugin')
  .option('-l, --local', 'Enable from the local project instead of globally')
  .action((pluginName, options) => {
    enablePlugin(pluginName, getTargetDir(options.local));
  });

program
  .command('remove <plugin>')
  .description('Uninstall a plugin and remove its files')
  .option('-l, --local', 'Remove from the local project instead of globally')
  .action((pluginName, options) => {
    removePlugin(pluginName, getTargetDir(options.local));
  });

program.parse(process.argv);
