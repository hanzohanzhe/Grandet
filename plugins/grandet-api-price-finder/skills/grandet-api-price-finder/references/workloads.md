# Workload and target app

Use declared information already in the conversation. Do not ask for history or require token calculations before helping. Target selection follows explicit `targetApp`, then explicitly supplied legacy `client`, then a recognized `host`, then generic defaults. `host` is where this Skill runs, not evidence of the user's intended API application. Omit unstated fields instead of adding `client=generic` and blocking the host default.

Read [the generated app catalogue](app-catalog.md) only when identifying an app or checking its inference profiles. Use `grandet_list_apps(app=...)` when available and current capability details are needed. Do not copy a separate hard-coded application/protocol matrix into the response.

| Known requirement | Query choice |
|---|---|
| Target app is known | Send its exact catalogue ID as `targetApp`; preserve the known running assistant in `host` |
| User named an actual inference profile | Send that catalogue `targetProfile` with an explicit target; do not substitute an MCP/runtime profile |
| User specified a protocol | Send the exact supported endpoint value; preserve the user's configuration |
| Target has several inference protocols | Omit profile/protocol unless explicitly chosen; let the server compare its supported set |
| Long answers dominate | Use `mix=long_output` |
| No usage ratios or special workload given | Let the target's server preset apply; unknown context uses chat |

Endpoint filter values are `openai`, `openai-response` (singular), `anthropic` and `gemini`; profile IDs such as `openai-responses` are a different namespace. A declaration is not proof of real inference execution. A new target/profile protocol conflict returns an actionable error; never remove the target to bypass it. Old `client` plus an explicit protocol can remain a compatibility override, but `EXPLICIT_PROTOCOL_UNVERIFIED_APP_ROUTE` must not be described as verified app compatibility.

Cursor/Windsurf MCP definitions do not establish a custom model inference route. When the service returns `NEEDS_CONNECTION_DETAILS`, use its next step and the available context. If the user supplies an explicit protocol, keep the target and send endpointType; the service can compare that protocol with `EXPLICIT_PROTOCOL_UNVERIFIED_APP_ROUTE` and a null profileId. This gives generic protocol guidance, not claimed native app integration. Do not silently assume OpenAI or replace the application result with a webpage candidate.

Initial presets are chat 75/0/25, coding 20/70/10, and long_output 35/0/65 for uncached input/cache read/output. These are comparison scenarios, not measured behavior. Coding proportions require later calibration; never claim to have observed a 70% cache rate. The server's returned mix is authoritative.

For explicit proportions, both MCP and HTTP use the string `mix=in:20,cacheRead:70,out:10`. The server also supports a `cacheWrite` bucket, defaulting to zero when omitted. Input, cache read, cache write and output are mutually exclusive token buckets; if the user says input includes cached tokens, subtract cache only when the figures share a denominator. Otherwise use the suitable preset and label the assumption, or ask one essential question if the answer changes compatibility. Preserve `scope.mixOrigin` (`PRESET` or `USER_DECLARED`) and `scope.preset`; neither claims measured history.

Keep absolute token counts local. Under the supported linear per-token comparison, proportions determine ordering; monthly tokens can explain scale only when every needed rate and unit is known. Never extrapolate a credit rate into cash spending, or ignore fixed fees, request charges and tiers that the result does not cover.

Do not infer model identity from a marketing nickname when the resolver returns multiple variants. A short clarification such as “Which exact model/version?” is appropriate; a long supplier preference form is not.
