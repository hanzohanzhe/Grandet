# Price answer

Short, in the user's language. Name the model first so the choice stays visible. Read only the fields below; do not print schema names, row IDs or long URLs beyond the one link.

## Fields used

- Top level: `priceFormat.unitDenominator` (`PER_MILLION_TOTAL_TOKENS` = price per 1,000,000 total tokens), `scope.mix` (the token shares used), `scope.application.status`, `notices`. In `view=compact`, `integrationCards` holds the shared connection cards.
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

1. **最低价 / Lowest price**: each row of `lowest`. For each: site, group name as written, price with unit, observation date; add "（官方）" or "（推理服务商）" after the site when `providerCategory` is `OFFICIAL` or `INFERENCE`; add the row's `listing.hint` if it has one; add "（报价较旧）" when `freshness=STALE`.
2. **有门槛的更低价 / Lower with a condition**: each row of `gated`, with its hint, for example "D 站「企业专享」0.08 美元额度／百万总 token，站点写明：仅企业用".
3. **列为参考 / Reference only**: up to two rows of `reference`. Write each row like a lowest row (site, group, price with unit, date) plus one plain reason. A count alone ("另有 11 条参考") is not enough; you may add the count after the rows. Reasons:
   - `listing.action=REFERENCE`: its `listing.hint` (for example "站点写明实际倍率 1.28（标价倍率 1.6）");
   - `reviewReasons`: `CROSS_SOURCE_OUTLIER` → "比其他多数站的同模型报价低 20 倍以上"; `UNIT_TEXT_CONTRADICTION` → "名称里写的计价单位和标价对不上"; `FLOAT_ARTIFACT` → "标价数字像换算误差"; `PLACEHOLDER_RATIO` → "倍率像是占位值";
   - `riskSignals`: `REVIEW_FLAG` → "Grandet 复核时标记为价格存疑"; `NONSTANDARD_CHANNEL` → "站点自己声明为非标准渠道"; `STALE` or `STALE_REFERENCE` → "报价较旧（观察于 <date>）"; `ZERO_PRICE_UNVERIFIED` → "标价为 0，未核实";
   - a hinted row of kind `test` → its hint ("站点标注为测试分组").
   Say it may really be this cheap; the user can test it before topping up much.
4. **折叠 / Folded**: one line per `folded` entry: "另有 N 条仅限 <client> 使用的报价，已折叠。" Add "其中 M 条比上面的最低价还低" when `lowerThanLowestCount` is above 0. If the user says they use that client, query again with that `targetApp`.
5. Other boards: at most one line, such as "人民币额度另有一档，最低 X；单位不同，不能直接比较。"
6. **官方价与推理服务商 / Official and inference prices** (cash), only when `official` or `listings.inference` has entries:
   - 官方价: vendor, input and output prices with currency, for example "官方价（现金）：Anthropic 输入 3 / 输出 15 美元／百万 token，10 月 16 日观察". When several entries differ only in cache conditions, show the first and mention cache prices only if the user asked about caching.
   - 推理服务商: each entry the same way; add "（聚合平台）" for an aggregator; add "输入比官方低 N%" / "输出比官方高 N%" only from `cashPercentVsOfficial`.
   - Then one line: "中转站是额度价，和官方、推理服务商的现金价单位不同，不能直接相比。"
   - Never compute a percentage yourself, never say a relay is N% cheaper than official, and never convert credit into cash. If the user asked for the official price and `official` is empty, say Grandet has not recorded it for this model.
7. One question: "要帮你接到 <app> 吗？" (or "要接到哪个应用？" if unknown).
8. Optional last line: one free-credit mention when it applies ([free credits](free-credits.md)), then any relevant unexpired `notices`, once per notice ID.

Labels: credit boards say "额度价，非现金" / "credit price, not cash"; cash boards say "站点现金标价" / "listed cash price". Every price you write carries its unit, including prices in the reference, gated and folded lines: board prices are "／百万总 token" / "per million total tokens"; official and inference prices are input and output prices "／百万 token" / "per million tokens". A monthly estimate is `blended × monthly tokens / 1,000,000`, only when the user gave a volume. The shares come from `scope.mix`; say "按编程用量估算" or similar when it is a preset.

## Example (all values illustrative)

> Claude Sonnet 4.6 最低价（按编程用量估算，额度价，非现金）：
> 1. A 站「claudecode带缓存」0.12 美元额度／百万总 token，10 月 10 日观察
> 2. B 站「aws0-ex」0.12 美元额度／百万总 token，10 月 10 日观察
>
> 有门槛的更低价：D 站「企业专享」0.08 美元额度／百万总 token，站点写明：仅企业用。
> 列为参考：
> - C 站「default」0.007 美元额度／百万总 token，10 月 10 日观察：比其他多数站的同模型报价低 20 倍以上；
> - E 站「gpt-plus」0.076 美元额度／百万总 token，10 月 10 日观察：Grandet 复核时标记为价格存疑。
> 可能真这么便宜，建议先小额试。
> 另有 5 条仅限 Claude Code 使用的报价，已折叠。
>
> 官方价（现金）：Anthropic 输入 3 / 输出 15 美元／百万 token，10 月 16 日观察。
> 推理服务商（现金）：DeepInfra 输入 3.00 / 输出 15.00 美元／百万 token。
> 中转站是额度价，和官方、推理服务商的现金价单位不同，不能直接相比。
>
> 要帮你接到 Codex 吗？

## Special results

- `status=NO_ELIGIBLE_RECOMMENDATION` on every board: "这组条件下暂时没有可列出的报价：<returned reason>。" plus the link. Do not switch model or search outside Grandet.
- `scope.application.status=PRICE_ONLY_UNVERIFIED_APP_ROUTE`: give the prices and add "接入这个应用的方式 Grandet 还没核实。"
- `scope.application.status=NEEDS_CONNECTION_DETAILS`: say the returned `nextStep` in the user's language.
- `NEEDS_CLARIFICATION` with candidates: ask "你指的是 X 还是 Y？" and wait.
- "直接帮我选一个 / just pick one": give the first row of `lowest`; that is a price choice, not a quality judgement.
- "比官方便宜多少 / cheaper than official?": give the official price and the relay price side by side, each with its own unit, and say a relay's credit price cannot be turned into a cash saving. For an inference provider, give the percentage only from `cashPercentVsOfficial`.

Never say "推荐", "好用", "稳定", "靠谱" about a site, never claim a worldwide lowest price, savings or real payment cost (except a cash percentage the server returned in `cashPercentVsOfficial`), and never repeat a site's boasts.
