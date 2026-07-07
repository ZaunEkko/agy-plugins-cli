import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

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
  _links: {
    self: string;
    git: string;
    html: string;
  };
}

/**
 * Fetch and download a plugin folder from GitHub
 */
export async function downloadPlugin(repo: string, pluginPath: string, targetDir: string): Promise<void> {
  const url = `${GITHUB_API_BASE}/${repo}/contents/${pluginPath}`;
  
  try {
    const response = await axios.get<GithubContent[] | GithubContent>(url, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'agy-plugins-cli'
      }
    });

    const contents = Array.isArray(response.data) ? response.data : [response.data];

    for (const item of contents) {
      const localPath = path.join(targetDir, item.name);
      
      if (item.type === 'dir') {
        // Recursive fetch for directories
        if (!fs.existsSync(localPath)) {
          fs.mkdirSync(localPath, { recursive: true });
        }
        await downloadPlugin(repo, item.path, localPath);
      } else if (item.type === 'file' && item.download_url) {
        // Download file
        console.log(chalk.gray(`Downloading ${item.path}...`));
        const fileResponse = await axios.get(item.download_url, { responseType: 'stream' });
        
        // Ensure parent dir exists
        const parentDir = path.dirname(localPath);
        if (!fs.existsSync(parentDir)) {
          fs.mkdirSync(parentDir, { recursive: true });
        }

        const writer = fs.createWriteStream(localPath);
        fileResponse.data.pipe(writer);
        
        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });
      }
    }
  } catch (error: any) {
    if (error.response && error.response.status === 404) {
      console.error(chalk.red(`Error: Plugin '${pluginPath}' not found in repository '${repo}'.`));
    } else {
      console.error(chalk.red(`Failed to fetch from GitHub API: ${error.message}`));
    }
    throw error;
  }
}
