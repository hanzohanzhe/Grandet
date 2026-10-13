# App catalog / 应用清单

Generated from the desktop adapter registry and shared common-client guides. / 由桌面端适配器注册表与共享应用指南生成。

Only INFERENCE_GATEWAY profiles declare an inference protocol. MCP support does not imply a custom inference endpoint. / 只有 INFERENCE_GATEWAY profile 声明推理协议；MCP 能力不代表可配置推理接口。

GUIDE entries use the existing generic Chat Completions adapter for manual setup; their empty platforms and null version contract mean unspecified. MCP=false for a guide means no MCP registration here. / GUIDE 使用已有通用 Chat Completions 适配器提供手动设置指南；空平台与空版本契约表示未指定，指南的 MCP=false 表示此处未登记该能力。

This catalog does not mark host tests complete. / 这份清单不代表已完成宿主实测。

Profile setup links use shared inference guides where specified; original registry citations remain in the documentation list. / 配置链接优先采用已指定的共享推理指南，原注册表引用仍保留在文档列表中。

| App / 应用 | ID | Kind / 类型 | Inference profiles / 推理配置 | MCP registered / 已登记 |
| --- | --- | --- | --- | --- |
| Claude Code | `claude-code` | NAMED | `anthropic-messages` | yes / 是 |
| OpenCode | `opencode` | NAMED | `openai-chat-completions`, `openai-responses` | yes / 是 |
| Codex | `codex` | NAMED | `openai-responses` | yes / 是 |
| Cursor | `cursor` | NAMED | — | yes / 是 |
| Gemini CLI | `gemini-cli` | NAMED | `gemini-native` | yes / 是 |
| Windsurf | `windsurf` | NAMED | — | yes / 是 |
| Cline | `cline` | NAMED | `openai-chat-completions` | yes / 是 |
| Hermes | `hermes` | NAMED | `openai-chat-completions`, `openai-responses`, `anthropic-messages` | yes / 是 |
| OpenClaw | `openclaw` | NAMED | `openai-chat-completions`, `openai-responses`, `anthropic-messages`, `gemini-native` | yes / 是 |
| WorkBuddy | `workbuddy` | NAMED | `cn-desktop-openai-chat-completions`, `intl-desktop-openai-chat-completions` | yes / 是 |
| Trae | `trae` | NAMED | `cn-ide-openai-chat-completions`, `cn-ide-anthropic-messages`, `intl-ide-openai-chat-completions`, `intl-ide-anthropic-messages` | yes / 是 |
| Kilo Code | `kilo-code` | NAMED | `openai-chat-completions`, `vscode-openai-chat-completions` | no / 否 |
| Continue | `continue` | NAMED | `vscode-openai-chat-completions` | no / 否 |
| OpenAI Chat Completions client | `openai-chat-completions-client` | GENERIC | `openai-chat-completions` | no / 否 |
| OpenAI Responses client | `openai-responses-client` | GENERIC | `openai-responses` | no / 否 |
| Anthropic Messages client | `anthropic-messages-client` | GENERIC | `anthropic-messages` | no / 否 |
| Gemini Native client | `gemini-native-client` | GENERIC | `gemini-native` | no / 否 |
| Generic CLI | `generic-cli` | GENERIC | — | no / 否 |
| Generic MCP client | `generic-mcp` | GENERIC | — | yes / 是 |
| Roo Code | `roo-code` | GUIDE | `openai-chat-completions` | no / 否 |
| Cherry Studio | `cherry-studio` | GUIDE | `openai-chat-completions` | no / 否 |
| Chatbox | `chatbox` | GUIDE | `openai-chat-completions` | no / 否 |

## Profile details / 配置详情

| App ID | Profile ID | Endpoint | Format | Conditional / 有条件 | Platforms / 平台 | Version contract / 版本契约 | Docs / 文档 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `claude-code` | `anthropic-messages` | `anthropic` | `LAUNCH_ENVIRONMENT` | no / 否 | WINDOWS, MACOS, LINUX | `SEMVER_ANY_V1` | [Docs / 文档](https://code.claude.com/docs/en/llm-gateway-connect) |
| `opencode` | `openai-chat-completions` | `openai` | `JSONC` | no / 否 | WINDOWS, MACOS, LINUX | `SEMVER_ANY_V1` | [Docs / 文档](https://opencode.ai/docs/providers/) |
| `opencode` | `openai-responses` | `openai-response` | `JSONC` | no / 否 | WINDOWS, MACOS, LINUX | `SEMVER_ANY_V1` | [Docs / 文档](https://opencode.ai/docs/providers/) |
| `codex` | `openai-responses` | `openai-response` | `TOML` | no / 否 | WINDOWS, MACOS, LINUX | `SEMVER_ANY_V1` | [Docs / 文档](https://developers.openai.com/codex/config-reference/) |
| `gemini-cli` | `gemini-native` | `gemini` | `LAUNCH_ENVIRONMENT` | no / 否 | WINDOWS, MACOS, LINUX | `SEMVER_ANY_V1` | [Docs / 文档](https://geminicli.com/docs/get-started/configuration/) |
| `cline` | `openai-chat-completions` | `openai` | `LAUNCH_ENVIRONMENT` | no / 否 | WINDOWS, MACOS, LINUX | `SEMVER_ANY_V1` | [Docs / 文档](https://docs.cline.bot/provider-config/openai-compatible) |
| `hermes` | `openai-chat-completions` | `openai` | `YAML` | no / 否 | WINDOWS, MACOS, LINUX | `SEMVER_ANY_V1` | [Docs / 文档](https://github.com/NousResearch/hermes-agent) |
| `hermes` | `openai-responses` | `openai-response` | `YAML` | no / 否 | WINDOWS, MACOS, LINUX | `SEMVER_ANY_V1` | [Docs / 文档](https://github.com/NousResearch/hermes-agent) |
| `hermes` | `anthropic-messages` | `anthropic` | `YAML` | no / 否 | WINDOWS, MACOS, LINUX | `SEMVER_ANY_V1` | [Docs / 文档](https://github.com/NousResearch/hermes-agent) |
| `openclaw` | `openai-chat-completions` | `openai` | `JSON` | no / 否 | WINDOWS, MACOS, LINUX | `SEMVER_ANY_V1` | [Docs / 文档](https://docs.openclaw.ai/) |
| `openclaw` | `openai-responses` | `openai-response` | `JSON` | no / 否 | WINDOWS, MACOS, LINUX | `SEMVER_ANY_V1` | [Docs / 文档](https://docs.openclaw.ai/) |
| `openclaw` | `anthropic-messages` | `anthropic` | `JSON` | no / 否 | WINDOWS, MACOS, LINUX | `SEMVER_ANY_V1` | [Docs / 文档](https://docs.openclaw.ai/) |
| `openclaw` | `gemini-native` | `gemini` | `JSON` | no / 否 | WINDOWS, MACOS, LINUX | `SEMVER_ANY_V1` | [Docs / 文档](https://docs.openclaw.ai/) |
| `workbuddy` | `cn-desktop-openai-chat-completions` | `openai` | `GUI_FIELDS` | no / 否 | WINDOWS, MACOS | `WORKBUDDY_CN_4_7_V1` | [Docs / 文档](https://www.codebuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Model) |
| `workbuddy` | `intl-desktop-openai-chat-completions` | `openai` | `GUI_FIELDS` | yes / 是 | WINDOWS, MACOS | `SEMVER_ANY_V1` | [Docs / 文档](https://www.codebuddy.ai/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Model) |
| `trae` | `cn-ide-openai-chat-completions` | `openai` | `GUI_FIELDS` | yes / 是 | WINDOWS, MACOS | `SEMVER_ANY_V1` | [Docs / 文档](https://docs.trae.cn/ide_models) |
| `trae` | `cn-ide-anthropic-messages` | `anthropic` | `GUI_FIELDS` | yes / 是 | WINDOWS, MACOS | `SEMVER_ANY_V1` | [Docs / 文档](https://docs.trae.cn/ide_models) |
| `trae` | `intl-ide-openai-chat-completions` | `openai` | `GUI_FIELDS` | yes / 是 | WINDOWS, MACOS | `SEMVER_ANY_V1` | [Docs / 文档](https://docs.trae.ai/ide/models) |
| `trae` | `intl-ide-anthropic-messages` | `anthropic` | `GUI_FIELDS` | yes / 是 | WINDOWS, MACOS | `SEMVER_ANY_V1` | [Docs / 文档](https://docs.trae.ai/ide/models) |
| `kilo-code` | `openai-chat-completions` | `openai` | `JSONC` | no / 否 | WINDOWS, MACOS, LINUX | `SEMVER_ANY_V1` | [Docs / 文档](https://kilo.ai/docs/getting-started/settings) |
| `kilo-code` | `vscode-openai-chat-completions` | `openai` | `JSONC` | yes / 是 | WINDOWS, MACOS, LINUX | `SEMVER_ANY_V1` | [Docs / 文档](https://kilo.ai/docs/code-with-ai/agents/custom-models) |
| `continue` | `vscode-openai-chat-completions` | `openai` | `YAML` | yes / 是 | WINDOWS, MACOS, LINUX | `SEMVER_ANY_V1` | [Docs / 文档](https://docs.continue.dev/reference) |
| `openai-chat-completions-client` | `openai-chat-completions` | `openai` | `LAUNCH_ENVIRONMENT` | no / 否 | WINDOWS, MACOS, LINUX | `SEMVER_ANY_V1` | [Docs / 文档](https://platform.openai.com/docs/api-reference/chat) |
| `openai-responses-client` | `openai-responses` | `openai-response` | `LAUNCH_ENVIRONMENT` | no / 否 | WINDOWS, MACOS, LINUX | `SEMVER_ANY_V1` | [Docs / 文档](https://platform.openai.com/docs/api-reference/responses) |
| `anthropic-messages-client` | `anthropic-messages` | `anthropic` | `LAUNCH_ENVIRONMENT` | no / 否 | WINDOWS, MACOS, LINUX | `SEMVER_ANY_V1` | [Docs / 文档](https://docs.anthropic.com/en/api/messages) |
| `gemini-native-client` | `gemini-native` | `gemini` | `LAUNCH_ENVIRONMENT` | no / 否 | WINDOWS, MACOS, LINUX | `SEMVER_ANY_V1` | [Docs / 文档](https://ai.google.dev/api/generate-content) |
| `roo-code` | `openai-chat-completions` | `openai` | `MANUAL_GUIDE` | yes / 是 | unspecified / 未指定 | unspecified / 未指定 | [Docs / 文档](https://roocodeinc.github.io/Roo-Code/providers/openai-compatible/) |
| `cherry-studio` | `openai-chat-completions` | `openai` | `MANUAL_GUIDE` | yes / 是 | unspecified / 未指定 | unspecified / 未指定 | [Docs / 文档](https://docs.cherryai.com.cn/docs/en-us/pre-basic/providers/zi-ding-yi-fu-wu-shang) |
| `chatbox` | `openai-chat-completions` | `openai` | `MANUAL_GUIDE` | yes / 是 | unspecified / 未指定 | unspecified / 未指定 | [Docs / 文档](https://docs.chatboxai.app/en/guides/providers) |

## Source references / 来源

- Registry / 主注册表: `lib/control-plane/integrations/client-adapter-registry.ts`
- Shared guides / 共享指南: `lib/control-plane/integrations/common-client-guides.ts`

| App ID | Adapter binding / 适配器绑定 | Documentation / 文档 |
| --- | --- | --- |
| `claude-code` | `claude-code` | [1](https://docs.anthropic.com/en/docs/claude-code/mcp), [2](https://code.claude.com/docs/en/llm-gateway-connect) |
| `opencode` | `opencode` | [1](https://opencode.ai/docs/providers/) |
| `codex` | `codex` | [1](https://developers.openai.com/codex/config-reference/) |
| `cursor` | `cursor` | [1](https://docs.cursor.com/context/model-context-protocol) |
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
| `cherry-studio` | `openai-chat-completions-client` | [1](https://docs.cherryai.com.cn/docs/en-us/pre-basic/providers/zi-ding-yi-fu-wu-shang), [2](https://platform.openai.com/docs/api-reference/chat) |
| `chatbox` | `openai-chat-completions-client` | [1](https://docs.chatboxai.app/en/guides/providers), [2](https://platform.openai.com/docs/api-reference/chat) |

Update / 更新: `npx tsx tools/website/generate-price-finder-app-catalog.ts`
Check / 检查: `npx tsx tools/website/generate-price-finder-app-catalog.ts --check`
