# Grandet

[English](README.md) · [官网](https://grandet.ai) · [安装说明](INSTALL.md)

**按你用的模型和用量，找便宜、好接的 API。**

## 安装

把这句话发给你正在用的 Agent（Codex、Claude Code、Cursor 等）：

```text
帮我安装 Grandet：https://github.com/hanzohanzhe/Grandet
```

剩下的 Agent 会自己做完。如果中途需要你登录或点确认，它会告诉你点哪里。

装好后新开一个对话，直接问：

> 我用 Claude Code 写代码，想用 Sonnet 4.6，帮我找便宜的 API，推荐一家，再给一个备选。

不用提 Grandet，也不用再发文件。查价不需要注册账号或 API Key。

想自己动手装，或者用的是 ChatGPT、Claude 网页版这类要上传技能文件的应用，看[手动安装](INSTALL.md#手动安装)。

全新安装默认使用[官方 skill-v0.3.0 Release 附件](https://github.com/hanzohanzhe/Grandet/releases/tag/skill-v0.3.0)，已有副本可直接复用。[安装回执与覆盖范围](docs/skills/installation-receipts.md)。

## 可以这样问

> 每月两千万 token，四分之一输入、其余输出，不用缓存。刚才那两家每月多少钱？

> apijing.com 的 Sonnet 4.6 会不会降智？有没有速度和稳定性的实测？

> 就用备选那家，告诉我在 Windows 的 Claude Code 里怎么接，简短点。

回答会写明价格的观察日期和来源链接，不同货币和平台额度分开列。标价和供应商的说法不代表质量；没有实测数据时会直接说没有。

## Grandet 包括什么

| | 用途 | 状态 |
|---|---|---|
| **[grandet.ai](https://grandet.ai)** | 比较模型 API 价格，查看供应商、免费额度和赠金，核对来源和观察日期 | 已上线 |
| **Grandet Skill** | 在你的 Agent 里直接问价，得到推荐、备选、依据和接入方法 | 0.3.0 公开试用 |
| **[Grandet Personal](https://grandet.ai/product/)** | 桌面客户端：管理 API Key，多家供应商之间路由和回退，记录费用、速度和质量 | 私测中，暂无公开安装包 |

Personal 计划中的功能：集中管理供应商账户和 Key；优先用掉已有额度并在供应商之间自动回退；预算和用量记录；响应速度和失败率统计；用 **Picky** 拿同一组问题对比各家的回答和评分。Picky 给的是对比依据，不保证模型身份或质量。

## 测试情况

Skill 已在 **Codex CLI** 上测试过（新对话里用中英文问价格和质量）；**Grok Bot** 测过一部分；其他应用还在逐个测。能装上不等于每个应用都测试通过。

遇到问题请[提 Issue](https://github.com/hanzohanzhe/Grandet/issues)，写明应用、版本、系统和卡在哪一步。不要贴 API Key 或私人对话。

可选回执工具是独立源码构建 `grandet-installation-receipts-source-20261014.1`，已过本机隔离文件测试。原 0.3.0 包保持原字节、不含新工具；宿主回执验收仍待实测。

## 数据与开发者入口

仓库里的 v3 快照收录 **73 个官方项目和 34 个第三方活动**，都是免费额度或赠金类机会。快照编制于 **2026-10-06**，每条记录保留原始观察日期和领取条件。这些是供你筛选的线索，不保证每个人都能领到。

| 内容 | 入口 |
|---|---|
| 当前机会目录 | [可读版](CATALOGUE-v3.md) · [JSON](data/free-tokens-v3.json) · [发布信息](data/RELEASE-v3.json) |
| 原始目录与来源 | [目录](CATALOGUE.md) · [JSON](data/free-tokens.json) · [清单](data/MANIFEST.json) |
| 仓库数据索引 | [机器可读索引](catalogue-index.json) · [给 AI 的阅读入口](llms.txt) |
| Agent 查价（MCP） | 匿名 Streamable HTTP：`https://grandet.ai/mcp` |
| HTTP 查价 | `https://grandet.ai/api/v1/board` · [接口说明](https://grandet.ai/public-data/price-finder.json) |

本地开发需要 **Node.js 20+**，不依赖第三方包：

```sh
node scripts/catalogue.mjs validate
node scripts/catalogue.mjs generate --check
node scripts/validate-public.mjs
node --test tests/catalogue.test.mjs
node scripts/serve.mjs
```

`serve.mjs` 在 `http://127.0.0.1:8787/` 打开本地浏览页。`catalogue.mjs` 和浏览页读的是原始目录 `data/free-tokens.json`，`validate-public.mjs` 检查 v3 数据。这些命令只检查本地文件，不会更新官网价格；`generate --check` 不写文件。

欢迎提交带来源的更正和改进，见[贡献指南](CONTRIBUTING.md)和[整理方法](METHODOLOGY.md)。

## 许可

- Skill 相关文件：**Apache-2.0**。
- 目录代码和 Grandet 编写的文档：**AGPL-3.0-only**，范围见 [LICENSE](LICENSE)。
- 供应商数据、原文和商标归各自权利人所有；事实汇编不附带统一的开放数据许可。见 [DATA-LICENSE.md](DATA-LICENSE.md)、[TRADEMARKS.md](TRADEMARKS.md) 和各版本清单。

<!-- Installing agents: fresh installs use the original skill-v0.3.0 Release attachment and optional separate receipt companion; follow INSTALL.md. Reuse existing copies without forced download. -->
