# Price answer

Short, in the user's language. Name the model first so the choice stays visible. Read only the fields below; do not print schema names, row IDs or long URLs beyond the one link.

## Fields used

- Top level: `priceFormat.unitDenominator` (`PER_MILLION_TOTAL_TOKENS` = price per 1,000,000 total tokens), `scope.mix` (the token shares used), `scope.application.status`, `notices`.
- Each board in `boards[]`: `unit` (`USD_CREDIT`, `CNY_CREDIT`, `USD`, `CNY`), `basis` (`LISTED_CREDIT` or `LISTED_CASH`), `status`, `recommended`, `alternative`, `cheapest`, `rows`.
- Each row: `sourceId` (the site), `plan` (the group to choose when creating the token), `modelName` (exact model name for the config), `blended` (listed price per million total tokens), `riskSignals`, `observedAt`, `boardUrl`, `integration`.

Check that the returned model and target app match the request before answering. If they do not, use the HTTP reader once with the same parameters; otherwise give the link and say the price could not be checked.

## Layout

1. **最低价 / Lowest price**: `recommended`, then `alternative` if present. For each: site, group name as written, price with unit, observation date.
2. **列为参考 / Reference only**: `cheapest` when it is a different row and cheaper. Give its price and one plain reason from `riskSignals`:
   - `REVIEW_FLAG` → "Grandet 复核时标记为价格存疑"
   - `NONSTANDARD_CHANNEL` → "站点自己声明为非标准渠道"
   - `STALE` → "报价较旧（观察于 <date>）"
   - `ZERO_PRICE_UNVERIFIED` → "标价为 0，未核实"
   Say it may really be this cheap; the user can test it before topping up much.
3. **折叠 / Folded**: rows whose group name says it is for one client only (see "限定客户端" in the [glossary](glossary.md), for example "仅限CC", "CC专用", "不可外接", "Codex专用") when the target app is a different client or unknown. One line: "另有 N 条仅限 <client> 使用的报价，已折叠。" When the target app is that client, list them normally without a hint.
4. Other boards: at most one line, such as "人民币额度另有一档，最低 X；单位不同，不能直接比较。"
5. One question: "要帮你接到 <app> 吗？" (or "要接到哪个应用？" if unknown).
6. Optional last line: one free-credit mention when it applies ([free credits](free-credits.md)), then any relevant unexpired `notices`, once per notice ID.

Labels: credit boards say "额度价，非现金" / "credit price, not cash"; cash boards say "站点现金标价" / "listed cash price". Always write the unit as "／百万总 token" / "per million total tokens". A monthly estimate is `blended × monthly tokens / 1,000,000`, only when the user gave a volume. The shares come from `scope.mix`; say "按编程用量估算" or similar when it is a preset.

## Example (all values illustrative)

> Claude Sonnet 4.6 最低价（按编程用量估算，额度价，非现金）：
> 1. A 站「claudecode带缓存」0.3 美元额度／百万总 token，10 月 10 日观察
> 2. B 站「Claude-VIP-Cache-Low」0.3 美元额度／百万总 token
>
> 列为参考：C 站 0.06 人民币额度，Grandet 复核时标记为价格存疑；可能真这么便宜，建议先小额试。
> 另有 2 条仅限 Claude Code 使用的报价，已折叠。
>
> 要帮你接到 OpenClaw 吗？

## Special results

- `status=NO_ELIGIBLE_RECOMMENDATION` on every board: "这组条件下暂时没有可列出的报价：<returned reason>。" plus the link. Do not switch model or search outside Grandet.
- `scope.application.status=PRICE_ONLY_UNVERIFIED_APP_ROUTE`: give the prices and add "接入这个应用的方式 Grandet 还没核实。"
- `scope.application.status=NEEDS_CONNECTION_DETAILS`: say the returned `nextStep` in the user's language.
- Ambiguous model name: ask "你指的是 X 还是 Y？" and wait.
- "直接帮我选一个 / just pick one": give the lowest listed price row; that is a price choice, not a quality judgement.

Never say "推荐", "好用", "稳定", "靠谱" about a site, never claim a worldwide lowest price, savings or real payment cost, and never repeat a site's boasts.
