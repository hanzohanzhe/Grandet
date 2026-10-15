# Grandet

[English](README.md) · [官网](https://grandet.ai) · [安装说明](INSTALL.md)

**在你的 Agent 里一句话查到某个模型最便宜的 API，再让它帮你接到自己的应用上。**

## 安装

把这句话发给你正在用的 Agent（Codex、Claude Code、Cursor 等）：

```text
帮我安装 Grandet：https://github.com/hanzohanzhe/Grandet
```

剩下的 Agent 会自己做完；需要你登录或点确认时，它会告诉你点哪里。装好后新开一个对话，直接问：

> 我在 Claude Code 里写代码，帮我找最便宜的 Claude Sonnet 4.6 API。

不用提 Grandet，也不用再发文件。查价不需要注册账号或 API Key。想自己动手装，或者用的是 ChatGPT、Claude 网页版这类要上传技能文件的应用，看[手动安装](INSTALL.md#手动安装)。

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

Codex、Claude Code、OpenCode、Kilo Code、Continue 和 Gemini CLI 由 Skill 自带的接入程序（`scripts/connect.mjs`，也能作为本机 MCP 使用）改配置，每一步都一样；其他应用会给你一张填写卡片和官方文档链接。在云端聊天里用时，它只能把命令和配置交给你自己执行。

## 可以这样问

> 每月两千万 token，四分之一输入、其余输出，不用缓存，最便宜的是哪家？每月多少钱？

> 有没有能免费用 Gemini 的 API？我没有信用卡。

> 就用第二家，帮我接到 Windows 上的 Codex。

> "官转"和"逆向"是什么意思？

回答会附价格来源链接。标价和站点的说法不代表质量；问到质量、速度、降智时，它只说 Grandet 有记录的部分，没有实测就直说没有。

## Grandet 包括什么

| | 用途 | 状态 |
|---|---|---|
| **[grandet.ai](https://grandet.ai)** | 比较模型 API 价格，查看供应商、免费额度和赠金，核对来源和观察日期 | 已上线 |
| **Grandet Skill** | 在你的 Agent 里查最低价、找免费额度、把选好的 API 接到应用上 | 0.3.0 公开试用 |
| **[Grandet Personal](https://grandet.ai/product/)** | 桌面客户端：管理 API Key，多家供应商之间路由和回退，记录费用、速度和质量 | 私测中，暂无公开安装包 |

## 测试情况

在 Codex CLI 上用自然的中文提问实测过：查最低价、找免费额度、接到 Claude Code（写入配置、备份、免费检查）都能完成。用真实 Key 走完整条接入链路、以及其他应用的原生安装还在逐个测。能装上不等于每个应用都测试通过。

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

## 许可

- Skill 相关文件：**Apache-2.0**。
- 目录代码和 Grandet 编写的文档：**AGPL-3.0-only**，范围见 [LICENSE](LICENSE)。
- 供应商数据、原文和商标归各自权利人所有；事实汇编不附带统一的开放数据许可。见 [DATA-LICENSE.md](DATA-LICENSE.md)、[TRADEMARKS.md](TRADEMARKS.md) 和各版本清单。

<!-- Installing agents: follow INSTALL.md. Product version 0.3.0. Reuse existing copies without forced download; no historical backfill. -->
