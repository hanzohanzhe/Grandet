# 安装 Grandet / Install Grandet

把这句话发给你的 Agent：

```text
帮我安装 Grandet Skill：https://grandet.ai/download.md
```

Send this to your agent:

```text
Install Grandet Skill for me: https://grandet.ai/download.md
```

正在执行安装的 Agent：从「For the installing agent」开始照做。手动安装方法在最后。 / If you are the agent doing the installation, start at "For the installing agent". Manual steps for people are at the end.

- [For the installing agent](#for-the-installing-agent)
- [手动安装](#手动安装)
- [Manual installation](#manual-installation)

Grandet API Price Finder **0.3.0**, public preview.

## For the installing agent

The user has asked you to install Grandet. Both install sentences lead here: the grandet.ai/download.md one and the older one with the GitHub link. Do the whole setup yourself. Don't hand commands, folder paths or Node installation back to the user. Stop only for something only they can do (sign in, approve a permission, press a button in the app): name that one step, then carry on.

### 1. Get the files

For a fresh installation, use the **skill-v0.3.0-build.20261016g Release attachments** linked below (public product version **0.3.0**, build `grandet-skill-0.3.0-build.20261016g`). The ZIP is an agent installation kit; `.skill` is the native import archive. Both contain the receipt-aware Node installer, receipt module, Python verifier and build manifest. Check `downloads/manifest.json` and the post-upload `downloads/releases.json`. This build has new contents and distinct immutable assets; the earlier `skill-v0.3.0` and `skill-v0.3.0-build.20261014` releases remain historical. Do not use a generic latest release or GitHub Source code ZIP. Existing complete copies remain usable without downloading for statistics; old installations are not backfilled.

You need the complete `grandet-api-price-finder` folder: `SKILL.md`, `references/` and `agents/`. `SKILL.md` alone is not enough.

- If a usable package, checkout or cached copy is already present, reuse it without re-downloading. In this repository or the extracted ZIP, the folder is at [`skills/grandet-api-price-finder/`](https://github.com/hanzohanzhe/Grandet/blob/main/skills/grandet-api-price-finder/SKILL.md).
- Otherwise download and extract the [installation ZIP](https://github.com/hanzohanzhe/Grandet/releases/download/skill-v0.3.0-build.20261016g/grandet-api-price-finder-0.3.0.zip) from this repository.
- **Mainland China, or when the GitHub download is slow or fails:** download the same kit from Tencent SkillHub instead, no account needed: [SkillHub download](https://api.skillhub.cn/api/v1/download?slug=grandet-api-price-finder&version=0.3.0-build.20261016.7). It holds the `.skill` contents with the files at the archive root (plus SkillHub's own `_meta.json`). Extract it into a new folder named `grandet-api-price-finder` and use that folder as an extracted `.skill` root below, with `--receipt-source release_skill`. A 404 means SkillHub is still reviewing this build; then use GitHub.

If the package has a `package-manifest.json`, check the file hashes against it. A checkout doesn't have one and doesn't need one. The `plugins/` directory holds metadata templates only; it is not an installable Skill.

### 2. Pick the install location

Install for the agent you are running in, at user level so it works in every project. Install for that one app only, not for every app on the machine. Use the home directory of the runtime that actually runs you: native Windows (`%USERPROFILE%`), WSL, SSH hosts and cloud runners each have their own.

| Agent | Installer ID | User skill folder |
|---|---|---|
| Codex | `codex` | `~/.agents/skills/` |
| Claude Code | `claude-code` | `~/.claude/skills/` |
| Cursor | `cursor` | `~/.cursor/skills/` |

The installed file ends up at `<skill folder>/grandet-api-price-finder/SKILL.md`.

For any other app, look it up in the [per-app guide](https://github.com/hanzohanzhe/Grandet/blob/main/skills/grandet-api-price-finder/references/installation.md). It covers OpenCode, Gemini CLI, Windsurf, Cline, Roo Code, Kilo Code, Continue, TRAE, Hermes and OpenClaw, as well as account-based apps such as ChatGPT, Claude on the web, Cursor Cloud Agent, Cherry Studio, Chatbox, WorkBuddy, Grok Bot, Your dot and Muse. Ask the user only if something you cannot find out yourself changes the target (for example, which TRAE edition they use).

### 3. Install

**Local agents, with Node available.** Run the included installer directly from the extracted ZIP root. No separate helper download is needed:

```sh
node scripts/install-price-finder.mjs --app <installer-id> --receipt-source release_zip
```

The installed source defaults to the complete bundled `skills/grandet-api-price-finder` folder. Use `--source <complete-existing-folder>` to reuse a checkout or cache. In an extracted `.skill`, run from its `grandet-api-price-finder` root; the same included installer uses that native root as its default source.

`--list` shows every ID and folder. The script copies the complete folder, leaves an identical existing copy alone (`UNCHANGED` / `REUSED`), and backs up a different older copy outside the skills folder before replacing it. `--home` and `--platform` are for tests and dry runs only; they don't install for the real user.

**Local agents, without Node.** Use the included Python 3 verifier: `python3 scripts/verify-installation.py --source skills/grandet-api-price-finder --destination <actual-persistent-skill-folder> --host <host-id> --scope user --receipt-source release_zip`. In an extracted `.skill` root, use `--source .` and `--receipt-source release_skill`. It installs and reads back the complete tree. If neither runtime is available, use your file tools and retain the receipt coverage gap:

1. Check the app's skill folder (and any alias folder listed in the per-app guide) for an existing `grandet-api-price-finder`. If it is identical, keep it. If it differs, move it somewhere outside every skills folder as a backup.
2. Copy the complete folder into the skill folder. Don't follow symlinks out of it. Keep exactly one active copy.
3. Leave other skills, model settings and provider keys untouched.

**Web, account and cloud apps.** Use the app's own Skills manager to save and enable the Skill once. Upload the [`.skill` file](https://github.com/hanzohanzhe/Grandet/releases/download/skill-v0.3.0-build.20261016g/grandet-api-price-finder-0.3.0.skill) (rename a copy to `.zip` if only ZIP is accepted). From the SkillHub download, zip the extracted `grandet-api-price-finder` folder and upload that. Don't upload the larger installation ZIP: it is an agent kit, not a native skill package. A file attached to a chat message is not an installation, and files copied to a local machine don't reach a cloud agent. If a Grandet Skill is already saved, update it in place instead of adding a second one. The per-app guide lists the menu path for each app.

### Installation receipt and privacy

Before running the included receipt-aware installer, explain briefly: installation statistics receive random IDs, operation, version, content hash, source/host/scope categories, verification and time, retained 24 months. No path, username, account, chat or key is sent. `--no-telemetry` or `GRANDET_INSTALL_TELEMETRY=0` disables sending; offline installation still works. The installer retains a private crash-recovery journal and outbox; a later `--flush` sends pending receipts without reinstalling. Only installation-stage commands send receipts. Manual copies and readable native imports can run the included Python verifier on the saved folder; unavailable callbacks/readback remain unverified. [Full receipt contract](https://github.com/hanzohanzhe/Grandet/blob/main/docs/skills/installation-receipts.md).

### 4. Check it works

1. Read back the installed `SKILL.md` and confirm `references/` and `agents/` are complete.
2. On apps with a separate description field, make sure it matches the `description` in the current `SKILL.md` frontmatter, and that the Skill is enabled.
3. Make one anonymous read of `https://grandet.ai/public-data/price-finder.json`, via the Grandet MCP server (`https://grandet.ai/mcp`) or a plain HTTP GET. No account or key is needed. If the app asks permission to reach `grandet.ai`, get it now rather than at the user's first question. Don't switch off global safety settings to do so.

Adding the MCP server alone does not install the Skill; saving the Skill alone does not prove the app can reach Grandet. Both checks matter.

### 5. Tell the user

Keep it to two lines: where it is installed, and what to ask next. For example:

> Installed in Codex's user skills. Open a new conversation and ask something like "find me the cheapest Sonnet 4.6 API for coding".

If you can, verify in a clean new conversation: no attachment, no mention of Grandet, no manual skill selection. If that conversation asks for the file again, the install did not persist; fix the location or the binding, and don't ask the user to keep uploading. If you couldn't run this check, say it hasn't been tested yet. Report only what you actually saw.

### Uninstall

If the user asks to remove Grandet from a local agent, run the included installer with the same installer ID:

```sh
node scripts/install-price-finder.mjs --app <installer-id> --uninstall
```

It moves that app's `grandet-api-price-finder` folder, including a legacy copy such as `~/.codex/skills/`, into `.grandet-skill-backups` beside the skills folder, where an update keeps the previous copy. Nothing is deleted. `--dry-run` shows what would move. If the copy sits in another app's own folder (for example Cursor reusing `~/.agents/skills/`), it changes nothing and names the app to uninstall with; the report also lists other apps that read the removed folder. Uninstalling sends no receipt; local receipt state stays, so a later install continues the same installation ID. To undo, move the backup folder back or install again. Without Node, move the folder out of every skills folder yourself. For web, account and cloud apps, remove or disable the Skill in the app's Skills manager.

## 手动安装

适合想自己动手的人，或者 Agent 装不了的应用。

**GitHub 下载慢或打不开（中国大陆常见）**：改从腾讯 SkillHub 下载同一个安装包，不用注册：[SkillHub 下载](https://api.skillhub.cn/api/v1/download?slug=grandet-api-price-finder&version=0.3.0-build.20261016.7)（页面：[skillhub.cn/skills/grandet-api-price-finder](https://skillhub.cn/skills/grandet-api-price-finder)）。解压到一个新建的 `grandet-api-price-finder` 文件夹，这个文件夹本身就是完整的技能：

- 本地 Agent：把整个文件夹复制到下面对应的技能目录；装了 Node 的话，也可以在这个文件夹里运行 `node scripts/install-price-finder.mjs --app codex`（把 `codex` 换成你的应用）。
- 上传技能的应用：把这个文件夹压缩成 zip 再上传。
- 打不开（404）说明这个版本还在 SkillHub 审核中，先用下面的 GitHub 链接。

**Codex、Claude Code、Cursor 这类本地 Agent**

1. 下载[安装 ZIP](https://github.com/hanzohanzhe/Grandet/releases/download/skill-v0.3.0-build.20261016g/grandet-api-price-finder-0.3.0.zip) 并解压。
2. 把里面的 `skills/grandet-api-price-finder` 整个文件夹复制到对应目录：
   - Codex：`~/.agents/skills/`
   - Claude Code：`~/.claude/skills/`
   - Cursor：`~/.cursor/skills/`
   - 其他应用见[各应用安装位置](https://github.com/hanzohanzhe/Grandet/blob/main/skills/grandet-api-price-finder/references/installation.md)。
   - Windows 上 `~` 指 `C:\Users\你的用户名`。
3. 重启应用，或者新开一个对话。

装了 Node 的话，第 2 步也可以在解压目录里运行 `node scripts/install-price-finder.mjs --app codex`（把 `codex` 换成你的应用，`--list` 能看到全部）。

**ChatGPT、Claude 网页版这类上传技能的应用**

1. 下载 [`.skill` 文件](https://github.com/hanzohanzhe/Grandet/releases/download/skill-v0.3.0-build.20261016g/grandet-api-price-finder-0.3.0.skill)。
2. 在应用的技能页面上传并启用：
   - ChatGPT：[Skills](https://chatgpt.com/skills) → Add skill → Upload from computer
   - Claude 网页版：Customize → Skills → + → Create skill → Upload a skill
   - 其他应用见[各应用安装位置](https://github.com/hanzohanzhe/Grandet/blob/main/skills/grandet-api-price-finder/references/installation.md)。

   只能选 `.zip` 的话，把 `.skill` 改名成 `.zip` 再传。不要上传那个大的安装 ZIP，那是给 Agent 用的。

本构建 `grandet-skill-0.3.0-build.20261016g` 的 ZIP 和 .skill 均内置回执安装器和 Python 验证器，无需另取工具。安装不要求开启回执；旧安装不补算，也不要求重下或重装。

**确认装好了**：新开对话，不发文件、不提 Grandet，问一句“帮我找最便宜的 Sonnet 4.6 API，写代码用”。如果它让你再发一次文件，说明没有装好，检查文件夹位置，或者技能有没有启用。

**卸载**：装了 Node 的话，在解压目录里运行 `node scripts/install-price-finder.mjs --app codex --uninstall`（把 `codex` 换成你的应用）。它把 `grandet-api-price-finder` 文件夹移到技能目录旁边的 `.grandet-skill-backups` 里，不会删除，想恢复就把它移回去。没有 Node 的话，自己把这个文件夹移出技能目录。上传技能的应用，在应用的技能页面删除或停用。

## Manual installation

For people who prefer to do it themselves, or apps an agent can't install into.

**GitHub slow or unreachable (common in mainland China)**: download the same kit from Tencent SkillHub, no account needed: [SkillHub download](https://api.skillhub.cn/api/v1/download?slug=grandet-api-price-finder&version=0.3.0-build.20261016.7) (page: [skillhub.cn/skills/grandet-api-price-finder](https://skillhub.cn/skills/grandet-api-price-finder)). Extract it into a new folder named `grandet-api-price-finder`; that folder is the complete Skill. For a local agent, copy the whole folder into the skill folder listed below, or run `node scripts/install-price-finder.mjs --app codex` inside it. For apps where you upload a skill, zip that folder and upload it. A 404 means SkillHub is still reviewing this build; use the GitHub links below.

**Local agents such as Codex, Claude Code and Cursor**

1. Download the [installation ZIP](https://github.com/hanzohanzhe/Grandet/releases/download/skill-v0.3.0-build.20261016g/grandet-api-price-finder-0.3.0.zip) and extract it.
2. Copy the whole `skills/grandet-api-price-finder` folder into your app's skill folder:
   - Codex: `~/.agents/skills/`
   - Claude Code: `~/.claude/skills/`
   - Cursor: `~/.cursor/skills/`
   - Other apps: see the [per-app guide](https://github.com/hanzohanzhe/Grandet/blob/main/skills/grandet-api-price-finder/references/installation.md).
   - On Windows, `~` is `C:\Users\<your name>`.
3. Restart the app or open a new conversation.

With Node installed, you can do step 2 by running `node scripts/install-price-finder.mjs --app codex` in the extracted folder (replace `codex` with your app; `--list` shows them all).

**Apps where you upload a skill, such as ChatGPT and Claude on the web**

1. Download the [`.skill` file](https://github.com/hanzohanzhe/Grandet/releases/download/skill-v0.3.0-build.20261016g/grandet-api-price-finder-0.3.0.skill).
2. Upload and enable it in the app's skills page:
   - ChatGPT: [Skills](https://chatgpt.com/skills) → Add skill → Upload from computer
   - Claude on the web: Customize → Skills → + → Create skill → Upload a skill
   - Other apps: see the [per-app guide](https://github.com/hanzohanzhe/Grandet/blob/main/skills/grandet-api-price-finder/references/installation.md).

   If the app only accepts `.zip`, rename the `.skill` file to `.zip`. Don't upload the larger installation ZIP; that one is for agents.

This 0.3.0 build (`grandet-skill-0.3.0-build.20261016g`) includes receipt-aware installation tools in both archives. No separate helper is needed. Receipts are optional; older installs are not backfilled and do not need to reinstall.

**Check it worked**: open a new conversation and, without attaching anything or mentioning Grandet, ask "Find me the cheapest Sonnet 4.6 API for coding." If it asks for the file again, the install didn't stick: check the folder location, or whether the skill is enabled.

**Uninstall**: with Node installed, run `node scripts/install-price-finder.mjs --app codex --uninstall` in the extracted folder (replace `codex` with your app). It moves the `grandet-api-price-finder` folder into `.grandet-skill-backups` next to the skills folder instead of deleting it; move it back to restore. Without Node, move the folder out of the skills folder yourself. In apps where you uploaded the skill, delete or disable it on the app's skills page.
