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
| `downloads/` | Published `.zip` and `.skill` archives plus immutable versioned content manifests. The original `manifest.json` is the 0.3.0 record; `manifest-0.3.1.json` describes the new package. `releases.json` records actual GitHub asset IDs only after upload. |

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

Build 0.3.1 into a new output directory with `scripts/build-skill-archives.py --package <packager-output> --out <new-output>`. Keep 0.3.0 archives and `downloads/manifest.json` byte-identical. Validate `downloads/manifest-0.3.1.json`; after actual upload use `scripts/register-skill-release.py` to create a separate registry with real asset IDs, URLs, fixed commit and baseline. Do not rebuild packages to add upload metadata.

新版使用独立内容清单和上传后资产登记；旧包、旧清单不覆盖。上传元数据不回写包，避免循环重打包。

## Making changes / 修改规则

- Receipt change version: **0.3.1**; identify contents by commit and file hashes.
- Change the canonical Skill first, then rebuild, so every entrypoint gets the same rules. Don't fork rules into individual adapters.
- Keep existing website contracts. Server-side changes go to the website maintainers.
- Record native test results per host, scope and artifact. Don't turn `NOT_RUN` into a blanket pass.

The Skill sources, templates, scripts and tests are [Apache-2.0](../../LICENSES/Apache-2.0.txt). The repository's data, website and trademark terms apply separately.

安装回执改动版本为 0.3.1；旧 0.3.0 附件和旧 manifest 字节保留。先改共同 Skill 再重新打包，不要单独改某个适配文档里的规则。Skill 源码、模板、脚本和测试采用 Apache-2.0；数据、网站和商标条款另行适用。
