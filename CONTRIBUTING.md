# Contributing

感谢你对 `agy-plugins-cli` 的关注。这个仓库维护面向 Google Antigravity 的 TypeScript CLI 插件管理器。

## 分支与提交流程

本仓库使用 Gitflow：

- `main`：稳定发布分支。
- `develop`：日常集成分支。
- `feature/*`：新功能、文档或维护改动，从 `develop` 拉出，完成后通过 PR 合回 `develop`。
- `release/*`：发布准备，从 `develop` 拉出，完成后合入 `main` 和 `develop`。
- `hotfix/*`：紧急修复，从 `main` 拉出，完成后合入 `main` 和 `develop`。

不要直接推送到 `main` 或 `develop`。改动应通过 Pull Request 合并，并等待必需检查通过。

## 仓库结构

```text
src/                 TypeScript CLI source
README.md            English user documentation
i18n/*/README.md     Localized user documentation
.github/             Issue and PR templates
```

`dist/` 是 `npm run build` 的生成产物并被 git 忽略。发布或打包前必须先构建。

## 开发命令

```bash
npm install
npm run build
npm start -- <agy-plugin args>
node dist/index.js <agy-plugin args>
npm pack --dry-run --json
```

当前没有单元测试套件；`npm test` 会运行 `npm run build` 并检查编译后的 CLI 版本输出，作为基础 smoke check。

## 验证要求

请根据改动范围运行对应验证：

- 修改 TypeScript 源码：运行 `npm run build`。
- 修改 CLI 版本、打包或发布配置：运行 `npm run build`、`node dist/index.js --version` 和 `npm pack --dry-run --json`。
- 修改 README 或 i18n 文档：检查相关语言文档中的命令、路径和链接是否同步。
- 修改 `.github/` 模板：确认模板仍符合 CLI 项目范围，而不是插件仓库范围。
- 只修改 Markdown：至少运行 `git diff --check`。

如果跳过某项验证，请在 PR 中说明原因。

## Hook、MCP 与安全说明

这个 CLI 会下载远程 plugin 内容并可能写入用户的 Antigravity 配置。涉及以下区域的改动需要特别说明安全影响：

- GitHub API 下载逻辑。
- `hooks.json` 合并或 hook 启用/禁用/删除逻辑。
- `mcp.json` 合并逻辑。
- `~/.agy-plugin/` 中的 config/state 持久化。
- 全局目标 `~/.gemini/config` 与本地目标 `.agents` 的切换。

不要在代码、测试、文档或示例中写入 API key、token、密码、私钥或机器专属路径。

## Pull Request 要求

PR 描述应包含：

- 变更内容。
- 影响范围。
- 已运行的验证命令。
- 未运行验证的原因。
- 是否影响安装、更新、移除、hooks、MCP、配置/state 或 npm 发布内容。
