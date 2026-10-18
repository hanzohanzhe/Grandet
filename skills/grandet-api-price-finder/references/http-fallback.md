# HTTP fallback

Endpoint: `GET https://grandet.ai/api/v1/board`. Send exactly one of `model` (resolved group ID, officialId or an exact original model name) and `name` (the catalogue's 20-character hexadecimal raw-name ID, not the name text). A human model name can be sent as `model` directly: a unique match is used (`resolvedFrom.model`), and an ambiguous one returns `NEEDS_CLARIFICATION` with `resolution.candidates` and `resolution.totalCandidates`. To look up only the ID, use `grandet_resolve_model(name=...)`; without MCP, GET `/api/v1/models?q=<model name>&scope=groups` and use the matching item's `id`. `/api/v1/models` accepts `q`, `scope`, `page`, `host`, `targetApp`, `skillVersion` and `skillBuild`; `lang`, `limit` and any other parameter return 400. The resolver's candidate `model` is a usable catalogue selector; keep its `officialId` for identity matching. A literal display name can validly select only a narrow original-name subset, so it is not the default selector for a broad supplier comparison. Reuse confirmed selectors on follow-up queries. Parameters: `model`, `name`, `mix`, `endpointType`, `currency`, `channel`, `plans`, `limit`, `releaseSet`, `asOf`, `host`, `targetApp`, `targetProfile`, legacy `client`, `os`, `lang`, `view` (`full` or `compact`), and the attribution fields `skillVersion` and `skillBuild`. Unknown parameters fail. Do not send raw prompts, credentials, absolute usage or account identifiers.

MCP first: `grandet_find_cheapest_api(model or name, host?, targetApp?, targetProfile?, mix?, client?, endpointType?, currency?, channel?, plans?, limit?, releaseSet?, asOf?, lang?, os?, view?, skillVersion?, skillBuild?)`. Use `view=compact`: it returns a short text summary plus the same `listings`, with connection cards shared in `integrationCards`. Follow the live tool schema; comparison parameters use the same names and string mix syntax as HTTP. `grandet_list_apps({app?, lang?, host?, targetApp?, skillVersion?})` lists public app definitions and profiles, optionally filtered by catalogue app ID. Use it only when the target identity or configuration support needs resolving. `grandet_quote_evidence(provider, model or name, rowId?, offerPage?, releaseSet?, asOf?, lang?, host?, targetApp?, skillVersion?)` reads a condition when necessary; `provider` is the selected row's `sourceId`. Model resolution also accepts optional host/targetApp/skillVersion on the new backend. Use `rowId` to inspect that declaration and follow `offerPage` if it is absent. Do not substitute the operator cluster ID for the provider.

MCP language is `en` or `zh-CN`; HTTP additionally accepts `zh`. Use `zh-CN` consistently. `host` is the current assistant and may be an unrecognized name; `targetApp` is the intended app ID (a safe known ID can be absent from the catalogue). Target precedence is explicit targetApp → explicit legacy client → generic. `host` alone never implies a target; when the user intends to use the current app, explicitly send its targetApp. `client` remains optional with its old target meaning, extended to catalogue app IDs; do not set it to generic by default. `targetProfile` must be an actual inference profile for an explicit targetApp or client, never a profile inferred solely from MCP support. Profile IDs and endpointType values are different namespaces. Send known target `os=windows`, `macos` or `linux`; otherwise omit it or use `unknown`, with no extra question. `channel=standard` and `plans=best` are defaults; use their wider values only when needed. Normal lookups use `limit=10`. HTTP's optional `schema` assertion is not a MCP argument.

Include `skillVersion=0.3.0`, `skillBuild=grandet-skill-0.3.0-build.20261018b` and known host/targetApp metadata only on requests that accept them: every MCP tool except `grandet_glossary`, and HTTP `/api/v1/board`, `/api/v1/free-credits`, `/api/v1/models` and `/api/v1/prices`. `/api/v1/glossary`, `/api/v1/providers`, `/api/v1/catalog-version` and `/api/grandet/page` reject them with 400. Every HTTP request sends a User-Agent such as `grandet-skill/0.3.0 (<host>)`; in Python, set the header explicitly instead of relying on the library default. Do not query merely to report usage, send identity data, or ask the user to fill missing metadata. Follow each live tool's schema: auxiliary tools and older services may accept fewer fields. Do not add these metadata parameters to V17 page JSON; omit unsupported fields and preserve the useful lookup.

Documented tool calls are inputs for package/schema verification; these examples do not prove real-host execution or deployment. Model and provider values are illustrative:

```json
{"tool":"grandet_find_cheapest_api","arguments":{"model":"example-model","host":"codex","targetApp":"openclaw","mix":"coding","limit":10,"view":"compact","lang":"zh-CN","os":"windows","skillVersion":"0.3.0","skillBuild":"grandet-skill-0.3.0-build.20261018b"}}
```

```json
{"tool":"grandet_resolve_model","arguments":{"name":"example model","lang":"en","host":"codex","targetApp":"openclaw","skillVersion":"0.3.0","skillBuild":"grandet-skill-0.3.0-build.20261018b"}}
```

```json
{"tool":"grandet_quote_evidence","arguments":{"model":"example-model","provider":"supplier.example","offerPage":1,"lang":"en","host":"codex","targetApp":"openclaw","skillVersion":"0.3.0","skillBuild":"grandet-skill-0.3.0-build.20261018b"}}
```

```json
{"tool":"grandet_list_apps","arguments":{"app":"openclaw","lang":"zh-CN","host":"codex","targetApp":"openclaw","skillVersion":"0.3.0","skillBuild":"grandet-skill-0.3.0-build.20261018b"}}
```

Use one shell-appropriate command with escaped literal values, not string-built shell code. The following is an example for a resolved catalogue group, not a claim of matching current quotes. Replace its entire model value with the matching HTTP item's `id` (or MCP candidate's `model`), preserving prefixes such as `anthropic/`; do not shorten it to the name used to configure inference. Preserve host/target/language from the request. Do not add an endpoint just to avoid the server's multi-protocol selection. On Windows PowerShell, use `curl.exe`, not the `curl` alias:

```powershell
curl.exe --fail-with-body --silent --show-error --max-time 20 --get 'https://grandet.ai/api/v1/board' --user-agent 'grandet-skill (codex)' --data-urlencode 'model=anthropic/claude-sonnet-4-6' --data-urlencode 'mix=coding' --data-urlencode 'host=codex' --data-urlencode 'targetApp=openclaw' --data-urlencode 'lang=zh-CN' --data-urlencode 'limit=10' --data-urlencode 'view=compact' --data-urlencode 'skillVersion=0.3.0' --data-urlencode 'skillBuild=grandet-skill-0.3.0-build.20261018b'
```

On macOS/Linux:

```sh
curl --fail-with-body --silent --show-error --max-time 20 --get 'https://grandet.ai/api/v1/board' --user-agent 'grandet-skill (claude-code)' --data-urlencode 'model=anthropic/claude-sonnet-4-6' --data-urlencode 'mix=coding' --data-urlencode 'host=claude-code' --data-urlencode 'targetApp=openclaw' --data-urlencode 'lang=en' --data-urlencode 'limit=10' --data-urlencode 'view=compact' --data-urlencode 'skillVersion=0.3.0' --data-urlencode 'skillBuild=grandet-skill-0.3.0-build.20261018b'
```

Add an explicit user protocol/profile and optional currency when known. A multi-protocol target needs no profile question. A profile/endpoint conflict returns 400; targets with inference profiles also reject a protocol outside that set. Known platforms must match the profile's declaration. An explicit target with inference profiles unsupported on the selected OS cannot be bypassed with endpointType: it returns TARGET_APP_PLATFORM_MISMATCH. Correct only from the user's actual requirements, never by dropping a target or platform. Apps without inference profiles, including current Cursor/Windsurf definitions and unlisted safe app IDs, proceed without a protocol question as `PRICE_ONLY_UNVERIFIED_APP_ROUTE`; return the price choice with unverified app compatibility. A user-specified endpointType instead yields `EXPLICIT_PROTOCOL_UNVERIFIED_APP_ROUTE` with a generic protocol card and null profileId. The same flag marks a legacy client protocol override outside its declared app routes; neither proves app integration.

Omit `releaseSet` and `asOf` for a fresh lookup. On a version conflict, restart at most once without the stale version. On a connection reset, timeout or HTTP 5xx, send the same request once more. A 403 whose body is `error code: 1010` means the User-Agent was rejected: resend once with `--user-agent 'grandet-skill/0.3.0'`. Do not retry other 401/403 responses or loop on unavailable service. A proxy CONNECT 403, HTTP 000 or empty body is a blocked/failed read, not a board result; give the link fallback rather than installing tools or trying to bypass access denial. Other full-service unavailability can use the limited V17 page path below. A successful no-recommendation result is respected. `PRICE_ONLY_UNVERIFIED_APP_ROUTE` is a useful price recommendation with unverified app setup, not an error and not an invitation to ask a protocol questionnaire. Keep that target and label its returned compatibility honestly. `NEEDS_CONNECTION_DETAILS` with empty boards remains an application result for known constraints: use its nextStep and known facts, not page fallback. Ask one necessary question only when a real user constraint remains unresolved; preserve the target and OS.

Read the response before summarizing it. A compact view retains top-level `scope`, `priceFormat`, `version`, `websiteLinkScope` and each board's unit, basis and complete selected rows. Match the returned model selector, four token shares and intended app to the resolved request; inspect returned scope even when a web-fetch tool displays the requested URL. If content is incomplete or belongs to an earlier query, use one already-available alternate structured/raw reader with the same parameters. If no matching response is obtained, give a verified link for the requested model, otherwise `https://grandet.ai/` with the model to search. Do not hand-calculate a new recommendation from old rows.

Result: `scope.application` describes the intended target independently of the source host, plus compatibility limits or required connection details. Selected `integration.compatibility=UNVERIFIED` cards support a price choice, not a claim that the app is ready to connect. `boards[]` contains independent unit boards with `basis` and `listings` (`lowest`, `gated`, `reference`, `folded`); each row has `providerCategory`. Top-level `official` and `listings.inference` hold official and inference-provider cash prices (input and output per million tokens). Read them as in [response format](response-format.md). The older fields `recommended`, `alternative`, `cheapest` and `rows` remain for older Skills. The three selected values are complete rows or null, not row IDs. Each selected row's `integration` identifies its actual app/profile/endpoint and configuration guidance; the alternative may use a different supported profile. Preserve returned decimal-string prices and units, coverage and exclusions. `scope.mixOrigin` is `PRESET` or `USER_DECLARED`; `scope.preset` is `chat`, `coding`, `long_output` or null. These are not usage measurements.

Use exact `boardUrl`/`evidenceUrl` returned by Grandet as links to show; never download `evidenceUrl` or other `public-data` files (403 `BULK_AUTHORIZATION_REQUIRED`). When `websiteLinkScope=MODEL_AND_CURRENCY_REFERENCE`, label it “报价出处 / price sources”. It is a model/currency reference, not a reproduction of the query's target-app filtering or cache-read/write mixing. The API's returned scope/version/mix defines this calculation.

## Reading a large response with a shell

A board response can be tens of kilobytes. With Python available, print only what the answer needs:

```sh
curl --fail-with-body --silent --show-error --max-time 20 --get 'https://grandet.ai/api/v1/board' --user-agent 'grandet-skill/0.3.0' --data-urlencode 'model=anthropic/claude-sonnet-4-6' --data-urlencode 'targetApp=codex' --data-urlencode 'lang=zh-CN' --data-urlencode 'limit=10' --data-urlencode 'view=compact' --data-urlencode 'skillVersion=0.3.0' --data-urlencode 'skillBuild=grandet-skill-0.3.0-build.20261018b' | python3 -c '
import json,sys
d=json.load(sys.stdin);cards=d.get("integrationCards") or []
print("scope",json.dumps({k:d.get("scope",{}).get(k) for k in ("mix","preset","application")},ensure_ascii=False))
print("excluded",json.dumps((d.get("coverage") or {}).get("excluded")))
for b in d.get("boards",[]):
    L=b.get("listings") or {}
    print("==",b["unit"],b["basis"],b["status"],"folded",L.get("folded"),"boardUrl",((L.get("lowest") or [{}])[0]).get("boardUrl"))
    for k in ("lowest","gated","reference"):
        for r in L.get(k) or []:
            i=r.get("integration") or {};c=cards[i["card"]] if isinstance(i.get("card"),int) and i["card"]<len(cards) else i
            print(k,r["sourceId"],r.get("providerCategory"),"|",r["plan"],"|",r["blended"],r["observedAt"][:10],r.get("freshness"),"|",(r.get("listing") or {}).get("hint"),r.get("reviewReasons"),r.get("riskSignals"),"|",i.get("baseUrl"),i.get("baseUrlMode"),i.get("tokenGroup"),c.get("endpointType"),c.get("configurationPath"))
for k,rows in (("official",d.get("official") or []),("inference",(d.get("listings") or {}).get("inference") or [])):
    for e in rows:
        print(k,e["vendor"],"|",e["currency"],"in",e["input"],"out",e["output"],"cacheRead",e.get("cacheRead"),"|",e["observedAt"][:10],"| aggregator",e.get("aggregator"),"| pct",e.get("cashPercentVsOfficial"),"|",json.dumps(e.get("conditions"),ensure_ascii=False))
'
```

Replace the model, target and language with the request's values. On Windows without Python, read the JSON with `ConvertFrom-Json` and the same fields.

## Free credits

`GET https://grandet.ai/api/v1/free-credits` with `q`, `kind` (`official`, `relay` or `all`), `userCanMeet` (`any`, `no_card`, `student`), `lang`, `page`, `limit` (at most 20), `host`, `targetApp`, `skillVersion`, `skillBuild`. Same as MCP `grandet_find_free_credits`. Read it as in [free credits](free-credits.md); follow `pagination` for more pages.

```sh
curl --fail-with-body --silent --show-error --max-time 20 --get 'https://grandet.ai/api/v1/free-credits' --user-agent 'grandet-skill/0.3.0' --data-urlencode 'q=gemini' --data-urlencode 'kind=all' --data-urlencode 'lang=zh-CN' --data-urlencode 'limit=20' --data-urlencode 'skillVersion=0.3.0' --data-urlencode 'skillBuild=grandet-skill-0.3.0-build.20261018b' | python3 -c '
import json,sys
d=json.load(sys.stdin);print("total",d["total"],"pages",d["pages"],d.get("coverage"))
for o in d["offers"]:
    req={k:v.get("state") for k,v in (o.get("requirements") or {}).items()}
    print(o["kind"],o.get("declaration") or "","|",o["provider"],"|",o.get("plan") or "","|",o["title"],"|",o.get("benefitText","")[:80],"|",req,"|",json.dumps(o.get("deadline")),o.get("claimUrl"),"|",(o.get("modelNames") or [])[:8])
'
```

## Glossary

`GET https://grandet.ai/api/v1/glossary?q=<term>&lang=zh-CN` (also `category`, `page`, `limit`; no other parameters, so no `skillVersion`, `skillBuild`, `host` or `targetApp`), same as MCP `grandet_glossary`. Each term has `meaning`, `confidence`, `status` and `sources`. Use it only to explain a term the built-in [glossary](glossary.md) lacks; how groups are shown is decided by the server, not by this lookup.

## V17 page fallback when the complete service is unavailable

Only when `/api/v1/board` itself fails twice (network error, timeout or HTTP 5xx), or when [quality evidence](quality-evidence.md) sends you here. A board that answers with empty `boards` or no `listings.lowest` has not failed: report its `coverage.excluded` reasons as the Skill's "Get the data first" says, and do not come here to look for other prices.

V17 adds `GET https://grandet.ai/api/grandet/page`, a bounded JSON representation of one supported HTML page, not the complete board API. It does not accept board-only `mix`, `endpointType`, `host`, `targetApp`, `targetProfile`, `client` or `lang`. Locale and supported webpage filters live in the encoded relative `path`; use returned paths and links rather than guessing model slugs. This page interface does not supply L4 target integration validation.

1. Prefer an existing page's `link rel="alternate" type="application/json"` href. Otherwise GET `/api/v1/catalog-version`, take `version.releaseSet`, and send it with the verified relative HTML `path` to `/api/grandet/page`. For a model not yet resolved, the supported model-directory path is `/models/?q=<URL-encoded name>&scope=groups` (or `/zh-CN/models/`); use its actual model link. No new user question is needed.
2. Require HTTP 200 and `schema=grandet.page-query/v1`; check the returned version, selected model, filters, unit and observation date. Errors may be `error` strings or `error.code`; do not treat either as price data.
3. For a per-token price page, preserve `data.comparison`'s server order. You may show one or two observed candidates, labelled **current webpage candidates / 当前网页条件下的候选**. State the actual input/output scenario and limited coverage briefly. Do not compute a new minimum from this page or call it a complete workload recommendation. Cache-read/write demands remain unverified by the two-bucket page. A provider is compatible only when a matching declaration supports that claim; otherwise say compatibility is unconfirmed. Do not substitute per-request or tiered rows into token comparisons.
4. Read further pages only when needed for this choice or a specific quote: follow `links.next`; model original-name discovery separately follows `discoveryPagination.links.next`. Keep one releaseSet and check each response's version. When multiple pages are needed, reissue the first required page with explicit `asOf` equal to its first evaluatedAt, then follow the returned links that preserve that clock. Do not invent page counts or fetch a full catalogue. On 409 or a response that breaks the pin, discard the mixed segment and restart at most once. A completed consistent read needs no extra version query.

An illustrative page request uses only supported V17 parameters; obtain the release value at lookup time rather than copying a historical pin:

```powershell
curl.exe --fail-with-body --silent --show-error --max-time 20 --get 'https://grandet.ai/api/grandet/page' --user-agent 'grandet-skill/0.3.0 (codex)' --data-urlencode 'path=/zh-CN/models/?q=claude-sonnet-4-6&scope=groups' --data-urlencode 'releaseSet=<value-returned-by-catalog-version>'
```

**Since the W42 site (2026-10-18), `/providers/<sourceId>/…` page paths answer `PAGE_NOT_FOUND`.** For one site's declarations use `path=/leaderboard/?model=<id>&provider=<sourceId>&view=declarations` (returns `kind=current-prices`) or, simpler, `/api/v1/prices?model=<id>&provider=<sourceId>`. The rest of this paragraph is for older sites. A returned `/providers/<sourceId>/?name=<modelName>&view=declarations` link is intended to select that provider's **paged declarations for this raw model name**, not a unique-row lookup; `name` here is model text, unlike `/api/v1/board`'s raw-name ID. Check that its page JSON actually has `kind=current-prices`. The received V17 dispatcher can instead return `current-catalogue`, ignoring the name/view filters; do not present that directory as quote evidence or assume the local repair is deployed.

If it is still a directory, automatically follow its real matching declaration link, or use the existing read-only `/api/v1/prices?name=<raw-name-ID>&provider=<sourceId>&offerPage=1&releaseSet=<pin>`. Obtain the exact raw-name ID from the returned directory's matching `modelName`/`modelId`, or `/api/v1/models?q=<raw-model-name>&scope=all`; do not guess it or pass model text as this API's name. Check the returned scope/source, then read further offerPage values only within returned pagination when the selected declaration is absent. Keep version and evaluation time consistent. No new user step is needed.

Preserve source, plan, original observation and evidence. Even a working provider same-model page can put the selected row on a later page. Related model links are discovery hints, not permission to substitute a model silently.

Normal page browsing has no application-level frequency quota. Existing resource admission and separately authorized bulk controls still apply: never bypass 403 or convert this fallback into a bulk download. On unsupported paths, malformed queries or unavailable data, give the verified `links.html` URL or Grandet homepage with a short search instruction. Do not claim the link itself is a completed comparison.
