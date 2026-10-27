# Grandet: find the cheapest API for any model

[简体中文](README.zh-CN.md) · [Website](https://grandet.ai) · [Installation](INSTALL.md)

**Grandet compares listed API prices for each model across official APIs, inference providers and relay sites. Your AI agent can look them up and connect the cheapest one to your app.**

| Use it as | How |
|---|---|
| Website | <https://grandet.ai> |
| Remote MCP server | `https://grandet.ai/mcp` (Streamable HTTP, no sign-up, no API key) |
| Agent Skill | Tell your agent: `Install Grandet Skill for me: https://grandet.ai/download.md` |
| Git | `git clone --depth 1 --branch skill-v0.3.0-build.20261018b https://github.com/hanzohanzhe/Grandet.git`, then see [Install with git](#install-with-git) |

## Install

Paste this into the agent you already use (Codex, Claude Code, Cursor and others):

```text
Install Grandet Skill for me: https://grandet.ai/download.md
```

The agent does the rest. If it needs you to sign in or approve something, it tells you exactly what to click. Then open a new conversation and ask:

> I code in Claude Code. Find me the cheapest Claude Sonnet 4.6 API.

No need to mention Grandet or attach files again. Price lookups need no account or API key. To install by hand, or for apps such as ChatGPT or Claude on the web that take an uploaded skill file, see [Manual installation](INSTALL.md#manual-installation).

## Install with git

The website and the install sentence above install **build.20261018b** (our internal name: j2), marked Latest on GitHub. Cloning its tag gives you the same Skill: the installed folder has the same content hash as the release ZIP.

```sh
git clone --depth 1 --branch skill-v0.3.0-build.20261018b https://github.com/hanzohanzhe/Grandet.git
cd Grandet
node scripts/install-price-finder.mjs --app claude-code --receipt-source checkout
```

- Replace `claude-code` with your app: `codex`, `cursor`, `opencode`, `gemini-cli`, `cline`, `roo-code`, `kilo-code`, `windsurf`, `continue`, `hermes`, `openclaw`, `trae-cn` or `trae-intl`. `--list` shows every app and the folder it installs to.
- The installer needs Node.js 20 or later. Without Node, copy the whole `skills/grandet-api-price-finder` folder into your app's skill folder: `~/.claude/skills/` for Claude Code, `~/.agents/skills/` for Codex, other apps in the [per-app guide](skills/grandet-api-price-finder/references/installation.md).
- Then open a new conversation and ask a price question. The last line of the installed `SKILL.md` names the build.
- The installer sends one anonymous install receipt (no path, name or key) so installs can be counted; `--receipt-source checkout` marks it as a git install. Add `--no-telemetry` to send nothing.
- **Another version:** put its tag from [Versions](#versions) after `--branch` and run the same install command. It replaces the installed copy and keeps the old one as a backup outside the skill folder. In a clone you already have: `git fetch --depth 1 origin tag <tag>`, then `git checkout <tag>`.
- Clone a tag, not `main`. `main` usually matches the latest release, but between releases it can carry changes that have not been tested yet.

## MCP server

Add it to any MCP client that supports remote servers:

```json
{ "mcpServers": { "grandet": { "url": "https://grandet.ai/mcp" } } }
```

In Claude Code: `claude mcp add --transport http grandet https://grandet.ai/mcp`

Tools: `grandet_find_cheapest_api`, `grandet_find_free_credits`, `grandet_resolve_model`, `grandet_quote_evidence`, `grandet_glossary`, `grandet_list_apps`.

## What it does

**1. Finds the lowest listed price.** It compares the relay and official prices on grandet.ai for your model and kind of use (chat, coding, long output) and lists the cheapest few: the site, the group to pick when you create the token, the price, its unit and when it was observed.

- It ranks by listed price only. It never says which site is "good" and never repeats a site's own claims such as "full strength" or "stable".
- USD credit, CNY credit and cash prices are listed separately and never compared with each other.
- Conditions such as a minimum top-up or members-only access are shown as a one-line hint. Prices that contradict the site's own text are listed as a reference. Groups a site limits to one client are folded away when your app is a different one.

**2. Finds free credit.** Ask "is there anything free?" and it lists official free tiers, trial credit and relay sign-up, check-in and free-group offers, with whether a card, ID check or application is needed. If something you already said makes you eligible for a free offer, it mentions it once.

**3. Connects it for you.** When you say "connect it":

1. You sign up and top up on the site yourself, and create the token in the group it names.
2. You run one command in your own terminal to store the key. Typing is hidden and the key never enters the chat.
3. It shows the exact configuration change, backs up the file, and writes only after you confirm.
4. It checks the key, group and model name without spending credit.
5. Say "undo" to restore the previous setup.

For Codex, Claude Code, OpenCode, Kilo Code, Continue, Gemini CLI, Hermes, OpenClaw and WorkBuddy, the Skill's own connect program (`scripts/connect.mjs`, also usable as a local MCP server) makes the change the same way every time. Other apps get a field card and their documentation link. In a cloud chat, it can only hand you the command and configuration to run yourself.

## Try asking

> 20 million tokens a month, a quarter input and the rest output, no cache. Which is cheapest, and what does it cost a month?

> Is there a free Gemini API? I don't have a credit card.

> Use the second one and connect it to Codex on Windows.

> What do "官转" and "逆向" mean?

Answers include a link to the price sources. Listed prices and suppliers' claims say nothing about quality. Asked about quality, speed or downgraded models, it reports only what Grandet has on record and says so when there is no measurement.

## What Grandet includes

| | What it does |
|---|---|
| **[grandet.ai](https://grandet.ai)** | Compare model API prices across official APIs, inference providers and relays; browse suppliers, free credit and promotions; check sources and observation dates |
| **Grandet Skill** | Find the lowest price, find free credit and connect the chosen API from inside your agent |
| **[MCP server](https://grandet.ai/mcp)** | The same price and free-credit lookup for any MCP client, anonymous and without a key |

## Versions

Every build keeps product version 0.3.0; builds differ by build ID. The tag of a build is `skill-v0.3.0-build.<build>` (for example `skill-v0.3.0-build.20261018b`), and every tag and its release files stay on [GitHub Releases](https://github.com/hanzohanzhe/Grandet/releases), so any of them can be installed with the [git commands above](#install-with-git). The website installs **20261018b (j2)**.

From 20261017 on, each build was tested against the build before it: the same 48 questions, asked in the Hermes agent with deepseek-v4.1-flash and glm-5.3. **PASS** means every target was met. **HOLD** means some targets were missed; those builds were published after the misses were reviewed. "Used the Skill" counts sessions that answered through the Skill.

### Which one to pick

- **Most people: 20261018b (j2).** It is what the website installs and has the best test results so far. When grandet.ai cannot be reached, it still answers from a price snapshot taken on 18 October 2026 and says the date first. The cost: the largest package (ZIP 522 KB, `.skill` 218 KB).
- **No snapshot, smaller package: 20261018 (i8).** ZIP 436 KB. It cannot answer when grandet.ai is unreachable, and in testing 1 of 16 group-condition sessions asked for a page the website has retired.
- **Chinese conversations only, fewer tokens on relay-jargon questions: 20261017 (i5).** The English glossary column added in 20261017b doubled the glossary file (33.9 KB → 64.2 KB). 20261017 has no English column, no WorkBuddy connection, no named-site comparison and no 30-second switch to SkillHub.
- **Longer answers: 20261016h or earlier.** These have no 8-line limit (median answer 841 characters in h, 484 in 20261017), but call addresses that don't exist far more often (18 bad-parameter errors in 48 questions, against 0). A small check of j2 against 20261016c (32 questions, deepseek-v4.1-flash) found: Skill used 90% → 100%, API errors per question 0.47 → 0.03, median answer 890 → 530 characters.
- **Avoid on native Windows: anything before 20261016d.** Its Node installer can fail with EPERM there; copy the folder by hand instead. Builds before 20261016e have no SkillHub download for mainland China, and builds before 20261016h have a description that weaker models pick up less often (47% vs 85% in an A/B test).
- Each build was written for the website's API at the time. The site has changed since, so older builds are more likely to ask for pages or fields that no longer exist.

### All builds

| Build | Released (UTC) | What changed | Test against the previous build |
|---|---|---|---|
| **20261018b** (j2) · website · Latest | 2026-10-18 | Price snapshot (469 models, 174 free-credit offers) for when grandet.ai is unreachable; group conditions from price data instead of retired pages; carried-over quotes marked; up to five suggestions when a model name isn't found | PASS 18/18 · used the Skill 96/96 (same as 20261018) · quotes matching Grandet's data 97.4% → 100% · tokens ×1.04 |
| 20261018 (i8) | 2026-10-18 | Sites the user names are compared from 20 board rows; switches to SkillHub after 30 s of slow GitHub | PASS 15/15 · used the Skill 95/96 (same) · tokens ×0.90 · named-site questions with side lookups 10/16 → 2/16 · quotes 36/36 matched |
| 20261017b (i7) | 2026-10-18 | English glossary column; English answers keep the relay's group name; connects WorkBuddy | HOLD 11/13 · used the Skill 95/96 (same) · tokens ×1.03 |
| 20261017 (i5) | 2026-10-17 | Only the documented requests, no guessed paths; parameter limits; answers within 8 lines and 600 characters | HOLD 10/13 (deepseek only) · used the Skill 47/48 (h 48/48) · bad-parameter errors 18 → 0 · median answer 841 → 484 characters |
| 20261016h | 2026-10-16 | Description opens with relay terms (trigger 47% → 85% in an A/B test); exact read-only requests for hosts without MCP tools; credit never compared with cash | not run |
| 20261016g | 2026-10-16 | Key files written owner-only (0600); a section listing what the Skill changes on your computer; loading on its own only reads prices | not run |
| 20261016f | 2026-10-16 | Answer fixes from agent reports (coding mix, model IDs kept as given, free-credit deadlines); registry copies pass their own manifest check | not run |
| 20261016e | 2026-10-16 | Tencent SkillHub download for mainland China; registries carry the full kit | not run |
| 20261016d | 2026-10-16 | Installer works on native Windows; `--uninstall`; first build on ClawHub and SkillHub | not run |
| 20261016c | 2026-10-16 | Connecting hides keys already in an app's settings; connects Hermes and OpenClaw | not run |
| 20261016b | 2026-10-16 | Homepage install sentence; handles models that only have older quotes | not run |
| 20261016 | 2026-10-16 | Reads official and inference-provider cash prices, listed apart from relay credit | not run |
| 20261015e | 2026-10-15 | Connect fixes: undo restores files exactly | not run |
| 20261015d | 2026-10-15 | Connect program (`scripts/connect.mjs`, also a local MCP server) | not run |
| 20261015c | 2026-10-15 | Glossary lookup fixed; explicit User-Agent and one retry on network errors | not run |
| 20261015b | 2026-10-15 | Reads the website's new free-credit and listing fields | not run |
| 20261015 | 2026-10-15 | Rewrite: lowest price, free credit, connecting the API, relay glossary | not run |
| 20261014 | 2026-10-14 | Same Skill as 0.3.0, with the installer and install receipts | not run |
| 0.3.0 (tag `skill-v0.3.0`) | 2026-10-14 | First public preview; no install receipts | not run |

`skill-v0.3.1` was a candidate that was withdrawn before release; don't use it.

## Feedback

Please [open an issue](https://github.com/hanzohanzhe/Grandet/issues) if something goes wrong, with the app, version, system and the step where it stopped. Don't paste API keys or private conversations.

## Data and developer entry points

| Content | Entry point |
|---|---|
| Free credit and promotions | [Readable](CATALOGUE-v3.md) · [JSON](data/free-tokens-v3.json) · [Release details](data/RELEASE-v3.json) |
| Original catalogue and sources | [Catalogue](CATALOGUE.md) · [JSON](data/free-tokens.json) · [Manifest](data/MANIFEST.json) |
| Repository data index | [Machine-readable index](catalogue-index.json) · [Reading guide for AI](llms.txt) |
| Agent price lookup (MCP) | Anonymous Streamable HTTP: `https://grandet.ai/mcp` |
| HTTP price lookup | `https://grandet.ai/api/v1/board` · [API description](https://grandet.ai/public-data/price-finder.json) |
| HTTP free-credit lookup | `https://grandet.ai/api/v1/free-credits?q=gemini` |
| Relay jargon glossary | [Built into the Skill](skills/grandet-api-price-finder/references/glossary.md) · [Online](https://grandet.ai/public-data/relay-glossary.json) |

Local development needs **Node.js 20+** and no third-party packages:

```sh
node scripts/catalogue.mjs validate
node scripts/catalogue.mjs generate --check
node scripts/validate-public.mjs
node --test tests/*.test.mjs
node scripts/serve.mjs
```

`serve.mjs` opens a local browser view at `http://127.0.0.1:8787/`. These commands check local files only and never update the website's prices.

Sourced corrections and improvements are welcome; see the [contributing guide](CONTRIBUTING.md) and [methodology](METHODOLOGY.md).

## Friends

- [LINUX DO](https://linux.do): Chinese-language tech community

## Licence

- Skill files: **Apache-2.0**.
- Catalogue code and documents written by Grandet: **AGPL-3.0-only**; scope in [LICENSE](LICENSE).
- Supplier data, original text and trademarks belong to their owners; the factual compilation carries no blanket open-data licence. See [DATA-LICENSE.md](DATA-LICENSE.md), [TRADEMARKS.md](TRADEMARKS.md) and each release manifest.

<!-- Installing agents: follow INSTALL.md. Product version 0.3.0. Reuse existing copies without forced download; no historical backfill. -->
