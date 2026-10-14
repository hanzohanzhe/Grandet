# Installing the Skill, app by app

Grandet Skill **0.3.0**, public preview. This is the current per-app installation guide.

The goal for every app is the same: **save the complete Skill once, keep it enabled, then ask normally in new conversations.** No repeated attachments and no manual skill selection per question. Uploading the Skill into a real Skills manager counts as installing; attaching it to a chat message does not.

Start from the app and account the user already has; don't ask them to sign up for anything else. The tables below describe where and how each app installs Skills. Unless a row says otherwise, the route has not yet been tested end to end in that app.

## What to install

The whole `grandet-api-price-finder` folder, never `SKILL.md` alone:

```text
grandet-api-price-finder/
├── SKILL.md
├── references/
└── agents/
```

For an upload screen, use the native `.skill` package, not the larger installation ZIP (that one is an agent kit).

To look up live prices the app also needs a Grandet MCP connection or a way to make HTTP requests. Adding the MCP server only adds tools; it does not install this Skill's workflow.

## Installation and update checks

Do these on every install or update:

1. **Update in place.** If a Grandet Skill is already saved, keep its identity/ID and update it. Don't create a duplicate.
2. **Sync the description.** If the app has a separate description field, copy the full current `description` from the `SKILL.md` frontmatter. It replaces any older, price-only description. This is required, not optional.
3. **Read back.** Check the saved content, the description and that the Skill is enabled.
4. **One anonymous read.** Fetch `https://grandet.ai/public-data/price-finder.json` through an available MCP or HTTP reader. No supplier key, no extra tracking call.

If any of these can't be done, the installation isn't finished: say so and give the one concrete next step. Passing these checks still isn't the same as the Skill triggering by itself in a fresh conversation; that is tested separately (see the end of this page).

## Local apps (user-level folder)

Copy the complete folder once into the folder in the second column, so the result is `<folder>/grandet-api-price-finder/SKILL.md`. Then restart the app or open a new conversation. These are user-level folders that work across projects; a project-relative `.xxx/skills` folder only covers that one project.

`~` is the home of the account that runs the agent. On native Windows that is usually `%USERPROFILE%`; WSL, SSH and cloud runners each have their own. An explicit home override set for the runtime wins.

| App (installer ID) | User skill folder | Notes |
|---|---|---|
| Codex `codex` | `~/.agents/skills/` | Local app, CLI and IDE, across repositories. Keep implicit invocation on. Check the older `~/.codex/skills/` for a duplicate. [Docs](https://learn.chatgpt.com/docs/build-skills) |
| Claude Code `claude-code` | `~/.claude/skills/` | All local projects. Cowork and cloud sessions don't read this folder; use account Skills (below). [Docs](https://code.claude.com/docs/en/skills) |
| Cursor `cursor` | `~/.cursor/skills/` | Local Agent across projects; check under Customize → Skills. Cloud Agent needs the separate sync step below. [Docs](https://cursor.com/docs/skills) |
| OpenCode `opencode` | `~/.agents/skills/` or `~/.config/opencode/skills/` | The installer uses the shared `~/.agents/skills/`. Keep one active copy; leave the skill tool and auto-discovery on. [Docs](https://opencode.ai/docs/skills/) |
| Gemini CLI `gemini-cli` | `~/.gemini/skills/` | `gemini skills install <folder-or-package>` installs at user level; `/skills list` confirms. The first use may show a permission prompt; no reinstall needed. [Docs](https://geminicli.com/docs/cli/using-agent-skills/) |
| Windsurf `windsurf` | `~/.codeium/windsurf/skills/` | Global across workspaces. In the UI: Cascade → … → Skills → + Global. The docs URL now redirects to Devin Desktop; check which edition is installed. [Docs](https://docs.windsurf.com/windsurf/cascade/skills) |
| Cline `cline` | `~/.cline/skills/` | Windows: `%USERPROFILE%\.cline\skills\`. Enabled on discovery; check via the scale icon → Skills. [Docs](https://docs.cline.bot/customization/skills) |
| Roo Code `roo-code` | `~/.roo/skills/` | Windows: `%USERPROFILE%\.roo\skills\`. Use the generic `skills/` folder so every mode sees it; `skills-code/` would limit it to Code mode. [Docs](https://roocodeinc.github.io/Roo-Code/features/skills/) |
| Kilo Code `kilo-code` | `~/.kilo/skills/` | Current CLI and extension discover Skills at the start of a session; `/reload` refreshes. Older `.kilocode` builds need checking per version. Local Skills don't reach Kilo Cloud. [Skills](https://kilo.ai/docs/customize/skills) · [Cloud](https://kilo.ai/docs/code-with-ai/platforms/cloud-agent) |
| Continue `continue` | `~/.continue/skills/` or `$CONTINUE_GLOBAL_DIR/skills/` | Current CLI and IDE load global Skills through their skill tool. Check the installed build; don't touch model settings. [CLI source](https://github.com/continuedev/continue/blob/5522c6f44ca0ac3528b37244818fbfa39b5af470/extensions/cli/src/util/loadMarkdownSkills.ts) · [IDE source](https://github.com/continuedev/continue/blob/5522c6f44ca0ac3528b37244818fbfa39b5af470/core/tools/definitions/readSkill.ts) |
| TRAE `trae-cn` / `trae-intl` | China: `~/.trae-cn/skills/`; international: `~/.trae/skills/` | Or Settings → Skills & Commands → Create → Global, and import the complete package. The two editions use different folders. [China](https://docs.trae.cn/ide_skills) · [International](https://docs.trae.ai/ide/skills) |
| Hermes `hermes` | `$HERMES_HOME/skills/` | Install for the backend/profile actually in use. Defaults: `~/.hermes/skills/` on macOS/Linux, `%LOCALAPPDATA%\hermes\skills\` on native Windows. Skills inside plugins follow different rules. [Skills](https://hermes-agent.nousresearch.com/docs/guides/work-with-skills/) · [Install](https://hermes-agent.nousresearch.com/docs/getting-started/installation) |
| OpenClaw `openclaw` | `<state-dir>/skills/`, usually `~/.openclaw/skills/` | Install on the machine running the Gateway. Agent allowlists and workspace overrides can hide it. [Docs](https://docs.openclaw.ai/tools/skills) |

Several apps share `~/.agents/skills/`. Pick one route and keep one copy instead of installing the same Skill everywhere. Local files are not account sync: for cloud agents, install on the actual runtime or use the account route below.

## Account, web and cloud apps

Save and enable the complete Skill once in the app's Skills manager. Later conversations should have it without attachments. Where a Skill is bound to one Agent, it covers new chats with that Agent only.

| App | One-time setup | Scope and status |
|---|---|---|
| ChatGPT | [Skills](https://chatgpt.com/skills) → Add skill → Upload from computer; choose the `.skill` (or `.zip`) package and save. | Accepts `.zip`, `.skill` or `SKILL.md`, up to 25 MB. A lone `SKILL.md` lacks the reference files, so upload the package. Saving and fresh-conversation triggering not yet tested. [Docs](https://learn.chatgpt.com/docs/build-skills) |
| Claude (web) `claude-ai` | Customize → Skills → + → Create skill → Upload a skill; upload the native ZIP and keep it enabled. | Personal account Skill; needs Code execution and file creation turned on. Organisation policy can block it. Tested on an earlier version; changed packages need retesting. [Docs](https://support.claude.com/en/articles/12512180-use-skills-in-claude) |
| Cursor Cloud Agent | Install locally in `~/.cursor/skills/` first, then Settings → Agents → Context and Tools → Sync Skills for Cloud Agents → Confirm. | Private sync of that folder only; `~/.agents/skills/` stays local. Teams can disable sync. Cloud run not yet tested. [Docs](https://cursor.com/docs/skills) |
| Cherry Studio `cherry-studio` | Settings → Skills → Add Skill → Local import; import the folder or ZIP and enable it globally. Then Work → Agent menu → Edit → Skills and enable it for the Agent you use. | Later chats with that Agent use it. If you use MCP, enable that connection for the same Agent too. Global import alone is not enough. [Skills](https://www.cherryai.com/docs/en/advanced-basic/extensions/skills/) · [Agent binding](https://cherryai.com/docs/en/advanced-basic/agent-workspace/tools-knowledge-skills-mcp/) |
| Chatbox `chatbox` | Desktop: Settings → Skills → open the local skills folder; copy the complete folder in and enable it. | Skills only run in **Work Mode**. New chats start in Chat Mode, and Smart Switching may ask to switch, so this is not yet seamless. Desktop only; web and mobile not covered. [Configuration](https://beta.chatboxai.app/en/guide/work-mode/configuration) · [Work Mode](https://beta.chatboxai.app/en/guide/work-mode/overview) |
| WorkBuddy `workbuddy` (China) | Skills → Add Skill → Upload Skill; upload the package and keep it enabled. | Installed Skills match automatically. Account settings sync doesn't prove the files reach every device. [Docs](https://www.codebuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Skills-Market) |
| WorkBuddy `workbuddy` (international) | Save it once through the app's own custom-Skill create/import feature, then check it shows as installed and enabled. | Custom Skills are documented; whether the import menu matches the China edition is unverified, so don't assume the same menu. [Skills](https://www.workbuddy.ai/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Skills-Market) · [Creating Skills](https://www.workbuddy.ai/docs/zh/workbuddy/From-Beginner-to-Expert-Guide/Practice-Cases/Create-Skills) |
| Grok Bot `grok-bot` | Use the packaged Grok Bot adapter: save it as a private Skill, then Connect apps → connected count → Private skills and enable it for the Bot. | A saved Skill can be reused across Bots, but each Bot may need enabling. Partly tested. [Docs](https://cursor.com/docs/grok-bot/work) |
| Your dot `your-dot` | Use the packaged Your dot adapter with a supported account plugin, or connect a computer once from the dot profile to use local Skills. | The local route needs that computer online with the app open. A Codex connection is not dot permission. Not yet tested. [Docs](https://learn.chatgpt.com/docs/dots/computers-and-apps) |
| Meta Muse `muse` | Use the packaged Muse adapter and Muse's own private custom-Skill feature to save it once. | Custom Skills are documented; the exact import, save step and automatic triggering are not yet tested. [Meta](https://research.meta.ai/blog/security-and-safety-for-ai-agents-our-approach-with-muse) |

These names identify installation surfaces only. They don't add website `targetApp` values or supplier protocols; API targets follow the service's own app catalogue.

## Testing in a fresh conversation

After installing, close the installation conversation and open an ordinary new one in the same scope. Without attaching a file, naming Grandet, typing a command or picking the Skill, ask:

> 帮我找适合写代码的便宜 GPT API，给我一个推荐和一个备选。

> Find a cheap API provider for Claude Sonnet 4.6 for coding. Give me one recommendation and one backup.

Check that the app loads the saved Skill, reads current Grandet data and gives a useful answer with sources. Then restart the app and try again in another new conversation. Record "installed", "triggered by itself" and "lookup worked" as three separate results.

If the new conversation asks for the file again, the install did not persist. Fix the location or binding; don't tell the user to keep uploading. Account, runtime or mode limits stay recorded as pending or blocked until they are resolved.

Use the current files from [Grandet's GitHub repository](https://github.com/hanzohanzhe/Grandet). New installations default to the registered **skill-v0.3.0 Release ZIP or .skill attachment**; reuse complete existing checkouts and caches without re-downloading. Exact contents are identified by commit and SHA-256.

## Optional companion receipt tools

Product and API protocol version remains 0.3.0. The original 0.3.0 ZIP/.skill and downloads/manifest.json stay byte-identical and do not include the new receipt helpers. Current repository scripts are a separate source-only build, `grandet-installation-receipts-source-20261014.1`, not a newly certified Skill release. Use those helpers with a complete 0.3.0 folder or an existing installation; no package re-download is required. Read the [companion tool instructions](https://github.com/hanzohanzhe/Grandet/blob/main/docs/skills/installation-receipts.md) before receipt delivery. No readback/callback means native acceptance remains NOT_RUN.
