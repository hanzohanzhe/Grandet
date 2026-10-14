# Grandet

[简体中文](README.zh-CN.md) · [Website](https://grandet.ai) · [Installation](INSTALL.md)

**Find a cheap, easy-to-connect API for the model you use.**

## Install

Paste this into the agent you already use (Codex, Claude Code, Cursor and others):

```text
Install Grandet for me: https://github.com/hanzohanzhe/Grandet
```

The agent does the rest. If it needs you to sign in or approve something, it will tell you exactly what to click.

Then open a new conversation and ask:

> Find an affordable Claude Sonnet 4.6 API for coding in Claude Code. Pick one provider and one alternative.

You don't need to mention Grandet or attach anything again. Price lookup needs no account or API key.

To install it yourself, or for apps where you upload a skill file (ChatGPT, Claude on the web), see [Manual installation](INSTALL.md#manual-installation).

Fresh installs default to the [official skill-v0.3.0 Release attachments](https://github.com/hanzohanzhe/Grandet/releases/tag/skill-v0.3.0) and reuses existing copies. [Receipt privacy and route coverage](docs/skills/installation-receipts.md).

## Things you can ask

> I use 20 million tokens a month: 25% input, 75% output, no cache. What would those two options cost?

> Does apijing.com's Sonnet 4.6 API have evidence of reduced quality? Are there speed and reliability measurements?

> Use the alternative. How do I connect it to Claude Code on Windows? Keep it short.

Answers show when each price was observed and link to the source. Currencies and platform credits are listed separately. A listed price or a supplier's claim says nothing about quality; when there are no measurements, the answer says so.

## What Grandet includes

| | What it does | Status |
|---|---|---|
| **[grandet.ai](https://grandet.ai)** | Compare model API prices, browse providers, free tiers and credits, and check sources and observation dates | Live |
| **Grandet Skill** | Ask about prices inside your agent and get a recommendation, an alternative, evidence and setup steps | 0.3.0 public preview |
| **[Grandet Personal](https://grandet.ai/product/)** | Desktop client: manage API keys, route and fall back across providers, track cost, speed and quality | Private beta, no public installer yet |

Planned for Personal: provider accounts and keys in one place; routing that uses credits you already have first and falls back across providers; budgets and usage records; speed and failure tracking; and **Picky**, which runs the same questions against several providers so you can compare answers and scores. Picky gives comparison evidence; it does not guarantee model identity or quality.

## Testing status

The Skill has been tested in **Codex CLI** (price and quality questions, in Chinese and English, in fresh conversations). **Grok Bot** is partly tested. Other apps are being tested one by one; being installable does not mean an app has passed testing.

If something breaks, [open an issue](https://github.com/hanzohanzhe/Grandet/issues) with the app, version, operating system and the step that failed. Don't include API keys or private conversations.

The optional receipt companion is a separate source build (`grandet-installation-receipts-source-20261014.1`) tested in isolated local file checks. Original 0.3.0 archives are unchanged and contain no new receipt helper; native receipt acceptance is still pending.

## Data and developer access

The v3 snapshot in this repository lists **73 official programmes and 34 third-party promotions** offering free tiers or credits. It was compiled on **2026-10-06**; every record keeps its original observation date and conditions. Treat them as leads to check, not offers everyone can claim.

| Resource | Where |
|---|---|
| Current opportunity catalogue | [Readable](CATALOGUE-v3.md) · [JSON](data/free-tokens-v3.json) · [Release metadata](data/RELEASE-v3.json) |
| Original catalogue and sources | [Catalogue](CATALOGUE.md) · [JSON](data/free-tokens.json) · [Manifest](data/MANIFEST.json) |
| Repository data index | [Machine-readable index](catalogue-index.json) · [AI reading guide](llms.txt) |
| Price lookup for agents (MCP) | Anonymous Streamable HTTP: `https://grandet.ai/mcp` |
| Price lookup over HTTP | `https://grandet.ai/api/v1/board` · [Interface description](https://grandet.ai/public-data/price-finder.json) |

Local development needs **Node.js 20+** and no third-party packages:

```sh
node scripts/catalogue.mjs validate
node scripts/catalogue.mjs generate --check
node scripts/validate-public.mjs
node --test tests/catalogue.test.mjs
node scripts/serve.mjs
```

`serve.mjs` opens a local browser view at `http://127.0.0.1:8787/`. It and `catalogue.mjs` read the original `data/free-tokens.json`; `validate-public.mjs` checks the v3 data. These commands only check local files and never update website prices. `generate --check` writes nothing.

Sourced corrections and improvements are welcome; see [CONTRIBUTING.md](CONTRIBUTING.md) and [METHODOLOGY.md](METHODOLOGY.md).

## License

- Skill files: **Apache-2.0**.
- Catalogue code and Grandet-written documentation: **AGPL-3.0-only**, as scoped in [LICENSE](LICENSE).
- Provider data, source material and trademarks belong to their owners; the factual compilations carry no blanket open-data license. See [DATA-LICENSE.md](DATA-LICENSE.md), [TRADEMARKS.md](TRADEMARKS.md) and each release manifest.

<!-- Installing agents: fresh installs use the original skill-v0.3.0 Release attachment and optional separate receipt companion; follow INSTALL.md. Reuse existing copies without forced download. -->
