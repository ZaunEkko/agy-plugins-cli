<div align="center">

# 🚀 Antigravity CLI 包管理器
**官方且极速的 Google Antigravity (agy) 插件管理器。**

[English](../../README.md) · [简体中文](README.md) · [繁體中文](../zh-TW/README.md) · [日本語](../ja/README.md) · [한국어](../ko/README.md)

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![NPM Version](https://img.shields.io/npm/v/agy-plugins-cli.svg?style=for-the-badge&logo=npm)](https://www.npmjs.com/package/agy-plugins-cli)
[![CLI](https://img.shields.io/badge/CLI-Command_Line-black?style=for-the-badge&logo=gnometerminal)](https://github.com/ZaunEkko/agy-plugins-cli)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](https://github.com/ZaunEkko/agy-plugins-cli/blob/main/LICENSE)

> 无缝跨越多个代码仓库安装、更新和管理 Antigravity 插件，提供交互式终端面板、细粒度的命名空间支持，以及安全的上下文合并功能。

</div>

<br />

## ✨ 核心特性

- **🌐 多插件市场支持**: 将多个远程 GitHub 仓库添加为您专属的插件下载源（例如 `ZaunEkko/agy-plugins`），并可在其中自由切换。
- **⚡ 极其精准的热更新**: 实时抓取远程仓库最新的 `commit` 提交指纹，支持全局、命名空间级或单一插件级别的瞬间更新。
- **🖥️ 交互式终端面板 (TUI)**: 基于 `@clack/prompts` 构建了炫酷的终端图形界面，支持全盘浏览、更新状态检测以及一键批量安装插件。
- **🔐 零配置接入私有仓库**: 原生检测并利用您本地的 `gh auth token` 绕过 GitHub API 的速率限制，从而无缝访问企业的私有插件库。
- **🛡️ 安全合并 Hooks 与 MCP**: 在向您的全局工作区自动合并多个 `hooks.json` 和 `mcp.json` 时，通过 JSON 字符串深度去重技术，确保不会覆盖现有服务器或触发重复的钩子脚本。

<br />

## 📦 安装指南

想要在您的机器上全局安装 `agy-plugins-cli`，只需运行：

```bash
npm install -g agy-plugins-cli@latest
```

*安装完毕后，您就可以在终端的任意位置使用 `agy-plugin` 命令了！*

<br />

## 🚀 快速开始

### 1. 添加并探索插件市场
将一个 GitHub 仓库绑定到您的本地注册表，并通过交互式界面探索其包含的插件。
```bash
# 将某个仓库添加为插件市场
agy-plugin marketplace add ZaunEkko/agy-plugins

# 打开交互式的市场仪表盘（可直观查看“已安装/有更新”状态！）
agy-plugin marketplace list
```
*(交互式的终端面板允许您浏览可用插件、查看最近更新日期，敲击一下键盘即可批量安装！)*

### 2. 安装插件
通过指定插件名称和所属仓库的命名空间，从已连接的市场中下载插件。
```bash
agy-plugin add commit-commands@zaunekko
agy-plugin add explanatory-output-style@zaunekko
```
*(CLI 会安全地将对应的 `skills` 和 `hooks` 下载到您本地的 `.gemini/config/` 目录！)*

### 3. 保持插件处于最新状态
轻松拉取并同步远程作者最新的插件改动。我们的 CLI 会时刻追踪本地与远程的 SHA 提交指纹，从而动态侦测出已经过时的插件。
```bash
# 全局更新：一键更新本地所有命名空间下的所有插件
agy-plugin update

# 命名空间级更新：更新某个特定命名空间下的所有插件
agy-plugin update @zaunekko

# 插件级更新：直接精准更新某一个特定的插件
agy-plugin update commit-commands@zaunekko
```

<br />

## 🧠 架构与安全

- **版本指纹追踪**: `agy-plugin` 会将已下载目录的最新 Git `sha` 缓存至本地的 `~/.gemini/config/state.json` 文件中，这使得智能增量更新成为可能，并能在 TUI 面板中向您展示直观的视觉反馈（已安装 vs 有更新可用）。
- **动态上下文注入**: Antigravity 会原生加载被放入 `.gemini/config/` 目录的所有内容。本 CLI 完美扮演了连接远程社区仓库与您本地 AI 脑容量的安全桥梁。
- **与 `gh` CLI 深度集成**: 在底层逻辑中，如果未发现环境变量 `GITHUB_TOKEN`，本工具将尝试通过 `gh auth token` 命令自动提取本地授权令牌，以确保您的本地 Git 工作流绝对不被打断。

## 📄 许可证

本项目使用 [MIT License](https://github.com/ZaunEkko/agy-plugins-cli/blob/main/LICENSE) 开源。

<br />

<div align="center">
  <i>为 Antigravity 而生，由 Antigravity 打造。</i>
</div>
