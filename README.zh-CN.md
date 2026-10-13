# Grandet

**比较 AI API 公开报价，发现免费与赠金额度，看清条件再选择。**

[English](README.md) · [官网](https://grandet.ai/zh-CN/) · [API 报价对比](https://grandet.ai/zh-CN/leaderboard/) · [免费与赠金机会](https://grandet.ai/zh-CN/free-tokens/) · [产品介绍](https://grandet.ai/zh-CN/product/)

Grandet 帮助开发者查找 AI API 服务商、公开报价和免费额度计划。官网将这些信息与来源证据、观察日期放在一起。本仓库提供可运行的目录工具和已审核的机会数据，方便你查看、校验，并在所列许可范围内使用。

## 从这里开始

| 你想做什么 | 入口 |
| --- | --- |
| 比较同一模型的服务商报价 | [打开报价榜](https://grandet.ai/zh-CN/leaderboard/)，查看原单位、适用条件和证据 |
| 查找免费层、试用或资助 | [在线浏览机会](https://grandet.ai/zh-CN/free-tokens/)，或阅读 [v3 完整目录](CATALOGUE-v3.md) |
| 在本机查看公开数据 | 运行下方无第三方依赖的目录工具 |
| 接入自己的工具或 AI 助手 | 使用下方「工具与 AI 读取入口」 |
| 修正一条信息 | 按 [贡献说明](CONTRIBUTING.md) 提供主来源与观察日期 |

## 现在可以使用什么

- **已上线网站：** 在 [grandet.ai](https://grandet.ai/zh-CN/) 查看模型与服务商报价、免费与赠金机会，以及 Grandet 产品介绍。
- **公开目录工具：** 本地浏览器目录、JSON 校验器、可复现的 Markdown 生成器和测试。不需要 API Key，也不调用付费 API。
- **已审核机会快照：** **73 项官方计划 + 34 项第三方公告机制**，包含 **642 个结构化前提字段**，分别记录申请、付费、绑卡、身份、邀请和续期要求；覆盖免费层、试用额度、创业资助、学生与科研机会。

**桌面客户端及安装包尚未公开发布。** 本仓库也未发布完整客户端与网站源码。实际状态见 [网站与发布状态](WEBSITE-STATUS.json)，后续方向见 [路线图](ROADMAP.md)。

## 本地运行目录

需要 **Git 和 Node.js 20+**，无需安装第三方依赖。

```sh
git clone https://github.com/hanzohanzhe/Grandet.git
cd Grandet
node scripts/catalogue.mjs validate
node scripts/catalogue.mjs generate --check
node scripts/validate-public.mjs
node scripts/serve.mjs
```

打开 **http://127.0.0.1:8787/**，即可搜索、筛选并展开卡片，查看完整公开 JSON 和来源链接。服务仅监听本机；按 `Ctrl+C` 停止。

本地浏览器工具与 `catalogue.mjs` 读取保留的**初始快照** `data/free-tokens.json`。单独审核的 **v3 快照**可通过 [JSON](data/free-tokens-v3.json) 或 [Markdown](CATALOGUE-v3.md) 阅读，由 `validate-public.mjs` 校验。上述命令只校验本地文件，不刷新机会，也不下载官网全量价格库。`generate --check` 不写文件；确需重建初始 Markdown 目录时才去掉 `--check`。

## 先看条件，再看额度

“免费 Token”是发现入口。记录保留额度点、金额标签、优惠券、活动凭证等原单位，不自动换算成 Token 或现金。充值、邀请、实名、期限、抽奖与续期条件完整保留，关闭或冲突的公告也有记录。

收录不代表你符合资格、已成功领取，也不证明上游真实性或端点质量。**未知不等于没有门槛。** 107 条记录是计划与公告机制，不代表今天有 107 项人人可领的福利；目录也不宣称覆盖全网。

v3 汇编日期为 **2026-10-06**，每条记录保留自己的原观察日期；整理与重新排版不会刷新观察时间。更新需人工审核，自动刷新尚未启用，仓库与网站版本可能不同。使用前请阅读 [方法说明](METHODOLOGY.md)，并核对提供方的现行条款。

## 工具与 AI 读取入口

| 入口 | 内容 |
| --- | --- |
| [仓库索引](catalogue-index.json) · [原始 JSON](https://raw.githubusercontent.com/hanzohanzhe/Grandet/main/catalogue-index.json) | 本仓库公开数据与文档的起点 |
| [v3 事实数据](data/free-tokens-v3.json) · [原始 JSON](https://raw.githubusercontent.com/hanzohanzhe/Grandet/main/data/free-tokens-v3.json) | 全部 107 条审核记录、完整结构化条件、证据与原日期 |
| [v3 发布清单](data/RELEASE-v3.json) | SHA-256、字节数、记录数与观察时间政策 |
| [v3 完整 Markdown](CATALOGUE-v3.md) | 可直接阅读的记录及其全部公开字段 |
| [AI 阅读指南](llms.txt) | 入口链接和解释规则 |
| [官网 AI 索引](https://grandet.ai/ai-index.json) · [官网阅读指南](https://grandet.ai/llms.txt) | 官网已发布目录与数据清单的发现入口 |

提取或转述时，请一起保留单位、日期、证据和前提条件；需要可复现结果时固定发布清单。官网索引连接后续数据，并非一个文件已经包含整个报价档案。机器入口公开可读不等于搜索引擎或 AI 已经收录。

[初始 JSON](data/free-tokens.json)、[初始清单](data/MANIFEST.json) 与 [初始 Markdown](CATALOGUE.md) 继续保留。旧发布清单保留当时状态；后续网站上线状态见 [WEBSITE-STATUS.json](WEBSITE-STATUS.json)。

## 参与改进

欢迎纠错、补充有来源的机会，或改进公开工具。请提供记录 ID、公开主来源、观察日期、原单位，以及完整的资格、付费、续期和到期条件；将来源声明与个人解释分开。不要提交凭据、账号记录、个人信息或私有采集正文。详见 [CONTRIBUTING.md](CONTRIBUTING.md)。

提交修改前，运行上方三条校验命令，再执行：

```sh
node --test tests/catalogue.test.mjs
```

如果 Grandet 对你有用，欢迎**自愿点 Star**，方便日后找回，也让我们知道这项工作有帮助。使用公开工具和阅读数据不需要 Star。

## 许可与来源权利

原创公开工具、浏览器代码及 Grandet 编写的项目文档，在 [LICENSE](LICENSE) 指定范围内使用 **AGPL-3.0-only**。

供应商数据、来源材料和商标保留各自权利；事实汇编**没有统一开放数据许可**。供应商整段原文与引文、私有采集正文和运行数据库不在公开内容内；来源链接及哈希也不授予转载权。再分发前请阅读 [DATA-LICENSE.md](DATA-LICENSE.md)、发布清单与 [TRADEMARKS.md](TRADEMARKS.md)。
