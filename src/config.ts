import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Path to the configuration file (e.g. ~/.agy-plugin/config.json)
const CONFIG_DIR = path.join(os.homedir(), '.agy-plugin');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

export interface Config {
  marketplaces: string[];
}

const DEFAULT_CONFIG: Config = {
  marketplaces: []
};

/**
 * Ensure the config file exists and load it.
 */
export function loadConfig(): Config {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }

  if (!fs.existsSync(CONFIG_FILE)) {
    saveConfig(DEFAULT_CONFIG);
    return DEFAULT_CONFIG;
  }

  try {
    const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
    return JSON.parse(data) as Config;
  } catch (error) {
    console.error('Error reading config file. Using default config.');
    return DEFAULT_CONFIG;
  }
}

/**
 * Save the config to disk.
 */
export function saveConfig(config: Config): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

/**
 * Add a marketplace repository if it doesn't already exist.
 */
export function addMarketplace(repo: string): void {
  const config = loadConfig();
  if (!config.marketplaces.includes(repo)) {
    config.marketplaces.push(repo);
    saveConfig(config);
    console.log(`Successfully added marketplace: ${repo}`);
  } else {
    console.log(`Marketplace ${repo} already exists in your config.`);
  }
}
