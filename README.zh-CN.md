# Grandet — 免费 API 与赠金额度目录

[English](README.md) · [完整目录](CATALOGUE.md) · [方法说明](METHODOLOGY.md)

这里提供可运行的开源目录工具，以及有观察日期、原始条件和来源链接的 **73 项官方项目 + 34 项第三方公告机制**：免费层、试用额度、创业申请、学生科研、开发者与有条件奖励。

“free tokens”只是发现入口。额度点、金额标签、优惠券和活动凭证保留原单位，不统一换成 Token 或现金。充值、邀请、实名、期限、抽奖、关闭与冲突公告全部保留。收录不代表人人可领、已领取或全网穷尽。

汇编日期：**2026-10-05**。每条记录保留原观察日期；汇编日期不续原观察。本仓库保留固定初始审核事实导出，不会自动同步网站最新 v3 DTO；仓库与网站的发布版本可以不同。

## 本地运行

需要 Node.js 20+，无第三方依赖。

```sh
node scripts/catalogue.mjs validate
node scripts/catalogue.mjs generate
node scripts/serve.mjs
```

打开终端打印的本机地址。可搜索、筛选并展开完整 JSON；Markdown保留衍生公开版的全部字段；供应商整段原文及引文不重刊，结构化条件与我们补写的事实摘要均可读。`generate --check`只检查生成物是否一致，不写文件。

## 当前状态

这是目录工具与已审核公开数据候选的初始仓库。Grandet 桌面客户端和完整网站源码尚未在本仓库发布；grandet.ai 尚未通过正式部署验收。没有在线服务、客户端下载或自动更新已完成的承诺。本工具不调用付费 API。

## 参与与许可

请按 [贡献说明](CONTRIBUTING.md) 提交公开主来源、观察时间和完整条件；不要提交账号凭据、个人信息或私有采集正文。计划见 [ROADMAP.md](ROADMAP.md)。

新增工具与浏览器代码沿用 AGPL-3.0-only。此软件许可不覆盖供应商数据、引文和商标。现有 [数据许可边界](DATA-LICENSE.md) 保留；[数据清单](data/MANIFEST.json) 明确数据候选及逐项来源权利与公开范围，不虚构统一开放数据许可。公开网页可访问不等于已授权转载。

This GitHub publication is derived from reviewed snapshot SHA-256 `581a6fcd246070d9a69eacdbbebe1630d734c67c3c168ccf3680fbdcf27f405b`; it is not byte-identical to the website DTO. 官方对象不变，第三方移除整段原文并保留结构化事实，未刷新观察时间。
