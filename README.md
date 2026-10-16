# Grandet

[简体中文](README.zh-CN.md) · [Website](https://grandet.ai) · [Installation](INSTALL.md)

**Ask your agent for the cheapest API for a model, then let it connect that API to your own app.**

## Install

Paste this into the agent you already use (Codex, Claude Code, Cursor and others):

```text
Install Grandet Skill for me: https://grandet.ai/download.md
```

The agent does the rest. If it needs you to sign in or approve something, it tells you exactly what to click. Then open a new conversation and ask:

> I code in Claude Code. Find me the cheapest Claude Sonnet 4.6 API.

No need to mention Grandet or attach files again. Price lookups need no account or API key. To install by hand, or for apps such as ChatGPT or Claude on the web that take an uploaded skill file, see [Manual installation](INSTALL.md#manual-installation).

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

For Codex, Claude Code, OpenCode, Kilo Code, Continue, Gemini CLI, Hermes and OpenClaw, the Skill's own connect program (`scripts/connect.mjs`, also usable as a local MCP server) makes the change the same way every time. Other apps get a field card and their documentation link. In a cloud chat, it can only hand you the command and configuration to run yourself.

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

## Licence

- Skill files: **Apache-2.0**.
- Catalogue code and documents written by Grandet: **AGPL-3.0-only**; scope in [LICENSE](LICENSE).
- Supplier data, original text and trademarks belong to their owners; the factual compilation carries no blanket open-data licence. See [DATA-LICENSE.md](DATA-LICENSE.md), [TRADEMARKS.md](TRADEMARKS.md) and each release manifest.

<!-- Installing agents: follow INSTALL.md. Product version 0.3.0. Reuse existing copies without forced download; no historical backfill. -->
