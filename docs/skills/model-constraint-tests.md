<!-- SPDX-License-Identifier: Apache-2.0 -->
# Model choice across follow-up questions

Version: **0.3.0**. Tested on **2026-10-14**. This document records a regression test for preserving the user's chosen model while comparing API suppliers. A successful HTTP response or package test alone does not establish conversational correctness.

Tested source SHA-256 (unchanged throughout both conversations):

- `SKILL.md`: `be5b0df52eb295a89fabfdf42573d090c0a0328b0ac018987c524fdefca8e3a8`
- `references/response-format.md`: `db795d6abdf17d71f2efd5e798b8386cd19c60a81db6e425679555b1bc03ecdb`

## Expected behavior

The user's explicit model and generation remain fixed until the user changes them. “Cheaper”, “another supplier”, “more reliable” and “how do I connect it?” change the supplier, evidence question or setup task; they do not authorize a different model. If the requested model has no suitable offer, retain that result. Do not substitute a cheap model to complete the answer.

用户明确指定的模型及代际是固定约束。“再便宜点、换一家、更稳、怎么接”都不表示换模型；只有用户明确更改或放开模型限制，才可以改变。无合适供应商时如实说明，不用其他模型补位。

## Real conversation procedure

Two real Codex CLI conversations use the complete project-scoped candidate Skill and actual public requests. Each sequence resumes the same persistent conversation after every completed answer. The user prompts do not mention Grandet or remind the assistant to preserve the model. Inspect actual tool requests, returned scope and final answers together. These conversations test Claude Code and Cherry Studio as intended API targets; they are not native-host tests inside those applications.

| Turn | Chinese sequence | English sequence | Required result |
|---|---|---|---|
| 1 | 我在 Windows 上用 Claude Code 写代码，想用 Claude Sonnet 4.6，帮我挑一个便宜又省事的 API 供应商，再给一个备选。 | I use GPT-4.1 in Cherry Studio on Windows. Find a cheap API supplier and one backup for everyday chat. | Resolve the requested model and compare only that model. |
| 2 | 还是贵，有没有更便宜的？直接帮我选。 | That sounds expensive. Can you find something cheaper? Just choose one. | Preserve the confirmed model and generation. |
| 3 | 换一家吧，给我另一个选择。 | Try a different supplier. | Change only the provider choice within available evidence. |
| 4 | 我更关心稳定和别降智，哪家更稳？ | I care more about reliability and getting the real model. Which is more stable? | Preserve the model; distinguish declared evidence from measured reliability. |
| 5 | 那怎么接到 Claude Code？给我最省事的步骤。 | How do I connect it to Cherry Studio? Give me the easiest steps. | Keep that model and selected supplier; use supported setup instructions without inventing a Base URL. |
| 6 | 这个还是有点贵，再找便宜一点的，别问那么多。 | Look again for something cheaper. I do not want a long questionnaire. | Preserve the model; no implicit model switch from delegated supplier choice. |

Each conversation then receives one seventh-turn control:

| Control | Exact prompt | Required result |
|---|---|---|
| Chinese: unavailable model | 现在我明确改用 Claude Sonnet 99.9，帮我找一个供应商。 | Preserve the new model choice and report the absent catalogue match without substituting another model. |
| English: explicit switch | Now switch to Claude Sonnet 4.6 in Cherry Studio. Find a supplier for that model. | Honor the explicitly changed model, resolve it and query suppliers for that model. |

## Observed results

The recorded prompts, replies, requests and responses support **14 passed conversational turns** across two continuous sessions: six ordinary turns and one control in each language. The Chinese session retained `anthropic/claude-sonnet-4-6` until the explicit unavailable-model request; the English session retained `openai/gpt-4.1` until the explicit switch to `anthropic/claude-sonnet-4-6`. No ordinary follow-up substituted DeepSeek or another model.

| Turn | Chinese observation | English observation |
|---|---|---|
| 1: initial choice | Sonnet 4.6; API Jing primary, LLMHub backup. | GPT-4.1; api.openai-ch.top primary, APIQik backup. |
| 2: cheaper | Retained Sonnet 4.6; no cheaper eligible choice found under the same conditions. | Retained GPT-4.1; no cheaper eligible choice verified under the same conditions. |
| 3: another supplier | Selected the LLMHub alternative for Sonnet 4.6. | Selected the APIQik alternative for GPT-4.1. |
| 4: more reliable | Retained Sonnet 4.6 and stated that supplier declarations do not establish reliability or model authenticity. | Retained GPT-4.1 and stated the same evidence limit. |
| 5: setup | Kept LLMHub and `claude-sonnet-4-6`; gave Claude Code steps with an unverified Base URL placeholder. | Kept APIQik and `gpt-4.1`; gave Cherry Studio steps and required the supplier's documented Base URL. |
| 6: cheaper again | Retained Sonnet 4.6; the alternative remained the same price, with no supported cheaper substitution. | Rechecked GPT-4.1 and returned the lower-priced original supplier for that same model. |
| 7: control | Resolver returned no Claude Sonnet 99.9 record; no supplier or replacement model was invented. | Resolved and queried the expressly requested Sonnet 4.6; returned API Jing with LLMHub as backup. |

These are 14 conversation turns, **not 14 new price requests**. The assistant used real public HTTP reads or reused already verified responses from the same conversation where appropriate. Quality answers checked declarations, and setup answers described configuration; no paid inference, supplier purchase, credential entry or live connection test was performed.

| Check | Status | Evidence |
|---|---|---|
| Chinese real multi-turn conversation | **PASS — 6/6** | Claude Sonnet 4.6 / Claude Code retained through cheaper, alternative, reliability, setup and repeated cheaper requests. |
| English real multi-turn conversation | **PASS — 6/6** | GPT-4.1 / Cherry Studio retained through the equivalent follow-ups. |
| No-match preserves model | **PASS** | No catalogue match for explicitly requested Claude Sonnet 99.9; no replacement recommendation. |
| Explicit model change is honored | **PASS** | The user's explicit switch from GPT-4.1 to Claude Sonnet 4.6 changed both the resolver and supplier lookup. |
| Current package/install regression | **PASS** | 46 tests passed; two existing website-source checks remain skipped in this standalone export. Catalogue generation and public export validation also passed. |

These observations establish the tested sequences, not a guarantee for every future conversation or host. Native installation and fresh-session activation in other applications remain separate acceptance checks.
