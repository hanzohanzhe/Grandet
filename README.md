# Grandet — free API credits & offer catalogue

[中文说明](README.zh-CN.md) · [Complete catalogue / 完整目录](CATALOGUE.md) · [Methodology](METHODOLOGY.md)

A small open-source catalogue tool and a dated research index of **73 official programmes + 34 third-party announcement mechanisms**. Explore free tiers, trial credits, startup grants, student/research programmes and conditional rewards with their source links and full conditions.

“Free tokens” is a discovery label. Credits, quota points, coupons, money-labelled balances and activity vouchers retain their original units. Payment, invitations, identity checks, expiry, lotteries and disabled/conflicting announcements are preserved. Inclusion does not prove eligibility or successful redemption; this is not an exhaustive worldwide directory.

Compilation date: **2026-10-05**. Each record retains its original observation date; this compilation date does not renew observations. The initial export is preserved; the reviewed v3 release added on 2026-10-06 matches the website’s safe factual catalogue. Updates are reviewed manually; repository and website versions may differ.

## Run locally

Requires Node.js 20+; no packages or installation needed.

```sh
node scripts/catalogue.mjs validate
node scripts/catalogue.mjs generate
node scripts/serve.mjs
```

Open the address printed by the server. Search and filter the browser catalogue; expand any card for its complete JSON, including eligibility, payment, expiry, editorial facts and evidence. The Markdown catalogue retains every field of this derived publication. Vendor full statements/excerpts are omitted; factual summaries and all structured conditions remain. The server binds only to localhost. `generate --check` checks reproducible output without writing.

## Project status

This initial repository contains catalogue source code and a reviewed public-data candidate. The Grandet desktop client and full website source are **not released in this repository**. grandet.ai has not passed live deployment acceptance; this README does not advertise a live service, downloadable client or automatic updates. No paid API calls are needed by these tools.

## Contribute

See [CONTRIBUTING.md](CONTRIBUTING.md). Corrections need a primary source, observation date and full conditions. Do not submit account credentials, personal information or private captures. See [ROADMAP.md](ROADMAP.md) for upcoming work.

## Rights

New tool/browser code is **AGPL-3.0-only**, see [LICENSE](LICENSE). That license does not license provider datasets, quotations or trademarks. [DATA-LICENSE.md](DATA-LICENSE.md) preserves the existing exclusion policy; [data/MANIFEST.json](data/MANIFEST.json) records the data candidate and per-record source rights and publication scope. Public accessibility is not permission to redistribute. Vendor statements remain subject to their owners’ rights and terms. No blanket open-data license is asserted. See [TRADEMARKS.md](TRADEMARKS.md).

This GitHub publication is derived from reviewed snapshot SHA-256 `581a6fcd246070d9a69eacdbbebe1630d734c67c3c168ccf3680fbdcf27f405b`; it is not byte-identical to the website DTO. 官方对象不变，第三方移除整段原文并保留结构化事实，未刷新观察时间。

## Machine-readable release / 机器读取入口（2026-10-06）

Latest reviewed facts: [v3 JSON](data/free-tokens-v3.json), [release/hash manifest](data/RELEASE-v3.json), [complete v3 Markdown](CATALOGUE-v3.md), [AI reading guide](llms.txt), and [machine index](catalogue-index.json). 107 cards retain their original conditions, evidence and observation dates; all 642 prerequisite fields are explicit. Unknown is not unconditional. The initial snapshot remains unchanged. Website deployment is in progress; desktop installers are not publicly released.
