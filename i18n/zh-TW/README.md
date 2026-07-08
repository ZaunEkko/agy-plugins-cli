<div align="center">

# 🚀 Antigravity CLI 套件管理器
**官方且極速的 Google Antigravity (agy) 外掛管理器。**

[English](../../README.md) · [简体中文](../zh-CN/README.md) · [繁體中文](README.md) · [日本語](../ja/README.md) · [한국어](../ko/README.md)

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![NPM Version](https://img.shields.io/npm/v/agy-plugins-cli.svg?style=for-the-badge&logo=npm)](https://www.npmjs.com/package/agy-plugins-cli)
[![CLI](https://img.shields.io/badge/CLI-Command_Line-black?style=for-the-badge&logo=gnometerminal)](https://github.com/ZaunEkko/agy-plugins-cli)
[![License](https://img.shields.io/badge/License-ISC-blue?style=for-the-badge)](#)

> 無縫跨越多個程式碼儲存庫安裝、更新和管理 Antigravity 外掛，提供互動式終端機面板、細粒度的命名空間支援，以及安全的上下文合併功能。

</div>

<br />

## ✨ 核心特性

- **🌐 多外掛市場支援**: 將多個遠端 GitHub 儲存庫新增為您專屬的外掛下載源（例如 `ZaunEkko/agy-plugins`），並可在其中自由切換。
- **⚡ 極其精準的熱更新**: 即時抓取遠端儲存庫最新的 `commit` 提交指紋，支援全域、命名空間級或單一外掛級別的瞬間更新。
- **🖥️ 互動式終端機面板 (TUI)**: 基於 `@clack/prompts` 建構了炫酷的終端機圖形介面，支援全盤瀏覽、更新狀態檢測以及一鍵批次安裝外掛。
- **🔐 零配置接入私有儲存庫**: 原生檢測並利用您本地的 `gh auth token` 繞過 GitHub API 的速率限制，從而無縫存取企業的私有外掛庫。
- **🛡️ 安全合併 Hooks 與 MCP**: 在向您的全域工作區自動合併多個 `hooks.json` 和 `mcp.json` 時，透過 JSON 字串深度去重技術，確保不會覆蓋現有伺服器或觸發重複的鉤子腳本。

<br />

## 📦 安裝指南

想要在您的機器上全域安裝 `agy-plugins-cli`，只需執行：

```bash
npm install -g agy-plugins-cli@latest
```

*安裝完畢後，您就可以在終端機的任意位置使用 `agy-plugin` 指令了！*

<br />

## 🚀 快速開始

### 1. 新增並探索外掛市場
將一個 GitHub 儲存庫綁定到您的本地登錄檔，透過互動式介面探索其包含的外掛。
```bash
# 將某個儲存庫新增為外掛市場
agy-plugin marketplace add ZaunEkko/agy-plugins

# 開啟互動式的市場儀表板（可直觀查看「已安裝/有更新」狀態！）
agy-plugin marketplace list
```
*(互動式的終端機面板允許您瀏覽可用外掛、查看最近更新日期，敲擊一下鍵盤即可批次安裝！)*

### 2. 安裝外掛
透過指定外掛名稱和所屬儲存庫的命名空間，從已連接的市場中下載外掛。
```bash
agy-plugin add commit-commands@zaunekko
agy-plugin add explanatory-output-style@zaunekko
```
*(CLI 會安全地將對應的 `skills` 和 `hooks` 下載到您本地的 `.gemini/config/` 目錄！)*

### 3. 保持外掛處於最新狀態
輕鬆拉取並同步遠端作者最新的外掛更動。我們的 CLI 會時刻追蹤本地與遠端的 SHA 提交指紋，從而動態偵測出已經過時的外掛。
```bash
# 全域更新：一鍵更新本地所有命名空間下的所有外掛
agy-plugin update

# 命名空間級更新：更新某個特定命名空間下的所有外掛
agy-plugin update @zaunekko

# 外掛級更新：直接精準更新某一個特定的外掛
agy-plugin update commit-commands@zaunekko
```

<br />

## 🧠 架構與安全

- **版本指紋追蹤**: `agy-plugin` 會將已下載目錄的最新 Git `sha` 快取至本地的 `~/.gemini/config/state.json` 檔案中，這使得智慧增量更新成為可能，並能在 TUI 面板中向您展示直觀的視覺反饋（已安裝 vs 有更新可用）。
- **動態上下文注入**: Antigravity 會原生載入被放入 `.gemini/config/` 目錄的所有內容。本 CLI 完美扮演了連接遠端社群儲存庫與您本地 AI 腦容量的安全橋樑。
- **與 `gh` CLI 深度整合**: 在底層邏輯中，如果未發現環境變數 `GITHUB_TOKEN`，本工具將嘗試透過 `gh auth token` 指令自動提取本地授權權杖，以確保您的本地 Git 工作流程絕對不被打斷。

<br />

<div align="center">
  <i>為 Antigravity 而生，由 Antigravity 打造。</i>
</div>
