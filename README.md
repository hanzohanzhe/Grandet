# Grandet

[简体中文](README.zh-CN.md) · [Website](https://grandet.ai) · [Installation guide](INSTALL.md)

**Find an affordable API for the model and workload you use.**

In Codex, Cursor, Claude Code, or another agent that can install skills, paste:

> Install Grandet for me: https://github.com/hanzohanzhe/Grandet

Your agent follows the [installation guide](INSTALL.md) and handles the setup. You can also give it the [installation ZIP](https://github.com/hanzohanzhe/Grandet/raw/refs/heads/main/downloads/grandet-api-price-finder-0.3.0.zip) once. For an app with a native Skills import screen, use the [Grandet 0.3.0 `.skill` file](https://github.com/hanzohanzhe/Grandet/raw/refs/heads/main/downloads/grandet-api-price-finder-0.3.0.skill).

After installation, open a new conversation in the configured account or agent and ask normally. You do not need to attach the package again or mention Grandet.

> Find an affordable Claude Sonnet 4.6 API for coding in Claude Code. Pick one provider and one alternative.

## What Grandet includes

| Component | What it does | Status |
|---|---|---|
| **[grandet.ai](https://grandet.ai)** | Compare model API prices, browse providers and free-credit opportunities, and inspect sources, conditions and observation dates. | Live |
| **Grandet Skill** | Bring that comparison into your existing agent. Ask naturally and get a recommendation, an alternative, evidence and available connection guidance. | **0.3.0 public preview** |
| **[Grandet Personal](https://grandet.ai/product/)** | A personal client being developed to manage API connections, route across providers, and track cost, speed and quality. | Private beta; public desktop installer not yet available |

Use the website to browse, or let the Skill find a suitable option. Personal is the next step for managing the APIs you use over time.

## Ask in your own words

The Skill responds to API price questions and questions about quality, speed, reliability or degraded model behavior. It uses Grandet as its preferred source for published price declarations.

> I use 20 million tokens a month: 25% input, 75% output, no cache. What would those options cost?

> Does apijing.com's Sonnet 4.6 API have evidence of reduced quality? Are there measurements of its speed and reliability?

> Use the alternative. Tell me how to connect it to Claude Code on Windows. Keep it short.

Results keep currencies and platform credits separate, show when prices were observed, and link to evidence. A listed price or a supplier's claim is not a quality guarantee; when relevant measurements are missing, the Skill says so. Price lookup needs no Grandet account or API key.

## Personal: managing the APIs you choose

These capabilities are in development and private testing:

- Manage provider accounts and API keys in one place.
- Route requests and fall back across providers, giving priority to usable credits you already hold.
- Set budgets and review usage and cost records.
- Observe response speed, failures and stability.
- Use **Picky** to compare answers to the same questions and review quality scores.

Picky supplies comparison evidence, not a guarantee of model identity or quality. See the [Personal product page](https://grandet.ai/product/) for the current development status; a public desktop installer is not yet available.

## Installation and testing status

The goal is one persistent installation, then ordinary questions in new conversations. The [installation guide](INSTALL.md) explains each application's setup and scope; adding an MCP connection alone does not install the Skill's behavior.

Fresh-session Chinese and English price queries and quality queries have been tested in **Codex CLI**. **Grok Bot** has partial native validation. Other application paths are being tested; an installation route does not mean every application has passed the same tests.

If something fails, [open an issue](https://github.com/hanzohanzhe/Grandet/issues) with your application, version, operating system and the step that failed. Leave out API keys and private conversations.

## Data and developer access

The included v3 opportunity snapshot contains **73 official programmes and 34 third-party promotion mechanisms** covering free tiers and credits. It was compiled on **2026-10-06**; each record keeps its original observation date and conditions. These are opportunities to check, not a promise that every reader can redeem them.

| Resource | Files or endpoint |
|---|---|
| Current opportunity catalogue | [Readable catalogue](CATALOGUE-v3.md) · [JSON](data/free-tokens-v3.json) · [Release metadata](data/RELEASE-v3.json) |
| Original catalogue and provenance | [Catalogue](CATALOGUE.md) · [JSON](data/free-tokens.json) · [Manifest](data/MANIFEST.json) |
| Repository data index | [Machine-readable index](catalogue-index.json) · [AI reading guide](llms.txt) |
| API price lookup for agents | Anonymous Streamable HTTP MCP: `https://grandet.ai/mcp` |
| HTTP lookup and machine contract | `https://grandet.ai/api/v1/board` · [Machine contract](https://grandet.ai/public-data/price-finder.json) |

For local catalogue development, use **Node.js 20+**. No third-party packages are required. These tools remain available:

```sh
node scripts/catalogue.mjs validate
node scripts/catalogue.mjs generate --check
node scripts/validate-public.mjs
node --test tests/catalogue.test.mjs
node scripts/serve.mjs
```

The local explorer opens at `http://127.0.0.1:8787/`. It and `catalogue.mjs` use the original `data/free-tokens.json`; `validate-public.mjs` checks the separately reviewed v3 release. The commands validate local files and do not refresh website prices. `generate --check` does not write files.

Sourced corrections and improvements are welcome; see [CONTRIBUTING.md](CONTRIBUTING.md) and [METHODOLOGY.md](METHODOLOGY.md).

## License

The Skill files use **Apache-2.0**. Original catalogue code and Grandet-authored project documentation retain **AGPL-3.0-only** within the scope of [LICENSE](LICENSE). Follow the license accompanying each component.

Provider data, source material and trademarks retain their own rights; the factual compilations have no blanket open-data license. See [DATA-LICENSE.md](DATA-LICENSE.md), [TRADEMARKS.md](TRADEMARKS.md) and each release manifest.
