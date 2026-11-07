# Catalogue methodology / 目录整理方法

This catalogue is a dated snapshot of a systematic search finished on 2026-10-05. It is an index to check, not a live check of whether you qualify.

## How it was compiled

- **Official programmes.** A fixed list of 62 platforms plus 3 additions was searched, using at least two entry points per platform and two rounds of follow-up on gaps. A search attempt is not counted as evidence. Platforms with nothing confirmed, still pending, or ended/paid-only are kept in the coverage list.
- **The 73 official records** keep their primary source links, SHA-256 references to the page body, observation times, and billing and eligibility conditions. Labels distinguish model vendors, inference operators and platform programmes.
- **The 34 third-party cards** describe 24 announcement families from 19 sources. They are 34 mechanisms, not 34 guaranteed benefits. Each keeps its original unit, conflicting or withdrawn statements, payment conditions and date.

## What it does not claim

- Nothing is inferred about your eligibility, successful redemption, cash value, whether an upstream model is genuine, or endpoint quality.
- Unknown expiry dates stay unknown. Reformatting a record does not extend its observation date.
- SHA references identify evidence. They don't grant redistribution rights and don't prove a page is unchanged today.
- Private full-page captures and operational data are not published.

## Temporal validation contract

- Timestamp fields use the strict form `YYYY-MM-DDTHH:mm:ss[.fraction](Z|+HH:mm|-HH:mm)`. A timezone is mandatory; calendar days, clock values and numeric offsets must be real, so parser normalization is not accepted. Calendar-only fields use `YYYY-MM-DD` with Gregorian leap-year rules.
- In both catalogues this applies to `observationWindow.first/last`, `searchCoverage.checkedAt`, official-record `checkedAt`, official evidence `capturedAt`, third-party-record `observedAt`, and third-party evidence `observedAt`. The v1 derivation `observedAt` is also checked. `data/RELEASE-v3.json` uses a calendar date for `compiledAt` and strict timestamps for its observation window.
- Third-party `endAt` and v3 official `activityEndAt` are exact instants when known and remain `null` when unknown. Optional third-party `expiryUpperBound` and structured `activityDeadline.expiryUpperBound` values are strict timestamps. An exact end may equal, but may not be later than, its associated upper bound.
- A structured `activityDeadline` has a real calendar `date`. For the tracked `timezone: "unspecified"` contract, its conservative upper bound is exactly 12:00:00Z on the following calendar day: the latest possible exclusive end of that date over UTC-12 through UTC+14. An equivalent numeric-offset timestamp represents the same bound.
- Observation-window ordering is inclusive: `first` must be at or before `last`. No other chronology is inferred. In particular, `deadlineText` is never parsed, unknown dates remain unknown, historical offers may be observed after ending, record times need not be contained by the catalogue window, and neither snapshots nor `compiledAt` are compared with the current clock.

## Proposing an update

Give a primary public URL, when you checked it, the wording before and after, and every eligibility, payment, renewal, expiry and service condition. A reviewer checks identity, conflicts, privacy and rights before a new snapshot is accepted. Snapshots are immutable, and there is no automatic refresh.

This GitHub release is derived from reviewed snapshot SHA-256 `581a6fcd246070d9a69eacdbbebe1630d734c67c3c168ccf3680fbdcf27f405b` and is not byte-identical to the website data. Official records are unchanged; third-party records drop the full source text but keep the structured facts. Observation times were not refreshed.

## 中文

- 固定检索 62 个平台加 3 个补充，每个平台至少试两个入口，并对缺口追查两轮。检索过不算有证据；未确认、待查和已结束的平台都保留在覆盖清单里。
- 73 条官方记录保留来源链接、正文 SHA-256、观察时间和计费、资格条件。
- 34 张第三方卡片来自 19 个来源的 24 组公告，是 34 种活动机制，不是 34 个保证能领的福利。
- 不推断个人能否领取、能否兑现、上游是否正品或接口质量。未知的有效期保持未知，重新排版不会延长观察日期。
- 时间戳严格采用带 `Z` 或数字时区的 RFC 3339 形式，纯日期严格采用 `YYYY-MM-DD`（含公历闰年校验）；不接受解析器自动归一化出的无效日期。观察窗口要求 `first <= last`，精确截止时刻不得晚于对应上界（相等可以）。
- `timezone: "unspecified"` 的结构化日历截止日以上述日期次日 `12:00:00Z` 为保守排他上界，对应 UTC-12 至 UTC+14 的最晚可能结束时刻。不会从 `deadlineText` 推断日期；未知值仍为 `null`，历史活动可以在结束后被观察，也不会与当前时钟比较。
- 提交更新时请给出来源链接、查看时间、前后措辞和全部条件。审核通过后形成新的不可变快照，没有自动刷新。
- 本仓库数据由审核快照 `581a6fcd…` 衍生，与官网数据并非逐字节相同：官方记录不变，第三方记录去掉原文全文、保留结构化事实，观察时间未刷新。
