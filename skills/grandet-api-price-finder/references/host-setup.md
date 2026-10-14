# Connection guidance on request

The price finder only explains setup. The user enters their key directly into their own client. Never read or request a key, edit settings, switch a provider or send a paid test call.

Use the selected row's `integration` card for the target app, actual inference profile, protocol, configuration format and documentation. Use the alternative's own card if the user chooses it; a multi-protocol app may have different profiles for the two suppliers. Read the relevant [app catalogue](app-catalog.md) entry when context is needed. Catalogue definitions, supplier protocol declarations and real-host acceptance are distinct facts.

The card includes `appId`, `appName`, `profileId`, `endpointType`, `profileStatus`, `configurationFormat`, `docsUrl`, `platforms`, `versionContract`, `profileOptions`, `conditional`, `baseUrl`, `model` and `steps`. Platform/version declarations constrain guidance; do not display their internal symbols in an ordinary recommendation.

| profileStatus | Setup interpretation |
|---|---|
| SELECTED | Use the one selected inference profile and its documentation |
| VARIANT_OPTIONS | Several profiles share this protocol; profileId is null. Match a known edition, platform or CLI/IDE mode to returned profileOptions. If unknown, give the protocol and the relevant variant documentation; do not silently choose CN/INTL or demand an extra profile answer |
| EXPLICIT_PROTOCOL_ONLY | The user specified a protocol, but this app's inference route is unverified; give a generic conditional protocol card |
| GENERIC_PROTOCOL | Give generic guidance for the returned protocol without claiming an app-specific integration |

Each profileOptions entry has its own `id`, `configurationFormat`, `docsUrl`, `platforms` and `versionContract`. A null profileId alone is not evidence that every app route is unsupported. Configuration format and app documentation are guidance, not an executable instruction to change a user profile.

Use the card's `configurationFormat` to explain the actual configuration route: launch environment variables, the indicated JSON/JSONC/TOML file, a GUI provider form, or documented custom steps. A CLI environment route must not become an invented GUI settings page. Use current official app instructions for exact version details when necessary. Model protocol compatibility is separate from the MCP connection used to query Grandet. Cursor/Windsurf's MCP capability cannot supply a missing inference profile. A `PRICE_ONLY_UNVERIFIED_APP_ROUTE` result or `integration.compatibility=UNVERIFIED` permits price selection only; keep the target, link relevant documentation and say setup is pending verification. Do not invent app-specific fields or demand a protocol just to fill a catalogue gap. If `scope.application.status=NEEDS_CONNECTION_DETAILS` reports a known constraint, follow its short next step rather than inventing a connection card.

For the API Base URL, use only a structured supplier declaration from the returned quote/evidence; a website homepage or app documentation URL is not an API URL. `integration.baseUrl=null` means no verified base URL was supplied: show the supplier instructions instead. If Grandet provides a prefill classification, follow it:

| Mode | Permitted field card |
|---|---|
| BASE | Show the declared HTTPS base address as the suggested value |
| SUGGESTION | Show the declared address and note that it is a different domain; let the user confirm |
| INFO_ONLY | Show as information, not a usable recommended connection value |
| NONE / missing | Link the supplier's instructions; do not construct an address |

These modes originate in Grandet's declared-endpoint rules; do not claim the board API returns them unless the actual response does. Without classification, use evidence to confirm HTTPS, declared provenance and domain relationship; if these are unavailable, give documentation rather than inventing the classification. Do not append `/v1`, `/responses` or `/messages` unless the supplier's instructions establish that exact base-address convention.

Show a plain field card rather than an executable config edit:

```text
Client / 客户端: <the user's target client>
Connection / 接入方式: <selected row's actual profile/configuration guidance>
Protocol / 协议: <declared compatible protocol>
API Base URL: <verified declared base URL, or see supplier instructions>
Model / 模型: <exact provider model name>
API Key: <enter locally in your client / 请在客户端本地填写>
```

When the user already has a compatible client, help them use it. Grandet Personal will later handle ongoing key management, routing and measured speed/quality; do not require it for this lookup or advertise unreleased integration as available.

When a returned card is conditional, has `compatibility=UNVERIFIED`, or the application result is `EXPLICIT_PROTOCOL_UNVERIFIED_APP_ROUTE`, explain the relevant condition briefly. A legacy explicit protocol filter does not prove that the app can use that connection. Keep actionable app and supplier documentation links separate; do not present generated steps as permission to write real settings.
