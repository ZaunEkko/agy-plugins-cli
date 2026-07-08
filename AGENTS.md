# AGENTS.md

This file is a standalone operating guide for agents working in this repository.

## Project overview

`agy-plugins-cli` is a TypeScript/CommonJS Node CLI published as the `agy-plugin` command. It manages Google Antigravity plugin marketplaces hosted in GitHub repositories, downloads plugin directories, merges Antigravity hook/MCP configuration, and tracks installed plugin commit SHAs for update checks.

## Required workflow

1. Check the current branch and worktree state before changing files.
2. Follow the Gitflow rules in this file for any branch work.
3. Read the relevant source files before editing; do not infer architecture from filenames alone.
4. Keep changes scoped to the user request.
5. Run the narrowest relevant validation command and report exactly what passed, failed, or was skipped.
6. Do not commit, tag, push, publish, or modify remote resources unless the user explicitly asks.

## Gitflow rules

Use standard Gitflow:

- `main` is the stable release branch. Do not commit directly to `main` for normal development.
- `develop` is the integration branch and the normal base for ongoing work.
- Create normal work branches from `develop` as `feature/<short-description>` and merge them back into `develop`.
- Create release branches from `develop` as `release/<version>` for version bumps, release notes, and final validation. Merge releases into `main`, tag the release from `main` as `v<version>`, then merge the release branch back into `develop`.
- Create hotfix branches from `main` as `hotfix/<short-description-or-version>`. Merge hotfixes into both `main` and `develop` so fixes are not lost from ongoing work.
- Keep unrelated changes out of the same branch.

## Common commands

```bash
# Install dependencies
npm install

# Type-check and compile TypeScript into dist/
npm run build

# Run the CLI through ts-node during development
npm start -- <agy-plugin args>
npm start -- marketplace list
npm start -- marketplace add ZaunEkko/agy-plugins
npm start -- add commit-commands@zaunekko --local

# Run the compiled CLI after building
node dist/index.js <agy-plugin args>

# Preview npm package contents; prepack runs npm run build first
npm pack --dry-run --json
```

Validation facts:

- Use `npm run build` as the primary validation command for source changes.
- There is no lint script configured.
- `npm test` runs `npm run build` and a compiled CLI version smoke check. There is no unit test suite or single-test command yet.
- For Markdown-only changes, `git diff --check` is usually the appropriate narrow validation.

## Runtime files and side effects

The CLI can write outside the repository. Be explicit about this in plans, tests, and reports.

- CLI marketplace config: `~/.agy-plugin/config.json` via `src/config.ts`.
- Installed plugin registry: `~/.agy-plugin/installed.json` via `src/state.ts`.
- Global Antigravity target: `~/.gemini/config`.
- Local Antigravity target: `<repo>/.agents` when `--local` is used.
- GitHub authentication: `src/fetcher.ts` uses `GITHUB_TOKEN` first, then falls back to `gh auth token`.

Prefer `--local` for development smoke checks on commands that support it (`add`, `update`, `enable`, `disable`, `remove`) so plugin files go into ignored local `.agents/` instead of the user's global Antigravity config. Marketplace config/state still use `~/.agy-plugin/`.

## Architecture map

- `src/index.ts` owns the Commander command tree, namespace resolution, global-vs-local target selection, and the interactive marketplace TUI using dynamic `@clack/prompts` imports.
- `src/fetcher.ts` is the GitHub integration layer. It lists repository root directories as plugins, fetches latest commit info per plugin path, checks for a top-level `hooks` directory before install, recursively downloads files, and special-cases root `mcp.json` plus `hooks/hooks.json` for merging instead of raw overwrite.
- `src/hooks-merger.ts` merges remote hook definitions into a target `hooks.json`. Array entries are deduplicated by JSON stringification, and the returned top-level hook keys are stored in install state so `manager.ts` can disable or remove them later.
- `src/mcp-merger.ts` merges remote `mcpServers` into local `mcp.json`; server names are the merge key and existing servers with the same name are overwritten.
- `src/state.ts` records installed plugins by the user-facing key such as `plugin@namespace`, including source repo, latest SHA, installed files, and merged hook keys.
- `src/config.ts` stores the marketplace list under `~/.agy-plugin/config.json`.
- `src/manager.ts` implements `enable`, `disable`, and `remove` using the state registry: files are renamed with `.disabled` or deleted, and hook keys are toggled/removed in the target `hooks.json`.

When changing install, update, disable, enable, or remove behavior, keep these pieces aligned:

- `downloadPlugin()` returned `files` and `hooks`
- `recordPluginInstall()` persisted state
- `manager.ts` cleanup/toggle behavior
- README examples and documented side effects

## Repository conventions

- Source is TypeScript under `src/`; `tsconfig.json` compiles `src/**/*` to `dist/` with `strict: true` and CommonJS output.
- `dist/` is generated by `npm run build` and ignored by git. `package.json` points `main` and `bin` at `dist/index.js`, and `prepack` runs the build before npm packing.
- `package-lock.json` is tracked and should change with dependency or package metadata updates.
- npm package contents are controlled by the `files` whitelist in `package.json`; keep local/agent maintenance files out of published packages.
- `.gitignore` excludes `node_modules/`, `dist/`, `.agents/`, `temp/`, and `HANDOFF.local.md`; do not edit ignored/generated directories unless the user specifically requests it.
- No Cursor rules or GitHub Copilot instruction file are present in this repository at the time this guide was created.

## Documentation and i18n

User-facing README content exists in these files:

- `README.md`
- `i18n/zh-CN/README.md`
- `i18n/zh-TW/README.md`
- `i18n/ja/README.md`
- `i18n/ko/README.md`

When changing documented behavior, update the relevant localized READMEs or explicitly report that localization updates were skipped.

GitHub issue and PR templates in `.github/` use the same language set. Preserve that multilingual structure when editing templates.

## Reporting expectations

When finishing work, report:

- Files changed.
- Validation commands run and their outcomes.
- Validation not run, with reason.
- Any filesystem or branch side effects.
- Any remaining risks or follow-up work.
