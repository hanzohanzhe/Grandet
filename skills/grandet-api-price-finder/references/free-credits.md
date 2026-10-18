# Free credits

Grandet records two kinds of free credit and returns both from one query:

- **Official**: free tiers, trial credit and application programmes from model providers and platforms (Google, Groq, Mistral, Cloudflare, OpenRouter, NVIDIA and others).
- **Relay**: sign-up, check-in and invite credit on relay sites, and relay **free groups** (groups whose ratio is 0).

Each offer has six conditions: card, identity (实名), payment, invite, application and renewal, each marked required, not required, conditional or unknown. Grandet does not verify personal eligibility or whether an offer can still be claimed.

## When to use

- The user asks about free API, trial credit, 白嫖, 公益站, 签到, invite rewards, or "有没有能测试的中转站": list a batch.
- The user did not ask, but has already said things that meet the conditions of an offer that covers their model (for example "我是学生", "我有信用卡"): add one line at the end of the price answer, once per conversation, such as "Google 有 Gemini 免费额度，需 Google 账号，要看看吗？" Unknown conditions do not count as met; say "条件未核实".

## Get the data

Call `grandet_find_free_credits` once with:

- `q`: the model family or provider the user cares about (`gemini`, `claude`, `deepseek` …). It matches provider, title, benefit text and the models a free group covers. Leave it out to list everything. If a model family returns no official offer, query once more with the vendor's name (qwen → `百炼` or `alibaba`, kimi → `moonshot`, glm → `智谱` or `zhipu`) and merge the official offers.
- `kind=all`, so official and relay offers both come back. Use `official` or `relay` only when the user asked for one kind.
- `userCanMeet`: `no_card` when the user said they have no card, `student` when they said they are a student, otherwise leave it out. `no_card` keeps only offers that **state** no card is needed; when it returns nothing, query again without it and mark each offer "是否需绑卡未写明".
- `lang` (`zh-CN` or `en`), `limit=20`, `skillVersion=0.3.0`, `skillBuild=grandet-skill-0.3.0-build.20261018b`, and the known `host`/`targetApp`.

Without MCP, send the same parameters to `GET https://grandet.ai/api/v1/free-credits` (see [HTTP fallback](http-fallback.md)). If both fail, give the web page instead: `https://grandet.ai/zh-CN/free-tokens/` (English: `https://grandet.ai/free-tokens/`), with `?q=<word>` to filter.

If the request fails with a network error, send it once more before answering; if it still fails, say the list could not be read and give the web page above. Never answer as if there were no offers.

If the host shows the result as cut off ("truncated", "output too long"), do not guess a saved file the host did not name. Read the saved file only when the host gives its path. Otherwise query again in smaller parts: `kind=official`, then `kind=relay`, each with `limit=5`, following `pagination` while needed. If it is still incomplete, list what you did read, say the list is incomplete, and give the web page.

Read `offers[]`, plus `total` and `pagination` to know whether more pages exist. Fields used per offer:

- `kind`: `official-free-tier` or `official-program` (trial, startup, student and developer programmes; `category` says which); `relay-credit` (sign-up, check-in, invite); `relay-free-group`.
- `provider`, `title`, `benefitText` (the provider's own words), `conditions`.
- `requirements.<card|identity|payment|invite|application|renewal>.state`.
- `deadline`, `claimUrl`, `observedAt`. `deadline.statedDate` (official) and `deadline.statedText` (relay credit) are end dates the provider wrote. A relay free group has only `deadline.endAt`: how long Grandet keeps the record valid, not an end date the site stated. `deadline.kind` names which it is: `PROMOTION_END` (the provider's end date, in `statedDate`), `OBSERVATION_WINDOW` (Grandet's record window, in `endAt`), `UNKNOWN` (no date: write none).
- For `relay-free-group` only: `plan` (the group to choose when creating the token), `modelNames`, and `declaration`:
  - `ZERO_RATIO`: the group really charges ratio 0. It is free credit.
  - `STATED_FREE_TINY_RATIO`: the site calls it free or 福利, but the ratio is not 0. It is a paid offer with a small ratio, not free credit.

## Answer

Merge entries with the same `provider` and `plan` (a free group can come back once per model or unit) and count them once. A relay free group covers the user's model only when one of its `modelNames` is that model (a route prefix such as `free/` is fine); a match in the site's domain or a variant such as `-distill` or `-spark` does not count. List up to five offers, the ones covering the user's model first. **Always include both kinds when the query returned both**: at least one official offer and at least one relay offer (credit or `ZERO_RATIO` group). If one kind returned nothing, say so in one line ("中转站目前没有收录覆盖 Gemini 的免费分组").

For each offer, one line:

- who offers it and what it gives (their words, shortened);
- the conditions marked required (for example "需绑卡、需实名"); unknown ones as "条件未写明";
- every usage limit the offer's own `conditions` state, such as only for one client, a daily or hourly cap, slower at peak times, or only some models (for example "仅限 rp-hub、每日 240 次、高峰限速"). Never drop a stated limit to shorten the line, and never call a stated limit "未写明";
- for a relay free group, the group name to choose: 「<plan>」; in English, add `planEn` in parentheses when the service returns it, and keep 「<plan>」 as the name to select;
- "截止 <date>" / "ends <date>" only from `deadline.statedDate` or `deadline.statedText`; for a relay free group's `deadline.endAt`, "记录有效期至 <date>" / "record valid until <date>"; and the claim link (`claimUrl`, or the site for a relay).

Keep each line's hint within 50 characters; a line with several stated limits may run longer rather than lose one. Then filter by what the user has told you about themselves.

Then give the page link, always, in its own line: "完整列表：https://grandet.ai/zh-CN/free-tokens/?q=<q>" (English: "Full list: https://grandet.ai/free-tokens/?q=<q>"), with the `q` you sent (leave `?q=` out when you sent none). Keep the whole answer within 8 lines and 600 characters (English: 100 words).

End with **at most one question**, the one that really changes the result, such as "能绑卡吗？" or "你在哪个国家或地区？". Asking which offer to use and which app to connect it to is two questions: ask which offer first, and ask about the app only when the user wants to connect.

Put `STATED_FREE_TINY_RATIO` groups after the real free offers, only when they cover the user's model, as "标为免费，实际按小倍率计费". Never count them as free. "free号 / free逆 / free池" in a group name means the site's upstream accounts are free tiers; it is not free credit for the user.

Do not say which free offer is better and do not repeat a provider's quality claims. If the user picks one, connect it the same way as a paid offer ([connect](host-setup.md)). For a relay free group, the token must be created in that group. For an official free tier, the API address and key come from that provider's own console.

## Example (all values illustrative)

> Gemini 能用的免费额度（共 5 条，按是否覆盖 Gemini 排）：
> 1. Google AI Studio：Gemini API 免费层，部分模型免费；需 Google 账号，是否需绑卡未写明。aistudio.google.com
> 2. OpenRouter：免费模型每天最多 50 次；条件未写明。openrouter.ai
> 3. A 站：免费分组「公益gemini」，倍率 0；仅限 rp-hub、每日 240 次、高峰限速；建令牌时选这个分组；记录有效期至 10 月 17 日。
> 4. B 站：QQ 邮箱注册送 1 刀站内额度；其他条件未写明。
> 5. C 站「福利gemini」标为免费，实际按小倍率计费。
>
> 完整列表：https://grandet.ai/zh-CN/free-tokens/?q=gemini
> 领取资格和是否还能领，Grandet 没有核实。要接哪一个？
