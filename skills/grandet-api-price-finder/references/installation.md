# Install once / 一次安装

Grandet Skill **0.3.0** · public trial / 公开试用。This is the current installation guide; older generated entrypoint notes are a catalogue snapshot, not the installation procedure. / 本文是当前安装指引；旧的生成入口表保留为目录快照。

**Install the complete Skill once, keep it enabled, then ask normally in a new conversation. No repeated attachments or per-query skill command.** / **完整安装一次并保持启用，以后新会话直接问；不重复附文件，也不要求每次手动点选 Skill。** First-time upload into a real Skills manager is installation. Uploading into a chat message alone is not. / 首次上传到技能管理器属于安装；仅上传到聊天消息不算。

Use the tester's existing application and account. Choose its row below; do not ask them to register another product. These are installation routes and scopes, not a declaration that every route has passed a native fresh-session test. / 从测试员已有应用和账号开始，按下表安装；无需另开其他产品账号。表中是安装机制与作用域，不代表全部原生验收通过。

## Complete payload / 完整文件

Copy or import the whole `grandet-api-price-finder` folder. Its root contains `SKILL.md`, with the bundled `references/` and `agents/` directories retained. For an upload manager, use the supplied native Skill package, not the outer tester-materials ZIP. / 复制或导入整个文件夹；技能根目录有 `SKILL.md`，保留随包的 `references/` 和 `agents/`。网页上传请选择原生 Skill 包，不要选择外层测试资料合集。

```text
grandet-api-price-finder/
├── SKILL.md
├── references/
└── agents/
```

The host needs an available Grandet MCP connection or an HTTP reader to retrieve current prices. An MCP connection alone installs tools, not this Skill's workflow. / 宿主需有可用的 Grandet MCP 连接或 HTTP 读取能力，才能查实时价格；只添加 MCP 工具不等于安装了本 Skill。

**安装/更新核验。** 已有 Grandet Skill 就保留原生身份/ID 并原位更新，不新建重复项。完整正文与原生发现描述必须同步：有独立描述字段时，采用共同 `SKILL.md` frontmatter 中当前 `description` 的完整内容，触发范围随它更新，不保留旧的仅价格描述，也不把必要更新留作可选问题。回读保存结果，核实描述和启用状态，再用已有 MCP/HTTP 读取工具完成一次正常匿名轻量读取（如 `https://grandet.ai/public-data/price-finder.json`）；无需供应商 Key，不另发统计请求。无法核实或读取时，安装验收仍未完成，只给具体补齐动作。干净新会话自然触发另行验收，安装读取不算通过。 / **Installation and update checks.** Update the existing native Skill in place, preserving its identity/ID without duplicates. Keep the complete body and native discovery description synchronized: when the host has a separate description field, copy the current full `description` from the common `SKILL.md` frontmatter; its trigger scope replaces any old price-only description as a required update. Read back the saved result, verify its description and enabled state, and perform one ordinary anonymous lightweight read through an available MCP/HTTP reader, such as the URL above; no supplier key or separate tracking call. If verification or reading is unavailable, leave installation acceptance incomplete and give the concrete next action. Fresh-session natural triggering is a separate test, not established by this installation read.

## Local user installation / 本机用户级安装

Copy the complete folder **once** into the root in column two, so the final path ends in `skills/grandet-api-price-finder/SKILL.md`. Restart the app or open a clean session after installation. These are user-wide roots; a project-relative `.xxx/skills` folder covers that project only. / 将完整文件夹一次性放入第二列目录，安装后重启应用或新建干净会话。下表是用户级目录；项目内的相对路径只覆盖该项目。

`~` means the home of the account **running the agent**. For native Windows this is usually `%USERPROFILE%`; WSL, SSH and cloud agents have their own home. Respect explicit runtime home overrides. / `~` 是实际运行 Agent 的用户目录；Windows 原生通常对应 `%USERPROFILE%`，WSL、SSH、云端各有自己的目录。已设置的运行目录覆盖值优先。

| Application / 应用 | User skill root / 用户级目录 | Scope and one-time checks / 作用域与一次性核对 |
|---|---|---|
| Codex `codex` | `~/.agents/skills/` | Local app/CLI/IDE, across repositories. Keep implicit invocation enabled; check for duplicate copies in older roots. / 本地应用、CLI、IDE 跨项目；保留自动调用，核对旧目录同名副本。[Official / 官方](https://learn.chatgpt.com/docs/build-skills) |
| Claude Code `claude-code` | `~/.claude/skills/` | All local projects. Cowork/cloud do not read this local folder; use account Skills there. / 本机跨项目；Cowork、云会话走下表账号技能。[Official / 官方](https://code.claude.com/docs/en/skills) |
| Cursor IDE `cursor` | `~/.cursor/skills/` | Local Agent across projects; inspect Customize → Skills. Cloud needs the separate sync row below. / 本地 Agent 跨项目，Customize → Skills 查看；云端需另做同步。[Official / 官方](https://cursor.com/docs/skills) |
| OpenCode `opencode` | `~/.config/opencode/skills/` | Also supports `~/.agents/skills/`. Use one active copy; keep the skill tool and automatic discovery enabled. / 也支持共享目录，仅保留一份生效副本；不关闭 Skill 工具或自动发现。[Official / 官方](https://opencode.ai/docs/skills/) |
| Gemini CLI `gemini-cli` | `~/.gemini/skills/` | `gemini skills install <local-folder-or-package>` defaults to user scope; `/skills list` checks discovery. Activation may require the host's permission prompt, without reinstalling. / 本地安装命令默认用户级；激活时可能有宿主许可，无需重装。[Official / 官方](https://geminicli.com/docs/cli/using-agent-skills/) |
| Windsurf `windsurf` | `~/.codeium/windsurf/skills/` | Global across workspaces; UI alternative: Cascade → … → Skills → + Global. Current official URL redirects to Devin Desktop docs; check the installed edition. / 跨工作区；也可通过全局技能菜单，核对实际版本。[Official / 官方](https://docs.windsurf.com/windsurf/cascade/skills) |
| Cline `cline` | `~/.cline/skills/` | Windows: `%USERPROFILE%\.cline\skills\`. Skills are discovered enabled by default; inspect scale icon → Skills. / 默认发现后启用，天平图标 → Skills 核对。[Official / 官方](https://docs.cline.bot/customization/skills) |
| Hermes `hermes` | `$HERMES_HOME/skills/` | Use the active backend/profile. Defaults: POSIX `~/.hermes/skills/`; native Windows `%LOCALAPPDATA%\hermes\skills\`. Ordinary skill directory participates in discovery; plugin-only opt-in skills differ. / 按实际后端、profile 安装；普通技能目录可自动发现，插件内技能不能据此等同。[Skills / 技能](https://hermes-agent.nousresearch.com/docs/guides/work-with-skills/) · [Windows / 安装](https://hermes-agent.nousresearch.com/docs/getting-started/installation) |
| OpenClaw `openclaw` | `<state-dir>/skills/`, normally `~/.openclaw/skills/` | Install on the actual Gateway runtime. Agent allowlists or workspace overrides can limit visibility. / 安装在实际 Gateway；所选 Agent 的允许列表和工作区覆盖影响可见性。[Official / 官方](https://docs.openclaw.ai/tools/skills) |
| TRAE `trae` | CN `~/.trae-cn/skills/`; international `~/.trae/skills/` | Or Settings → Skills & Commands → Create → Global, import the complete package. Regional editions use different user roots; keep references after import. / 也可全局导入；中外版目录不同，导入后保留参考文件。[CN / 中国版](https://docs.trae.cn/ide_skills) · [International / 国际版](https://docs.trae.ai/ide/skills) |
| Kilo Code `kilo-code` | Current platform `~/.kilo/skills/` | Current CLI/extension discovers at new-session start; `/reload` refreshes. Older `.kilocode` builds require version-specific checking. Local global skills do not reach Kilo Cloud. / 新平台按会话发现；旧版须核对目录，本机全局技能不自动进入云端。[Skills / 技能](https://kilo.ai/docs/customize/skills) · [Cloud / 云端](https://kilo.ai/docs/code-with-ai/platforms/cloud-agent) |
| Continue `continue` | `~/.continue/skills/`, or `$CONTINUE_GLOBAL_DIR/skills/` | Current upstream CLI and IDE load global Skills through their skill tool. Verify the installed build separately; do not replace model settings. / 当前上游 CLI、IDE 有全局加载路径；分别核对所装版本，不替换模型配置。[CLI source / CLI 源码](https://github.com/continuedev/continue/blob/5522c6f44ca0ac3528b37244818fbfa39b5af470/extensions/cli/src/util/loadMarkdownSkills.ts) · [IDE source / IDE 源码](https://github.com/continuedev/continue/blob/5522c6f44ca0ac3528b37244818fbfa39b5af470/core/tools/definitions/readSkill.ts) |
| Roo Code `roo-code` | `~/.roo/skills/` | Windows: `%USERPROFILE%\.roo\skills\`. Use generic `skills/` to cover modes; `skills-code/` would narrow scope. / 使用通用目录覆盖各模式，不放入仅 Code 模式目录。[Official / 官方](https://roocodeinc.github.io/Roo-Code/features/skills/) |

Shared roots such as `~/.agents/skills/` are supported by several hosts. Choose one route rather than installing duplicate named copies everywhere. Local files are not account sync: install on the actual runtime, or use the documented cloud/account route. / 多宿主支持共享目录，但应选择一条生效路线，避免同名多份。复制本地文件不等于账号同步；云端按实际运行端或下表处理。

## Account, Agent and cloud installation / 账号、Agent 与云端保存

Use the native Skills manager to save and enable the complete workflow once. Later conversations must retain it without attachments. Agent-specific routes cover new chats **with that Agent**; they do not automatically cover unrelated agents. / 在原生技能管理器保存、启用一次；后续无需附件。按 Agent 绑定的路线覆盖该 Agent 的新聊天，不自动扩展到其他 Agent。

| Application / 应用入口 | One-time setup / 一次性设置 | Scope and acceptance / 作用域与验收 |
|---|---|---|
| ChatGPT | Open [Skills](https://chatgpt.com/skills) → Add skill / 添加技能 → Upload from computer / 从电脑上传; choose the complete `.zip` or `.skill` package and save it. / 上传完整原生包并保存。 | Current account UI has been inspected: accepts `.zip`, `.skill`, or `SKILL.md`, up to 25 MB. Saving and clean-session triggering remain pending; do not substitute chat attachments. / 已看到真实菜单及格式限制；保存和干净新会话仍待验。单文件入口不能自动补齐本包参考文件。[Skill behavior / 技能行为](https://learn.chatgpt.com/docs/build-skills) |
| Claude web / 网页 `claude-ai` | Customize → Skills → + → Create skill → Upload a skill; upload the native ZIP and keep it enabled. / 在技能管理器上传原生 ZIP 并启用。 | Personal account skill, with Code execution and file creation enabled; organization policy can restrict it. Prior project evidence exists, but each changed artifact needs applicable acceptance evidence. / 账号级技能，需相应执行能力；已有实测记录不能自动证明后来修改也通过。[Official / 官方](https://support.claude.com/en/articles/12512180-use-skills-in-claude) |
| Cursor Cloud Agent | First install in `~/.cursor/skills/`; Settings → Agents → Context and Tools → Sync Skills for Cloud Agents → Confirm. / 本机安装后一次开启云技能同步。 | Private sync. `~/.agents/skills/` and unsynced local files stay local; team policy may disable sync. Fresh cloud execution still awaits acceptance. / 私有同步，仅指定目录；团队可禁用，云端实测待验。[Official / 官方](https://cursor.com/docs/skills) |
| Cherry Studio `cherry-studio` | Settings → Skills → Add Skill → Local import; import folder/ZIP and enable globally. Then Work → Agent menu → Edit → Skills, enable it for that Agent. / 导入后全局启用，再给实际 Agent 绑定。 | Subsequent chats with the bound Agent reuse it. If using MCP, enable that connection for the same Agent once. Global import alone is incomplete. / 后续用该 Agent；若走 MCP，也需一次绑定，光导入未完成接入。[Skills / 技能](https://www.cherryai.com/docs/en/advanced-basic/extensions/skills/) · [Agent binding / 绑定](https://cherryai.com/docs/en/advanced-basic/agent-workspace/tools-knowledge-skills-mcp/) |
| Chatbox `chatbox` | Desktop Settings → Skills → open local skills folder; copy the full folder and enable once. / 桌面端打开技能目录，复制完整文件夹并启用。 | Global enablement, **Work Mode required for execution**. New chats default to Chat Mode; Smart Switching may ask to switch. This conditional route is not yet acceptance for seamless ordinary new chats. / 全局启用，但执行需 Work Mode；新聊天默认模式可能要切换，尚不满足无缝新会话验收。Web/mobile not inferred. / 不推及网页或手机。[Configuration / 设置](https://beta.chatboxai.app/en/guide/work-mode/configuration) · [Work Mode](https://beta.chatboxai.app/en/guide/work-mode/overview) |
| WorkBuddy `workbuddy`, CN / 中国版 | Skills → Add Skill → Upload Skill; import local package and keep Installed skill enabled. / 本地包上传后保持启用。 | Persistent installed skill with automatic matching; account config sync does not prove payload reaches all devices. / 持久安装与自动匹配；配置同步不证明文件跨设备到位。[Official / 官方](https://www.codebuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Skills-Market) |
| WorkBuddy `workbuddy`, international / 国际版 | Save the custom Skill once using the actual private creation/import feature, then verify it appears installed and enabled. / 使用实际私有创建或导入入口保存并核对安装状态。 | Reusable custom Skills documented; exact local ZIP importer parity with CN is unverified. Do not invent the same menu. / 已有持久技能能力依据，未核实导入菜单与中国版一致。[Skills](https://www.workbuddy.ai/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Skills-Market) · [Creation / 创建](https://www.workbuddy.ai/docs/zh/workbuddy/From-Beginner-to-Expert-Guide/Practice-Cases/Create-Skills) |
| Grok Bot `grok-bot` | Save the complete workflow as a private Skill once; Connect apps → connected count → Private skills, enable it for the Bot. / 保存私有技能并为当前 Bot 启用。 | Saved skill can be reused across Bots; each Bot may need enablement. Use a fresh chat/test Bot without attaching or naming Grandet for acceptance. / 可复用私有技能，各 Bot 核对启用；干净会话自然触发另验。[Official / 官方](https://cursor.com/docs/grok-bot/work) |
| Your dot `your-dot` | Use a supported enabled account plugin, or connect the computer once from the dot profile for local skills. / 走账号支持的插件，或在 dot 资料中一次连接电脑供其使用本地技能。 | Local route needs that computer online with app open. Existing Codex connection is not dot permission. No independent dot directory or completed Grandet fresh-task acceptance established. / 本地路线依赖电脑在线；不能把 Codex 连接当 dot 授权；独立安装目录和本 Skill 新任务验收待核。[Official / 官方](https://learn.chatgpt.com/docs/dots/computers-and-apps) |
| Meta Muse `muse` | Use its actual private custom-Skill feature to persist the complete workflow once. / 通过实际私有技能功能持久保存完整流程。 | Custom skills are documented; exact importer, save action and clean-session automatic trigger remain unverified. Keep pending, not attachment-based compatibility. / 能力有依据，具体导入、保存和新会话触发待验；不以附件执行冒充兼容。[Meta source / Meta 说明](https://research.meta.ai/blog/security-and-safety-for-ai-agents-our-approach-with-muse) |

These labels identify installation surfaces; they do not add website `targetApp` values or supplier protocols. Use the service's existing application contract for API targets. / 表中标识用于区分安装入口，不新增网站 `targetApp` 或供应商协议；实际 API 目标沿用服务端契约。

## Fresh-session acceptance / 新会话验收

After saving or copying once, close the installation conversation. Open an ordinary new conversation within the documented scope and ask, without a file, brand name, slash command or Skill selection: / 完成一次安装后关闭安装对话，在对应作用域新建普通会话，不附文件、不提品牌、不输命令、不点选技能，直接问：

> 帮我找适合写代码的便宜 GPT API，给我一个推荐和一个备选。

> Find a cheap API provider for Claude Sonnet 4.6 for coding. Give me one recommendation and one backup.

Verify that the host actually loads the saved Skill, reads current Grandet data and gives a useful sourced answer. Then restart the app and repeat in another clean conversation. Installation visibility, natural trigger and successful lookup are separate results. / 核对真实加载已保存 Skill、读取当前 Grandet 数据并给出有出处的有用答案；再重启应用，在另一新会话重复。安装可见、自然触发、查价成功分别记录。

If the next conversation asks for the file again, it fails persistent-install acceptance. Fix the installation scope or binding; do not instruct the tester to keep uploading. Account, runtime or mode limits remain recorded as pending/blocked until resolved. / 若新会话还要附件，就判持久安装失败；修复安装位置或绑定，不让测试员反复上传。账号、运行端或模式限制据实保留待验或阻塞。

Use the current complete source or package linked by [Grandet's official GitHub repository](https://github.com/hanzohanzhe/Grandet). Version remains **0.3.0**; identify its exact contents by commit and SHA-256. Public availability does not certify every host's native installation or fresh-session use. / 使用 Grandet 官方 GitHub 提供的当前完整源码或安装包；版本保持 **0.3.0**，具体内容以提交和 SHA-256 识别。公开提供不表示所有宿主的原生安装与新会话使用均已验收。
