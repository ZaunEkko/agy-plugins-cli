import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { getInstalledPlugin, removePluginState } from './state';

function getHooksPath(targetDir: string) {
  return path.join(targetDir, 'hooks.json');
}

export function setPluginHooksState(targetDir: string, hooks: string[], enabled: boolean) {
  const hooksPath = getHooksPath(targetDir);
  if (!fs.existsSync(hooksPath)) return;
  try {
    const data = JSON.parse(fs.readFileSync(hooksPath, 'utf-8'));
    let changed = false;
    for (const hookName of hooks) {
      if (data[hookName]) {
        data[hookName].enabled = enabled;
        changed = true;
      }
    }
    if (changed) {
      fs.writeFileSync(hooksPath, JSON.stringify(data, null, 2), 'utf-8');
    }
  } catch (e) {
    console.warn(chalk.yellow(`Could not modify hooks at ${hooksPath}`));
  }
}

export function removePluginHooks(targetDir: string, hooks: string[]) {
  const hooksPath = getHooksPath(targetDir);
  if (!fs.existsSync(hooksPath)) return;
  try {
    const data = JSON.parse(fs.readFileSync(hooksPath, 'utf-8'));
    let changed = false;
    for (const hookName of hooks) {
      if (data[hookName]) {
        delete data[hookName];
        changed = true;
      }
    }
    if (changed) {
      fs.writeFileSync(hooksPath, JSON.stringify(data, null, 2), 'utf-8');
    }
  } catch (e) {
    console.warn(chalk.yellow(`Could not remove hooks at ${hooksPath}`));
  }
}

export function disablePlugin(pluginName: string, targetDir: string) {
  const plugin = getInstalledPlugin(pluginName);
  if (!plugin) {
    console.log(chalk.red(`Plugin ${pluginName} is not installed.`));
    return;
  }
  
  if (plugin.files) {
    for (const file of plugin.files) {
      if (fs.existsSync(file) && !file.endsWith('.disabled')) {
        fs.renameSync(file, file + '.disabled');
      }
    }
  }
  
  if (plugin.hooks) {
    setPluginHooksState(targetDir, plugin.hooks, false);
  }
  
  console.log(chalk.green(`✓ Plugin ${pluginName} has been disabled.`));
}

export function enablePlugin(pluginName: string, targetDir: string) {
  const plugin = getInstalledPlugin(pluginName);
  if (!plugin) {
    console.log(chalk.red(`Plugin ${pluginName} is not installed.`));
    return;
  }
  
  if (plugin.files) {
    for (const file of plugin.files) {
      const disabledFile = file + '.disabled';
      if (fs.existsSync(disabledFile)) {
        fs.renameSync(disabledFile, file);
      }
    }
  }
  
  if (plugin.hooks) {
    setPluginHooksState(targetDir, plugin.hooks, true);
  }
  
  console.log(chalk.green(`✓ Plugin ${pluginName} has been enabled.`));
}

export function removePlugin(pluginName: string, targetDir: string) {
  const plugin = getInstalledPlugin(pluginName);
  if (!plugin) {
    console.log(chalk.red(`Plugin ${pluginName} is not installed.`));
    return;
  }
  
  if (plugin.files) {
    for (const file of plugin.files) {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      } else if (fs.existsSync(file + '.disabled')) {
        fs.unlinkSync(file + '.disabled');
      }
    }
  }
  
  if (plugin.hooks) {
    removePluginHooks(targetDir, plugin.hooks);
  }
  
  removePluginState(pluginName);
  
  console.log(chalk.green(`✓ Plugin ${pluginName} has been removed.`));
}
