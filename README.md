# Grandet

**Compare public AI API offers. Find free-credit opportunities. Check the conditions before choosing.**

[中文](README.zh-CN.md) · [Website](https://grandet.ai/) · [API price comparison](https://grandet.ai/leaderboard/) · [Free credits & offers](https://grandet.ai/free-tokens/) · [Product](https://grandet.ai/product/)

Grandet helps developers explore AI API providers, their published prices and free-tier or credit programmes. The website brings those records together with source evidence and observation dates. This repository publishes a runnable catalogue tool and reviewed offer data that you can inspect, validate and reuse within the stated licensing boundaries.

## Start here

| What you want to do | Where to go |
| --- | --- |
| Compare providers for a model | [Open the price comparison](https://grandet.ai/leaderboard/) and inspect each offer's units, conditions and evidence |
| Find free tiers, trials or grants | [Browse offers online](https://grandet.ai/free-tokens/) or read the [complete v3 catalogue](CATALOGUE-v3.md) |
| Explore the published data locally | Run the dependency-free tools below |
| Build a reader or use an AI assistant | Start with the [repository index](catalogue-index.json) and the data entries below |
| Correct an offer | Follow the [contribution guide](CONTRIBUTING.md) with a primary source and observation date |

## Available today

- **Live website:** model/provider price comparison, free-credit discovery and a Grandet product introduction at [grandet.ai](https://grandet.ai/).
- **Public catalogue tools:** a local browser explorer, JSON validator, reproducible Markdown generator and tests. No API key or paid API call is needed.
- **Reviewed offer snapshot:** **73 official programmes + 34 third-party announcement mechanisms**, with **642 structured prerequisite fields** covering application, payment, card, identity, invitation and renewal requirements. Free tiers, trial credits, startup grants and student/research opportunities are included.

The **desktop client and installers are not publicly released**. The complete client and website source are not published in this repository. See [website and release status](WEBSITE-STATUS.json) and the [roadmap](ROADMAP.md).

## Run the catalogue locally

Requires **Git and Node.js 20+**. There are no third-party packages to install.

```sh
git clone https://github.com/hanzohanzhe/Grandet.git
cd Grandet
node scripts/catalogue.mjs validate
node scripts/catalogue.mjs generate --check
node scripts/validate-public.mjs
node scripts/serve.mjs
```

Open **http://127.0.0.1:8787/**. Search and filter the catalogue, then expand a card to inspect its complete published JSON and source links. The server listens only on localhost; press `Ctrl+C` to stop it.

The local browser and `catalogue.mjs` use the preserved **initial snapshot** in `data/free-tokens.json`. The separately reviewed **v3 snapshot** is available in [JSON](data/free-tokens-v3.json) and [Markdown](CATALOGUE-v3.md); `validate-public.mjs` checks that release. These commands validate local files and do not refresh offers or download the website's price database. `generate --check` does not write files; omit `--check` only when intentionally regenerating the initial Markdown catalogue.

## Read the conditions, not just the headline

“Free tokens” is a discovery label. Records preserve their original units: credits, quota points, coupons, money-labelled balances and activity vouchers are not automatically equivalent to tokens or cash. Payment, invitation, identity, expiry, lottery and renewal conditions remain visible, including disabled or conflicting announcements.

Inclusion does not establish your eligibility, successful redemption, upstream authenticity or endpoint quality. **Unknown does not mean unrestricted.** The 107 records describe programmes and mechanisms, not 107 benefits guaranteed to be redeemable today; coverage is finite.

The v3 release was compiled on **2026-10-06**. Each record retains its own original observation date; compilation and formatting do not refresh it. Updates require manual review, automatic refresh is disabled, and repository and website versions may differ. Read the [methodology](METHODOLOGY.md) and check the provider's current terms before acting.

## Data for tools and AI assistants

| Entry | Contents |
| --- | --- |
| [Repository index](catalogue-index.json) · [raw JSON](https://raw.githubusercontent.com/hanzohanzhe/Grandet/main/catalogue-index.json) | Starting point for the public repository's data and documentation |
| [v3 facts](data/free-tokens-v3.json) · [raw JSON](https://raw.githubusercontent.com/hanzohanzhe/Grandet/main/data/free-tokens-v3.json) | All 107 reviewed records, full structured conditions, evidence and original dates |
| [v3 release manifest](data/RELEASE-v3.json) | SHA-256, byte length, counts and observation policy |
| [Complete v3 Markdown](CATALOGUE-v3.md) | Human-readable records with their complete published fields |
| [AI reading guide](llms.txt) | Entry links and interpretation rules |
| [Website AI index](https://grandet.ai/ai-index.json) · [website reading guide](https://grandet.ai/llms.txt) | Discovery entries for the website's published catalogue and data manifests |

Keep units, dates, evidence and prerequisites with any extracted claim. Pin the release manifest when reproducibility matters. The website index links to further data; it is not one file containing the full price archive. Public machine-readable access does not guarantee search or AI indexing.

The [initial JSON](data/free-tokens.json), [initial manifest](data/MANIFEST.json) and [initial Markdown](CATALOGUE.md) remain available. Earlier release metadata keeps its publication-time status; [WEBSITE-STATUS.json](WEBSITE-STATUS.json) records the subsequent website launch.

## Contribute

Corrections, sourced new offers and improvements to the public tools are welcome. Include the record ID, primary public URL, observation date, original unit and complete eligibility, payment, renewal and expiry conditions. Distinguish the source's statement from your interpretation. Do not submit credentials, account records, personal data or private captures. See [CONTRIBUTING.md](CONTRIBUTING.md).

Before proposing a change, run the three validation commands above and:

```sh
node --test tests/catalogue.test.mjs
```

If Grandet helps your research, a **voluntary Star** makes this repository easier to find again and shows your support. No Star is required to use the public tools or read the data.

## License and source rights

The original public tool/browser code and Grandet-authored project documentation are licensed **AGPL-3.0-only** within the scope stated in [LICENSE](LICENSE).

Provider datasets, source material and trademarks retain their own rights. The factual compilations carry **no blanket open-data license**. Provider full statements/excerpts, private captures and operational datasets are excluded; published source links and hashes do not grant redistribution rights. Read [DATA-LICENSE.md](DATA-LICENSE.md), the release manifests and [TRADEMARKS.md](TRADEMARKS.md) before redistributing material.
