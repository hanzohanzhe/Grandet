# Price finder entrypoints / 比价入口

Generated from the same application catalog as API target guidance. Documentation and installed-host acceptance are separate records; see each route below. / 与 API 目标指导从同一应用目录生成；资料登记与实际安装验收分开记录，请查看各入口状态。

Capability validation / 能力验收: NOT_RUN: 35; PASS: 0; FAIL: 0

The shared remote service uses Streamable HTTP: https://grandet.ai/mcp. It is a lookup service, not a supplier inference Base URL or the desktop stdio control service. / 共用远程查价服务使用 Streamable HTTP；它不是供应商推理 Base URL，也不是桌面 stdio 控制服务。

MCP_HTTP exposes tools only; SKILL_PLUGIN and SKILL_DIRECTORY also install the common Skill instructions. No route is a claim of current deployment or release approval. / MCP_HTTP 仅暴露工具，SKILL_PLUGIN 与 SKILL_DIRECTORY 同时安装共用 Skill 指令。入口记录不代表网站已部署或批准发布。

## Claude Code — SKILL_PLUGIN

Identity / 身份: `claude-code:skill-plugin`. Status: DOCUMENTED / NOT_RUN.

Use a complete generated plugin through a Claude Code plugin entrypoint after that route has passed installation acceptance. The source template and its repository marketplace reference are not an installable release; this route is still awaiting a real installation test.

完整生成包应通过 Claude Code 插件入口安装，待该入口完成实装验收后再提供给用户。源码模板及指向模板的仓库 marketplace 条目不是可安装版本；此路线仍待真实安装验证。

Resources / 资源: `plugins/grandet-api-price-finder/.claude-plugin/plugin.json`, `skills/grandet-api-price-finder`, `plugins/grandet-api-price-finder/.mcp.json`

Documentation / 文档: [1](https://code.claude.com/docs/en/plugin-marketplaces), [2](https://code.claude.com/docs/en/plugins-reference)

## Codex — SKILL_PLUGIN

Identity / 身份: `codex:skill-plugin`. Status: DOCUMENTED / NOT_RUN.

Use a complete generated plugin through a Codex plugin entrypoint after that route has passed installation acceptance. The source template and its repository marketplace reference are not an installable release; this route is still awaiting a real installation test.

完整生成包应通过 Codex 插件入口安装，待该入口完成实装验收后再提供给用户。源码模板及指向模板的仓库 marketplace 条目不是可安装版本；此路线仍待真实安装验证。

Resources / 资源: `plugins/grandet-api-price-finder/.codex-plugin/plugin.json`, `skills/grandet-api-price-finder`, `plugins/grandet-api-price-finder/.mcp.json`

Documentation / 文档: [1](https://developers.openai.com/plugins/build/plugins)

## Cursor — SKILL_DIRECTORY

Identity / 身份: `cursor:skill-directory`. Status: DOCUMENTED / NOT_RUN.

Copy the complete Skill folder into project .cursor/skills/ or .agents/skills/, then start a new Agent chat. If that session can read webpages or make HTTP requests, the Skill uses its HTTP fallback directly; a separate MCP connection is optional.

将完整 Skill 文件夹放入项目 .cursor/skills/ 或 .agents/skills/，再新建 Agent 会话。该会话能读取网页或发起 HTTP 请求时，Skill 可直接使用 HTTP fallback；MCP 连接可选。

Resources / 资源: `skills/grandet-api-price-finder`

Documentation / 文档: [1](https://prod.cursor.com/docs/skills)

## Cursor — MCP_HTTP

Identity / 身份: `cursor:http-mcp`. Status: DOCUMENTED / NOT_RUN.

Add the Streamable HTTP MCP URL using Cursor MCP settings or a verified install link. MCP tools alone do not install the Skill.

在 Cursor MCP 设置或经验证的安装链接中添加 Streamable HTTP MCP 地址；添加工具本身不会安装 Skill。

Resources / 资源: `plugins/grandet-api-price-finder/.mcp.json`

Documentation / 文档: [1](https://prod.cursor.com/docs/mcp/install-links)

## Cherry Studio — SKILL_DIRECTORY

Identity / 身份: `cherry-studio:skill-directory`. Status: DOCUMENTED / NOT_RUN.

Import the complete Skill folder or ZIP using Settings → Skills, then start a new agent/session. If that session can read webpages or make HTTP requests, the Skill uses its HTTP fallback directly; a separate MCP connection is optional. Confirm the installed version and session capabilities during acceptance.

通过设置 → Skills 导入完整 Skill 文件夹或 ZIP，再新建 agent/会话。该会话能读取网页或发起 HTTP 请求时，Skill 可直接使用 HTTP fallback；MCP 连接可选。验收时核实所装版本和会话能力。

Resources / 资源: `skills/grandet-api-price-finder`

Documentation / 文档: [1](https://www.cherryai.com/docs/en/advanced-basic/extensions/skills/)

## Cherry Studio — MCP_HTTP

Identity / 身份: `cherry-studio:http-mcp`. Status: DOCUMENTED / NOT_RUN.

In Settings → MCP → Add, use the Streamable HTTP URL and enable it for the active agent/session. MCP tools alone do not install the Skill.

在设置 → MCP → 添加中使用 Streamable HTTP 地址，并对当前 agent/会话启用；添加工具本身不会安装 Skill。

Resources / 资源: `plugins/grandet-api-price-finder/.mcp.json`

Documentation / 文档: [1](https://www.cherryai.com/docs/en/advanced-basic/extensions/mcp/)

## Unrecorded entry capability / 尚未登记的入口能力

`opencode`, `gemini-cli`, `windsurf`, `cline`, `hermes`, `openclaw`, `workbuddy`, `trae`, `kilo-code`, `continue`, `roo-code`, `chatbox`

These applications remain API targets where profiles exist. Investigate an actual version and official installation documentation before registering an entry route; do not infer unavailability. / 这些应用仍可按已有推理配置作为 API 使用目标；先核实实际版本和官方安装资料再登记入口，不能推定不支持。
