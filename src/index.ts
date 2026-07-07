#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import * as path from 'path';
import { addMarketplace, loadConfig } from './config';
import { downloadPlugin, getLatestCommitSha } from './fetcher';
import { recordPluginInstall, getInstalledPlugin, loadState } from './state';
import ora from 'ora';

const program = new Command();

program
  .name('agy-plugin')
  .description('Antigravity CLI Package Manager')
  .version('1.0.0');

// "marketplace" command
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

// "add" command
program
  .command('add <plugin>')
  .description('Install a plugin (e.g. commit-commands@zaunekko)')
  .action(async (pluginArg) => {
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
      const targetDir = path.join(process.cwd(), '.agy');
      await downloadPlugin(targetRepo, pluginName, targetDir);
      
      const sha = await getLatestCommitSha(targetRepo, pluginName);
      if (sha) {
        recordPluginInstall(pluginName, targetRepo, sha);
      }
      
      spinner.succeed(chalk.green(`Successfully installed ${pluginName} to ${targetDir}`));
    } catch (error) {
      spinner.fail(chalk.red(`Failed to install ${pluginName}.`));
      process.exit(1);
    }
  });

// "update" command
program
  .command('update [plugin]')
  .description('Update a specific plugin or all installed plugins')
  .action(async (pluginName) => {
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

      console.log(chalk.blue(`Checking for updates: ${name}...`));
      const latestSha = await getLatestCommitSha(installed.repo, name);
      
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
          const targetDir = path.join(process.cwd(), '.agy');
          await downloadPlugin(installed.repo, name, targetDir, true); // skip security prompt on update
          recordPluginInstall(name, installed.repo, latestSha);
          spinner.succeed(chalk.green(`Successfully updated ${name}.`));
        } catch (error) {
          spinner.fail(chalk.red(`Failed to update ${name}.`));
        }
      }
    }
  });

program.parse(process.argv);
