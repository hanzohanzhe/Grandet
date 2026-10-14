# Contributing / 贡献

## Data corrections and new offers

Open an issue with the **correction** or **new offer** template and include:

- the record ID (for corrections);
- a primary public source and when you checked it;
- the original unit (tokens, credits, dollars …);
- every condition: eligibility, payment card, identity checks, expiry, renewal and other limits.

Keep what the source says separate from your own reading of it. Leave unknown values unknown rather than guessing, and don't drop paid conditions to make an offer look free.

Data you submit must name its owner and the basis for using it; a public URL doesn't grant rights to the page. Never submit credentials, account records, personal data, private page captures or database files.

## Code

Code contributions are licensed AGPL-3.0-only (Skill files: Apache-2.0). You need the right to contribute what you submit; there is no contributor licence agreement.

Before opening a pull request, run:

```sh
node scripts/catalogue.mjs validate
node scripts/catalogue.mjs generate --check
node --test tests/*.test.mjs
```

Update the data manifest's hashes and counts only on purpose, together with a reviewed snapshot.

## 中文

**更正和新增活动**：用 Issue 模板提交，写明记录 ID、主要来源、查看时间、原始单位，以及全部领取条件（资格、绑卡、实名、有效期、续费等）。来源原话和你的理解分开写；不知道的就写不知道，不要删掉付费门槛。数据要说明权利人和使用依据，不要提交账号、密码、个人信息或私有页面内容。

**代码**：采用 AGPL-3.0-only（Skill 文件为 Apache-2.0），无需签署 CLA。提交前运行上面三条命令。
