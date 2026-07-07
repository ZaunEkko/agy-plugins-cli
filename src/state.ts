import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const STATE_DIR = path.join(os.homedir(), '.agy-plugin');
const STATE_FILE = path.join(STATE_DIR, 'installed.json');

export interface InstalledPlugin {
  repo: string;
  sha: string;
  installedAt: string;
}

export interface State {
  plugins: Record<string, InstalledPlugin>;
}

const DEFAULT_STATE: State = {
  plugins: {}
};

export function loadState(): State {
  if (!fs.existsSync(STATE_DIR)) {
    fs.mkdirSync(STATE_DIR, { recursive: true });
  }

  if (!fs.existsSync(STATE_FILE)) {
    return DEFAULT_STATE;
  }

  try {
    const data = fs.readFileSync(STATE_FILE, 'utf-8');
    return JSON.parse(data) as State;
  } catch (error) {
    return DEFAULT_STATE;
  }
}

export function saveState(state: State): void {
  if (!fs.existsSync(STATE_DIR)) {
    fs.mkdirSync(STATE_DIR, { recursive: true });
  }
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
}

export function recordPluginInstall(pluginName: string, repo: string, sha: string): void {
  const state = loadState();
  state.plugins[pluginName] = {
    repo,
    sha,
    installedAt: new Date().toISOString()
  };
  saveState(state);
}

export function getInstalledPlugin(pluginName: string): InstalledPlugin | undefined {
  const state = loadState();
  return state.plugins[pluginName];
}
