import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import * as readline from 'readline';
import { mergeMcpConfig } from './mcp-merger';

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
 * Get the latest commit SHA for a specific path in the repository
 */
export async function getLatestCommitSha(repo: string, pluginPath: string): Promise<string | null> {
  const url = `${GITHUB_API_BASE}/${repo}/commits?path=${pluginPath}&per_page=1`;
  try {
    const headers: any = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'agy-plugins-cli'
    };
    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const response = await axios.get(url, { headers });
    if (response.data && response.data.length > 0) {
      return response.data[0].sha;
    }
  } catch (e) {
    // Ignore, just return null if we can't fetch it
  }
  return null;
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
    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
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
export async function downloadPlugin(repo: string, pluginPath: string, targetDir: string, skipSecurityCheck: boolean = false): Promise<void> {
  if (!skipSecurityCheck) {
    const safeToProceed = await checkSecurity(repo, pluginPath);
    if (!safeToProceed) {
      throw new Error("Installation cancelled by user due to security warning.");
    }
  }

  const url = `${GITHUB_API_BASE}/${repo}/contents/${pluginPath}`;
  
  try {
    const headers: any = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'agy-plugins-cli'
    };
    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
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
        await downloadPlugin(repo, item.path, localPath, true); // Skip security check for subdirectories
      } else if (item.type === 'file' && item.download_url) {
        console.log(chalk.gray(`Downloading ${item.path}...`));
        const fileResponse = await axios.get(item.download_url, { responseType: 'arraybuffer' });
        
        // Handle mcp.json merge specially
        if (item.name === 'mcp.json' && path.basename(targetDir) === '.agy') {
           console.log(chalk.blue(`Found mcp.json. Merging...`));
           const remoteContent = Buffer.from(fileResponse.data).toString('utf-8');
           mergeMcpConfig(localPath, remoteContent);
           continue;
        }

        // Ensure parent dir exists
        const parentDir = path.dirname(localPath);
        if (!fs.existsSync(parentDir)) {
          fs.mkdirSync(parentDir, { recursive: true });
        }

        fs.writeFileSync(localPath, fileResponse.data);
      }
    }
  } catch (error: any) {
    if (error.response && error.response.status === 404) {
      console.error(chalk.red(`Error: Plugin '${pluginPath}' not found in repository '${repo}'.`));
    } else if (error.message !== "Installation cancelled by user due to security warning.") {
      console.error(chalk.red(`Failed to fetch from GitHub API: ${error.message}`));
    }
    throw error;
  }
}
