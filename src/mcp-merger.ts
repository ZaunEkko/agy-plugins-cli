import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

export function mergeMcpConfig(localMcpPath: string, remoteMcpContent: string): void {
  let localMcp: any = { mcpServers: {} };

  // Read existing local mcp.json if it exists
  if (fs.existsSync(localMcpPath)) {
    try {
      const data = fs.readFileSync(localMcpPath, 'utf-8');
      localMcp = JSON.parse(data);
      if (!localMcp.mcpServers) {
        localMcp.mcpServers = {};
      }
    } catch (e) {
      console.warn(chalk.yellow(`Warning: Could not parse existing local mcp.json at ${localMcpPath}. It will be overwritten.`));
    }
  }

  // Parse remote mcp.json
  let remoteMcp: any = {};
  try {
    remoteMcp = JSON.parse(remoteMcpContent);
  } catch (e) {
    console.error(chalk.red(`Error: Could not parse remote mcp.json. Skipping MCP merge.`));
    return;
  }

  if (remoteMcp.mcpServers) {
    let addedCount = 0;
    for (const [serverName, serverConfig] of Object.entries(remoteMcp.mcpServers)) {
      if (localMcp.mcpServers[serverName]) {
        console.log(chalk.yellow(`Warning: MCP server '${serverName}' already exists locally. Overwriting...`));
      } else {
        addedCount++;
      }
      localMcp.mcpServers[serverName] = serverConfig;
    }
    
    // Save merged config
    fs.mkdirSync(path.dirname(localMcpPath), { recursive: true });
    fs.writeFileSync(localMcpPath, JSON.stringify(localMcp, null, 2), 'utf-8');
    
    if (addedCount > 0) {
      console.log(chalk.green(`Successfully merged ${addedCount} MCP server(s) into ${localMcpPath}`));
    }
  } else {
    console.log(chalk.gray(`Remote mcp.json contains no mcpServers. Skipping.`));
  }
}
