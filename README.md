<div align="center">

# 🚀 Antigravity CLI Package Manager
**The official, ultra-fast plugin manager for Google Antigravity (agy).**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![NPM Version](https://img.shields.io/npm/v/agy-plugins-cli.svg?style=for-the-badge&logo=npm)](https://www.npmjs.com/package/agy-plugins-cli)
[![CLI](https://img.shields.io/badge/CLI-Command_Line-black?style=for-the-badge&logo=gnometerminal)](https://github.com/ZaunEkko/agy-plugins-cli)
[![License](https://img.shields.io/badge/License-ISC-blue?style=for-the-badge)](#)

> Seamlessly install, update, and manage Antigravity plugins across multiple repositories, with zero-configuration private repository support and secure context merging.

</div>

<br />

## ✨ Features

- **🌐 Multi-Marketplace Support**: Add and switch between multiple remote GitHub repositories as your plugin sources.
- **⚡ Hot Updates**: Fetch the newest `commit` fingerprint from remote repos and perform silent updates instantly (`agy-plugin update`).
- **🔐 Zero-Config Private Repos**: Natively detects and utilizes your local `gh auth token` to bypass GitHub API 404s, granting frictionless access to your enterprise private plugin repositories.
- **🛡️ Secure Hook Execution**: Automatically detects and alerts you of arbitrary executable hooks (e.g., Python scripts) before installation.
- **🧩 MCP Auto-Merger**: Safely and dynamically merges multiple MCP (Model Context Protocol) configurations to your global workspace without overwriting existing servers.

<br />

## 📦 Installation

To install `agy-plugins-cli` globally on your machine, simply run:

```bash
npm install -g agy-plugins-cli@latest
```

*Now you can use the `agy-plugin` command anywhere in your terminal!*

<br />

## 🚀 Quick Start

### 1. Add and Explore Marketplaces
Link a GitHub repository to your local registry and explore its plugins interactively.
```bash
# Add a repository as a marketplace
agy-plugin marketplace add ZaunEkko/agy-plugins

# Open the interactive marketplace dashboard
agy-plugin marketplace list
```
*(The interactive TUI lets you browse available plugins, see update dates, and batch install them with a single keystroke!)*

### 2. Install a Plugin
Install plugins from the connected marketplace by specifying the plugin name and the repository namespace.
```bash
agy-plugin add commit-commands@zaunekko
agy-plugin add explanatory-output-style@zaunekko
```
*(The CLI will securely download the `rules`, `skills`, and `hooks` to your local `.gemini/` directory!)*

### 3. Keep Plugins Updated
Easily fetch and sync the latest plugin updates from the remote authors.
```bash
# Update all installed plugins across all namespaces
agy-plugin update

# Update all plugins in a specific namespace
agy-plugin update @zaunekko

# Update a specific plugin
agy-plugin update commit-commands@zaunekko
```

<br />

## 🧠 Architecture & Security

- **Fingerprint Tracking**: `agy-plugin` caches the latest Git `sha` for downloaded directories in `~/.agy-plugin/installed.json`, enabling intelligent delta-updates instead of redownloading everything.
- **Dynamic Context Injection**: Antigravity natively loads everything dropped into the `.agy/` directory. Our CLI acts as the secure bridge between remote community repos and your local AI context.
- **`gh` CLI Integration**: Under the hood, if `GITHUB_TOKEN` is missing, the tool attempts to extract tokens via `gh auth token` to ensure your local git workflow is entirely uninterrupted.

<br />

<div align="center">
  <i>Built for Antigravity, by Antigravity.</i>
</div>
