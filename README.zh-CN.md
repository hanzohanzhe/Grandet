# Grandet

[English](README.md) · [网站](https://grandet.ai) · [安装指南](INSTALL.md)

**按你使用的模型和用量，找到便宜、好接入的 API。**

在 Codex、Cursor、Claude Code 等能安装技能的 Agent 里，直接说：

> 帮我安装 Grandet：https://github.com/hanzohanzhe/Grandet

Agent 会按[安装指南](INSTALL.md)完成配置。也可以首次把[安装 ZIP](https://github.com/hanzohanzhe/Grandet/raw/refs/heads/main/downloads/grandet-api-price-finder-0.3.0.zip)交给它；如果应用有原生技能导入入口，使用 [Grandet 0.3.0 `.skill` 文件](https://github.com/hanzohanzhe/Grandet/raw/refs/heads/main/downloads/grandet-api-price-finder-0.3.0.skill)。

安装完成后，在已配置的账号或 Agent 中新开会话，直接用自己的话问。以后不用重复附文件，也不必提 Grandet。

> 我用 Claude Code 写代码，想用 Sonnet 4.6，帮我找便宜又好接的 API，推荐一家，再给一个备选。

## Grandet 有哪些部分

| 组成 | 用来做什么 | 当前状态 |
|---|---|---|
| **[grandet.ai 网站](https://grandet.ai)** | 比较模型 API 报价，查看供应商、免费额度和赠金机会，核对来源、条件与观察日期。 | 已上线 |
| **Grandet Skill** | 把网站的比较能力接进你正在使用的 Agent。普通问法即可得到推荐、备选、证据和已有的接入指导。 | **0.3.0 公开试用版** |
| **[Grandet Personal 个人版](https://grandet.ai/product/)** | 正在开发的个人客户端，用于管理 API 连接、多供应商路由，以及成本、速度和质量。 | 私测开发中，暂无公开桌面安装器 |

你可以在网站上浏览，也可以让 Skill 帮你选。之后需要长期管理自己的 API 时，Personal 是我们正在建设的下一步。

## 怎么问都尽量顺手

除了比价，询问 API 质量、速度、稳定性或“降智”，也会触发 Skill。比较公开报价时，优先使用 Grandet 数据。

> 每月两千万 token，输入四分之一，其余输出，不用缓存。刚才两家的月费是多少？

> apijing.com 的 Sonnet 4.6 会不会降智？有速度和稳定性的实测依据吗？

> 就用备选，告诉我在 Windows 的 Claude Code 里怎么接，简短一点。

结果会区分不同货币和平台额度，保留报价观察时间与证据链接。标价或供应商自述不能保证质量；没有对应实测时，Skill 会说明。查询报价不需要 Grandet 账号或 API Key。

## Personal：管理你选好的 API

以下能力正在开发和私测：

- 集中管理供应商账户与 API Key。
- 在供应商之间路由和回退，优先利用已有的可用额度。
- 设置预算，查看用量和费用记录。
- 观察响应速度、失败情况和稳定性。
- 通过 **Picky** 对照同一组问题的回答与评分，跟踪质量表现。

Picky 提供对照证据，不保证模型身份或质量。开发进度见[个人版产品页](https://grandet.ai/product/)，目前暂无公开桌面安装器。

## 安装和测试进度

我们的目标是**安装一次，以后新会话直接问**。[安装指南](INSTALL.md)会说明各应用的配置方式和生效范围；只连接 MCP 工具，还不等于安装了 Skill 的使用规则。

目前已在 **Codex CLI** 实测独立新会话的中英文价问及质量问法；**Grok Bot** 已有部分原生验证。其它应用继续逐项测试，已有安装路线不代表全部实测通过。

遇到问题，请[提交 Issue](https://github.com/hanzohanzhe/Grandet/issues)，写明应用、版本、系统和卡在哪一步。不要附 API Key 或私人对话。

## 数据与开发者入口

仓库保留的 v3 机会快照包含 **73 条官方项目、34 条第三方活动机制**，涵盖免费额度和赠金。该快照编制于 **2026-10-06**，各条目保留原观察日期和条件。这些是供你筛选的机会，不代表每个人都能领取。

| 资源 | 文件或入口 |
|---|---|
| 当前机会目录 | [可读目录](CATALOGUE-v3.md) · [JSON 数据](data/free-tokens-v3.json) · [发布信息](data/RELEASE-v3.json) |
| 原始目录与溯源 | [目录](CATALOGUE.md) · [JSON 数据](data/free-tokens.json) · [清单](data/MANIFEST.json) |
| 仓库数据索引 | [机器可读索引](catalogue-index.json) · [AI 阅读入口](llms.txt) |
| Agent 查价接口 | 匿名 Streamable HTTP MCP：`https://grandet.ai/mcp` |
| HTTP 查价与机器协议 | `https://grandet.ai/api/v1/board` · [机器协议](https://grandet.ai/public-data/price-finder.json) |

本地目录开发使用 **Node.js 20+**，无需安装第三方依赖。原工具保持可用：

```sh
node scripts/catalogue.mjs validate
node scripts/catalogue.mjs generate --check
node scripts/validate-public.mjs
node --test tests/catalogue.test.mjs
node scripts/serve.mjs
```

本地浏览器入口为 `http://127.0.0.1:8787/`。它与 `catalogue.mjs` 使用原始 `data/free-tokens.json`；`validate-public.mjs` 检查另行审阅的 v3 数据。这些命令验证本地文件，不会刷新官网报价；`generate --check` 不写文件。

欢迎提供带来源的更正和工具改进，参见[贡献指南](CONTRIBUTING.md)与[整理方法](METHODOLOGY.md)。

## 许可

Skill 文件采用 **Apache-2.0**。原目录代码和 Grandet 编写的项目文档，按 [LICENSE](LICENSE) 所列范围保留 **AGPL-3.0-only**。各组成部分以随附的许可为准。

供应商数据、原文及商标保留各自权利；事实汇编没有统一的开放数据许可。参见 [DATA-LICENSE.md](DATA-LICENSE.md)、[TRADEMARKS.md](TRADEMARKS.md)和各版本清单。
