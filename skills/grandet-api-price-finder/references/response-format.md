# Price answer

Short, in the user's language. Name the model first so the choice stays visible. Read only the fields below; do not print schema names, row IDs or long URLs beyond the one link.

The usual answer is the 8-line shape in step 4 of the Skill's "1. Lowest price"; it needs nothing from this file. Use this file for the cases that shape leaves out. The limit stays the same: 8 lines and 600 characters (English: 100 words), link included. When a case below adds a line, drop the reference or gated line rather than go over.

## Fields used

- Top level: `priceFormat.unitDenominator` (`PER_MILLION_TOTAL_TOKENS` = price per 1,000,000 total tokens), `scope.mix` (the token shares used), `scope.application.status`, `coverage.excluded` (rows left out of the ranking, counted by reason), `notices`. In `view=compact`, `integrationCards` holds the shared connection cards.
- Top level, cash prices (may be missing on an older service):
  - `official`: the model maker's own regular price, from its pricing page. Each entry: `vendor`, `currency` (`USD` or `CNY`, real money), `input` and `output` (each per 1,000,000 input or output tokens, `unit=PER_MILLION_TOKENS`), `cacheRead`, `cacheWrite`, `conditions` (for example `cacheWriteTTL`, a context tier), `observedAt`, `sourceUrl`.
  - `listings.inference`: at most two inference providers (services that sell model calls for cash, such as DeepInfra), same fields. `aggregator: true`, or a condition with `aggregator: true`, marks a platform that routes to other providers.
  - An entry may carry `cashPercentVsOfficial` (`input`, `output`: whole percent against the official price, negative = cheaper; `null` = not comparable). Use it only when the server returns it.
- Each board in `boards[]`: `unit` (`USD_CREDIT`, `CNY_CREDIT`, `USD`, `CNY`), `basis` (`LISTED_CREDIT` or `LISTED_CASH`), `status`, and **`listings`**:
  - `lowest`: the lowest listed prices, at most two different sites. These are the answer.
  - `gated`: lower prices behind a condition the site states (minimum top-up, members only, enterprise only).
  - `reference`: lower prices that need a second look (see reasons below).
  - `folded`: `[{client, count, lowerThanLowestCount}]`, groups the site limits to another client.
  - `totals`, `counts`: how many rows were ranked, hidden and folded.
- Each row: `sourceId` (the site), `providerCategory` (`RELAY` relay, `OFFICIAL`, `INFERENCE` inference provider, `UNCLASSIFIED`), `plan` (the group), `modelName` (exact model name for the config), `blended` (listed price per million total tokens), `observedAt`, `freshness` (`FRESH` or `STALE`), `riskSignals`, `reviewReasons`, `boardUrl`, `integration`, and `listing`:
  - `listing.action`: `LIST`, `LIST_WITH_HINT` or `REFERENCE`;
  - `listing.hint`: a ready-made hint of at most 50 characters, written from the site's own text. Show it as it is.
  - `listing.kind` on hinted rows: `gate`, `test`, `limited` (限时价) or `vip-price`.

With `view=compact` over MCP, the short text block lists the lowest rows but may not mark old quotes or show the gated, reference, official or inference rows. Always read `listings`, `official`, `listings.inference` and each row's `freshness` from the structured content, not only the text block or a summary count.

The server has already applied the rules: groups not offered to users are hidden, client-only groups are folded unless the target app is that client, and boasts never appear in hints. Do not re-sort, re-filter or write your own hints.

If a board has no `listings` (an older service), fall back to `recommended`, `alternative` and `cheapest`, and map `riskSignals` as below.

Check that the returned model and target app match the request before answering. If they do not, use the HTTP reader once with the same parameters; otherwise give the link and say the price could not be checked.

## Layout

1. **最低价 / Lowest price**: each row of `lowest`. For each: site (its `sourceId`, copied exactly), group name as written, price with unit, observation date; add "（官方）" or "（推理服务商）" after the site when `providerCategory` is `OFFICIAL` or `INFERENCE`; add the row's `listing.hint` if it has one; add "（报价较旧）" when `freshness=STALE`.
2. **有门槛的更低价 / Lower with a condition**: each row of `gated`, with its hint, for example "relay-d.example「企业专享」0.08 美元额度／百万总 token，站点写明：仅企业用".
3. **列为参考 / Reference only**: up to two rows of `reference`. Write each row like a lowest row (site, group, price with unit, date) plus one plain reason. A count alone ("另有 11 条参考") is not enough; you may add the count after the rows. Reasons:
   - `listing.action=REFERENCE`: its `listing.hint` (for example "站点写明实际倍率 1.28（标价倍率 1.6）");
   - `reviewReasons`: `CROSS_SOURCE_OUTLIER` → "明显低于其他多数站的同模型报价" / "far below most other sites"; `UNIT_TEXT_CONTRADICTION` → "名称里写的计价单位和标价对不上"; `FLOAT_ARTIFACT` → "标价数字像换算误差"; `PLACEHOLDER_RATIO` → "倍率像是占位值";
   - `riskSignals`: `REVIEW_FLAG` → "Grandet 复核时标记为价格存疑"; `NONSTANDARD_CHANNEL` → "站点自己声明为非标准渠道"; `STALE` or `STALE_REFERENCE` → "报价较旧（观察于 <date>）"; `ZERO_PRICE_UNVERIFIED` → "标价为 0，未核实";
   - a hinted row of kind `test` → its hint ("站点标注为测试分组");
   - `listing.usage` (newer service): `NO_TOOL_CALLS` → "站点写明不支持工具调用"; `CHAT_ONLY` → "站点写明只能聊天"; `NOT_FOR_CODING` → "站点写明不用于编程"; `IMAGE_ONLY` → "站点写明仅生图".
   Say it may really be this cheap; the user can test it before topping up much.
4. **折叠 / Folded**: one line per `folded` entry: "另有 N 条仅限 <client> 使用的报价，已折叠。" Add "其中 M 条比上面的最低价还低" when `lowerThanLowestCount` is above 0. If the user says they use that client, query again with that `targetApp`.
5. **未参与排序 / Not ranked**, from `coverage.excluded`, at most one line each:
   - `CACHE_PRICE_UNKNOWN` above 0 and `scope.mix.cacheRead` above 0: "另有 N 条没标缓存价，未参与排序。" / "N more quotes list no cache price and were not ranked."
   - `OTHER_BILLING_UNIT` above 0 and the user asked for a per-image or per-request price: "另有 N 条按张或按次计价的报价，不在按 token 的排序里，可在网页上看：" plus the board link (item 8). Grandet's API has no per-image view: never send `view=declarations` or try another path for them.
   - `coverage.estimated.CACHE_READ_FROM_INPUT` above 0 (newer service): rows with `estimates: ["CACHE_READ_FROM_INPUT"]` list no cache price, so the server priced cache reads at the input price. Add "（缓存价按输入价估算）" after such a row.
6. Other boards: at most one line, such as "人民币额度另有一档，最低 X；单位不同，不能直接比较。"
7. **官方价与推理服务商 / Official and inference prices** (cash), only when `official` or `listings.inference` has entries:
   - 官方价: vendor, input and output prices with currency, for example "官方价（现金）：Anthropic 输入 3 / 输出 15 美元／百万 token，10 月 16 日观察". When several entries differ only in cache conditions, show the first and mention cache prices only if the user asked about caching.
   - 推理服务商: each entry the same way; add "（聚合平台）" for an aggregator; add "输入比官方低 N%" / "输出比官方高 N%" only from `cashPercentVsOfficial`.
   - Then one line: "中转站是额度价，和官方、推理服务商的现金价单位不同，不能直接相比。"
   - Never compute a percentage yourself, never say a relay is N% cheaper than official, and never convert credit into cash. If the user asked for the official price and `official` is empty, say Grandet has not recorded it for this model.
8. **链接 / Link**: the first `lowest` row's `boardUrl`, copied exactly, as "报价出处：<boardUrl>" / "Price sources: <boardUrl>". You may drop `utm_*` parameters; keep every other one (`model`, `currency`, `share` …). Every answer that gives lowest prices includes it.
9. One question, in the user's language: "要帮你接到 <app> 吗？" / "Want me to connect it to <app>?" (if the app is unknown: "要接到哪个应用？" / "Which app should I connect it to?").
10. Optional last line: one free-credit mention when it applies ([free credits](free-credits.md)), then any relevant unexpired `notices`, once per notice ID. A notice of `kind=skill-update` becomes one line with its `title` and `url`; never update the Skill unless the user asks.

Labels: credit boards say "额度价，非现金" / "credit price, not cash"; cash boards say "站点现金标价" / "listed cash price". Every price you write carries its unit, including prices in the reference, gated and folded lines: board prices are "／百万总 token" / "per million total tokens"; official and inference prices are input and output prices "／百万 token" / "per million tokens". A monthly estimate is `blended × monthly tokens / 1,000,000`, only when the user gave a volume. The shares come from `scope.mix`; say "按编程用量估算" or similar when it is a preset.

## Examples (all values illustrative)

> Claude Sonnet 4.6 最低价（按编程用量估算，额度价，非现金）：
> 1. relay-a.example「claudecode带缓存」0.12 美元额度／百万总 token，10 月 10 日观察
> 2. relay-b.example「aws0-ex」0.12 美元额度／百万总 token，10 月 10 日观察
>
> 有门槛的更低价：relay-d.example「企业专享」0.08 美元额度／百万总 token，站点写明：仅企业用。
> 列为参考：
> - relay-c.example「default」0.007 美元额度／百万总 token，10 月 10 日观察：明显低于其他多数站的同模型报价；
> - relay-e.example「gpt-plus」0.076 美元额度／百万总 token，10 月 10 日观察：Grandet 复核时标记为价格存疑。
> 可能真这么便宜，建议先小额试。
> 另有 5 条仅限 Claude Code 使用的报价，已折叠。
> 另有 3 条没标缓存价，未参与排序。
>
> 官方价（现金）：Anthropic 输入 3 / 输出 15 美元／百万 token，10 月 16 日观察。
> 推理服务商（现金）：DeepInfra 输入 3.00 / 输出 15.00 美元／百万 token。
> 中转站是额度价，和官方、推理服务商的现金价单位不同，不能直接相比。
> 报价出处：https://grandet.ai/leaderboard/?model=claude-sonnet-4-6&currency=USD_CREDIT&channel=standard&plans=best&sort=estimate
>
> 要帮你接到 Codex 吗？

> Claude Sonnet 4.6, lowest listed price (chat estimate, credit price, not cash):
> 1. relay-a.example "default" 0.30 USD credit per million total tokens, observed Oct 10
> 2. relay-b.example "aws0-ex" 0.30 USD credit per million total tokens, observed Oct 10
>
> Reference only: relay-c.example "default" 0.007 USD credit per million total tokens, observed Oct 10: far below most other sites. It may really be this cheap; try a small top-up first.
>
> Official (cash): Anthropic input 3 / output 15 USD per million tokens, observed Oct 16.
> Relay prices are credit and official prices are cash, so they cannot be compared directly.
> Price sources: https://grandet.ai/leaderboard/?model=claude-sonnet-4-6&currency=USD_CREDIT&channel=standard&plans=best&sort=estimate&share=75
>
> Want me to connect it to Codex?

## English conversations

With `lang=en`, a newer service adds English next to the original text. Older services leave these fields out; then answer as before, show the original group name, and explain terms from the English column of the [glossary](glossary.md).

- `planEn` (with `planTranslationMethod`): write the group name exactly as `plan`, then `planEn` in parentheses, for example: A site, group 「官key-特价」 ("official key, special price"). `planEn` is an explanation, never the name to select.
- `conditionsEn[]` lines up with `conditions[]`; use the English entry, and the original where it is `null`.
- `listing.hintEn`: show it instead of `listing.hint`. Without it, show `listing.hint` as it is.
- `modelNameEn` may explain a model name; `modelName` stays the exact name for the config.
- `integration.tokenGroup` and `modelName` are always the original text in the steps, the commands and the executor's `--group` and `--model`. `integration.tokenGroupNote` says the same: select this exact group name on the site.
- The fixed phrases in this file in English: "credit price, not cash"; "per million total tokens"; "older quote (observed <date>)"; "far below most other sites"; "the unit in the name does not match the price"; "the price looks like a conversion error"; "the rate multiplier looks like a placeholder"; "flagged by Grandet's review as a doubtful price"; "the site declares it a non-standard channel"; "listed at 0, not verified"; "N more offers limited to <client> are folded"; "N more quotes list no cache price and were not ranked"; "Relay prices are credit; official and inference prices are cash, so they cannot be compared directly."

## Special results

- `status=NO_ELIGIBLE_RECOMMENDATION` on every board: "这组条件下暂时没有可列出的报价：<returned reason>。" plus the link. Do not switch model or search outside Grandet.
- No board has `lowest` rows but a board has `reference` rows (for example every quote is older than the freshness limit): say there is no current listed price, then list up to two `reference` rows with their observation dates and "（报价较旧）". Do not present them as the lowest price.
- `scope.application.status=PRICE_ONLY_UNVERIFIED_APP_ROUTE`: give the prices and add "接入这个应用的方式 Grandet 还没核实。"
- `scope.application.status=NEEDS_CONNECTION_DETAILS`: say the returned `nextStep` in the user's language.
- `NEEDS_CLARIFICATION` with candidates: ask "你指的是 X 还是 Y？" and wait. `SELECTION_NOT_FOUND`: search once and ask with up to three candidates, as in the Skill's step 1.
- The user gave only a cash budget ("100 元能用多少", "I have $20 a month"): never turn it into a token count through a credit price. Say credit is not cash and each site's top-up ratio differs, give the prices as usual, and ask for the monthly volume if they want an estimate.
- "直接帮我选一个 / just pick one": give the first row of `lowest`; that is a price choice, not a quality judgement.
- "比官方便宜多少 / cheaper than official?": give the official price and the relay price side by side, each with its own unit, and say a relay's credit price cannot be turned into a cash saving. For an inference provider, give the percentage only from `cashPercentVsOfficial`.

Never say "推荐", "好用", "稳定", "靠谱" about a site, never claim a worldwide lowest price, savings or real payment cost (except a cash percentage the server returned in `cashPercentVsOfficial`), and never repeat a site's boasts.
