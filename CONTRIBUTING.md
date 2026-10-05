# Contributing / 贡献

Use the correction or new-offer issue template. Include the record ID, primary public source, when you observed it, original unit, eligibility, payment/card/identity requirements, expiry, renewal and limitations. Separate a factual source statement from your interpretation. Do not replace unknown values with guesses or strip paid conditions to make an offer look free.

Code contributions use AGPL-3.0-only. Data submissions must name the owner and the permission/license basis; submitting a public URL does not grant rights to its page. Do not submit credentials, account records, personal data, private page captures or database files. Contributors should have the right to contribute their own work; no contributor license agreement is required by this initial hub.

Run `node scripts/catalogue.mjs validate` and `node scripts/catalogue.mjs generate --check` before proposing changes. Update the data hash/counts manifest intentionally with reviewed snapshots. Negative validation tests: `node --test tests/catalogue.test.mjs`.

中文：提交记录ID、主来源、观察时间、原单位及全部资格/付费/续费/期限限制。未知不猜；不得删除门槛。数据需说明权利人及许可依据，不提交私有正文或账号资料。新增源码沿用AGPL-3.0-only。
