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

## Installing or updating: four steps agents get wrong

In past installs that agents did on their own, these four steps were the ones that failed. Do each of them.

1. **Read the instructions with `curl`:** `curl -sS https://grandet.ai/download.md` (Windows: `curl.exe`). Never use a web-page reader, browser or search tool (`web_extract`, `fetch` and the like): they can return a cached old copy that links an older build. Newer versions of the website also answer `curl -sS https://grandet.ai/dl/latest.json`; when that returns JSON, take `build`, `zip.url` and `zip.sha256` from it. Otherwise (404), use the build and the pinned links at the top of download.md.
2. **Install that build, not one you remember.** Download the ZIP named in step 1, check its SHA-256, extract it, and run the bundled installer in the extracted folder: `node scripts/install-price-finder.mjs --app <installer-id>` (for example `--app hermes`).
3. **Check the build.** The installed `SKILL.md` ends with an `Installation build` line. It must name the build from step 1; an older build means an old copy was installed, so start again at step 1. The installed folder must hold `SKILL.md`, `references/` and `agents/`.
4. **Hermes goes into `$HERMES_HOME/skills/` only.** Run `echo "$HERMES_HOME"` (PowerShell: `$env:HERMES_HOME`) first. When it is set, the Skill goes into `$HERMES_HOME/skills/grandet-api-price-finder/` and nowhere else; `~/.hermes/skills/` is only for when it is empty. Check with `hermes skills list`.

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

**Hermes.** Hermes reads skills from `$HERMES_HOME/skills/`, and a profile (`hermes -p <name>`) sets `HERMES_HOME` to that profile's folder, also inside its terminal. So when `HERMES_HOME` is set (PowerShell: `$env:HERMES_HOME`), install into `$HERMES_HOME/skills/grandet-api-price-finder/`; only when it is empty use the default `~/.hermes/skills/` (native Windows: `%LOCALAPPDATA%\hermes\skills\`). A copy in the default folder is not seen by a profile. Prefer the bundled installer, which follows `HERMES_HOME` by itself: `node scripts/install-price-finder.mjs --app hermes` from the extracted kit (`--dry-run` prints the destination). Then run `hermes skills list` (with the same profile) and check that `grandet-api-price-finder` is listed. `hermes skills install` and `hermes skills uninstall` are for Hermes hub skills, not for a copied folder.

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

> 帮我找写代码用的最便宜的 GPT API。

> Find the cheapest API for Claude Sonnet 4.6 for coding.

Check that the app loads the saved Skill, reads current Grandet data and gives a useful answer with sources. Then restart the app and try again in another new conversation. Record "installed", "triggered by itself" and "lookup worked" as three separate results.

If the new conversation asks for the file again, the install did not persist. Fix the location or binding; don't tell the user to keep uploading. Account, runtime or mode limits stay recorded as pending or blocked until they are resolved.

## Uninstalling

Uninstalling means taking the `grandet-api-price-finder` folder out of every skill folder the app reads (the table under "Local apps"), then checking in a new session that the Skill is gone. The apps have no command for a copied Skill folder (`hermes skills uninstall` only removes Hermes hub skills); the bundled installer does the same move with `--uninstall` (below). Moving it into `.grandet-skill-backups` beside the skill folder keeps a copy to restore; delete it instead only if the user wants it gone for good.

Hermes on macOS or Linux (uses `HERMES_HOME` when set, as for installing):

```sh
H="${HERMES_HOME:-$HOME/.hermes}"; mkdir -p "$H/.grandet-skill-backups" && mv "$H/skills/grandet-api-price-finder" "$H/.grandet-skill-backups/"
```

Hermes on Windows PowerShell:

```powershell
$H = if ($env:HERMES_HOME) { $env:HERMES_HOME } else { "$env:LOCALAPPDATA\hermes" }; New-Item -ItemType Directory -Force "$H\.grandet-skill-backups" | Out-Null; Move-Item "$H\skills\grandet-api-price-finder" "$H\.grandet-skill-backups\"
```

Then `hermes skills list` must no longer show `grandet-api-price-finder`. If the backup folder already holds an older copy, move or rename that one first. For another app, use the same two steps with its folder from the table, for example `~/.claude/skills/` (Claude Code) or `~/.agents/skills/` (Codex, OpenCode).

With the extracted kit at hand (a folder installed from the `.skill` or SkillHub also holds the installer), it does this for you: `node scripts/install-price-finder.mjs --app <installer-id> --uninstall` (`--dry-run` previews it). It moves this app's `grandet-api-price-finder` folder, and any copy in the app's own legacy folder, into `.grandet-skill-backups` beside the skill folder, where an update keeps the old copy. Nothing is deleted; move the backup back to restore. A copy in another app's own folder (for example `~/.agents/skills/` when uninstalling Cursor or Gemini CLI) is left alone and the installer names the app to uninstall with. Several apps share `~/.agents/skills/`, so removing the copy there removes it for all of them. Without Node, move the folder out of every skill folder by hand. Uninstalling sends no receipt and keeps local receipt state.

Account, web and cloud apps: delete or disable the Skill in the Skills manager where it was saved. A local uninstall does not change a copy already synced to Cursor Cloud Agents.

Use the current files from [Grandet's GitHub repository](https://github.com/hanzohanzhe/Grandet). New installations default to the registered **skill-v0.3.0-build.20261018b Release ZIP or .skill attachment**; reuse complete existing checkouts and caches without re-downloading. Exact contents are identified by commit and SHA-256.

**Mainland China, or when GitHub is slow or unreachable / 中国大陆或 GitHub 下载慢、打不开时:** download the same kit from Tencent SkillHub, no account needed: `https://api.skillhub.cn/api/v1/download?slug=grandet-api-price-finder&version=0.3.0-build.20261018.2` (page: [skillhub.cn/skills/grandet-api-price-finder](https://skillhub.cn/skills/grandet-api-price-finder)). It holds the `.skill` contents with the files at the archive root, plus SkillHub's own `_meta.json`. Extract it into a folder named `grandet-api-price-finder` and treat that folder as an extracted `.skill` root (`--receipt-source release_skill`). Each file's SHA-256 is in its `package-manifest.json`. A 404 means SkillHub is still reviewing this build; use the GitHub link.

## Included receipt tools


Product/API version is 0.3.0; content build `grandet-skill-0.3.0-build.20261018b`. The `skill-v0.3.0-build.20261018b` ZIP and .skill include receipt-aware installers and a Python verifier. Follow the bundled INSTALL.md, with no additional helper download. Native importing does not execute a receipt callback automatically: absent readable saved files or a host callback, retain NOT_RUN. Existing older installs need no forced download/reinstall and are not backfilled.
