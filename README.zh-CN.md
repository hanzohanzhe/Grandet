# Grandet：查任意模型最便宜的 API

[English](README.md) · [官网](https://grandet.ai) · [安装说明](INSTALL.md)

**Grandet 按模型比较官方 API、推理服务商和中转站公布的价格。你的 AI 助手可以直接查价，并把最便宜的一家接到你的应用上。**

| 用法 | 地址 |
|---|---|
| 网站 | <https://grandet.ai> |
| 远程 MCP 服务 | `https://grandet.ai/mcp`（Streamable HTTP，不用注册，不用 API Key） |
| Agent Skill | 对你的 Agent 说：`帮我安装 Grandet Skill：https://grandet.ai/download.md` |
| Git | `git clone --depth 1 --branch skill-v0.3.0-build.20261018b https://github.com/hanzohanzhe/Grandet.git`，然后看[用 git 安装](#用-git-安装) |

## 安装

把这句话发给你正在用的 Agent（Codex、Claude Code、Cursor 等）：

```text
帮我安装 Grandet Skill：https://grandet.ai/download.md
```

剩下的 Agent 会自己做完；需要你登录或点确认时，它会告诉你点哪里。装好后新开一个对话，直接问：

> 我在 Claude Code 里写代码，帮我找最便宜的 Claude Sonnet 4.6 API。

不用提 Grandet，也不用再发文件。查价不需要注册账号或 API Key。想自己动手装，或者用的是 ChatGPT、Claude 网页版这类要上传技能文件的应用，看[手动安装](INSTALL.md#手动安装)。

GitHub 下载慢或打不开？同一个安装包也在[腾讯 SkillHub](https://skillhub.cn/skills/grandet-api-price-finder) 上，不用注册就能下载；Agent 下载 GitHub 失败时会自动改用它。

## 用 git 安装

官网和上面那句话装的都是 **build.20261018b**（内部代号 j2），也是 GitHub 上标为 Latest 的版本。clone 它的 tag 装到的是同一份 Skill：装好的文件夹和 Release ZIP 装出来的内容哈希一致。

```sh
git clone --depth 1 --branch skill-v0.3.0-build.20261018b https://github.com/hanzohanzhe/Grandet.git
cd Grandet
node scripts/install-price-finder.mjs --app claude-code --receipt-source checkout
```

- `claude-code` 换成你的应用：`codex`、`cursor`、`opencode`、`gemini-cli`、`cline`、`roo-code`、`kilo-code`、`windsurf`、`continue`、`hermes`、`openclaw`、`trae-cn` 或 `trae-intl`。`--list` 列出全部应用和各自装到哪个文件夹。
- 安装器要 Node.js 20 或更新。没有 Node，就把整个 `skills/grandet-api-price-finder` 文件夹复制到应用的技能文件夹：Claude Code 是 `~/.claude/skills/`，Codex 是 `~/.agents/skills/`，其他应用看[逐个应用的说明](skills/grandet-api-price-finder/references/installation.md)。
- 装好后新开一个对话问价。装好的 `SKILL.md` 最后一行写着构建号。
- 安装器会发一条匿名安装回执（不含路径、名字和 Key），用来统计安装数；`--receipt-source checkout` 表示这次是用 git 装的。加 `--no-telemetry` 就什么都不发。
- **换别的版本：** 把 `--branch` 后面换成[版本记录](#版本记录)里的 tag，再跑同一条安装命令。它会替换已装的那份，旧的备份到技能文件夹外面。已经 clone 过的：先 `git fetch --depth 1 origin tag <tag>`，再 `git checkout <tag>`。
- clone tag，别 clone `main`。`main` 平时和最新发布一致，但两次发布之间可能有还没测过的改动。

## MCP 服务

支持远程 MCP 的客户端都能直接添加：

```json
{ "mcpServers": { "grandet": { "url": "https://grandet.ai/mcp" } } }
```

Claude Code 里：`claude mcp add --transport http grandet https://grandet.ai/mcp`

工具：`grandet_find_cheapest_api`（查最低价）、`grandet_find_free_credits`（找免费额度）、`grandet_resolve_model`（识别模型名）、`grandet_quote_evidence`（查报价来源）、`grandet_glossary`（中转站术语）、`grandet_list_apps`（支持的应用）。

## 它做三件事

**1. 查最低价。** 按你的模型和用法（聊天、编程、长输出）比较 grandet.ai 收录的中转站和官方报价，列出最低的几家，写明站点、建令牌时要选的分组、价格、单位和观察日期。

- 只按标价排，不替你判断哪家"好用"，也不复述站点自己吹的"满血""稳定"。
- 美元额度、人民币额度和现金价分开列，不拿不同单位比大小。
- 需要充值满多少、仅限会员这类门槛会写成一句提示；价格前后对不上的列为参考；写明只能在某个客户端用的分组，和你的应用不符时会折叠。

**2. 找免费额度。** 问"有没有免费的""能白嫖吗"，它会列出官方免费层、试用额度和中转站的签到、注册赠金、免费分组，并写明要不要绑卡、实名或申请。你说过的条件刚好符合某个免费额度时，它也会顺带提一句。

**3. 帮你接上。** 你说"帮我接上"之后：

1. 你自己在站点上注册、充值，建令牌时选它告诉你的分组；
2. 你在自己的终端里运行一条命令保存 Key，输入时不显示，Key 不进对话；
3. 它先给你看要改的配置，备份原文件，你确认后才写入；
4. 它用不扣费的方式检查 Key、分组和模型名对不对；
5. 想撤销就说"恢复"。

Codex、Claude Code、OpenCode、Kilo Code、Continue、Gemini CLI、Hermes、OpenClaw 和 WorkBuddy 由 Skill 自带的接入程序（`scripts/connect.mjs`，也能作为本机 MCP 使用）改配置，每一步都一样；其他应用会给你一张填写卡片和官方文档链接。在云端聊天里用时，它只能把命令和配置交给你自己执行。

## 可以这样问

> 每月两千万 token，四分之一输入、其余输出，不用缓存，最便宜的是哪家？每月多少钱？

> 有没有能免费用 Gemini 的 API？我没有信用卡。

> 就用第二家，帮我接到 Windows 上的 Codex。

> "官转"和"逆向"是什么意思？

回答会附价格来源链接。标价和站点的说法不代表质量；问到质量、速度、降智时，它只说 Grandet 有记录的部分，没有实测就直说没有。

## Grandet 包括什么

| | 用途 |
|---|---|
| **[grandet.ai](https://grandet.ai)** | 比较模型 API 价格，官方、推理服务商和中转站分开；查看供应商、免费额度和赠金，核对来源和观察日期 |
| **Grandet Skill** | 在你的 Agent 里查最低价、找免费额度、把选好的 API 接到应用上 |
| **[MCP 服务](https://grandet.ai/mcp)** | 同样的查价和免费额度查询，任何 MCP 客户端都能用，匿名、无需 Key |

## 版本记录

所有构建的产品版本号都是 0.3.0，区别在构建号。构建的 tag 是 `skill-v0.3.0-build.<构建号>`（例如 `skill-v0.3.0-build.20261018b`）。每个 tag 和它的安装包都留在 [GitHub Releases](https://github.com/hanzohanzhe/Grandet/releases) 上，哪一个都能用[上面的 git 命令](#用-git-安装)装。官网装的是 **20261018b（j2）**。

从 20261017 起，每个构建发布前都和上一个构建比过：同样 48 道题，在 Hermes 里用 deepseek-v4.1-flash 和 glm-5.3 各问一遍。**PASS** 表示各项指标都达标；**HOLD** 表示有指标没达标，这些构建是逐项看过没达标的原因后才发布的。「用上 Skill」指通过 Skill 作答的会话数。

### 怎么选

- **大多数人：20261018b（j2）。** 官网装的就是它，目前测试结果最好。连不上 grandet.ai 时，它还能用 2026 年 10 月 18 日的价格快照回答，并且先说明快照日期。代价是安装包最大（ZIP 522 KB，`.skill` 218 KB）。
- **不要快照、包小一点：20261018（i8）。** ZIP 436 KB。连不上 grandet.ai 就答不了；测试里查分组条件的 16 个会话有 1 个去请求了网站已下线的页面。
- **只用中文、想让中转站术语题少花 token：20261017（i5）。** 20261017b 给术语表加了英文列，文件从 33.9 KB 涨到 64.2 KB。20261017 没有英文列，也不能接 WorkBuddy，没有点名站点对比，GitHub 慢时不会在 30 秒后改用 SkillHub。
- **想要更长的回答：20261016h 或更早。** 这些版本没有 8 行限制（h 的回答中位数 841 字，20261017 是 484 字），但请求不存在地址的次数多得多（48 道题 18 次参数错误，后者是 0）。拿 j2 和 20261016c 做过一次小规模对比（32 道题，deepseek-v4.1-flash）：用上 Skill 90% → 100%，每题 API 错误 0.47 → 0.03，回答中位数 890 → 530 字。
- **原生 Windows 别用 20261016d 之前的版本。** 它们的 Node 安装器在 Windows 上可能报 EPERM，只能手动复制文件夹。20261016e 之前没有给中国大陆用的 SkillHub 下载；20261016h 之前的描述，较弱的模型更不容易触发（A/B 测试里 47% 对 85%）。
- 每个构建都是按当时的网站接口写的。网站之后改过，越旧的版本越可能请求已经不存在的页面或字段。

### 全部构建

| 构建 | 发布时间（UTC） | 改了什么 | 和上一个构建比 |
|---|---|---|---|
| **20261018b**（j2）· 官网 · Latest | 2026-10-18 | 带价格快照（469 个模型、174 条免费额度），连不上 grandet.ai 时用；分组条件改从价格数据取，不再访问已下线的页面；沿用上一轮的报价会标出来；模型名找不到时给最多 5 个候选 | PASS 18/18 · 用上 Skill 96/96（和 20261018 相同）· 报价和 Grandet 数据一致 97.4% → 100% · token ×1.04 |
| 20261018（i8） | 2026-10-18 | 用户点名的站点从看板前 20 行里比；GitHub 慢 30 秒就改用 SkillHub | PASS 15/15 · 用上 Skill 95/96（相同）· token ×0.90 · 点名站点题绕路查询 10/16 → 2/16 · 报价 36/36 一致 |
| 20261017b（i7） | 2026-10-18 | 术语表加英文列；英文回答保留中转站原来的分组名；能接 WorkBuddy | HOLD 11/13 · 用上 Skill 95/96（相同）· token ×1.03 |
| 20261017（i5） | 2026-10-17 | 只发文档里写明的请求，不猜路径；写明参数上限；回答不超过 8 行、600 字 | HOLD 10/13（只跑了 deepseek）· 用上 Skill 47/48（h 是 48/48）· 参数错误 18 → 0 · 回答中位数 841 → 484 字 |
| 20261016h | 2026-10-16 | 描述开头写中转站黑话（A/B 测试触发率 47% → 85%）；没有 MCP 工具的宿主也有现成的只读请求；赠金额度不和现金价比较 | 没跑 |
| 20261016g | 2026-10-16 | 存 Key 的文件只有本人可读（0600）；新增一节说明 Skill 会改你电脑上的哪些东西；自动加载时只查价 | 没跑 |
| 20261016f | 2026-10-16 | 按 Agent 测试报告修回答（编程用量、模型名照原样、免费额度截止时间）；各平台的副本能通过自己的清单校验 | 没跑 |
| 20261016e | 2026-10-16 | 中国大陆可从腾讯 SkillHub 下载；各平台上架完整安装包 | 没跑 |
| 20261016d | 2026-10-16 | 安装器支持原生 Windows；新增 `--uninstall`；第一个上架 ClawHub 和 SkillHub 的构建 | 没跑 |
| 20261016c | 2026-10-16 | 接入时不再显示应用里已有的 Key；能接 Hermes 和 OpenClaw | 没跑 |
| 20261016b | 2026-10-16 | 改用官网首页的安装句子；只有旧报价的模型也能回答 | 没跑 |
| 20261016 | 2026-10-16 | 读官方和推理服务商的现金价，和中转站赠金额度分开列 | 没跑 |
| 20261015e | 2026-10-15 | 接入程序修复：撤销能原样恢复文件 | 没跑 |
| 20261015d | 2026-10-15 | 新增接入程序（`scripts/connect.mjs`，也能当本地 MCP 服务） | 没跑 |
| 20261015c | 2026-10-15 | 修好术语表查询；请求带明确的 User-Agent，网络错误重试一次 | 没跑 |
| 20261015b | 2026-10-15 | 读网站新增的免费额度和报价字段 | 没跑 |
| 20261015 | 2026-10-15 | 重写：查最低价、找免费额度、接入 API、中转站术语表 | 没跑 |
| 20261014 | 2026-10-14 | Skill 和 0.3.0 相同，加了安装器和安装回执 | 没跑 |
| 0.3.0（tag `skill-v0.3.0`） | 2026-10-14 | 第一个公开试用版，没有安装回执 | 没跑 |

`skill-v0.3.1` 是发布前撤回的候选版，不要用。

## 反馈

遇到问题请[提 Issue](https://github.com/hanzohanzhe/Grandet/issues)，写明应用、版本、系统和卡在哪一步。不要贴 API Key 或私人对话。

## 数据与开发者入口

| 内容 | 入口 |
|---|---|
| 免费额度与赠金目录 | [可读版](CATALOGUE-v3.md) · [JSON](data/free-tokens-v3.json) · [发布信息](data/RELEASE-v3.json) |
| 原始目录与来源 | [目录](CATALOGUE.md) · [JSON](data/free-tokens.json) · [清单](data/MANIFEST.json) |
| 仓库数据索引 | [机器可读索引](catalogue-index.json) · [给 AI 的阅读入口](llms.txt) |
| Agent 查价（MCP） | 匿名 Streamable HTTP：`https://grandet.ai/mcp` |
| HTTP 查价 | `https://grandet.ai/api/v1/board` · [接口说明](https://grandet.ai/public-data/price-finder.json) |
| HTTP 查免费额度 | `https://grandet.ai/api/v1/free-credits?q=gemini` |
| 中转站黑话表 | [Skill 内置版](skills/grandet-api-price-finder/references/glossary.md) · [在线版](https://grandet.ai/public-data/relay-glossary.json) |

本地开发需要 **Node.js 20+**，不依赖第三方包：

```sh
node scripts/catalogue.mjs validate
node scripts/catalogue.mjs generate --check
node scripts/validate-public.mjs
node --test tests/*.test.mjs
node scripts/serve.mjs
```

`serve.mjs` 在 `http://127.0.0.1:8787/` 打开本地浏览页。这些命令只检查本地文件，不会更新官网价格。

欢迎提交带来源的更正和改进，见[贡献指南](CONTRIBUTING.md)和[整理方法](METHODOLOGY.md)。

## 友情链接

- [LINUX DO](https://linux.do)：新的理想型社区

## 许可

- Skill 相关文件：**Apache-2.0**。
- 目录代码和 Grandet 编写的文档：**AGPL-3.0-only**，范围见 [LICENSE](LICENSE)。
- 供应商数据、原文和商标归各自权利人所有；事实汇编不附带统一的开放数据许可。见 [DATA-LICENSE.md](DATA-LICENSE.md)、[TRADEMARKS.md](TRADEMARKS.md) 和各版本清单。

<!-- Installing agents: follow INSTALL.md. Product version 0.3.0. Reuse existing copies without forced download; no historical backfill. -->
