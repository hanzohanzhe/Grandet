# Install Grandet / 安装 Grandet

**给执行安装的 Agent。用户只需说“帮我安装 Grandet”或“Install Grandet for me”。** 完成范围内的安装操作，不把命令、目录研究或运行时安装交回用户。产品版本固定 **0.3.0**；这是公开试用版，各宿主原生验收按实际记录分别判断。

**For the installing agent.** The user's installation request authorizes the routine setup below. Complete it in the current application's actual runtime; do not turn the user into the installer. Version **0.3.0** is a public trial; native acceptance remains specific to each tested host and artifact.

## 1. 找到正确的安装材料 / Locate the installation source

优先使用当前对话已经明确的 [Grandet 官方 GitHub](https://github.com/hanzohanzhe/Grandet) 链接、该仓库当前安装说明所指向的完整安装包，或用户提供的对应官方包。用户给出明确官方 GitHub 链接时直接使用，不要求官网再次背书，不索取私测包，也不等待无链接自动发现测试。

只有“帮我安装 Grandet”而没有材料时，自行读取这个官方仓库的当前安装说明。官网可作为辅助发现入口，不是前置条件。仅在当前工具确实无法取得完整材料时，说明实际缺项并给一个具体补齐动作；不要把“我没找到”说成官方尚未发布，不猜撤下的旧路径。

将材料放入当前任务工作目录，读取安装说明并使用同一提交的完整文件。生成包包含 `package-manifest.json` 时逐文件核对；从源码安装时固定同一 Git 提交，取得整个 `skills/grandet-api-price-finder/` 及其引用，不要求源码目录提供构建产物 manifest。固定版本 0.3.0 不能代替内容身份。`plugins/grandet-api-price-finder/` 可能只是打包模板，不得把缺少共同 Skill 的模板目录当安装完成。

本包的共同 Skill 位于 [skills/grandet-api-price-finder/](../../skills/grandet-api-price-finder/SKILL.md)，所有支持文件必须一起保存。有现成完整包就直接使用，不让用户构建源码。没有 Node 仍按第 4 节用已有文件工具安装；账号型宿主按第 5 节实际可用的持久入口操作。

Prefer an explicit [official Grandet GitHub link](https://github.com/hanzohanzhe/Grandet), the complete package linked by that repository's current installation instructions, or the corresponding official package already supplied by the user. An explicit official GitHub source is sufficient: do not require a second website endorsement, a private test package or completion of a separate discovery test. When only the installation request is given, consult that official repository yourself; the website is an optional discovery aid.

Read the instructions in the task workspace. Verify a generated package against its manifest when present. For source installation, pin one commit and obtain the complete `skills/grandet-api-price-finder/` tree and references; do not require a generated manifest to exist in the source tree. A plugin-template directory without the complete Skill is insufficient. If the current tools cannot retrieve the material, describe that concrete gap and one next action rather than asserting that no public package exists. Use the existing complete package or file tools; do not ask the user to build it or install Node.

## 2. 识别真正运行的应用 / Identify the actual runtime

优先服务当前 **Codex、Cursor、Claude Code 等 Agent**。利用本对话已有的宿主身份、工具、系统和工作环境，选择[一次安装指南](../../skills/grandet-api-price-finder/references/installation.md)中的对应入口。识别的是执行 Agent 的环境：Windows 原生、WSL、SSH、云运行器各有自己的用户目录，不要把本地前端所在电脑当成远端运行目录。

本地路线优先用户级安装，避免每个项目重装。只选当前应用，不自动向所有应用复制。TRAE 根据已有版本信息区分中国版与国际版；Continue、Hermes、OpenClaw 使用当前实际运行目录和已设置的覆盖值。不要猜未确定的 profile、云端目录或 GUI 菜单。遇到无法自行查明、且会改变安装目标的信息，最多问一个具体问题。

Use the host identity, available tools and runtime facts already present. Prefer the current Codex, Cursor, Claude Code or other local agent's documented user-level installation. Native Windows, WSL, SSH and cloud runners have separate homes. Select one application and its actual edition/runtime, not every supported app. Consult the bundled guide for account or cloud entrypoints. Ask only for a genuinely unresolved fact that determines the installation target.

## 3. 有 Node 就运行现成安装器 / Use the bundled installer when available

在包根目录，用当前环境已有的 Node 执行：

```text
node scripts/install-price-finder.mjs --list
node scripts/install-price-finder.mjs --app <实际应用ID>
```

`<实际应用ID>` 由 Agent 从已有宿主信息选择，例如 `codex`、`cursor`、`claude-code`。`trae-cn`、`trae-intl` 是安装时的版本选择，网站业务查询仍沿用其应用目录身份。若脚本不在当前工作目录，使用实际解压目录的绝对路径；无需让用户寻找目录。

安装器默认使用真实运行用户的 home，一次只处理这个 Skill；它会核对完整文件、复用相同内容、检查该应用的已知同名别名，并在更新时完整保留旧目录备份。`--home` 是隔离测试目录选项，不能用来假装已经安装到真实账号。`--platform` 跨平台演练只能 `--dry-run`；计划成功不算安装成功。

若返回 `REUSED`，继续核实该路径对当前应用确实可见。Cursor 复用共享别名只证明本机路线；Cloud Agent 只同步 `~/.cursor/skills`，仍需实际的私有同步步骤。不同内容或多份副本的冲突须查明现有用途，不能删除别的应用正在使用的副本。需要迁移时先保留可恢复副本，再按用户授权范围完成，只保留已选作用域内的一份。

If Node is already available, run the bundled script from the package root, choosing the current application's ID yourself. Inspect the resulting action and actual destination. `UNCHANGED` and `REUSED` are valid file outcomes, not proof of host discovery. Test-root or cross-platform dry runs do not install into the real runtime. Preserve the script's alias-conflict and backup behavior; do not treat a shared local Cursor copy as ready for cloud sync.

## 4. 没有 Node 也由 Agent 完成 / Complete the copy without requiring Node

没有 Node 时，用自己已有的文件工具按指南完成等价操作；**不要求用户为了这个 Skill 安装 Node 或研究路径**：

1. 确认包内整个 `skills/grandet-api-price-finder` 文件夹及其本地引用齐全，目标为当前应用的官方用户级 Skills 目录。
2. 只检查该应用明确支持的同名发现路径。已有完整同内容副本则复用，不再复制第二份；不同副本先明确其用途，保留其它 Skill 和现有设置。
3. 更新已有目标时，把原目录完整保存在技能发现目录之外、同一运行文件系统内的可恢复备份，再放入完整新目录。保留 `SKILL.md`、`references/`、`agents/` 和包内其它随附文件；不只复制首页，不跟随符号链接到别处写入。
4. 回读目标文件，逐文件核对内容或 SHA-256，并检查相对引用。保持宿主自动调用可用；需要原生的保存/启用动作时，在当前授权范围内完成。

If Node is unavailable, use your existing filesystem tools. Copy the entire Skill to the documented user-level root, reuse an identical existing copy, and preserve old content outside discovery before updating. Keep every support file and verify the installed bytes and local references afterward. Do not require the user to install Node, locate folders, or assemble commands. Do not modify provider keys, model routing or unrelated application settings.

## 5. 账号和云端入口作为补充 / Account and cloud entrypoints

用户当前就在 ChatGPT、Claude 网页、Grok Bot、Your dot、Muse 或其它账号型入口时，按[一次安装指南](../../skills/grandet-api-price-finder/references/installation.md)及包内对应适配说明保存并启用完整 Skill。首次给 Agent 安装材料不等于持久安装；后续对话不应再附文件。没有该入口的实际保存或权限能力，就记录该入口尚未完成，不把本机安装成功推及云端，也不阻塞其它已具备条件的 Agent 路线。

优先复用已有匿名 Grandet MCP 或 HTTP 读取能力。仅连接 MCP 不算 Skill 已保存；原生 Skill 已保存也不证明当前模式可以查价。不要为“安装成功”扩大权限、购买服务或修改供应商配置。需要本人登录、原生授权或不可自动完成的点击时，只给用户**一个具体下一步**，完成后接着做，不让用户重走整套说明。

Use account-native persistence when the current host is a web or cloud assistant. Follow its actual importer, enabled Skill, Agent binding or documented private-sync route. These supplement the primary agent installation route. Existing MCP or HTTP access can supply the data tools; adding a tool alone is not installing the Skill. If one real login, permission or manual UI action is required, state that one concrete next step and then resume. An unavailable web entrypoint does not block independent local-agent installation.

## 6. 验证后简短交付 / Verify and report briefly

**安装时完成连接与权限预检。** 复用已有 MCP 或 HTTP 读取工具，通过一次正常只读工具调用或轻量 GET（如 `https://grandet.ai/public-data/price-finder.json`）验证匿名访问；不需要供应商 Key，也不另发统计请求。所需的原生保存、启用或 `grandet.ai` 读取许可在安装阶段具体请求，并核实它覆盖哪个账号、Agent 或新会话；不关闭全局安全设置或扩展到所有站点。一次 shell/工具执行成功不代表以后永久获准。宿主强制逐次许可时，明确记为尚未满足无缝使用，不能改规则绕过；没有可用 HTTP/MCP 时，只给一个与实际入口对应的补齐动作，不把仅保存文件说成可用安装已完成。 / **Check access during installation:** reuse an available MCP/HTTP reader for one ordinary anonymous read, without a supplier key or separate tracking call. Obtain any required native save, enablement or Grandet-domain permission now and verify its account/Agent/session scope. A successful one-off command is not permanent permission. Preserve global protections; mandatory per-call approval remains an unmet seamless-use condition. If no reader is available, give one concrete setup action and leave usable-install acceptance incomplete.

按[共同安装指南](../../skills/grandet-api-price-finder/references/installation.md)的“安装/更新核验”完成回读：完整正文、当前发现描述和启用状态必须一致；已有原生身份原位更新，必要的描述同步不留作可选问题。无法核实的项目仍未验收。区分“文件已安装”“宿主已发现”“新会话自然触发并查价成功”，没有证据的环节不能口头报成功。

安装完成后提示用户另开新会话直接说自己的 API 需求。能够代为验收时，关闭安装对话后在干净会话提问，**不附文件、不提 Grandet、不指定工具或 Skill**；观察实际加载、当前数据查询和有出处的推荐，再在重启后复验。继续要求附件就是持久安装未通过，应修复安装范围或绑定。

给用户的交付保持短，例如：“已装到 Codex 的用户级 Skills。新开会话直接问你要找的 API 即可。”只有验收确实做到的部分才写完成；新会话测试尚未执行就如实说明，附一个有用的测试问法，不把内部命令和校验过程塞给用户。

Follow the common guide's installation and update checks: verify the complete saved body, current discovery description and enabled state, updating the existing native identity in place. Description synchronization is required, not an optional follow-up. Unverified steps remain incomplete. Report file installation, host discovery and fresh-session business success separately. A clean-session acceptance prompt must contain no attachment, Grandet name or manual tool selection. Confirm actual current data and a useful sourced recommendation; repeat after restart where possible. Keep the user-facing completion message short and limited to what was observed.
