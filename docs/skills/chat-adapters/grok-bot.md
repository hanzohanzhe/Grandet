# Grandet 比价 · Grok Bot / API price finder for Grok Bot

## 安装一次 / Install once

第一次把本文件提供给 Grok Bot，然后只说：**帮我安装 Grandet。** 安装后另开会话，直接问你的 API 选型需求。

Provide this file to Grok Bot once and say: **Install Grandet for me.** After installation, start a new conversation and ask your normal API-supplier question.

### 给助手的安装规则 / Installation rules for the assistant

以下内容由助手读取执行，用户不需要复制长提示。

> 请将本文件从「Shared Skill and references / 共同 Skill 与参考资料」标题开始到文件结尾的完整原文，持久保存为名为「Grandet API price finder」的私人 Skill 正文，保留内嵌参考资料和锚点，并在当前 Bot 中启用，不总结、改写或加入机器专用规则。执行[共同安装指南](#grandet-source-skills-grandet-api-price-finder-references-installation-md)的“安装/更新核验”：保留已有身份，同步当前发现描述，核实启用并完成匿名读取；这些都是安装必做项。以后新会话按共同 `SKILL.md` 的当前触发范围自动使用，无需再附文件、指定 Skill 或提 Grandet。简短报告实际保存位置、描述、启用、读取结果和适用范围；干净新会话验收另记。无法完成时，说明安装未完成及具体卡点。

The assistant should execute the following rules; the user does not need to copy this longer instruction:

> Persist the complete text from the “Shared Skill and references / 共同 Skill 与参考资料” heading to the end of this file verbatim as a private Skill named “Grandet API price finder”, retaining the embedded references and anchors, and enable it for this Bot. Do not summarize, rewrite or add machine-specific rules. Follow the “Installation and update checks” in the [common installation guide](#grandet-source-skills-grandet-api-price-finder-references-installation-md): preserve the existing identity, synchronize the current discovery description, verify enablement and complete the anonymous read; all are required installation steps. Automatically use the current common `SKILL.md` trigger scope in new conversations without another attachment, explicit Skill selection or the Grandet name. Briefly report the actual saved location, description, enablement, read result and scope; record clean-session acceptance separately. If any required step cannot be completed, report installation as incomplete and identify the blocker.

首次附件传不上时，可把本文件完整内容粘贴到现有 Grok Bot 对话，再说“帮我安装 Grandet”。这仍是一次安装，不是每次查价的步骤。

If the initial attachment will not upload, paste the complete file into the existing Grok Bot conversation and say “Install Grandet for me.” This remains a one-time installation step, not a step for every lookup.

保存后另开新会话，直接问「Claude API 哪家便宜，日常聊天用？」或 “Find a cheaper API for coding with Codex.”，不附文件、不指定 Skill、不提 Grandet。若当前 Bot 没有独立新会话入口，跨会话验收记为尚未完成，不能用同一段持续对话代替。首次安装时若私人 Skill 未启用，可按官方说明打开 **Connect apps → 已连接数量 / connected count → Private skills**，为当前 Bot 启用。`/` 菜单手动选择只用于排查，不算自然触发通过。是否在另一 Bot 可用必须另外核实，不把当前 Bot 启用说成全账号可用。

After saving, start a new conversation and ask normally in Chinese or English, without attaching the file, selecting the Skill or naming Grandet. If this Bot has no separate new-conversation entrypoint, leave cross-conversation acceptance incomplete rather than substituting the continuing installation conversation. Enable the saved Skill for this Bot through the official Private skills flow above if needed during installation. Manual selection from `/` is diagnostic only and does not pass natural-trigger acceptance. Verify availability in another Bot separately; enabling one Bot does not establish account-wide availability.

## 宿主说明 / Host notes

这是 Grok Bot 的私人 Skill 工作流。它运行在持久云电脑上；不要把附件当作 Cursor IDE 的 `.cursor/skills` 安装，也不要假设有 ZIP 导入或专门的 MCP 设置入口。查价不要求新增连接器或 Grandet Key。宿主确实执行请求且接口接受时，使用 `host=grok-bot`；依下文共同说明处理目标应用、语言和版本。云电脑的操作系统不是用户目标应用的系统。

This is a private Grok Bot workflow on its persistent cloud computer. Use the existing tools and the common instructions below; no new connector or Grandet key is needed for price lookup. Record `host=grok-bot` only when this is the actual execution host and the live interface accepts it. Do not infer the user's target OS from the cloud computer.

保存成功、以后自动触发、原生执行均须在真实账户内验收。此文件不证明 Grok Bot 可替换自身模型 API；该结论须有服务器返回的实际推理配置证据。账号登录或权限门槛出现时保留此提示，请用户完成所需动作；不付费调用、不读取供应商密钥、不改路由设置。

Saving, later activation and native use still require account-level acceptance. This file does not establish that Grok Bot can replace its own model API. At a real login or permission gate, keep the prepared prompt for the user; do not call a paid model, collect supplier keys or change routing.

官方依据 / Official source: [Grok Bot work and private Skills](https://cursor.com/cn/docs/grok-bot/work).
