# 安装 Grandet / Install Grandet

**你不需要读这一页。** 把这句话发给你的 Agent 就行：

```text
帮我安装 Grandet：https://github.com/hanzohanzhe/Grandet
```

**You don't need to read this page.** Paste this into your agent:

```text
Install Grandet for me: https://github.com/hanzohanzhe/Grandet
```

这一页是给执行安装的 Agent 看的，后面附有手动安装方法。 / This page is for the agent doing the installation. Manual steps for people are at the end.

- [For the installing agent](#for-the-installing-agent)
- [手动安装](#手动安装)
- [Manual installation](#manual-installation)

Grandet API Price Finder **0.3.1**, public preview.

## For the installing agent

The user has asked you to install Grandet. Do the whole setup yourself. Don't hand commands, folder paths or Node installation back to the user. Stop only for something only they can do (sign in, approve a permission, press a button in the app): name that one step, then carry on.

### 1. Get the files

For a fresh installation, use the official **skill-v0.3.1 Release attachments** linked below. The ZIP is an agent installation kit; `.skill` is the native import archive. Check `downloads/manifest-0.3.1.json` and the post-upload `downloads/releases.json` registration. Do not use a generic latest release or GitHub Source code ZIP. A candidate is not a registered published release until it has actual GitHub asset IDs.

You need the complete `grandet-api-price-finder` folder: `SKILL.md`, `references/` and `agents/`. `SKILL.md` alone is not enough.

- If a usable package, checkout or cached copy is already present, reuse it without re-downloading. In this repository or the extracted ZIP, the folder is at [`skills/grandet-api-price-finder/`](https://github.com/hanzohanzhe/Grandet/blob/main/skills/grandet-api-price-finder/SKILL.md).
- Otherwise download and extract the [installation ZIP](https://github.com/hanzohanzhe/Grandet/releases/download/skill-v0.3.1/grandet-api-price-finder-0.3.1.zip) from this repository.

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

**Local agents, with Node available.** From the root of the package or checkout, run `scripts/install-price-finder.mjs` with the right ID:

```sh
node scripts/install-price-finder.mjs --app <installer-id>
```

`--list` shows every ID and folder. The script copies the complete folder, leaves an identical existing copy alone (`UNCHANGED` / `REUSED`), and backs up a different older copy outside the skills folder before replacing it. `--home` and `--platform` are for tests and dry runs only; they don't install for the real user.

**Local agents, without Node.** Prefer the bundled Python 3 installer/verifier: `python3 scripts/verify-installation.py --source skills/grandet-api-price-finder --destination <actual-persistent-skill-folder> --host <host-id> --scope user`. It installs and reads back the complete tree. If neither runtime is available, use your file tools and retain the receipt coverage gap:

1. Check the app's skill folder (and any alias folder listed in the per-app guide) for an existing `grandet-api-price-finder`. If it is identical, keep it. If it differs, move it somewhere outside every skills folder as a backup.
2. Copy the complete folder into the skill folder. Don't follow symlinks out of it. Keep exactly one active copy.
3. Leave other skills, model settings and provider keys untouched.

**Web, account and cloud apps.** Use the app's own Skills manager to save and enable the Skill once. Upload the [`.skill` file](https://github.com/hanzohanzhe/Grandet/releases/download/skill-v0.3.1/grandet-api-price-finder-0.3.1.skill) (rename a copy to `.zip` if only ZIP is accepted). Don't upload the larger installation ZIP: it is an agent kit, not a native skill package. A file attached to a chat message is not an installation, and files copied to a local machine don't reach a cloud agent. If a Grandet Skill is already saved, update it in place instead of adding a second one. The per-app guide lists the menu path for each app.

### Installation receipt and privacy

Before running the installer, explain briefly: installation statistics receive random IDs, operation, version, content hash, source/host/scope categories, verification and time, retained 24 months. No path, username, account, chat or key is sent. `--no-telemetry` or `GRANDET_INSTALL_TELEMETRY=0` disables sending; offline installation still works. The installer retains a private crash-recovery journal and outbox; a later `--flush` sends pending receipts without reinstalling. Only installation-stage commands send receipts. Manual copies and readable native imports can run the bundled Python verifier on the saved folder; unavailable callbacks/readback remain unverified. [Full receipt contract](https://github.com/hanzohanzhe/Grandet/blob/main/docs/skills/installation-receipts.md).

### 4. Check it works

1. Read back the installed `SKILL.md` and confirm `references/` and `agents/` are complete.
2. On apps with a separate description field, make sure it matches the `description` in the current `SKILL.md` frontmatter, and that the Skill is enabled.
3. Make one anonymous read of `https://grandet.ai/public-data/price-finder.json`, via the Grandet MCP server (`https://grandet.ai/mcp`) or a plain HTTP GET. No account or key is needed. If the app asks permission to reach `grandet.ai`, get it now rather than at the user's first question. Don't switch off global safety settings to do so.

Adding the MCP server alone does not install the Skill; saving the Skill alone does not prove the app can reach Grandet. Both checks matter.

### 5. Tell the user

Keep it to two lines: where it is installed, and what to ask next. For example:

> Installed in Codex's user skills. Open a new conversation and ask something like "find me a cheap Sonnet 4.6 API for coding, one pick and one backup".

If you can, verify in a clean new conversation: no attachment, no mention of Grandet, no manual skill selection. If that conversation asks for the file again, the install did not persist; fix the location or the binding, and don't ask the user to keep uploading. If you couldn't run this check, say it hasn't been tested yet. Report only what you actually saw.

## 手动安装

适合想自己动手的人，或者 Agent 装不了的应用。

**Codex、Claude Code、Cursor 这类本地 Agent**

1. 下载[安装 ZIP](https://github.com/hanzohanzhe/Grandet/releases/download/skill-v0.3.1/grandet-api-price-finder-0.3.1.zip) 并解压。
2. 把里面的 `skills/grandet-api-price-finder` 整个文件夹复制到对应目录：
   - Codex：`~/.agents/skills/`
   - Claude Code：`~/.claude/skills/`
   - Cursor：`~/.cursor/skills/`
   - 其他应用见[各应用安装位置](https://github.com/hanzohanzhe/Grandet/blob/main/skills/grandet-api-price-finder/references/installation.md)。
   - Windows 上 `~` 指 `C:\Users\你的用户名`。
3. 重启应用，或者新开一个对话。

装了 Node 的话，第 2 步也可以在解压目录里运行 `node scripts/install-price-finder.mjs --app codex`（把 `codex` 换成你的应用，`--list` 能看到全部）。

**ChatGPT、Claude 网页版这类上传技能的应用**

1. 下载 [`.skill` 文件](https://github.com/hanzohanzhe/Grandet/releases/download/skill-v0.3.1/grandet-api-price-finder-0.3.1.skill)。
2. 在应用的技能页面上传并启用：
   - ChatGPT：[Skills](https://chatgpt.com/skills) → Add skill → Upload from computer
   - Claude 网页版：Customize → Skills → + → Create skill → Upload a skill
   - 其他应用见[各应用安装位置](https://github.com/hanzohanzhe/Grandet/blob/main/skills/grandet-api-price-finder/references/installation.md)。

   只能选 `.zip` 的话，把 `.skill` 改名成 `.zip` 再传。不要上传那个大的安装 ZIP，那是给 Agent 用的。

**确认装好了**：新开对话，不发文件、不提 Grandet，问一句“帮我找便宜的 Sonnet 4.6 API，写代码用，推荐一家再给个备选”。如果它让你再发一次文件，说明没有装好，检查文件夹位置，或者技能有没有启用。

## Manual installation

For people who prefer to do it themselves, or apps an agent can't install into.

**Local agents such as Codex, Claude Code and Cursor**

1. Download the [installation ZIP](https://github.com/hanzohanzhe/Grandet/releases/download/skill-v0.3.1/grandet-api-price-finder-0.3.1.zip) and extract it.
2. Copy the whole `skills/grandet-api-price-finder` folder into your app's skill folder:
   - Codex: `~/.agents/skills/`
   - Claude Code: `~/.claude/skills/`
   - Cursor: `~/.cursor/skills/`
   - Other apps: see the [per-app guide](https://github.com/hanzohanzhe/Grandet/blob/main/skills/grandet-api-price-finder/references/installation.md).
   - On Windows, `~` is `C:\Users\<your name>`.
3. Restart the app or open a new conversation.

With Node installed, you can do step 2 by running `node scripts/install-price-finder.mjs --app codex` in the extracted folder (replace `codex` with your app; `--list` shows them all).

**Apps where you upload a skill, such as ChatGPT and Claude on the web**

1. Download the [`.skill` file](https://github.com/hanzohanzhe/Grandet/releases/download/skill-v0.3.1/grandet-api-price-finder-0.3.1.skill).
2. Upload and enable it in the app's skills page:
   - ChatGPT: [Skills](https://chatgpt.com/skills) → Add skill → Upload from computer
   - Claude on the web: Customize → Skills → + → Create skill → Upload a skill
   - Other apps: see the [per-app guide](https://github.com/hanzohanzhe/Grandet/blob/main/skills/grandet-api-price-finder/references/installation.md).

   If the app only accepts `.zip`, rename the `.skill` file to `.zip`. Don't upload the larger installation ZIP; that one is for agents.

**Check it worked**: open a new conversation and, without attaching anything or mentioning Grandet, ask "Find me a cheap Sonnet 4.6 API for coding, one pick and one backup." If it asks for the file again, the install didn't stick: check the folder location, or whether the skill is enabled.
