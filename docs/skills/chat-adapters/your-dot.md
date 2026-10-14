# Grandet 比价 · Your dot / API price finder for Your dot

## 安装一次 / Install once

第一次把本文件提供给 Your dot，然后只说：**帮我安装 Grandet。** 安装后另开会话，直接问你的 API 选型需求。

Provide this file to Your dot once and say: **Install Grandet for me.** After installation, start a new conversation and ask your normal API-supplier question.

### 给助手的安装规则 / Installation rules for the assistant

以下内容由助手读取执行，用户不需要复制长提示。

> 请将本文件从「Shared Skill and references / 共同 Skill 与参考资料」标题开始到文件结尾的完整原文，通过你实际提供的私人 Skill 或持久工作流入口保存并启用，名称为「Grandet API price finder」，保留内嵌参考资料和锚点，不总结或改写。已能访问同名本地 Skill 时复用其身份。执行[共同安装指南](#grandet-source-skills-grandet-api-price-finder-references-installation-md)的“安装/更新核验”：同步当前发现描述，核实启用并完成匿名读取；这些都是安装必做项。以后新会话按共同 `SKILL.md` 的当前触发范围自动使用，不再附文件、指定 Skill 或提 Grandet。简短报告实际保存位置、描述、启用、读取结果和适用范围；干净新会话验收另记。没有可用的持久入口或所需权限时，说明安装未完成和具体卡点，不把当前对话读过附件当作安装成功。

The assistant should execute the following rules; the user does not need to copy this longer instruction:

> Persist and enable the complete text from the “Shared Skill and references / 共同 Skill 与参考资料” heading to the end of this file through an actual private Skill or persistent-workflow entrypoint, named “Grandet API price finder”. Retain the embedded references and anchors without summarizing or rewriting. Reuse the identity of an already accessible local Skill of that name. Follow the “Installation and update checks” in the [common installation guide](#grandet-source-skills-grandet-api-price-finder-references-installation-md): synchronize the current discovery description, verify enablement and complete the anonymous read; all are required installation steps. Automatically use the current common `SKILL.md` trigger scope in new conversations without another attachment, explicit Skill selection or the Grandet name. Briefly report the actual saved location, description, enablement, read result and scope; record clean-session acceptance separately. If a persistent entrypoint or required permission is unavailable, report installation as incomplete and identify the blocker; reading the attachment in this conversation is not a successful installation.

保存并启用后另开新会话，直接问「帮我找便宜的 Codex API」或 “Which Claude API supplier is cheaper for long answers?”，不再附文件、不指定 Skill、不提 Grandet。若新会话不能加载，记为安装或自然触发未通过，核对实际保存、启用和访问权限；不以重新附文件补过关。手动选择 Skill 只用于排查，不能替代自然触发验收。持久入口须按当前产品实际功能核实，不虚构云端保存菜单。

After saving and enabling, start a new conversation and ask normally in Chinese or English without another attachment, explicit Skill selection or the Grandet name. If the new conversation cannot load it, record installation or natural triggering as not passed and check the actual saved content, enabled state and access. Attaching the file again does not remedy this acceptance failure. Manual Skill selection is diagnostic only. Verify the persistent entrypoint exposed by the current product; do not invent a cloud save menu.

## 宿主说明 / Host notes

Your dot 可用插件；本地 Skills 只有在电脑连接到 **Your dot** 时才可访问。Codex 已连接、Work Sync 已开启或 Codex 发现了本地 Skill，都不能证明 dot 已有权限。本路线优先使用已有云端查价能力；只有用户已有的 dot 电脑连接授权可支持本地路线，不自动开启连接，也不猜测或写入 dot 的配置文件夹。

Your dot can use plugins; local Skills require a computer connected specifically to Your dot. Codex connectivity, Work Sync or Codex project discovery does not establish that access. Use existing cloud lookup capabilities by default. The optional local route needs the user's existing dot computer permission; do not enable it automatically or invent a dot configuration directory.

若 dot 亲自查价且接口接受，传 `host=your-dot`；若实际委派给 Codex 查价，传 `host=codex`，不增加额外来源字段或遥测。遵循下文目标应用规则；不要将执行电脑系统当作用户目标系统，也不能因为 dot 能调用工具就声称它支持替换自身模型 API。

When dot executes the request, use `host=your-dot` if accepted. If Codex actually executes a delegated lookup, use `host=codex`; add no extra origin fields or telemetry. Follow the common target-app rules. The execution computer's OS and tool access do not establish the target OS or configurable model API support.

持久保存、下一次触发、dot 电脑权限和原生执行尚待实测。真实登录或权限门槛保留给用户处理；不付费调用、不读取密钥、不改客户端设置。

Persistence, later triggering, dot computer access and native use remain untested. Leave real login or permission gates to the user; do not call a paid model, collect keys or change client settings.

官方依据 / Official source: [Your dot and connected computers](https://learn.chatgpt.com/docs/dots).
