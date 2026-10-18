# Connect the chosen offer

Goal: the user's app calls the chosen site with the chosen model. You prepare and write the configuration; the user signs in, tops up, creates the token and types the key on their own machine. Never ask for the key in chat, never print it, never send it anywhere except the chosen site's API address during the check below.

## 1. Collect the facts from the chosen row

- **Site**: `sourceId` (for example `apijing.com`).
- **Group**: `integration.tokenGroup`, or `plan` when it is null. On New API sites the price depends on the token's group, so the user must pick this group when creating the token.
- **Model name**: `integration.model` (or `modelName`), exactly as written.
- **Protocols**: `endpointTypes` (`openai`, `openai-response`, `anthropic`, `gemini`); `integration.endpointType` is the one Grandet matched to the target app.
- **Target app**: the app the user named. If none, ask once: "接到哪个应用？" and query again with that `targetApp`, so the row's `integration` card fits that app.
- The row's `integration` card gives the app's documented `configurationFormat`, `configurationPath`, `docsUrl` and `steps`. In `view=compact`, the row carries `integration.card`, an index into the top-level `integrationCards`; that card's `stepsTemplate` has `{{model}}` and `{{tokenGroup}}` to replace with the row's literal values.

Pick the protocol the target app needs: Codex needs `openai-response`; Claude Code needs `anthropic`; Gemini CLI needs `gemini`; OpenCode, Kilo Code, Continue and most chat apps use `openai`; Hermes takes `openai`, `openai-response` or `anthropic`; OpenClaw takes `openai` or `anthropic`; WorkBuddy takes `openai` or `openai-response`. If the row does not offer it, say so and offer the next row that does.

## 2. Find the API address

Grandet records the address each site declares and returns it on the row:

- `integration.baseUrlMode=BASE`: use `integration.baseUrl` as the **origin**. It is https and on the site's own domain.
- `SUGGESTION`: the declared address is on another domain. Show it and ask the user to confirm it against the site's own docs before using it.
- `INFO_ONLY`: the declared address is not https. Do not use it; use `https://<site>`.
- `NONE` (or no `baseUrl` field on an older service): read `https://<site>/api/status` (read-only GET). On New API sites, `data.server_address` is the declared address. Apply the same rules: https on the same domain is the origin; another domain needs the user's confirmation; `http`, `localhost` or missing means `https://<site>`.

OpenAI-format clients use `<origin>/v1`. Anthropic and Gemini clients use `<origin>` and add their own paths. Do not take an address from a homepage, a group description or a notice.

## 3. What the user does on the site

Tell the user exactly these three steps, then wait:

1. 注册或登录 `https://<site>`。
2. 充值（站点的门槛提示见查价结果）。
3. 新建令牌（API Key）时，分组选「<group>」。

## Use the connect executor (preferred)

This Skill includes a small program, `scripts/connect.mjs`, in the same folder as its `SKILL.md` (needs Node 18 or later). It previews, backs up, writes, checks for free and undoes the connection for **Codex, Claude Code, OpenCode, Kilo Code, Continue, Gemini CLI, Hermes, OpenClaw and WorkBuddy**. Use it instead of editing files by hand. Use the manual steps in sections 4–7 only when Node is missing, the app is not one of these nine, or the executor stops with a code that says to edit by hand.

Below, `CONNECT` stands for `node "<folder of this SKILL.md>/scripts/connect.mjs"`. Fill the values from the row (section 1) and the address rules (section 2). Pass values exactly; quote ones that contain spaces or non-ASCII text.

1. **Preview**, then show the user the diff and notes, and the three steps on the site (section 3):
   `CONNECT preview --app <codex|claude-code|opencode|kilo-code|continue|gemini-cli|hermes|openclaw|workbuddy> --site <sourceId> --base-url <origin> --protocol <protocol> --model <model> --group "<group>"`
   - `baseUrlMode=SUGGESTION`: ask the user to confirm the address first, then add `--confirmed-other-domain`.
   - Codex, OpenCode and Kilo Code have one default model. When a note says `Will change the default model from X to Y` (or `Will set Y as the default model`; `defaultModel` in `--json` and MCP output), tell the user that in one line.
   - The output ends with `plan-hash <hash>`; keep it.
2. **Apply** only after the user agrees: the same options with `apply --yes --plan-hash <hash>`. It backs up the file next to it, writes, and reads it back. If the target app is the app you are running in, run step 4 first and say the change takes effect after a restart.
3. **The user stores the key.** Preview and apply print the exact command (the `Next: The user stores the key…` line; `keyCommand` in `--json` and MCP output), with this Skill's real path filled in. Always give the user that command unchanged, in its own code block, and ask them to run it in their own terminal, where typing is hidden and the key stays on their computer. Never answer with only "store the key locally". Never run it yourself with a key, never pass a key as an argument, and never ask for the key in chat.
4. **Free check:** `CONNECT verify --app <app> --site <sourceId> --base-url <origin> --model <model>`. It lists the models the key can use, without spending credit.
   - `MODEL_LISTED`: the free check passed: the key, the group and the model name match. Tell the user to restart the app (or open a new terminal). Say separately that the first real message spends a little credit, and that you send a test request only if they agree.
   - `MODEL_NOT_LISTED`: the key works but the token is probably in another group; ask the user to check the group is「<group>」.
   - `KEY_REJECTED`: wrong key, expired, or no balance.
   - Never call the free check a working connection. A real request costs credit: send one short request only if the user agrees, after this check passes.
5. **Undo:** `CONNECT restore` undoes the latest connection from its backups (`--app <app>` for a specific app), including the old default model, and prints `Default model back to X`. Add `--delete-key` only if the user wants the stored key removed.

When it stops with a code:

| Code | What to do |
|---|---|
| `PROTOCOL_NOT_SUPPORTED_BY_APP` | The offer does not speak the protocol the app needs; offer the next row that does |
| `BASE_URL_OTHER_DOMAIN` | Ask the user to confirm the address, then add `--confirmed-other-domain` |
| `BASE_URL_NOT_HTTPS` | Use `https://<site>` |
| `COMMENTS_PRESENT`, `COMPLEX_TOML`, `COMPLEX_YAML`, `INVALID_JSON` | The file cannot be rewritten safely; use the manual steps below for this app |
| `PLAN_CHANGED` | The file changed since the preview; preview again |
| `CHANGED_SINCE_APPLY` | The user edited the file after Grandet wrote it; ask before adding `--force` to restore |
| `KEY_NOT_STORED`, `NOT_CONNECTED_YET` | Do the steps in order: apply, then the user stores the key, then verify |

If the app can use MCP but you cannot run commands, the same executor runs as a local MCP server: `node "<folder of this SKILL.md>/scripts/connect-mcp.mjs"` (stdio). Its tools are `grandet_connect_preview`, `grandet_connect_apply` (pass `confirmed: true` only after the user agrees, plus the preview `planHash`), `grandet_connect_verify` and `grandet_connect_restore`. Adding it to the app's MCP settings is a one-time step for the user. The key is still stored by the user with the `key` command above.

## 4. The user stores the key locally (manual)

The key is kept in a file only the user can read and exported as an environment variable. The user runs one command in their own terminal; it does not show the key while typing. Name the variable `GRANDET_<SITE>_KEY`, with the site in upper case and every non-letter or digit replaced by `_` (for example `GRANDET_APIJING_COM_KEY`). Replace `<site>`, `<VAR>` and the profile file (`~/.zshrc` for zsh, `~/.bashrc` for bash) before showing the command.

macOS / Linux:

```sh
mkdir -p ~/.grandet/keys && chmod 700 ~/.grandet/keys && printf 'API Key: ' && IFS= read -rs K && echo && (umask 077; printf '%s' "$K" > ~/.grandet/keys/<site>) && chmod 600 ~/.grandet/keys/<site> && unset K && echo 'export <VAR>="$(cat ~/.grandet/keys/<site>)"  # grandet:<site>' >> ~/.zshrc
```

`read -rs` hides the typing in bash and zsh and needs no terminal reset. Before giving this command, note whether the profile file already exists, so undo can put it back exactly.

Windows PowerShell:

```powershell
$d="$HOME\.grandet\keys"; New-Item -ItemType Directory -Force $d | Out-Null; $s=Read-Host 'API Key' -AsSecureString; $k=[Runtime.InteropServices.Marshal]::PtrToStringBSTR([Runtime.InteropServices.Marshal]::SecureStringToBSTR($s)); Set-Content -NoNewline -Path "$d\<site>" -Value $k; [Environment]::SetEnvironmentVariable('<VAR>',$k,'User'); Remove-Variable k,s
```

New terminals and newly started apps see the variable. Ask the user to say "好了" when done.

## 5. Write the configuration (manual)

For every file: read the current content, show the user the exact lines you will add or change, copy the file to `<file>.grandet-backup-<YYYYMMDD-HHMMSS>`, and write only after the user confirms. Keep every other setting. Use a provider ID made from the site (for example `apijing`). On Windows, `~` is `%USERPROFILE%`.

**Codex** (`openai-response` only) — `~/.codex/config.toml`:

```toml
model = "<modelName>"
model_provider = "<id>"

[model_providers.<id>]
name = "<site>"
base_url = "<origin>/v1"
wire_api = "responses"
env_key = "<VAR>"
```

**Claude Code** (`anthropic`) — `~/.claude/settings.json`, merged into the existing JSON:

```json
{
  "env": { "ANTHROPIC_BASE_URL": "<origin>", "ANTHROPIC_MODEL": "<modelName>" },
  "apiKeyHelper": "cat ~/.grandet/keys/<site>"
}
```

On Windows, leave out `apiKeyHelper` and have the user also run `[Environment]::SetEnvironmentVariable('ANTHROPIC_AUTH_TOKEN',(Get-Content -Raw "$HOME\.grandet\keys\<site>"),'User')`.

**OpenCode** — `~/.config/opencode/opencode.jsonc` if it exists, otherwise `opencode.json`; **Kilo Code** — `~/.config/kilo/kilo.jsonc` (or an existing `kilo.json`), same shape. The key stays in the Grandet key file, read through `{file:…}` with its full path, so the config never holds it. `model` makes this the default model: tell the user, and say undo restores the old one.

```json
{
  "$schema": "https://opencode.ai/config.json",
  "model": "grandet-<site>/<modelName>",
  "provider": {
    "grandet-<site>": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "<site> (Grandet)",
      "options": { "baseURL": "<origin>/v1", "apiKey": "{file:<home>/.grandet/keys/<site>}" },
      "models": { "<modelName>": { "name": "<modelName>" } }
    }
  }
}
```

Use `"npm": "@ai-sdk/openai"` instead when connecting through `openai-response`.

**Continue** — add one entry to `models` in `~/.continue/config.yaml`; Continue keeps the key in this file, so write the placeholder and ask the user to replace it themselves:

```yaml
  - name: <site> <modelName>
    provider: openai
    model: <modelName>
    apiBase: <origin>/v1
    apiKey: PASTE_YOUR_KEY_HERE
```

**Gemini CLI** (`gemini`) — add `GOOGLE_GEMINI_BASE_URL=<origin>` and `GEMINI_MODEL=<modelName>` to `~/.env`, and have the user put the key in the same file as `GEMINI_API_KEY=` (it reads `GEMINI_API_KEY`, not `<VAR>`).

**Hermes** — `~/.hermes/config.yaml` (`$HERMES_HOME` if set; `%LOCALAPPDATA%\hermes` on Windows). Add a named provider and point `model` at it; remove `base_url`, `api_key`, `key_env` and `key_cmd` from `model` so the named provider is used. `transport` is `chat_completions` for `openai`, `codex_responses` for `openai-response`, `anthropic_messages` for `anthropic` (then `api: <origin>`). Write the full path of the key file. On Windows use `key_env: <VAR>` instead of `key_cmd`. Restart Hermes afterwards.

```yaml
providers:
  grandet-<site>:
    api: <origin>/v1
    key_cmd: "cat '<home>/.grandet/keys/<site>'"
    transport: chat_completions
    default_model: <modelName>
model:
  default: <modelName>
  provider: custom:grandet-<site>
```

**OpenClaw** — `~/.openclaw/openclaw.json` (`$OPENCLAW_CONFIG_PATH` if set). The key stays in the Grandet key file and OpenClaw reads it through a file SecretRef, so the file never holds the key. Use `api: anthropic-messages` and `baseUrl: <origin>` for `anthropic`. Write the full path of the key file. Restart the OpenClaw gateway afterwards (`openclaw gateway restart`).

```json
{
  "secrets": { "providers": { "grandet-<site>": { "source": "file", "path": "<home>/.grandet/keys/<site>", "mode": "singleValue" } } },
  "models": { "mode": "merge", "providers": { "grandet-<site>": {
    "baseUrl": "<origin>/v1", "api": "openai-completions",
    "apiKey": { "source": "file", "provider": "grandet-<site>", "id": "value" },
    "models": [{ "id": "<modelName>", "name": "<modelName>" }] } } },
  "agents": { "defaults": { "model": { "primary": "grandet-<site>/<modelName>" } } }
}
```

**WorkBuddy** (also the CodeBuddy CLI) — `~/.codebuddy/models.json`; the app reloads it. Add one entry to `models`; `url` is the full path for `openai` (`<origin>/v1/chat/completions`), or `<origin>/v1` with `"api": "openai-responses"`. If the file has `availableModels`, add the model there too; never create that list, it would hide every other model. If an entry with the same `id` already exists, ask the user before changing it. The key goes into `apiKey`; ask the user to paste it into the file themselves, and keep the file readable by them only.

```json
{"models": [{"id": "<modelName>", "name": "<modelName> (<site>)", "vendor": "<site> (Grandet)",
  "apiKey": "PASTE_YOUR_KEY_HERE", "url": "<origin>/v1/chat/completions", "supportsToolCall": true}]}
```

**Scripts and OpenAI-compatible SDKs** — `OPENAI_BASE_URL=<origin>/v1` and `OPENAI_API_KEY` from `<VAR>`.

**Other apps**: give the field card below and the app's documentation link from the [app catalogue](app-catalog.md); the user fills it in the app's own settings.

- Cline, TRAE, Cherry Studio, Chatbox: settings in the app (OpenAI format; TRAE, Cherry Studio and Chatbox also take Anthropic). Do not use `cline auth -k`: it takes the key as a command argument.
- Cursor: only the app's "Override OpenAI Base URL" setting; Grandet has not checked it with relays.
- Windsurf (renamed Devin Desktop on 2026-06-02): no documented way to set an API address, so a relay cannot be connected. Say so.
- Roo Code: shut down on 2026-05-15. Suggest Cline or Kilo Code instead.

If you can edit an app's config file and its official documentation gives the exact format, you may write it with the same preview, backup and confirmation.

```text
应用 / App: <target app>
协议 / Protocol: <protocol>
API 地址 / Base URL: <origin>/v1 (OpenAI format) or <origin> (Anthropic/Gemini)
模型 / Model: <modelName>
Key: 在应用里本地填写 / enter it in the app yourself
```

## 6. Check it without spending credit

List the models the token can use. This uses no credit on New API sites and shows whether the key, the group and the model name are right. Print only the status code and whether the model is in the list.

macOS / Linux:

```sh
f=$(mktemp) && printf 'header = "Authorization: Bearer %s"\n' "$(cat ~/.grandet/keys/<site>)" | curl -sS -K - -o "$f" -w '%{http_code}\n' '<origin>/v1/models'; python3 -c 'import json,sys; print(sys.argv[2] in [m.get("id") for m in json.load(open(sys.argv[1])).get("data", [])])' "$f" '<modelName>'; rm -f "$f"
```

The key goes to curl through standard input, so it never appears in the command line or the process list. Never write a key into a curl argument, a URL or a command you show in chat.

Windows PowerShell:

```powershell
$k=Get-Content -Raw "$HOME\.grandet\keys\<site>"; $r=Invoke-RestMethod -Uri '<origin>/v1/models' -Headers @{Authorization="Bearer $k"}; Remove-Variable k; $r.data.id -contains '<modelName>'
```

- 200 and the model is listed: the free check passed. Tell the user to restart the app (or open a new terminal), and say separately that the first real message spends a little credit.
- 401 or 403: the key is wrong or has no balance. Model missing: the token is probably in another group; ask the user to check the group is「<group>」.
- A real request costs credit. Send one short request only if the user agrees, and only after the free check passes.
- A group locked to one client (for example "仅限 CC") may still reject other apps on a real request; only connect it to that client.

If the target app is the app you are running in, finish this check **before** writing its configuration, and say the change takes effect after a restart.

## 7. Undo

"恢复 / undo": prefer `CONNECT restore`, which puts every file back byte for byte. By hand: copy the latest `<file>.grandet-backup-*` back; if a file did not exist before, delete it; remove the profile line ending with `# grandet:<site>` (or delete the profile if Grandet created it); and tell the user the key file `~/.grandet/keys/<site>` can be deleted. On Windows, also remove the user environment variable. If a backup could not be made, say so before writing, never after.

## When you cannot reach the user's computer

Cloud chats, web apps and bots cannot edit the user's files: a cloud computer's home folder is not the user's. Do not hand-write profile edits or `curl` commands with the key. Instead give the user these commands to run in their own terminal. They download this Skill and use the same connect executor, so the preview, backup, hidden key input, free check and exact undo all work. Fill in the values from the chosen row, as in "Use the connect executor" above. Needs Node 18 or later; if the user has no Node, give the field card below and the app's documentation link.

macOS / Linux:

```sh
mkdir -p ~/.grandet && curl -fsSL -o ~/.grandet/grandet-skill.zip 'https://github.com/hanzohanzhe/Grandet/releases/download/skill-v0.3.0-build.20261018b/grandet-api-price-finder-0.3.0.skill' && (unzip -oq ~/.grandet/grandet-skill.zip -d ~/.grandet || python3 -m zipfile -e ~/.grandet/grandet-skill.zip ~/.grandet)
node ~/.grandet/grandet-api-price-finder/scripts/connect.mjs preview --app <app> --site <sourceId> --base-url <origin> --protocol <protocol> --model <model> --group "<group>"
```

Windows PowerShell:

```powershell
$g="$HOME\.grandet"; New-Item -ItemType Directory -Force $g | Out-Null; Invoke-WebRequest -UseBasicParsing -OutFile "$g\grandet-skill.zip" 'https://github.com/hanzohanzhe/Grandet/releases/download/skill-v0.3.0-build.20261018b/grandet-api-price-finder-0.3.0.skill'; Expand-Archive -Force "$g\grandet-skill.zip" $g
node "$HOME\.grandet\grandet-api-price-finder\scripts\connect.mjs" preview --app <app> --site <sourceId> --base-url <origin> --protocol <protocol> --model <model> --group "<group>"
```

If the user is in mainland China, or the GitHub download fails, give this first line instead. It downloads the same kit from Tencent SkillHub, whose archive has no top folder, so it extracts into the folder itself; the `node` line stays the same.

```sh
mkdir -p ~/.grandet/grandet-api-price-finder && curl -fsSL -o ~/.grandet/grandet-skill.zip 'https://api.skillhub.cn/api/v1/download?slug=grandet-api-price-finder&version=0.3.0-build.20261018.2' && (unzip -oq ~/.grandet/grandet-skill.zip -d ~/.grandet/grandet-api-price-finder || python3 -m zipfile -e ~/.grandet/grandet-skill.zip ~/.grandet/grandet-api-price-finder)
```

```powershell
$g="$HOME\.grandet"; New-Item -ItemType Directory -Force "$g\grandet-api-price-finder" | Out-Null; Invoke-WebRequest -UseBasicParsing -OutFile "$g\grandet-skill.zip" 'https://api.skillhub.cn/api/v1/download?slug=grandet-api-price-finder&version=0.3.0-build.20261018.2'; Expand-Archive -Force "$g\grandet-skill.zip" "$g\grandet-api-price-finder"
```

Then tell the user, in order:

1. Read the change the preview shows. To write it, run the same command with `apply --yes --plan-hash <the plan-hash the preview printed>` in place of `preview`.
2. Run the key command the preview printed (the `Next: The user stores the key…` line). Typing is hidden and the key stays on their computer.
3. Run the same command with `verify` in place of `preview`. It checks for free; `MODEL_LISTED` means the key, group and model name match. The first real message spends credit.
4. To undo, run `node ~/.grandet/grandet-api-price-finder/scripts/connect.mjs restore`.

For an app the executor does not support, give the field card from section 5 and the app's documentation link. Say the setup is waiting for the user. Do not say it is connected.
