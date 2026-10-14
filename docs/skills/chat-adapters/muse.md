# Grandet 比价 · Muse / API price finder for Muse

## 安装一次 / Install once

第一次把本文件提供给 Muse，然后只说：**帮我安装 Grandet。** 安装后另开会话，直接问你的 API 选型需求。

Provide this file to Muse once and say: **Install Grandet for me.** After installation, start a new conversation and ask your normal API-supplier question.

### 给助手的安装规则 / Installation rules for the assistant

以下内容由助手读取执行，用户不需要复制长提示。

> 请将本文件从「Shared Skill and references / 共同 Skill 与参考资料」标题开始到文件结尾的完整原文，持久保存并启用为名为「Grandet API price finder」的私人 Skill 或只读工作流，保留内嵌参考资料和锚点，不总结或改写。若实际功能要求自定义连接器，按附件现有 HTTP 契约建立，不需要 Grandet Key；连接器不能代替共同 Skill 的保存和启用。执行[共同安装指南](#grandet-source-skills-grandet-api-price-finder-references-installation-md)的“安装/更新核验”：保留已有身份，同步当前发现描述，核实启用并完成匿名读取；这些都是安装必做项。以后新会话按共同 `SKILL.md` 的当前触发范围自动使用，不再附文件、指定 Skill 或提 Grandet。简短报告实际保存位置、描述、启用、读取结果和适用范围；干净新会话验收另记。无法完成时，说明安装未完成和具体卡点。

The assistant should execute the following rules; the user does not need to copy this longer instruction:

> Persist and enable the complete text from the “Shared Skill and references / 共同 Skill 与参考资料” heading to the end of this file as a private Skill or read-only workflow named “Grandet API price finder”. Retain the embedded references and anchors without summarizing or rewriting. If your actual capabilities require a custom connector, use the existing HTTP contract in the attachment; no Grandet key is required. A connector does not replace saving and enabling the common Skill. Follow the “Installation and update checks” in the [common installation guide](#grandet-source-skills-grandet-api-price-finder-references-installation-md): preserve the existing identity, synchronize the current discovery description, verify enablement and complete the anonymous read; all are required installation steps. Automatically use the current common `SKILL.md` trigger scope in new conversations without another attachment, explicit Skill selection or the Grandet name. Briefly report the actual saved location, description, enablement, read result and scope; record clean-session acceptance separately. If any required step cannot be completed, report installation as incomplete and identify the blocker.

保存并启用后另开新会话，直接问「帮我找便宜的 Codex API」或 “Find a cheaper Claude API for long answers.”，不再附文件、不指定 Skill、不提 Grandet。若宿主不能持久保存或新会话不能加载，记为安装或自然触发未通过，保留具体卡点，不用当前对话查价替代。手动选择 Skill 只用于排查，不能算自然触发通过。遇到真实登录或授权步骤，保留上面的安装提示供用户完成，随后继续。

After saving and enabling, start a new conversation and ask normally in Chinese or English without another attachment, explicit Skill selection or the Grandet name. If persistence or loading in a new conversation is unavailable, record installation or natural triggering as not passed and retain the blocker; a lookup in the installation conversation is not a substitute. Manual Skill selection is diagnostic only. At a real login or permission step, preserve the prepared installation prompt for the user to complete before continuing.

## 宿主说明 / Host notes

Muse 官方资料描述自定义 Skills、面向 API/CLI 服务的自定义连接器和云虚拟机。使用当前产品实际提供的功能；不虚构自定义 MCP 设置界面，不使用另一个 Muse Code 产品的 `~/.config/muse/commands` 路径。本文件用于私人使用，不提交公共连接器目录；该目录是独立审批流程。

Muse documents custom Skills, connectors for API/CLI services and a cloud VM. Use the capabilities actually exposed by this host. Do not invent a custom MCP settings screen or use Muse Code's `~/.config/muse/commands` path. Keep this workflow private; submitting to the public connector directory is a separate approval process.

Muse 实际执行查价且接口接受时使用 `host=muse`。按下文区分来源与目标，云 VM 系统不是用户目标系统。能接入服务不等于可更换 Muse 自身模型 API；只有返回的实际推理配置可支撑这种结论。不要付费调用、读取供应商密钥、修改现有供应商配置或增加独立统计请求。

Use `host=muse` only when Muse actually performs the query and the interface accepts it. Follow the common distinction between host and target; the cloud VM's OS is not the user's target OS. Connecting a service does not prove Muse can replace its own model API without a returned inference profile. Do not call a paid model, collect supplier keys, change supplier settings or add tracking calls.

私人工作流/连接器创建、持久触发和原生查询仍须真实账户验收。

Private workflow/connector creation, persistence and native queries still require real-account acceptance.

官方依据 / Official sources: [Muse](https://muse.ai/), [Meta's Muse agent capabilities and security model](https://research.meta.ai/blog/security-and-safety-for-ai-agents-our-approach-with-muse), [separate public connector directory process](https://muse.ai/platform).
