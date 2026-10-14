# Grandet Skill source / Skill 开发说明

Grandet API Price Finder **0.3.0** is a public preview. For installation, tell your existing agent **“Install Grandet for me” / “帮我安装 Grandet”** and use [INSTALL.md](INSTALL.md). The commands below are for maintainers, not requirements for users.

Grandet Skill **0.3.0** 公开试用版。安装从 [INSTALL.md](INSTALL.md) 开始；用户不需要构建源码或安装 Node。下面命令供开发维护使用。

## Source layout / 源码结构

- [Canonical Skill](../../skills/grandet-api-price-finder/SKILL.md): one common workflow and its complete `references/` and `agents/` directories. The [installation guide](../../skills/grandet-api-price-finder/references/installation.md) records actual runtime scopes and acceptance limits.
- [Installer](../../scripts/install-price-finder.mjs): copies the complete Skill to one selected local application's user-level directory. It preserves unrelated settings, reuses identical copies, detects known alias conflicts and backs up replaced content outside discovery.
- [Package builder](../../scripts/package-price-finder.mjs): reads an explicit source list and the common Skill's local references. It exports one complete portable package, an embedded editor document and three chat adapters; it never reads account profiles or private handoff files.
- [Distribution snapshot](application-distribution.generated.json): declared application resources from the website catalogue. It is not proof of native installation. The website repository owns catalogue generation and server implementation.
- `plugins/grandet-api-price-finder/`: metadata templates only. Use the complete generated package or canonical Skill; do not advertise the template directory as an installed plugin.

共有一份共同 Skill；安装器处理用户级完整复制，打包器合成网页编辑器和对话型入口资料。应用目录快照记录声明，不代表原生实测全部通过。网站源码、目录生成和部署由网站仓库维护。

## Offline verification and build / 离线验证与构建

Run from the repository root with Node 24 or later; these scripts use only Node's standard library.

```text
node --test tests/price-finder-install.test.mjs tests/price-finder-package.test.mjs
node scripts/package-price-finder.mjs --out ../grandet-price-finder-package
```

Choose a new output directory. The builder refuses an existing output. Its `package-manifest.json` lists SHA-256 values for every payload file. The complete Skill remains under `skills/grandet-api-price-finder/`; root `README.md` and `INSTALL.md` have their local links adjusted for the package layout. Native upload packaging must include all canonical Skill files and the Apache license.

Tests use isolated temporary homes outside the repository. They cover complete copying, repeated installation without writes, backups, alias reuse/conflicts, dry runs, rejected unsafe inputs, package integrity, reproducible builds and linked references. Two website-integration checks explicitly skip when the separately maintained website source is absent. Offline success does not certify a live MCP/HTTP service, native account installation or new-conversation triggering.

从仓库根运行；构建目标必须是不存在的新目录。测试使用独立临时目录，不写真实用户的 Skills。网站实现未包含时，两项网站集成检查会明确跳过。离线通过不等于官网、原生账户或新会话触发通过。

## Contributions and licensing / 修改与许可

Keep version **0.3.0** and identify each change by commit and file hashes. Change the common Skill before regenerating adapters so that all entrypoints receive the same rules. Preserve existing website contracts; submit server-side changes to the website maintainers. Record native acceptance against the actual host, scope and artifact rather than converting `NOT_RUN` into a blanket pass.

These Skill sources, templates, scripts and tests use [Apache-2.0](../../LICENSES/Apache-2.0.txt). Public availability does not change the repository's separate data, website or trademark terms.

版本保持 **0.3.0**，以提交和文件哈希识别内容。先改共同 Skill，再重新打包；不单独分叉各适配器的查询规则。Skill 源码、模板、工具与测试采用 Apache-2.0，其他数据、网站与商标条款按仓库说明分别适用。
