<div align="center">

# 🚀 Antigravity CLI Package Manager
**The official, ultra-fast plugin manager for Google Antigravity (agy).**

[English](README.md) · [简体中文](i18n/zh-CN/README.md) · [繁體中文](i18n/zh-TW/README.md) · [日本語](i18n/ja/README.md) · [한국어](i18n/ko/README.md)

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![NPM Version](https://img.shields.io/npm/v/agy-plugins-cli.svg?style=for-the-badge&logo=npm)](https://www.npmjs.com/package/agy-plugins-cli)
[![CLI](https://img.shields.io/badge/CLI-Command_Line-black?style=for-the-badge&logo=gnometerminal)](https://github.com/ZaunEkko/agy-plugins-cli)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](https://github.com/ZaunEkko/agy-plugins-cli/blob/main/LICENSE)

> Seamlessly install, update, and manage Antigravity plugins across multiple repositories, with interactive terminal UI, granular namespace support, and secure context merging.

</div>

<br />

## ✨ Features

- **🌐 Multi-Marketplace Support**: Add and switch between multiple remote GitHub repositories as your plugin sources (e.g. `ZaunEkko/agy-plugins`).
- **⚡ Hot Updates with Precision**: Fetch the newest `commit` fingerprint from remote repos and perform updates instantly at global, namespace, or individual plugin levels.
- **🖥️ Interactive TUI**: Browse, check update status, and batch-install plugins via a stunning terminal user interface built with `@clack/prompts`.
- **🔐 Zero-Config Private Repos**: Natively detects and utilizes your local `gh auth token` to bypass GitHub API rate limits and access enterprise private plugin repositories.
- **🛡️ Secure Hook & MCP Merging**: Safely and dynamically merges multiple `hooks.json` and `mcp.json` configurations (with automatic JSON string deduplication) to your global workspace without overwriting existing servers or triggering duplicate scripts.

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

# Open the interactive marketplace dashboard (Shows Outdated/Installed status!)
agy-plugin marketplace list
```
*(The interactive TUI lets you browse available plugins, see update dates, and batch install them with a single keystroke!)*

### 2. Install a Plugin
Install plugins from the connected marketplace by specifying the plugin name and the repository namespace.
```bash
agy-plugin add commit-commands@zaunekko
agy-plugin add explanatory-output-style@zaunekko
```
*(The CLI will securely download the `skills`, and `hooks` to your local `.gemini/config/` directory!)*

### 3. Keep Plugins Updated
Easily fetch and sync the latest plugin updates from the remote authors. Our CLI tracks the local and remote SHA fingerprints to dynamically detect out-of-date plugins.
```bash
# Update all installed plugins across all namespaces globally
agy-plugin update

# Update all plugins in a specific namespace
agy-plugin update @zaunekko

# Update a specific plugin directly
agy-plugin update commit-commands@zaunekko
```

<br />

## 🧠 Architecture & Security

- **Fingerprint Tracking**: `agy-plugin` caches the latest Git `sha` for downloaded directories in `~/.gemini/config/state.json`, enabling intelligent delta-updates and distinct visual states (Installed vs Update Available) in the TUI.
- **Dynamic Context Injection**: Antigravity natively loads everything dropped into the `.gemini/config/` directory. Our CLI acts as the secure bridge between remote community repos and your local AI context.
- **`gh` CLI Integration**: Under the hood, if `GITHUB_TOKEN` is missing, the tool attempts to extract tokens via `gh auth token` to ensure your local git workflow is entirely uninterrupted.

## 📄 License

This project is open-sourced under the [MIT License](https://github.com/ZaunEkko/agy-plugins-cli/blob/main/LICENSE).

<br />

<div align="center">
  <i>Built for Antigravity, by Antigravity.</i>
</div>
