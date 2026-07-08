import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import * as readline from 'readline';
import { execSync } from 'child_process';
import { mergeMcpConfig } from './mcp-merger';
import { mergeHooksConfig } from './hooks-merger';

let cachedToken: string | null = null;
function getGithubToken(): string | null {
  if (cachedToken) return cachedToken;
  if (process.env.GITHUB_TOKEN) {
    cachedToken = process.env.GITHUB_TOKEN;
    return cachedToken;
  }
  try {
    const token = execSync('gh auth token', { stdio: ['pipe', 'pipe', 'ignore'], encoding: 'utf-8' }).trim();
    if (token) {
      cachedToken = token;
      return token;
    }
  } catch (e) {
    // Ignore error
  }
  return null;
}

const GITHUB_API_BASE = 'https://api.github.com/repos';

interface GithubContent {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string | null;
  type: 'file' | 'dir';
}

function askQuestion(query: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans.toLowerCase().startsWith('y'));
  }));
}

/**
 * Get the latest commit info (SHA, date, message) for a specific path
 */
export async function getLatestCommitInfo(repo: string, pluginPath: string): Promise<{sha: string, date: string, message: string} | null> {
  const url = `${GITHUB_API_BASE}/${repo}/commits?path=${pluginPath}&per_page=1`;
  try {
    const headers: any = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'agy-plugins-cli'
    };
    const token = getGithubToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await axios.get(url, { headers });
    if (response.data && response.data.length > 0) {
      return {
        sha: response.data[0].sha,
        date: response.data[0].commit.committer.date,
        message: response.data[0].commit.message.split('\n')[0]
      };
    }
  } catch (e) {
    // Ignore, just return null if we can't fetch it
  }
  return null;
}

/**
 * Get the latest commit SHA for a specific path in the repository
 */
export async function getLatestCommitSha(repo: string, pluginPath: string): Promise<string | null> {
  const info = await getLatestCommitInfo(repo, pluginPath);
  return info ? info.sha : null;
}

/**
 * Check if the plugin contains dangerous executable hooks before downloading
 */
async function checkSecurity(repo: string, pluginPath: string): Promise<boolean> {
  const url = `${GITHUB_API_BASE}/${repo}/contents/${pluginPath}`;
  try {
    const headers: any = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'agy-plugins-cli'
    };
    const token = getGithubToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await axios.get<GithubContent[]>(url, { headers });
    
    const hasHooks = response.data.some(item => item.name === 'hooks' && item.type === 'dir');
    if (hasHooks) {
      console.log(chalk.red.bold(`\n⚠️  SECURITY WARNING ⚠️`));
      console.log(chalk.yellow(`The plugin '${pluginPath}' contains executable hooks scripts.`));
      console.log(chalk.yellow(`Executing unverified scripts can be dangerous and compromise your system.`));
      const isTrusted = await askQuestion(chalk.white.bold(`Do you trust this plugin and want to proceed? (y/N): `));
      if (!isTrusted) {
        return false;
      }
    }
  } catch (e) {
    // Ignore errors here, they will be caught during actual download
  }
  return true;
}

/**
 * Fetch and download a plugin folder from GitHub
 */
export async function downloadPlugin(repo: string, pluginPath: string, targetDir: string, skipSecurityCheck: boolean = false, rootTargetDir?: string): Promise<{files: string[], hooks: string[]}> {
  if (!skipSecurityCheck) {
    const safeToProceed = await checkSecurity(repo, pluginPath);
    if (!safeToProceed) {
      throw new Error("Installation cancelled by user due to security warning.");
    }
  }

  // If this is the initial call, set rootTargetDir to targetDir
  const activeRootTargetDir = rootTargetDir || targetDir;

  let installedFiles: string[] = [];
  let installedHooks: string[] = [];

  const url = `${GITHUB_API_BASE}/${repo}/contents/${pluginPath}`;
  
  try {
    const headers: any = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'agy-plugins-cli'
    };
    const token = getGithubToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await axios.get<GithubContent[] | GithubContent>(url, { headers });

    const contents = Array.isArray(response.data) ? response.data : [response.data];

    for (const item of contents) {
      const localPath = path.join(targetDir, item.name);
      
      if (item.type === 'dir') {
        // Recursive fetch for directories
        if (!fs.existsSync(localPath)) {
          fs.mkdirSync(localPath, { recursive: true });
        }
        const subResult = await downloadPlugin(repo, item.path, localPath, true, activeRootTargetDir);
        installedFiles = [...installedFiles, ...subResult.files];
        installedHooks = [...installedHooks, ...subResult.hooks];
      } else if (item.type === 'file' && item.download_url) {
        console.log(chalk.gray(`Downloading ${item.path}...`));
        const fileResponse = await axios.get(item.download_url, { responseType: 'arraybuffer' });
        
        // Handle mcp.json merge specially
        if (item.name === 'mcp.json' && targetDir === activeRootTargetDir) {
           console.log(chalk.blue(`Found mcp.json. Merging...`));
           const remoteContent = Buffer.from(fileResponse.data).toString('utf-8');
           mergeMcpConfig(localPath, remoteContent);
           installedFiles.push(localPath);
           continue;
        }

        // Handle hooks.json merge specially
        if (item.name === 'hooks.json' && path.basename(path.dirname(localPath)) === 'hooks') {
           console.log(chalk.blue(`Found hooks.json. Merging into root hooks.json...`));
           const remoteContent = Buffer.from(fileResponse.data).toString('utf-8');
           const rootHooksPath = path.join(activeRootTargetDir, 'hooks.json');
           const mergedKeys = mergeHooksConfig(rootHooksPath, remoteContent);
           installedHooks = [...installedHooks, ...mergedKeys];
           continue;
        }

        // Ensure parent dir exists
        const parentDir = path.dirname(localPath);
        if (!fs.existsSync(parentDir)) {
          fs.mkdirSync(parentDir, { recursive: true });
        }

        fs.writeFileSync(localPath, fileResponse.data);
        installedFiles.push(localPath);
      }
    }
    
    return { files: installedFiles, hooks: installedHooks };
  } catch (error: any) {
    if (error.response && error.response.status === 404) {
      console.error(chalk.red(`Error: Plugin '${pluginPath}' not found in repository '${repo}'.`));
    } else if (error.message !== "Installation cancelled by user due to security warning.") {
      console.error(chalk.red(`Failed to fetch from GitHub API: ${error.message}`));
    }
    throw error;
  }
}

/**
 * List all available plugins (directories) in a remote repository along with update date
 */
export async function listPluginsInRepo(repo: string): Promise<{name: string, date: string | null, sha: string | null}[]> {
  const url = `${GITHUB_API_BASE}/${repo}/contents/`;
  try {
    const headers: any = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'agy-plugins-cli'
    };
    const token = getGithubToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await axios.get<GithubContent[]>(url, { headers });
    
    const dirs = response.data.filter(item => item.type === 'dir' && !item.name.startsWith('.'));
    
    // Fetch commit info concurrently for all plugin directories
    const plugins = await Promise.all(dirs.map(async (dir) => {
      const info = await getLatestCommitInfo(repo, dir.name);
      return { name: dir.name, date: info ? info.date : null, sha: info ? info.sha : null };
    }));
      
    // Sort by most recently updated
    return plugins.sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
      
  } catch (error: any) {
    if (error.response && error.response.status === 404) {
      console.error(chalk.red(`Error: Repository '${repo}' not found.`));
    } else {
      console.error(chalk.red(`Failed to fetch repository contents: ${error.message}`));
    }
    return [];
  }
}
