# Antigravity 插件包管理器 - 开发交接文档

## 1. 背景与目标
当前目录 `antigravity-plugins` 被定位为**远端插件库源（Marketplace 仓库）**，类似于 `ZaunEkko/codex-plugins`，用于存放可复用的 Skills, Rules, Hooks 和 MCP 配置文件。
为了让其他开发者能够一键安装此仓库中的内容，我们需要在一个全新的工作区开发一个 **第三方 Antigravity CLI 包管理器**。

## 2. 新 CLI 工具命名建议
在开启新工作区之前，建议为这个 CLI 包管理器选择一个名字，然后用该名字创建新的目录/代码仓库：
- **`agypm`** (Antigravity Package Manager) - 简短有力，类似 `npm`。运行方式：`agypm add explanatory-output-style`
- **`agy-get`** - 类似于 `apt-get`。运行方式：`agy-get install explanatory-output-style`
- **`agy-hub`** - 侧重于去中心化的生态。运行方式：`agy-hub add ...`
- **`agy-plugins-cli`** - 中规中矩，一目了然。

*(建议：选定名字后，在本地新建一个同名文件夹，例如 `D:\project\coding\project\github\agypm`，然后在那个目录中用 Antigravity 打开并继续对话)*

## 3. CLI 工具技术选型建议
建议在新目录中直接启动 **Node.js (TypeScript)** 项目。
- **原因**：Node.js CLI 通过 `npm install -g agypm` 分发极其便利，且自带优秀的文件操作（`fs`）、网络请求（`axios/fetch`）和命令行交互 UI（`commander`, `inquirer`, `ora`）生态。

## 4. 核心功能与架构草案
新 CLI 需要实现以下核心命令：

1. **配置源管理**
   - `agypm marketplace add <username/repo>`：将远端 Github 仓库注册到本地配置文件（如 `~/.agypm/config.json`）。
2. **包安装**
   - `agypm add <plugin-name> [--global | --local]`
   - **工作流**：
     1. 根据用户配置的源，通过 GitHub API 或 Raw 链接拉取目标插件文件夹的元数据（Manifest）。
     2. 下载 Skills（存入 `.agy/skills/` 或 `~/.gemini/antigravity-cli/builtin/skills/`）。
     3. 下载 Rules（存入 `.agy/rules/` 等）。
     4. 下载 MCP 配置，并自动将其 `merge` 到用户的 `mcp.json` 中。
3. **环境审查**
   - 由于 Hooks 具有执行脚本的风险，CLI 在安装带 Hooks 的插件时需给出显式的安全警告（类似 Codex 的 Trust 机制）。

## 5. 待办事项 (Next Steps)
交接给新工作区后，请直接将此文档发给（或让我读取）AI 助手，我们将执行以下操作：
1. 确认 CLI 的名称和技术栈。
2. 初始化新仓库的项目结构（生成 `package.json`、`tsconfig.json` 等）。
3. 编写核心拉取引擎（与 Github Raw 或 API 交互）。
4. 编写 Antigravity 配置注入逻辑。
