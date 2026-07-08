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

const packageJson = require('../package.json') as { version: string };

const program = new Command();

program
  .name('agy-plugin')
  .description('Antigravity CLI Package Manager')
  .version(packageJson.version);

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

async function runCheckCommand(namespaceArg: string) {
  let namespace = namespaceArg.replace('@', '').toLowerCase();
  const config = loadConfig();
  
  const targetRepo = config.marketplaces.find(repo => repo.toLowerCase().includes(namespace));
  if (!targetRepo) {
    console.error(chalk.red(`Error: Namespace '${namespace}' not found in your marketplaces.`));
    process.exit(1);
  }

  const s = ora(`Checking namespace @${namespace}...`).start();
  let plugins: {name: string, date: string | null, sha: string | null}[] = [];
  try {
    plugins = await listPluginsInRepo(targetRepo);
    s.stop();
  } catch (e: any) {
    s.fail(chalk.red(`Failed to check namespace @${namespace}`));
    return;
  }

  const { select, isCancel, multiselect } = await import('@clack/prompts');

  while (true) {
    const state = loadState();
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
        { value: 'remove', label: `  Remove marketplace` },
        { value: 'back', label: `  < Go back` }
      ],
    });

    if (isCancel(action) || action === 'back') {
      return;
    }

    if (action === 'browse') {
      const selectedPlugins = await multiselect({
        message: 'Select plugins to install (Space to select, Enter to confirm, Esc to go back)',
        options: plugins.map(p => {
          const dateStr = p.date ? chalk.gray(` (updated ${new Date(p.date).toISOString().split('T')[0]})`) : '';
          
          let statusStr = '';
          const installedPlugin = state.plugins[p.name] || state.plugins[`${p.name}@${namespace}`];
          let colorize = chalk.white;
          
          if (installedPlugin) {
             if (p.sha && p.sha !== installedPlugin.sha) {
               statusStr = chalk.yellow(' (★ Update available)');
               colorize = chalk.yellow;
             } else {
               statusStr = chalk.green(' (✔ Installed)');
               colorize = chalk.green;
             }
          }

          return {
            value: p.name,
            label: `${colorize(p.name)}${statusStr}${dateStr}`
          };
        }),
        initialValues: plugins.filter(p => installedPlugins.includes(p.name) || installedPlugins.includes(`${p.name}@${namespace}`)).map(p => p.name),
        required: false,
      });

      if (isCancel(selectedPlugins)) {
        await new Promise(resolve => setTimeout(resolve, 50));
        continue;
      }

      const toInstall = selectedPlugins as string[];
      if (toInstall.length > 0) {
        for (const p of toInstall) {
           // Skip if already installed
           if (!installedPlugins.includes(p) && !installedPlugins.includes(`${p}@${namespace}`)) {
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
      }
      
      // Yield to event loop before recreating prompt to prevent terminal hangs
      await new Promise(resolve => setTimeout(resolve, 50));
    } else if (action === 'update') {
      console.log(chalk.yellow('Update marketplace feature coming soon!'));
      await new Promise(r => setTimeout(r, 1000));
    } else if (action === 'remove') {
      console.log(chalk.yellow('Remove marketplace feature coming soon!'));
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

marketplaceCmd
  .command('list')
  .description('List all registered marketplace namespaces')
  .action(async () => {
    const { select, isCancel, text } = await import('@clack/prompts');
    
    // Fetch GitHub stats ONCE to avoid rate limits when looping back
    const initialConfig = loadConfig();
    let stats: Record<string, {availableCount: number, lastUpdated: string}> = {};

    if (initialConfig.marketplaces.length > 0) {
      const s = ora('Loading marketplaces...').start();
      for (const repo of initialConfig.marketplaces) {
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
          // Ignore
        }
        stats[repo] = { availableCount, lastUpdated };
      }
      s.stop();
    }

    while (true) {
      // Reload config/state dynamically to reflect any new additions or installs
      const config = loadConfig();
      const state = loadState();

      let options: { value: string, label: string, hint?: string }[] = [];
      options.push({ value: 'add', label: chalk.blue('> + Add Marketplace') });

      for (const repo of config.marketplaces) {
        const namespace = repo.split('/')[0].toLowerCase();
        const stat = stats[repo] || { availableCount: 0, lastUpdated: 'unknown' };
        const installedCount = Object.values(state.plugins).filter(p => p.repo === repo).length;

        options.push({
          value: namespace,
          label: chalk.white(`● `) + chalk.white.bold(namespace) + chalk.gray(`  (${repo})`),
          hint: `${stat.availableCount} available • ${installedCount} installed • Updated ${stat.lastUpdated}`
        });
      }

      console.clear();
      const action = await select({
        message: 'Manage marketplaces',
        options,
      });

      if (isCancel(action)) {
        process.exit(0);
      }

      if (action === 'add') {
        const repo = await text({
          message: 'Enter the GitHub repository path (e.g., ZaunEkko/agy-plugins):',
          placeholder: 'username/repo',
          validate(value) {
            if (!value) return 'Repository path is required!';
            if (!value.includes('/')) return 'Must be in username/repo format!';
          }
        });
        if (isCancel(repo)) {
          await new Promise(resolve => setTimeout(resolve, 50));
          continue;
        }
        
        addMarketplace(repo as string);
        console.log(chalk.green(`\n✓ Successfully added marketplace: ${repo}`));
        await new Promise(r => setTimeout(r, 1000));
        // Note: For simplicity, new marketplaces added in the same session won't have pre-fetched stats until restart
      } else {
        await runCheckCommand(action as string);
        // Yield to event loop when returning from inner menu to prevent terminal hangs
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
  });

marketplaceCmd
  .command('check <namespace>')
  .description('Check and list all available plugins in a specific namespace (e.g. @zaunekko)')
  .action(runCheckCommand);

program
  .command('add <plugin>')
  .description('Install a plugin (e.g. commit-commands@zaunekko)')
  .option('-l, --local', 'Install locally to the current project instead of globally')
  .action(async (pluginArg, options) => {
    if (!pluginArg.includes('@')) {
      console.error(chalk.red(`Error: Please specify the marketplace namespace (e.g., ${pluginArg}@zaunekko)`));
      process.exit(1);
    }

    const parts = pluginArg.split('@');
    const pluginName = parts[0];
    const namespace = parts[1];

    const config = loadConfig();
    const targetRepo = config.marketplaces.find(repo => repo.toLowerCase().includes(namespace.toLowerCase()));
    
    if (!targetRepo) {
      console.error(chalk.red(`Error: Namespace '${namespace}' not found in your marketplaces.`));
      process.exit(1);
    }

    console.log(chalk.green(`Installing plugin: ${pluginName} from repository: ${targetRepo}`));
    
    const spinner = ora(`Downloading ${pluginName}...`).start();
    try {
      const targetDir = getTargetDir(options.local);
      const result = await downloadPlugin(targetRepo, pluginName, targetDir);
      
      const sha = await getLatestCommitSha(targetRepo, pluginName);
      if (sha) {
        recordPluginInstall(pluginArg, targetRepo, sha, result.files, result.hooks);
      }
      
      spinner.succeed(chalk.green(`Successfully installed ${pluginName} to ${targetDir}`));
    } catch (error) {
      spinner.fail(chalk.red(`Failed to install ${pluginName}.`));
      process.exit(1);
    }
  });

program
  .command('update [target]')
  .description('Update all plugins, a specific plugin (e.g. plugin@namespace), or a whole namespace (e.g. @namespace)')
  .option('-l, --local', 'Update locally to the current project instead of globally')
  .action(async (targetArg, options) => {
    const state = loadState();
    let pluginsToUpdate: string[] = [];

    if (!targetArg) {
      // Update ALL installed plugins
      pluginsToUpdate = Object.keys(state.plugins);
    } else if (targetArg.startsWith('@')) {
      // Update ALL plugins in a specific namespace
      const namespace = targetArg.replace('@', '').toLowerCase();
      const config = loadConfig();
      const targetRepo = config.marketplaces.find(repo => repo.toLowerCase().includes(namespace));
      
      if (!targetRepo) {
        console.error(chalk.red(`Error: Namespace '${namespace}' not found in your marketplaces.`));
        process.exit(1);
      }
      
      pluginsToUpdate = Object.entries(state.plugins)
        .filter(([k, v]) => v.repo === targetRepo)
        .map(([k, v]) => k);
        
      if (pluginsToUpdate.length === 0) {
        console.log(chalk.yellow(`No plugins installed from namespace @${namespace}.`));
        return;
      }
    } else {
      // Update a specific plugin
      pluginsToUpdate = [targetArg];
    }
    
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

      console.log(chalk.blue(`\nChecking for updates: ${name}...`));
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
