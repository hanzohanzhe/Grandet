# Grandet 比价 · Grok Bot / Grandet API price finder for Grok Bot

## 你只需要做一步 / What you do

把这个文件发给 Grok Bot，说：**帮我安装 Grandet。** 附件传不上的话，把全文粘贴进对话再说这句话。装好后新开对话，直接问你的 API 需求。

Send this file to Grok Bot and say: **Install Grandet for me.** If the attachment won't upload, paste the whole file into the chat and say the same thing. Afterwards, open a new conversation and ask your API question.

## Installation steps for Grok Bot

The rest of this section is for the Bot.

1. Save the text from the heading "Shared Skill and references / 共同 Skill 与参考资料" to the end of this file, verbatim, as a private Skill named "Grandet API price finder". Keep the embedded references and anchors. Don't summarise, rewrite or add rules of your own.
2. Enable it for this Bot. If it isn't enabled, use **Connect apps → connected count → Private skills**.
3. Run the [installation and update checks](#grandet-source-skills-grandet-api-price-finder-references-installation-md): update an existing copy in place, sync the description with the current `SKILL.md`, confirm it is enabled and make one anonymous read. All of these are part of installing.
4. Tell the user in a line or two where it was saved and that they can now ask in a new conversation. If a step failed, say which one and what's blocking it.

From then on the Skill should trigger by itself in new conversations, following the `SKILL.md` description, without attachments, manual selection or the Grandet name.

**Testing.** In a new conversation, without the file or the Grandet name, ask something like 「Claude API 哪家便宜，日常聊天用？」 or "Find a cheaper API for coding with Codex." If this Bot has no way to start a separate conversation, record the cross-conversation test as not done; the installation conversation doesn't count. Picking the Skill from the `/` menu is for debugging only and doesn't count as triggering by itself. Being enabled on this Bot doesn't mean it is enabled on other Bots.

## Notes for Grok Bot

- Grok Bot runs on a persistent cloud computer. This is not a Cursor IDE `.cursor/skills` install; don't assume a ZIP importer or a dedicated MCP settings screen.
- Price lookup needs no new connector and no Grandet key. Use `host=grok-bot` when Grok Bot itself sends the request and the interface accepts it. The cloud computer's OS is not the user's target OS.
- This Skill doesn't show that Grok Bot can switch its own model API; only a returned inference profile can show that.
- Saving, later triggering and native use still need testing in a real account. At a sign-in or permission step, hand that step to the user and continue afterwards. Never make paid model calls, ask for supplier keys or change routing.

Official source: [Grok Bot work and private Skills](https://cursor.com/cn/docs/grok-bot/work).

Installation receipts are installation-stage only. Persist the complete text and verify the saved host state first. Use the included scripts/verify-installation.py from the 0.3.0 build archive only where the actual saved complete Skill is readable and execution is allowed. No callback/readback means NOT_RUN, not a completed installation. Receipt fields: random IDs, operation, version, content hash, source/host/scope categories, verification and time; 24-month retention; no paths, usernames, accounts, chat or keys. Disable with --no-telemetry or GRANDET_INSTALL_TELEMETRY=0. Sync, binding and enable actions are separate from a new installation.
