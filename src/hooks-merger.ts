import * as fs from 'fs';
import chalk from 'chalk';

/**
 * Deep merge two hook configurations.
 */
function mergeHooksConfigData(target: any, source: any) {
  for (const key of Object.keys(source)) {
    if (!target[key]) {
      target[key] = source[key];
    } else {
      for (const hookType of Object.keys(source[key])) {
        if (!target[key][hookType]) {
          target[key][hookType] = source[key][hookType];
        } else if (Array.isArray(target[key][hookType]) && Array.isArray(source[key][hookType])) {
          target[key][hookType] = [...target[key][hookType], ...source[key][hookType]];
        } else {
          target[key][hookType] = source[key][hookType];
        }
      }
    }
  }
}

export function mergeHooksConfig(targetPath: string, remoteContent: string) {
  let targetData: any = {};
  
  if (fs.existsSync(targetPath)) {
    try {
      targetData = JSON.parse(fs.readFileSync(targetPath, 'utf-8'));
    } catch (e) {
      console.warn(chalk.yellow(`Warning: Could not parse existing hooks.json at ${targetPath}. Overwriting.`));
    }
  }

  let remoteData: any = {};
  try {
    remoteData = JSON.parse(remoteContent);
  } catch (e) {
    console.error(chalk.red(`Error parsing remote hooks.json content.`));
    return;
  }

  mergeHooksConfigData(targetData, remoteData);

  fs.writeFileSync(targetPath, JSON.stringify(targetData, null, 2), 'utf-8');
  console.log(chalk.green(`✓ Successfully merged hooks.json into ${targetPath}`));
}
