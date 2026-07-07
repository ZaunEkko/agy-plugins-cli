#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import * as path from 'path';
import { addMarketplace, loadConfig } from './config';
import { downloadPlugin } from './fetcher';
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

    // Resolve the repository from config
    const config = loadConfig();
    let targetRepo: string | undefined;

    if (namespace) {
      targetRepo = config.marketplaces.find(repo => repo.toLowerCase().includes(namespace!.toLowerCase()));
      if (!targetRepo) {
        console.error(chalk.red(`Error: Namespace '${namespace}' not found in your marketplaces.`));
        console.log(chalk.yellow(`Try adding it first: agy-plugin marketplace add ${namespace}/agy-plugins`));
        process.exit(1);
      }
    } else {
      if (config.marketplaces.length === 0) {
        console.error(chalk.red(`Error: No marketplaces configured.`));
        process.exit(1);
      }
      // Default to the first marketplace
      targetRepo = config.marketplaces[0];
    }

    console.log(chalk.green(`Installing plugin: ${pluginName} from repository: ${targetRepo}`));
    
    const spinner = ora(`Downloading ${pluginName}...`).start();
    try {
      // For now, download to .agy folder in the current directory
      const targetDir = path.join(process.cwd(), '.agy');
      await downloadPlugin(targetRepo, pluginName, targetDir);
      spinner.succeed(chalk.green(`Successfully installed ${pluginName} to ${targetDir}`));
    } catch (error) {
      spinner.fail(chalk.red(`Failed to install ${pluginName}.`));
      process.exit(1);
    }
  });

program.parse(process.argv);
