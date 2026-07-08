<div align="center">

# 🚀 Antigravity CLI パッケージマネージャー
**Google Antigravity (agy) の公式プラグインマネージャー。**

[English](../../README.md) · [简体中文](../zh-CN/README.md) · [繁體中文](../zh-TW/README.md) · [日本語](README.md) · [한국어](../ko/README.md)

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![NPM Version](https://img.shields.io/npm/v/agy-plugins-cli.svg?style=for-the-badge&logo=npm)](https://www.npmjs.com/package/agy-plugins-cli)
[![CLI](https://img.shields.io/badge/CLI-Command_Line-black?style=for-the-badge&logo=gnometerminal)](https://github.com/ZaunEkko/agy-plugins-cli)
[![License](https://img.shields.io/badge/License-ISC-blue?style=for-the-badge)](#)

> 複数のリポジトリにまたがる Antigravity プラグインのインストール、更新、管理をシームレスに行います。インタラクティブな TUI、詳細な名前空間のサポート、および安全なコンテキストマージ機能を提供します。

</div>

<br />

## ✨ 主な機能

- **🌐 マルチマーケットプレイスのサポート**: 複数のリモート GitHub リポジトリ（例：`ZaunEkko/agy-plugins`）をプラグインのソースとして追加し、自由に切り替えることができます。
- **⚡ 超高速ホットアップデート**: リモートリポジトリから最新の `commit` フィンガープリントを取得し、グローバル、名前空間、または個々のプラグインレベルで瞬時にアップデートを実行します。
- **🖥️ インタラクティブな TUI**: `@clack/prompts` で構築された洗練されたターミナル UI を使用して、プラグインの参照、更新状態の確認、一括インストールを簡単に行えます。
- **🔐 プライベートリポジトリのゼロコンフィグアクセス**: ローカルの `gh auth token` をネイティブに検出し、GitHub API のレート制限を回避してエンタープライズのプライベートプラグインリポジトリにシームレスにアクセスします。
- **🛡️ Hook & MCP の安全なマージ**: 複数の `hooks.json` および `mcp.json` 設定をグローバルワークスペースに自動で安全にマージします。JSON 文字列の重複排除技術により、既存のサーバーを上書きしたり、スクリプトを重複してトリガーしたりすることはありません。

<br />

## 📦 インストール

`agy-plugins-cli` をマシンにグローバルインストールするには、次のコマンドを実行します。

```bash
npm install -g agy-plugins-cli@latest
```

*インストール後、ターミナルのどこからでも `agy-plugin` コマンドを使用できるようになります。*

<br />

## 🚀 クイックスタート

### 1. マーケットプレイスの追加と探索
GitHub リポジトリをローカルレジストリにバインドし、インタラクティブにプラグインを探索します。
```bash
# リポジトリをマーケットプレイスとして追加
agy-plugin marketplace add ZaunEkko/agy-plugins

# インタラクティブなマーケットプレイスダッシュボードを開く
agy-plugin marketplace list
```
*(インタラクティブなターミナルパネルでは、利用可能なプラグインを参照し、更新日を確認し、ワンキーストロークで一括インストールできます！)*

### 2. プラグインのインストール
プラグイン名とリポジトリの名前空間を指定して、接続されたマーケットプレイスからプラグインをインストールします。
```bash
agy-plugin add commit-commands@zaunekko
agy-plugin add explanatory-output-style@zaunekko
```
*(CLI は、対応する `skills` と `hooks` をローカルの `.gemini/config/` ディレクトリに安全にダウンロードします！)*

### 3. プラグインを最新に保つ
リモートの作成者から最新の更新を簡単に取得して同期します。CLI はローカルとリモートの SHA フィンガープリントを追跡し、古いプラグインを動的に検出します。
```bash
# グローバル更新：すべての名前空間のすべてのプラグインを更新
agy-plugin update

# 名前空間の更新：特定の名前空間のすべてのプラグインを更新
agy-plugin update @zaunekko

# 個別更新：特定のプラグインを直接更新
agy-plugin update commit-commands@zaunekko
```

<br />

## 🧠 アーキテクチャとセキュリティ

- **フィンガープリントの追跡**: `agy-plugin` は、ダウンロードしたディレクトリの最新の Git `sha` をローカルの `~/.gemini/config/state.json` にキャッシュします。これにより、インテリジェントな差分更新が可能になり、TUI パネルで直感的な視覚的フィードバック（インストール済み vs 更新可能）が提供されます。
- **動的コンテキスト注入**: Antigravity は、`.gemini/config/` ディレクトリに配置されたすべてのコンテンツをネイティブに読み込みます。この CLI は、リモートのコミュニティリポジトリとローカル AI コンテキストを接続する安全なブリッジとして機能します。
- **`gh` CLI 統合**: 内部では、環境変数 `GITHUB_TOKEN` が見つからない場合、ツールは `gh auth token` コマンドを介してトークンを抽出しようとします。これにより、ローカルの Git ワークフローが完全に妨げられないことが保証されます。

<br />

<div align="center">
  <i>Antigravity のために、Antigravity によって構築されました。</i>
</div>
