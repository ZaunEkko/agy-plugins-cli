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
  .action(async () => {
    const config = loadConfig();
    if (config.marketplaces.length === 0) {
      console.log(chalk.yellow('No marketplaces registered yet.'));
      return;
    }
    
    console.log(chalk.white.bold('\nManage marketplaces\n'));
    console.log(chalk.blue('> + Add Marketplace\n'));
    
    const state = loadState();

    for (const repo of config.marketplaces) {
      const namespace = repo.split('/')[0].toLowerCase();
      
      let availableCount = 0;
      let lastUpdated = 'unknown';
      
      try {
        const plugins = await listPluginsInRepo(repo);
        availableCount = plugins.length;
        if (plugins.length > 0) {
          const latestDateStr = plugins.reduce((max, p) => p.date && (!max || new Date(p.date) > new Date(max)) ? p.date : max, null as string | null);
          if (latestDateStr) {
            const d = new Date(latestDateStr);
            lastUpdated = `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
          }
        }
      } catch (e) {
        // Ignore fetch error and keep defaults
      }

      const installedCount = Object.values(state.plugins).filter(p => p.repo === repo).length;

      console.log(chalk.gray(`  ● `) + chalk.white.bold(namespace));
      console.log(chalk.gray(`    ${repo}`));
      console.log(chalk.gray(`    ${availableCount} available • ${installedCount} installed • Updated ${lastUpdated}\n`));
    }
  });

marketplaceCmd
  .command('check <namespace>')
  .description('Check and list all available plugins in a specific namespace (e.g. @zaunekko)')
  .action(async (namespaceArg) => {
    let namespace = namespaceArg.replace('@', '').toLowerCase();
    const config = loadConfig();
    const state = loadState();
    
    const targetRepo = config.marketplaces.find(repo => repo.toLowerCase().includes(namespace));
    if (!targetRepo) {
      console.error(chalk.red(`Error: Namespace '${namespace}' not found in your marketplaces.`));
      process.exit(1);
    }

    const s = ora(`Checking namespace @${namespace}...`).start();
    let plugins: {name: string, date: string | null}[] = [];
    try {
      plugins = await listPluginsInRepo(targetRepo);
      s.stop();
    } catch (e: any) {
      s.fail(chalk.red(`Failed to check namespace @${namespace}`));
      return;
    }

    // Dynamic import to support ESM-only clack/prompts
    const { select, isCancel, multiselect } = await import('@clack/prompts');

    const installedPlugins = Object.entries(state.plugins).filter(([k, v]) => v.repo === targetRepo).map(([k, v]) => k);
    
    console.clear();
    console.log(chalk.white.bold(namespace));
    console.log(chalk.gray(targetRepo) + '\n');
    console.log(chalk.white(`${plugins.length} available plugins\n`));

    if (installedPlugins.length > 0) {
      console.log(chalk.white.bold(`Installed plugins (${installedPlugins.length}):`));
      installedPlugins.forEach(p => {
        console.log(chalk.gray(`● `) + chalk.white(p.split('@')[0]));
      });
      console.log('');
    }

    const action = await select({
      message: 'Select an action (Enter to select • Esc to go back)',
      options: [
        { value: 'browse', label: `> Browse plugins (${plugins.length})` },
        { value: 'update', label: `  Update marketplace` },
        { value: 'remove', label: `  Remove marketplace` }
      ],
    });

    if (isCancel(action)) {
      process.exit(0);
    }

    if (action === 'browse') {
      const selectedPlugins = await multiselect({
        message: 'Select plugins to install (Space to select, Enter to confirm)',
        options: plugins.map(p => ({
          value: p.name,
          label: p.name,
          hint: p.date ? `updated ${new Date(p.date).toISOString().split('T')[0]}` : ''
        })),
        required: false,
      });

      if (isCancel(selectedPlugins)) {
        process.exit(0);
      }

      const toInstall = selectedPlugins as string[];
      if (toInstall.length > 0) {
        for (const p of toInstall) {
           console.log(chalk.blue(`\nInstalling ${p}...`));
           const targetDir = getTargetDir(false);
           try {
             const result = await downloadPlugin(targetRepo, p, targetDir);
             const sha = await getLatestCommitSha(targetRepo, p);
             if (sha) {
               recordPluginInstall(`${p}@${namespace}`, targetRepo, sha, result.files, result.hooks);
             }
             console.log(chalk.green(`✓ Successfully installed ${p}`));
           } catch (e) {
             console.log(chalk.red(`Failed to install ${p}`));
           }
        }
      }
    } else if (action === 'update') {
      console.log(chalk.yellow('Update marketplace feature coming soon!'));
    } else if (action === 'remove') {
      console.log(chalk.yellow('Remove marketplace feature coming soon!'));
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
