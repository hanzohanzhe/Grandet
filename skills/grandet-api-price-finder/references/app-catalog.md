# App catalog / 应用清单

Generated from one shared application capability catalog. / 从统一应用能力目录生成。

16 named applications + 6 generic templates; 29 inference profiles. / 16 个具名应用、6 个通用模板、29 个推理配置。

An application may be the lookup entrypoint, the API target, or both. These are request roles, not parallel product lists. / 同一应用可以是查价入口、API 使用目标或两者；这是请求角色，不是两套产品名单。

Entry routes are documented or unknown, never assumed from desktop control registration. UNKNOWN means unrecorded capability, not unsupported. / 入口能力依资料标为 DOCUMENTED 或 UNKNOWN；UNKNOWN 是尚未登记，不代表不支持。

Legacy kind records the desktop source category. Legacy mcp and desktopControl.mcpStdioRegistered describe local desktop stdio control only; they do not prove remote HTTP MCP, Skill installation or inference support. / 旧 kind 是桌面来源分类；旧 mcp 和 desktopControl.mcpStdioRegistered 仅表示桌面本地 stdio 控制登记，不证明远程 HTTP MCP、Skill 安装或推理能力。

This catalog does not mark host tests complete by listing an application. Consult the per-capability validation records. / 列入清单不代表已完成宿主实测，请按具体能力查看验收记录。

Capability validation / 能力验收: NOT_RUN: 35; PASS: 0; FAIL: 0

| App / 应用 | ID | Entity / 身份 | Setup / 支持方式 | Default / 默认场景 | Price finder entry / 比价入口 | Inference profiles / 推理配置 |
| --- | --- | --- | --- | --- | --- | --- |
| Claude Code | `claude-code` | APPLICATION | ADAPTER | coding | `SKILL_PLUGIN` (NOT_RUN) | `anthropic-messages` |
| OpenCode | `opencode` | APPLICATION | ADAPTER | coding | UNKNOWN / 待核实 | `openai-chat-completions`, `openai-responses` |
| Codex | `codex` | APPLICATION | ADAPTER | coding | `SKILL_PLUGIN` (NOT_RUN) | `openai-responses` |
| Cursor | `cursor` | APPLICATION | ADAPTER | coding | `SKILL_DIRECTORY` (NOT_RUN), `MCP_HTTP` (NOT_RUN) | — |
| Gemini CLI | `gemini-cli` | APPLICATION | ADAPTER | coding | UNKNOWN / 待核实 | `gemini-native` |
| Windsurf | `windsurf` | APPLICATION | ADAPTER | coding | UNKNOWN / 待核实 | — |
| Cline | `cline` | APPLICATION | ADAPTER | coding | UNKNOWN / 待核实 | `openai-chat-completions` |
| Hermes | `hermes` | APPLICATION | ADAPTER | chat | UNKNOWN / 待核实 | `openai-chat-completions`, `openai-responses`, `anthropic-messages` |
| OpenClaw | `openclaw` | APPLICATION | ADAPTER | chat | UNKNOWN / 待核实 | `openai-chat-completions`, `openai-responses`, `anthropic-messages`, `gemini-native` |
| WorkBuddy | `workbuddy` | APPLICATION | ADAPTER | coding | UNKNOWN / 待核实 | `cn-desktop-openai-chat-completions`, `intl-desktop-openai-chat-completions` |
| Trae | `trae` | APPLICATION | ADAPTER | coding | UNKNOWN / 待核实 | `cn-ide-openai-chat-completions`, `cn-ide-anthropic-messages`, `intl-ide-openai-chat-completions`, `intl-ide-anthropic-messages` |
| Kilo Code | `kilo-code` | APPLICATION | ADAPTER | coding | UNKNOWN / 待核实 | `openai-chat-completions`, `vscode-openai-chat-completions` |
| Continue | `continue` | APPLICATION | ADAPTER | coding | UNKNOWN / 待核实 | `vscode-openai-chat-completions` |
| OpenAI Chat Completions client | `openai-chat-completions-client` | TEMPLATE | TEMPLATE | chat | UNKNOWN / 待核实 | `openai-chat-completions` |
| OpenAI Responses client | `openai-responses-client` | TEMPLATE | TEMPLATE | chat | UNKNOWN / 待核实 | `openai-responses` |
| Anthropic Messages client | `anthropic-messages-client` | TEMPLATE | TEMPLATE | chat | UNKNOWN / 待核实 | `anthropic-messages` |
| Gemini Native client | `gemini-native-client` | TEMPLATE | TEMPLATE | chat | UNKNOWN / 待核实 | `gemini-native` |
| Generic CLI | `generic-cli` | TEMPLATE | TEMPLATE | chat | UNKNOWN / 待核实 | — |
| Generic MCP client | `generic-mcp` | TEMPLATE | TEMPLATE | chat | UNKNOWN / 待核实 | — |
| Roo Code | `roo-code` | APPLICATION | GUIDE | coding | UNKNOWN / 待核实 | `openai-chat-completions` |
| Cherry Studio | `cherry-studio` | APPLICATION | GUIDE | chat | `SKILL_DIRECTORY` (NOT_RUN), `MCP_HTTP` (NOT_RUN) | `openai-chat-completions` |
| Chatbox | `chatbox` | APPLICATION | GUIDE | chat | UNKNOWN / 待核实 | `openai-chat-completions` |

## Profile details / 配置详情

Configuration fields come from the selected inference profile. Internal secret-reference placeholders and unrelated MCP fields are omitted. Manual guides have no fabricated file paths. / 配置字段来自选定推理配置，过滤内部密钥引用占位和无关 MCP 字段；手动指南不编造文件路径。

| App ID | Profile ID | Endpoint | Format | Path / 路径 | Fields / 字段 | Platforms / 平台 | Version / 版本 | Conditional / 条件 | Validation / 验收 | Docs / 文档 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `claude-code` | `anthropic-messages` | `anthropic` | `LAUNCH_ENVIRONMENT` | — | `ANTHROPIC_BASE_URL`, `ANTHROPIC_MODEL` | WINDOWS, MACOS, LINUX | `SEMVER_ANY_V1` | no / 否 | NOT_RUN | [Docs / 文档](https://code.claude.com/docs/en/llm-gateway-connect) |
| `opencode` | `openai-chat-completions` | `openai` | `JSONC` | `opencode.jsonc` | `model`, `provider.grandet` | WINDOWS, MACOS, LINUX | `SEMVER_ANY_V1` | no / 否 | NOT_RUN | [Docs / 文档](https://opencode.ai/docs/providers/) |
| `opencode` | `openai-responses` | `openai-response` | `JSONC` | `opencode.jsonc` | `model`, `provider.grandet` | WINDOWS, MACOS, LINUX | `SEMVER_ANY_V1` | no / 否 | NOT_RUN | [Docs / 文档](https://opencode.ai/docs/providers/) |
| `codex` | `openai-responses` | `openai-response` | `TOML` | `.codex/config.toml` | `model`, `model_provider`, `model_providers.grandet` | WINDOWS, MACOS, LINUX | `SEMVER_ANY_V1` | no / 否 | NOT_RUN | [Docs / 文档](https://developers.openai.com/codex/config-reference/) |
| `gemini-cli` | `gemini-native` | `gemini` | `LAUNCH_ENVIRONMENT` | — | `GOOGLE_GEMINI_BASE_URL`, `GEMINI_MODEL` | WINDOWS, MACOS, LINUX | `SEMVER_ANY_V1` | no / 否 | NOT_RUN | [Docs / 文档](https://geminicli.com/docs/get-started/configuration/) |
| `cline` | `openai-chat-completions` | `openai` | `LAUNCH_ENVIRONMENT` | — | `OPENAI_BASE_URL`, `OPENAI_MODEL` | WINDOWS, MACOS, LINUX | `SEMVER_ANY_V1` | no / 否 | NOT_RUN | [Docs / 文档](https://docs.cline.bot/provider-config/openai-compatible) |
| `hermes` | `openai-chat-completions` | `openai` | `YAML` | `.hermes/config.yaml` | `providers.grandet` | WINDOWS, MACOS, LINUX | `SEMVER_ANY_V1` | no / 否 | NOT_RUN | [Docs / 文档](https://github.com/NousResearch/hermes-agent) |
| `hermes` | `openai-responses` | `openai-response` | `YAML` | `.hermes/config.yaml` | `providers.grandet` | WINDOWS, MACOS, LINUX | `SEMVER_ANY_V1` | no / 否 | NOT_RUN | [Docs / 文档](https://github.com/NousResearch/hermes-agent) |
| `hermes` | `anthropic-messages` | `anthropic` | `YAML` | `.hermes/config.yaml` | `providers.grandet` | WINDOWS, MACOS, LINUX | `SEMVER_ANY_V1` | no / 否 | NOT_RUN | [Docs / 文档](https://github.com/NousResearch/hermes-agent) |
| `openclaw` | `openai-chat-completions` | `openai` | `JSON` | `.openclaw/openclaw.json` | `agents.defaults.model.primary`, `models.providers.grandet` | WINDOWS, MACOS, LINUX | `SEMVER_ANY_V1` | no / 否 | NOT_RUN | [Docs / 文档](https://docs.openclaw.ai/) |
| `openclaw` | `openai-responses` | `openai-response` | `JSON` | `.openclaw/openclaw.json` | `agents.defaults.model.primary`, `models.providers.grandet` | WINDOWS, MACOS, LINUX | `SEMVER_ANY_V1` | no / 否 | NOT_RUN | [Docs / 文档](https://docs.openclaw.ai/) |
| `openclaw` | `anthropic-messages` | `anthropic` | `JSON` | `.openclaw/openclaw.json` | `agents.defaults.model.primary`, `models.providers.grandet` | WINDOWS, MACOS, LINUX | `SEMVER_ANY_V1` | no / 否 | NOT_RUN | [Docs / 文档](https://docs.openclaw.ai/) |
| `openclaw` | `gemini-native` | `gemini` | `JSON` | `.openclaw/openclaw.json` | `agents.defaults.model.primary`, `models.providers.grandet` | WINDOWS, MACOS, LINUX | `SEMVER_ANY_V1` | no / 否 | NOT_RUN | [Docs / 文档](https://docs.openclaw.ai/) |
| `workbuddy` | `cn-desktop-openai-chat-completions` | `openai` | `GUI_FIELDS` | — | `OPENAI_BASE_URL`, `OPENAI_MODEL` | WINDOWS, MACOS | `WORKBUDDY_CN_4_7_V1` | no / 否 | NOT_RUN | [Docs / 文档](https://www.codebuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Model) |
| `workbuddy` | `intl-desktop-openai-chat-completions` | `openai` | `GUI_FIELDS` | — | `OPENAI_BASE_URL`, `OPENAI_MODEL` | WINDOWS, MACOS | `SEMVER_ANY_V1` | yes / 是 | NOT_RUN | [Docs / 文档](https://www.codebuddy.ai/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Model) |
| `trae` | `cn-ide-openai-chat-completions` | `openai` | `GUI_FIELDS` | — | `OPENAI_BASE_URL`, `OPENAI_MODEL` | WINDOWS, MACOS | `SEMVER_ANY_V1` | yes / 是 | NOT_RUN | [Docs / 文档](https://docs.trae.cn/ide_models) |
| `trae` | `cn-ide-anthropic-messages` | `anthropic` | `GUI_FIELDS` | — | `ANTHROPIC_BASE_URL`, `ANTHROPIC_MODEL` | WINDOWS, MACOS | `SEMVER_ANY_V1` | yes / 是 | NOT_RUN | [Docs / 文档](https://docs.trae.cn/ide_models) |
| `trae` | `intl-ide-openai-chat-completions` | `openai` | `GUI_FIELDS` | — | `OPENAI_BASE_URL`, `OPENAI_MODEL` | WINDOWS, MACOS | `SEMVER_ANY_V1` | yes / 是 | NOT_RUN | [Docs / 文档](https://docs.trae.ai/ide/models) |
| `trae` | `intl-ide-anthropic-messages` | `anthropic` | `GUI_FIELDS` | — | `ANTHROPIC_BASE_URL`, `ANTHROPIC_MODEL` | WINDOWS, MACOS | `SEMVER_ANY_V1` | yes / 是 | NOT_RUN | [Docs / 文档](https://docs.trae.ai/ide/models) |
| `kilo-code` | `openai-chat-completions` | `openai` | `JSONC` | `.config/kilo/kilo.jsonc` | `model`, `provider.grandet` | WINDOWS, MACOS, LINUX | `SEMVER_ANY_V1` | no / 否 | NOT_RUN | [Docs / 文档](https://kilo.ai/docs/getting-started/settings) |
| `kilo-code` | `vscode-openai-chat-completions` | `openai` | `JSONC` | `.config/kilo/kilo.jsonc` | `model`, `provider.grandet` | WINDOWS, MACOS, LINUX | `SEMVER_ANY_V1` | yes / 是 | NOT_RUN | [Docs / 文档](https://kilo.ai/docs/code-with-ai/agents/custom-models) |
| `continue` | `vscode-openai-chat-completions` | `openai` | `YAML` | `.continue/config.yaml` | `models.Grandet` | WINDOWS, MACOS, LINUX | `SEMVER_ANY_V1` | yes / 是 | NOT_RUN | [Docs / 文档](https://docs.continue.dev/reference) |
| `openai-chat-completions-client` | `openai-chat-completions` | `openai` | `LAUNCH_ENVIRONMENT` | — | `OPENAI_BASE_URL`, `OPENAI_MODEL` | WINDOWS, MACOS, LINUX | `SEMVER_ANY_V1` | no / 否 | NOT_RUN | [Docs / 文档](https://platform.openai.com/docs/api-reference/chat) |
| `openai-responses-client` | `openai-responses` | `openai-response` | `LAUNCH_ENVIRONMENT` | — | `OPENAI_BASE_URL`, `OPENAI_MODEL` | WINDOWS, MACOS, LINUX | `SEMVER_ANY_V1` | no / 否 | NOT_RUN | [Docs / 文档](https://platform.openai.com/docs/api-reference/responses) |
| `anthropic-messages-client` | `anthropic-messages` | `anthropic` | `LAUNCH_ENVIRONMENT` | — | `ANTHROPIC_BASE_URL`, `ANTHROPIC_MODEL` | WINDOWS, MACOS, LINUX | `SEMVER_ANY_V1` | no / 否 | NOT_RUN | [Docs / 文档](https://docs.anthropic.com/en/api/messages) |
| `gemini-native-client` | `gemini-native` | `gemini` | `LAUNCH_ENVIRONMENT` | — | `GOOGLE_GEMINI_BASE_URL`, `GEMINI_MODEL` | WINDOWS, MACOS, LINUX | `SEMVER_ANY_V1` | no / 否 | NOT_RUN | [Docs / 文档](https://ai.google.dev/api/generate-content) |
| `roo-code` | `openai-chat-completions` | `openai` | `MANUAL_GUIDE` | — | — | unspecified / 未指定 | unspecified / 未指定 | yes / 是 | NOT_RUN | [Docs / 文档](https://roocodeinc.github.io/Roo-Code/providers/openai-compatible/) |
| `cherry-studio` | `openai-chat-completions` | `openai` | `MANUAL_GUIDE` | — | — | unspecified / 未指定 | unspecified / 未指定 | yes / 是 | NOT_RUN | [Docs / 文档](https://docs.cherryai.com.cn/docs/en-us/pre-basic/providers/zi-ding-yi-fu-wu-shang) |
| `chatbox` | `openai-chat-completions` | `openai` | `MANUAL_GUIDE` | — | — | unspecified / 未指定 | unspecified / 未指定 | yes / 是 | NOT_RUN | [Docs / 文档](https://docs.chatboxai.app/en/guides/providers) |

## Sources / 来源

| App ID | Adapter binding / 适配器绑定 | Documentation / 文档 |
| --- | --- | --- |
| `claude-code` | `claude-code` | [1](https://docs.anthropic.com/en/docs/claude-code/mcp), [2](https://code.claude.com/docs/en/llm-gateway-connect), [3](https://code.claude.com/docs/en/plugin-marketplaces), [4](https://code.claude.com/docs/en/plugins-reference) |
| `opencode` | `opencode` | [1](https://opencode.ai/docs/providers/) |
| `codex` | `codex` | [1](https://developers.openai.com/codex/config-reference/), [2](https://developers.openai.com/plugins/build/plugins) |
| `cursor` | `cursor` | [1](https://docs.cursor.com/context/model-context-protocol), [2](https://prod.cursor.com/docs/skills), [3](https://prod.cursor.com/docs/mcp/install-links) |
| `gemini-cli` | `gemini-cli` | [1](https://geminicli.com/docs/get-started/configuration/) |
| `windsurf` | `windsurf` | [1](https://docs.windsurf.com/windsurf/cascade/mcp) |
| `cline` | `cline` | [1](https://docs.cline.bot/mcp/configuring-mcp-servers), [2](https://docs.cline.bot/provider-config/openai-compatible) |
| `hermes` | `hermes` | [1](https://github.com/NousResearch/hermes-agent) |
| `openclaw` | `openclaw` | [1](https://docs.openclaw.ai/) |
| `workbuddy` | `workbuddy` | [1](https://www.codebuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Model), [2](https://www.codebuddy.ai/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Model), [3](https://www.codebuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/MCP-Guide) |
| `trae` | `trae` | [1](https://docs.trae.cn/ide_models), [2](https://docs.trae.ai/ide/models), [3](https://docs.trae.cn/ide_add-mcp-servers), [4](https://docs.trae.ai/ide/add-mcp-servers), [5](https://docs.trae.cn/cli_config-file) |
| `kilo-code` | `kilo-code` | [1](https://kilo.ai/docs/getting-started/settings), [2](https://kilo.ai/docs/code-with-ai/agents/custom-models), [3](https://kilo.ai/docs/ai-providers/openai-compatible) |
| `continue` | `continue` | [1](https://docs.continue.dev/reference) |
| `openai-chat-completions-client` | `openai-chat-completions-client` | [1](https://platform.openai.com/docs/api-reference/chat) |
| `openai-responses-client` | `openai-responses-client` | [1](https://platform.openai.com/docs/api-reference/responses) |
| `anthropic-messages-client` | `anthropic-messages-client` | [1](https://docs.anthropic.com/en/api/messages) |
| `gemini-native-client` | `gemini-native-client` | [1](https://ai.google.dev/api/generate-content) |
| `generic-cli` | `generic-cli` | [1](https://grandet.ai/docs/client-adapters/generic-cli) |
| `generic-mcp` | `generic-mcp` | [1](https://modelcontextprotocol.io/docs/learn/client-concepts) |
| `roo-code` | `openai-chat-completions-client` | [1](https://roocodeinc.github.io/Roo-Code/providers/openai-compatible/), [2](https://platform.openai.com/docs/api-reference/chat) |
| `cherry-studio` | `openai-chat-completions-client` | [1](https://docs.cherryai.com.cn/docs/en-us/pre-basic/providers/zi-ding-yi-fu-wu-shang), [2](https://platform.openai.com/docs/api-reference/chat), [3](https://www.cherryai.com/docs/en/advanced-basic/extensions/skills/), [4](https://www.cherryai.com/docs/en/advanced-basic/extensions/mcp/) |
| `chatbox` | `openai-chat-completions-client` | [1](https://docs.chatboxai.app/en/guides/providers), [2](https://platform.openai.com/docs/api-reference/chat) |

Entry installation details / 入口安装：[entrypoints.md](entrypoints.md)

Update / 更新: `npx tsx tools/website/generate-price-finder-app-catalog.ts`
Check / 检查: `npx tsx tools/website/generate-price-finder-app-catalog.ts --check`
