# Workload and target app

Use declared information already in the conversation. Do not ask for history or require token calculations before helping. Target selection follows explicit `targetApp`, then explicitly supplied legacy `client`, then generic defaults. `host` is attribution only and never selects the target, protocol or preset. When the user explicitly wants to use the API in the current app, send that app as `targetApp`; when no destination is stated, omit it and make a generic lookup. Omit missing metadata without asking.

The querying computer's OS is not necessarily the target computer's OS, especially for cloud bots and cross-app requests. If only the source OS is known, omit `os`; do not ask just to fill it. A cloud bot's current model is not evidence of the model the user wants to buy.

Read [the generated app catalogue](app-catalog.md) only when identifying an app or checking its inference profiles. Use `grandet_list_apps(app=...)` when available and current capability details are needed. Do not copy a separate hard-coded application/protocol matrix into the response.

| Known requirement | Query choice |
|---|---|
| Target app is known | Send its known app ID as `targetApp`; preserve the source app in `host`. A safe known ID can remain a target even when absent from the current catalogue |
| User named an actual inference profile | Send that catalogue `targetProfile` with an explicit target; do not substitute an MCP/runtime profile |
| User specified a protocol | Send the exact supported endpoint value; preserve the user's configuration |
| Target has several inference protocols | Omit profile/protocol unless explicitly chosen; let the server compare its supported set |
| User says 写代码, 编程, 代码审查, coding or code review | Use `mix=coding` |
| Long answers dominate | Use `mix=long_output` |
| Embedding model (input only) | Use `mix=in:100,cacheRead:0,out:0` |
| No usage ratios or special workload given | Let the target's server preset apply; unknown context uses chat |

Endpoint filter values are `openai`, `openai-response` (singular), `anthropic` and `gemini`; profile IDs such as `openai-responses` are a different namespace. A declaration is not proof of real inference execution. A new target/profile protocol conflict returns an actionable error; never remove the target to bypass it. Old `client` plus an explicit protocol can remain a compatibility override, but `EXPLICIT_PROTOCOL_UNVERIFIED_APP_ROUTE` must not be described as verified app compatibility.

Missing inference evidence, including current Cursor/Windsurf definitions or an unlisted safe app ID, allows `PRICE_ONLY_UNVERIFIED_APP_ROUTE`: keep the target, give the server's price choice and state briefly that app setup is unverified. Do not ask the user to supply a protocol just to repair our catalogue gap. If the user already specified a protocol, send it; `EXPLICIT_PROTOCOL_UNVERIFIED_APP_ROUTE` and a null profileId still mean generic protocol guidance, not native integration. Known platform incompatibility and explicit profile/protocol conflicts remain actionable constraints; never remove the target or OS to bypass them. None of these conditions call for webpage fallback.

Initial presets are chat 75/0/25, coding 20/70/10, and long_output 35/0/65 for uncached input/cache read/output. These are comparison scenarios, not measured behavior. Coding proportions require later calibration; never claim to have observed a 70% cache rate. The server's returned mix is authoritative. Transcription and image models have no preset of their own: the chat preset is only an estimate for them, so say so.

For explicit proportions, both MCP and HTTP use the string `mix=in:20,cacheRead:70,out:10`. Always include `cacheRead`, even when it is 0: equal input and output is `mix=in:50,cacheRead:0,out:50`; `in:50,out:50` returns 400 `INVALID_MIX`. The server also supports a `cacheWrite` bucket, defaulting to zero when omitted.

`mix` is either a preset name or `in:<n>,cacheRead:<n>,out:<n>` (optionally `,cacheWrite:<n>`), whole numbers that add up to 100. Checked against the live service:

| Write | Result |
|---|---|
| `mix=coding`, `mix=chat`, `mix=long_output` | preset |
| `mix=in:50,cacheRead:0,out:50` | 50 % input, 50 % output |
| `mix=in:20,cacheRead:70,out:10` | the coding shares, written out |
| `mix=in:20,cacheRead:60,cacheWrite:10,out:10` | with cache writes |
| `mix=in:50,out:50` | 400 `INVALID_MIX`: `cacheRead` missing |
| `mix=20/70/10`, `mix=in:0.2,cacheRead:0.7,out:0.1` | 400 `INVALID_MIX`: not `name:whole number` |
| `mix=in:30,cacheRead:30,out:30` | 400 `INVALID_MIX`: adds up to 90 |

Turn the user's figures into whole-number shares yourself (for example 3M input and 1M output → `in:75,cacheRead:0,out:25`). On `INVALID_MIX`, fix the string once from this table; if the user gave no shares, drop `mix` and use the preset. Input, cache read, cache write and output are mutually exclusive token buckets; if the user says input includes cached tokens, subtract cache only when the figures share a denominator. Otherwise use the suitable preset and label the assumption, or ask one essential question if the answer changes compatibility. Preserve `scope.mixOrigin` (`PRESET` or `USER_DECLARED`) and `scope.preset`; neither claims measured history.

Keep absolute token counts local. Under the supported linear per-token comparison, proportions determine ordering; monthly tokens can explain scale only when every needed rate and unit is known. Never extrapolate a credit rate into cash spending, or ignore fixed fees, request charges and tiers that the result does not cover.

Do not infer model identity from a marketing nickname when the resolver returns multiple variants. A short clarification such as “Which exact model/version?” is appropriate; a long supplier preference form is not.
