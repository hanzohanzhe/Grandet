# Install Grandet / 安装 Grandet

**Grandet Skill 0.3.0 · Public preview / 公开试用版**

In your existing agent, paste: / 在你正在使用的 Agent 里说：

> 帮我安装 Grandet：https://github.com/hanzohanzhe/Grandet
>
> Install Grandet for me: https://github.com/hanzohanzhe/Grandet

The agent should complete the setup using its available tools. You should only need to act when the application requires a specific login, permission or button. / Agent 应代做能完成的安装步骤；只有应用确实需要你登录、授权或点击时，才说明具体的一步。

[Installation ZIP / 安装 ZIP](https://github.com/hanzohanzhe/Grandet/raw/refs/heads/main/downloads/grandet-api-price-finder-0.3.0.zip) · [Native Skill / 原生技能包](https://github.com/hanzohanzhe/Grandet/raw/refs/heads/main/downloads/grandet-api-price-finder-0.3.0.skill) · [All application routes / 各应用路线](skills/grandet-api-price-finder/references/installation.md)

## For the installing agent / 给执行安装的 Agent

### 1. Use the complete public Skill / 获取完整公开 Skill

Use the existing checkout's [`skills/grandet-api-price-finder/`](skills/grandet-api-price-finder/SKILL.md) directory, including `SKILL.md`, `references/` and `agents/`. If no checkout is present, download the [installation ZIP](https://raw.githubusercontent.com/hanzohanzhe/Grandet/main/downloads/grandet-api-price-finder-0.3.0.zip) from this official repository and extract it in your working area. The ZIP contains the same Skill directory, installation script and instructions.

A checkout installation does not require `package-manifest.json` at the repository root. When an archive supplies a manifest, verify it before installation.

已有仓库就直接使用整个 `skills/grandet-api-price-finder/`；没有仓库则从上面的官方链接下载 ZIP 并解压。保留全部支持文件，不能只保存 `SKILL.md` 或 GitHub 网页。下载包有清单时核对；直接从本仓库安装**不要求源码根目录存在 `package-manifest.json`**。

For a native Skills importer, use the [`.skill` archive](https://github.com/hanzohanzhe/Grandet/raw/refs/heads/main/downloads/grandet-api-price-finder-0.3.0.skill). If the importer accepts only `.zip`, rename a copy of that archive to `.zip`. The larger installation ZIP is an agent installation kit, not the native importer payload. / 原生技能导入器用 `.skill`；只接受 ZIP 时，改名一份副本后导入。外层安装 ZIP 供 Agent 解包安装，不要直接当原生技能包导入。

### 2. Install for the actual running agent / 安装到实际运行端

Identify the current host and runtime from available context. Prefer a user-level installation so it survives new projects and conversations. Windows, WSL, SSH and cloud environments have separate user directories. / 根据现有上下文识别当前宿主和运行环境，优先用户级安装，跨项目和会话使用；Windows、WSL、SSH、云端的目录分别处理。

| Current agent / 当前 Agent | App ID / 安装器 ID | Default user Skill root / 默认用户级目录 |
|---|---|---|
| Codex | `codex` | `~/.agents/skills/` |
| Cursor IDE | `cursor` | `~/.cursor/skills/` |
| Claude Code | `claude-code` | `~/.claude/skills/` |

`~` is the home of the user running the agent; on native Windows it is usually `%USERPROFILE%`. The installed file should end in `skills/grandet-api-price-finder/SKILL.md`. For other applications and overrides, follow the [application guide](skills/grandet-api-price-finder/references/installation.md). / `~` 指实际运行用户的主目录；Windows 原生通常为 `%USERPROFILE%`。其它应用及目录覆盖值见应用指南，不让用户先研究目录。

### 3. Complete the installation / 代为完成安装

If Node is already available, run [`scripts/install-price-finder.mjs`](scripts/install-price-finder.mjs) from the checkout or extracted package. Choose the actual host's ID yourself. For example, **only for Codex**:

```sh
node scripts/install-price-finder.mjs --app codex
```

已有 Node 就运行随附安装器，按实际宿主选择 ID；上例仅用于 Codex。没有 Node 时，使用现有文件工具把**完整 Skill 目录**复制到对应用户级目录，不要求用户安装 Node。先检查该宿主支持的同名位置：相同内容复用，更新时将旧内容备份到技能发现目录之外；保留其它技能和设置。详细步骤见[安装操作说明](docs/skills/INSTALL.md)。

Without Node, perform the equivalent complete copy with your filesystem tools. Reuse an identical existing installation; back up changed content outside Skill discovery roots before updating. Keep other skills and settings. Read back the installed files and verify their contents and relative references. A test-directory dry run is not a user installation.

### 4. Save, enable and check access / 保存、启用并检查读取能力

For web or cloud assistants, use the application's actual persistent Skill importer, Agent binding or private-sync route. Do not assume local files reach a cloud agent. Update an existing native Skill in place; preserve its identity, synchronize the current discovery description and keep it enabled. / 网页或云 Agent 走实际的持久导入、Agent 绑定或私有同步路线，不把本机复制当云端安装。已有原生技能原位更新，保持身份、完整正文、最新发现描述和启用状态一致。

Use existing MCP or HTTP tools to check anonymous access to `https://grandet.ai/public-data/price-finder.json`. Price lookup needs no Grandet account or supplier key. Finish any required save, enablement and Grandet-domain permission step now. If one manual action is unavoidable, name that exact step and resume afterward. / 安装时用现有 MCP 或 HTTP 工具检查匿名读取，不申请 Key。需要本人操作时只指出实际的一步，然后继续；不能把“已保存文件”直接说成“新会话已可用”。

### 5. Verify an ordinary new conversation / 验证普通新会话

After installation, open a clean conversation within the installed scope. Do not attach files, select a Skill or mention Grandet. Ask, for example: / 安装后在对应账号或 Agent 新开干净会话，不附文件、不点技能、不提 Grandet，例如：

> 我用 Claude Code 写代码，想找便宜的 Sonnet 4.6 API，推荐一家，再给一个备选。
>
> Find an affordable Sonnet 4.6 API for coding. Give me a recommendation and an alternative.

Confirm that the saved Skill is loaded, current Grandet data is read, and the answer includes useful choices, units, dates and sources. If the next conversation asks for the package again, fix persistence or binding rather than asking the user to re-upload. / 核对已保存的技能被加载、实际查询了 Grandet，并给出选择、单位、日期和来源。若新会话仍索要文件，应修复保存位置或绑定。

Keep the completion message short: say where the Skill is installed and how to ask next. Report fresh-session testing as pending if it has not run. / 最后简短告知安装位置、生效范围和下一句怎么问；尚未完成的新会话验证如实保留。
