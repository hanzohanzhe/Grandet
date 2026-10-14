<!-- SPDX-License-Identifier: Apache-2.0 -->
# Model choice and name recovery across follow-up questions

Version: **0.3.0**. Updated on **2026-10-14**. This document distinguishes the completed fixed-model regression from the new model-name recovery regression. A successful HTTP response or package test alone does not establish conversational correctness.

## Current name-recovery behavior

Keep an exactly identified model fixed. If the requested name does not resolve uniquely, offer one or two plausible names verified in the catalogue and ask one short confirmation question. Do not query prices for a different model or generation before confirmation. If the user insists on an exact unlisted ID, retain it and explain the catalogue gap rather than repeating suggestions. An empty catalogue does not prove a model does not exist, and a resolved model with no eligible offers is a price-availability result, not a spelling mistake.

准确识别的模型号保持不变。名称无法识别时，先用目录核实近似名称，问一句“你指的是 X 还是 Y？”，确认前不替换查价。用户坚持精确型号时遵从，不反复纠正；目录未收录不等于型号不存在。型号已识别但没有报价时，保留无报价结果，不把它当作写错型号。

Current source SHA-256:

- `SKILL.md`: `c70204d2adfec3b2d28fc68f311d3906e17af3d12798851c6a94be1d494bf60f`
- `references/response-format.md`: `a112496be3023d3ba5717de3ab9ec63d83f24aa76888229bb48482b3f8ee3406`

### Current real-conversation regression — completed

Two real, continuous Codex CLI conversations loaded all ten files of this candidate. Each follow-up resumed the same persistent session. User prompts did not mention Grandet or remind the assistant to load a Skill. Actual public catalogue reads, captured responses and final replies were inspected together. All **14 conversational turns** met the tested model-choice and name-recovery requirements. Claude Code and Cherry Studio are intended API targets here, not the native host in which these tests ran.

| Turn | Chinese sequence | English sequence | Required result |
|---|---|---|---|
| 1 | Ask for Claude Sonnet 99.9 for Claude Code. | Ask for GPT-4.11 for Cherry Studio. | Offer verified plausible names and ask a short confirmation; do not substitute or price a candidate yet. |
| 2 | Confirm Claude Sonnet 4.6. | Confirm GPT-4.1. | Query the user's confirmed exact model. |
| 3 | Ask for something cheaper and delegate the choice. | Same. | Retain the confirmed model. |
| 4 | Ask for another supplier. | Same. | Retain the model; change only supplier choice. |
| 5 | Ask for reliability and model authenticity. | Same. | Retain the model and distinguish declarations from measured evidence. |
| 6 | Ask how to connect. | Same. | Retain the model and chosen supplier without inventing connection details. |
| 7 | Insist on the exact Claude Sonnet 99.9 ID without replacement. | Explicitly switch to Claude Sonnet 4.6. | Respect the user's exact instruction: no repeated suggestions in Chinese; honor the new model in English. |


### Current observations

| Turn | Chinese observation | English observation |
|---|---|---|
| 1: name clarification | No exact Sonnet 99.9 match; a focused Sonnet-family lookup verified Sonnet 4.6 and Sonnet 5. Asked which was intended, without a price query. | The GPT-4.11 search produced a fuzzy GPT-4-1106 result, which was not accepted as the user's intended model. A focused GPT-4.1 lookup verified that candidate; asked for confirmation without a price query. |
| 2: explicit confirmation | After the user confirmed Sonnet 4.6, queried `anthropic/claude-sonnet-4-6` for Claude Code and recommended API Jing with LLMHub as backup. | After the user confirmed GPT-4.1, queried `openai/gpt-4.1` for Cherry Studio and recommended api.openai-ch.top with APIqik as backup. |
| 3: cheaper | Kept Sonnet 4.6 and selected bearlab.ai from the CNY-credit board. The answer explicitly stated that recharge conversion was unverified and that savings against the previous USD-credit quote could not be established. This is **not evidence of a cheaper cash cost**. | Expanded the same GPT-4.1 comparison and kept api.openai-ch.top; found no cheaper eligible USD-credit offer in that comparison. |
| 4: another supplier | Kept Sonnet 4.6 and chose code.aigcpro.org; explicitly stated that its declared CNY-credit price was higher than the preceding supplier's. | Kept GPT-4.1 and chose APIqik; explicitly stated that its declared USD-credit price was higher than the preceding supplier's. |
| 5: reliability | Inspected declarations for the two Sonnet 4.6 suppliers and did not invent a quality or stability winner. | Inspected the GPT-4.1 declarations and did not present group labels or prices as proof of authenticity or reliability. |
| 6: setup | Read the selected supplier's setup and API-address documentation. Preserved `claude-sonnet-4-6` despite another model in the supplier's example; no configuration was applied. | Kept APIqik and exact `gpt-4.1`; gave Cherry Studio instructions and left the unverified API base URL for the supplier's documented value. |
| 7: user instruction | When the user insisted on exact Sonnet 99.9, retained that requested ID, did not repeat near-name suggestions and requested its model/API page. Explicitly said the preceding Sonnet 4.6 setup did not meet this new requirement. | Honored the explicit switch to Sonnet 4.6: both the resolver and price query used `anthropic/claude-sonnet-4-6`, and setup used `claude-sonnet-4-6`. |

| Acceptance check | Result |
|---|---|
| Unrecognized name offers catalogue-backed clarification | **PASS — Chinese and English** |
| No substitute-model price request before confirmation | **PASS — zero board requests in both first turns** |
| Confirmed exact model retained through cheaper / another supplier / reliability / setup | **PASS — both sequences** |
| Reaffirmed unlisted exact model is respected without repeated corrections | **PASS — Chinese turn 7** |
| Explicit model switch is honored | **PASS — English turn 7** |
| Package and installer regression for this candidate | **PASS — 46 tests, 0 failures; 2 existing website-source checks skipped** |
| Catalogue generation, public file validation and local documentation links | **PASS** |

The source hashes above remained unchanged in all fourteen turns and match the packaged common Skill. The two first turns performed model identification only; later turns used live reads or reused verified responses already in the same conversation. The recorded Grandet HTTP traffic was **5 model-catalogue reads, 5 board requests and 4 price-evidence reads**. Fourteen conversation turns therefore do not mean fourteen new price requests. No paid inference, supplier purchase, credential entry or application-setting change was made.

The setup answers were checked for model preservation and source-grounded instructions, not by connecting a paid provider. A successfully resolved model with no eligible supplier remains a documented no-substitution rule; that distinct empty-offer scenario was not exercised in this run. These results cover the stated conversations in Codex CLI, not every host or every possible conversation.

## Previous fixed-model regression — historical evidence

The results below apply to the earlier source published in commit `d4af24d6ca9fae98d411f1f8b6c240e383f4bdb2`. The twelve ordinary follow-up turns and explicit-switch control remain useful regression evidence for that source. The old Chinese no-match control checked only that no model was substituted: its expectation of merely reporting the missing match has been superseded by the current name-recovery behavior above. It is not acceptance evidence for the new clarification experience.

Previous tested source SHA-256 (unchanged throughout both historical conversations):

- `SKILL.md`: `be5b0df52eb295a89fabfdf42573d090c0a0328b0ac018987c524fdefca8e3a8`
- `references/response-format.md`: `db795d6abdf17d71f2efd5e798b8386cd19c60a81db6e425679555b1bc03ecdb`

### Previous expected behavior

The user's explicit model and generation remain fixed until the user changes them. “Cheaper”, “another supplier”, “more reliable” and “how do I connect it?” change the supplier, evidence question or setup task; they do not authorize a different model. If the requested model has no suitable offer, retain that result. Do not substitute a cheap model to complete the answer.

用户明确指定的模型及代际是固定约束。“再便宜点、换一家、更稳、怎么接”都不表示换模型；只有用户明确更改或放开模型限制，才可以改变。无合适供应商时如实说明，不用其他模型补位。

### Previous real conversation procedure

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
| Chinese: unavailable model (historical; superseded) | 现在我明确改用 Claude Sonnet 99.9，帮我找一个供应商。 | Preserve the new model choice and report the absent catalogue match without substituting another model. |
| English: explicit switch | Now switch to Claude Sonnet 4.6 in Cherry Studio. Find a supplier for that model. | Honor the explicitly changed model, resolve it and query suppliers for that model. |

### Previous observed results

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
| No-match preserves model (historical; recovery expectation superseded) | **PASS for previous no-substitution check only** | No catalogue match for explicitly requested Claude Sonnet 99.9; no replacement recommendation. |
| Explicit model change is honored | **PASS** | The user's explicit switch from GPT-4.1 to Claude Sonnet 4.6 changed both the resolver and supplier lookup. |
| Previous package/install regression | **PASS** | 46 tests passed; two existing website-source checks remain skipped in this standalone export. Catalogue generation and public export validation also passed. |

These observations establish the tested sequences, not a guarantee for every future conversation or host. Native installation and fresh-session activation in other applications remain separate acceptance checks.
