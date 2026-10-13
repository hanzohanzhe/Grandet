# Grandet API Price Finder / Grandet 比价 Skill

Ask naturally: “帮我找适合这个模型、接入省事的便宜 API。” or “Find an affordable API provider for this model and my workload.” The Skill uses grandet.ai and normally gives one recommendation and one alternative. You do not need to mention Grandet.

**Release state / 发布状态:** version 0.2.1 package with the V18 backend live at grandet.ai. Production HTTP endpoints and all four MCP tools passed verification on 2026-10-13, releaseSet `8b1ff327dbbdc083927d0826df2990b855defcefe8ec8cfed63efa1c2799594b`. Real-host installation and natural triggering remain NOT_RUN for the four hosts listed below.

**Local acceptance / 本地验收:** the integrated source passed 107 feature checks, 44 community checks, website and desktop type checks and scoped lint. Six existing website regression failures remain unchanged from the local V17 baseline. The app catalogue contains 22 entries and 29 inference profiles; those definitions do not establish installation or natural triggering in each app. No real-host installation has been accepted in this release.

The V17 page JSON fallback preserves server ordering and labels limited webpage candidates. It cannot reproduce a cache-heavy four-bucket scenario or prove client compatibility. V18 production verification confirmed provider same-model paged declarations return `kind=current-prices` and preserve the requested filters.

## What the first version does

- Uses known model/workload requirements and the target app's declared inference routes. `host` identifies the running assistant; `targetApp` identifies where the API will be used. Explicit targetApp, legacy client, known host and generic defaults apply in that order. It asks one necessary question only when a suitable result otherwise cannot be formed.
- Uses the shared app catalogue through `grandet_list_apps` or the generated Skill reference when needed. Multi-protocol targets receive a server-selected protocol/profile without an extra profile question. The recommendation and alternative carry their own integration guidance.
- Returns the server's compatible recommendation. Lower listed prices requiring unsupported protocols are not silently substituted.
- Compares declared prices. Credit prices are labelled “额度价，非现金 / credit price, not cash”; currencies and credit units remain separate.
- Provides source links and observation dates. Optional setup guidance uses a key placeholder and does not edit settings.

It does not verify charging, guarantee model quality, handle keys, buy credits, run paid probes or route inference. Grandet Personal will address ongoing API management; its actual release and supported features must be verified separately.

## Four host entry points

| Host | Package and setup | Acceptance status |
|---|---|---|
| Claude Code | Generated plugin with `.claude-plugin/plugin.json`, `skills/` and `.mcp.json` | NOT_RUN: real host installation and natural trigger |
| Codex | Generated compatibility plugin with `.codex-plugin/plugin.json`; repository marketplace at `.agents/plugins/marketplace.json` | NOT_RUN: real host installation and natural trigger |
| Cursor | Import the packaged skill directory to project `.cursor/skills/` or `.agents/skills/`; add the HTTP MCP URL | NOT_RUN: real host installation and natural trigger |
| Cherry Studio | Settings → MCP → Add → Streamable HTTP URL; optionally Settings → Skills → import the packaged skill folder/ZIP | NOT_RUN: real host installation and natural trigger |

The package's MCP URL is `https://grandet.ai/mcp`. It is a catalogue service, not the model supplier's inference Base URL, and requires no supplier API key. MCP-only installs expose tools; verify the host's natural tool selection and result handling rather than assuming the Skill has also been installed.

For Claude Code, after the public repository has the generated package and release approval, its root `.claude-plugin/marketplace.json` identifies the `plugins/grandet-api-price-finder` git subdirectory. The Codex marketplace uses the corresponding `.agents/plugins/marketplace.json` entry. A GitHub source path must actually exist in the released commit; local validation cannot prove remote installation.

Cursor's install link format is `cursor://anysphere.cursor-deeplink/mcp/install?name=grandet&config=<base64-json>`. Encode a single-server configuration supported by the installed Cursor version, then URL-encode the base64 value. Clicking prompts the user to install; it does not install the Skill. Do not put any key in the link. Prefer the published, tested installation link when available.

Cherry accepts a GitHub `SKILL.md` URL, a ZIP or a skill folder. Import the folder containing `SKILL.md` and its references, not just copied text. Enable the MCP server for the relevant agent/session using the host's normal controls.

`npx skills add` is a candidate distribution route, not yet an accepted installation path. Before advertising it, test discovery in the published repository and ensure generated plugin copies do not create duplicate skill choices. The standalone generated package contains exactly one skill copy.

## Privacy and controls / 隐私与控制

Requests contain model selector, workload proportions or preset, protocol/currency filters, version/time controls and a coarse client/language label; OS is optional. No raw conversation, keys, account IDs or absolute usage is sent by this Skill. Normal HTTP infrastructure may receive an IP address and headers; the service's privacy policy governs its logs. This package makes no claim that infrastructure logs are absent.

V17 page fallback sends a supported relative page path, releaseSet and optional evaluation time instead of board-only parameters. It follows real pagination and model links, does not download the full catalogue, and respects separate bulk authorization. Public page browsing does not have an application-level frequency quota; resource admission still applies.

No profile is read or written by the package builder. The installed Skill uses current conversation facts and does not scan other software's logs. A host may apply its own permissions, execution rules and retention. Anonymous query counts are not unique-user counts.

The statistics feature adds UTC-day aggregates of price-service business requests by coarse host, target and Skill version, using the existing community SQLite store. It does not store models, prompts, keys, IP/device identifiers, client logs or absolute user usage. Missing metadata stays unknown. Only an OWNER may read aggregate JSON/CSV; ordinary lookups remain anonymous. Asynchronous statistics failures do not block lookups and may lose counts. Production deployment is complete. Actual preflight V18 upgrade → V17 rollback → V18 restoration preserved the existing OWNER session, visible review/message history and aggregate JSON/CSV. This was an isolated preflight rollback, not a production rollback or a full private-table audit.

Notices can be ignored. Each ID is shown at most once within a session; the first version does not promise persistent cross-session suppression. Future notices can inform an unchanged Skill about Grandet Personal, but do not install software or add future integration capabilities.

## Package contents and verification

The released plugin directory contains one complete Skill with its references and agent metadata, both host manifests, an anonymous MCP configuration, this README, the selected license text and `package-manifest.json`. The two repository marketplace files refer to that generated directory. A manifest template on its own is not an installable plugin.

`package-manifest.json` lists SHA-256 hashes for the 12 payload files. Check those hashes against the received files before importing a package. Installation does not require the website source, pricing archive, development tests or an internal handoff ZIP. This package contains no credentials and does not run an installer or lifecycle hook.

Actual installation and natural-language triggering remain NOT_RUN for this candidate. Local service tests cover host/target separation, multi-protocol selection and conditional configuration guidance; they do not prove that every catalogue application can load this Skill. `NEEDS_CONNECTION_DETAILS` is a target-configuration result and does not trigger webpage fallback.

## Current official packaging references

Packaging references retained from the 2026-10-12 handoff; this preparation did not reverify these pages. Installed host versions still require acceptance:

- [OpenAI plugin packaging](https://developers.openai.com/plugins/build/plugins): `.codex-plugin/plugin.json` remains a supported compatibility format; portable root `plugin.json`/`mcp.json` is a distinct newer format.
- [Claude marketplace](https://code.claude.com/docs/en/plugin-marketplaces) and [manifest reference](https://code.claude.com/docs/en/plugins-reference).
- [Cursor Skills](https://prod.cursor.com/docs/skills) and [MCP install links](https://prod.cursor.com/docs/mcp/install-links).
- [Cherry Skills](https://www.cherryai.com/docs/en/advanced-basic/extensions/skills/) and [MCP setup](https://www.cherryai.com/docs/en/advanced-basic/extensions/mcp/).

The selected public Skill, plugin files and marketplace descriptors are Apache-2.0. This does not relicense Grandet website code, datasets or separately licensed components.
