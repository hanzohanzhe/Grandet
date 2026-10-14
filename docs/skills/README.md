# Grandet Skill source / Skill 维护说明

This page is for maintainers. To install the Skill, see [INSTALL.md](INSTALL.md); users never need to build anything.

本页给维护者看。安装看 [INSTALL.md](INSTALL.md)，用户不需要构建任何东西。

## Layout / 目录结构

| Path | What it is |
|---|---|
| [`skills/grandet-api-price-finder/`](../../skills/grandet-api-price-finder/SKILL.md) | The one canonical Skill: `SKILL.md`, `references/`, `agents/`. Every package and adapter is built from it. [`references/installation.md`](../../skills/grandet-api-price-finder/references/installation.md) is the per-app install guide. |
| [`scripts/install-price-finder.mjs`](../../scripts/install-price-finder.mjs) | Copies the complete Skill into one local app's user-level folder. Reuses identical copies, detects alias conflicts, and backs up replaced copies outside the skills folder. |
| [`scripts/package-price-finder.mjs`](../../scripts/package-price-finder.mjs) | Builds the portable package from an explicit file list: the Skill, a single-file editor version (`install/chatgpt-editor.md`) and three chat adapters. Never reads account profiles or private files. |
| `docs/skills/INSTALL.md`, `QUICKSTART.md` | Become `INSTALL.md` and `README.md` at the package root. |
| `docs/skills/chat-adapters/` | Host-specific intros for Grok Bot, Your dot and Muse; the builder appends the full Skill to each. |
| [`application-distribution.generated.json`](application-distribution.generated.json) | Snapshot of declared app resources from the website catalogue. It records declarations, not passed tests. Generated in the website repository. |
| `plugins/grandet-api-price-finder/` | Plugin metadata templates only. Don't advertise this directory as an installable plugin. |
| `downloads/` | Published `.zip` and `.skill` archives plus the immutable original 0.3.0 `manifest.json`. `releases.json` records only actual 0.3.0 GitHub Release asset IDs after registration. No new archive is being built. |

The root [`INSTALL.md`](../../INSTALL.md) must equal `docs/skills/INSTALL.md` with `../../skills/` links rewritten to `skills/`, i.e. exactly what the package ships. A test enforces this.

根目录 `INSTALL.md` 必须与 `docs/skills/INSTALL.md` 打包后的版本完全一致（`../../skills/` 改为 `skills/`），有测试检查。

## Test and build / 测试与构建

Run from the repository root with Node 24+. Only Node's standard library is used.

```sh
node --test tests/*.test.mjs
node scripts/package-price-finder.mjs --out ../grandet-price-finder-package
```

The output directory must not exist yet. Its `package-manifest.json` lists the SHA-256 of every file. Native upload packages must contain every canonical Skill file plus the Apache license.

Tests run in temporary home directories and never touch real user Skills. Two website-integration tests skip when the website source isn't present. Passing offline tests says nothing about the live MCP/HTTP service, native installs or triggering in a fresh conversation.

The current receipt-aware installer and Python verifier are separate source-only tools with build identity `grandet-installation-receipts-source-20261014.1`. Original 0.3.0 archives and `downloads/manifest.json` must remain byte-identical to commit 60f66fd. `package-price-finder.mjs` can export an explicitly labeled source kit for local review, but that output is not a Release package. There is no active archive-rebuild workflow. Register only actual original-0.3.0 Release metadata with `register-skill-release.py`; it never changes artifacts.

原 0.3.0 ZIP/.skill/manifest 保持原字节。新增回执是独立源码工具，sourceBuild 单独标识；不能把源码导出套件说成原包已更新，也不能把撤回的 0.3.1 改名成已验收的 0.3.0。未来若要交付含新工具的安装包，需另定构建身份、清单与网站兼容验收；本轮不擅自重建或覆盖。

## Making changes / 修改规则

- Product/API version stays **0.3.0**. Identify the optional helper by its separate sourceBuild, source commit and file hashes.
- Keep canonical Skill instructions and source-only adapters consistent; do not rebuild the published 0.3.0 archives. Don't fork rules into individual adapters.
- Keep existing website contracts. Server-side changes go to the website maintainers.
- Record native test results per host, scope and artifact. Don't turn `NOT_RUN` into a blanket pass.

The Skill sources, templates, scripts and tests are [Apache-2.0](../../LICENSES/Apache-2.0.txt). The repository's data, website and trademark terms apply separately.

产品版本保持 0.3.0；回执工具是单独 sourceBuild，原附件和 manifest 字节保留，不重新打包。Skill 源码、模板、脚本和测试采用 Apache-2.0；数据、网站和商标条款另行适用。
