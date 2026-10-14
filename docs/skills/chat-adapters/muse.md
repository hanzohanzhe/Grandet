# Grandet 比价 · Muse / Grandet API price finder for Muse

## 你只需要做一步 / What you do

把这个文件发给 Muse，说：**帮我安装 Grandet。** 装好后新开对话，直接问你的 API 需求。

Send this file to Muse and say: **Install Grandet for me.** Afterwards, open a new conversation and ask your API question.

## Installation steps for Muse

The rest of this section is for the assistant.

1. Save the text from the heading "Shared Skill and references / 共同 Skill 与参考资料" to the end of this file, verbatim, as a private Skill or read-only workflow named "Grandet API price finder", and enable it. Keep the embedded references and anchors; don't summarise or rewrite.
2. If your actual features require a custom connector, build it from the HTTP interface described in this file. No Grandet key is needed. A connector does not replace saving and enabling the Skill.
3. Run the [installation and update checks](#grandet-source-skills-grandet-api-price-finder-references-installation-md): update an existing copy in place, sync the description with the current `SKILL.md`, confirm it is enabled and make one anonymous read. All of these are part of installing.
4. Tell the user in a line or two where it was saved and that they can now ask in a new conversation. If a step failed, say which one and what's blocking it.

From then on the Skill should trigger by itself in new conversations, following the `SKILL.md` description, without attachments, manual selection or the Grandet name.

**Testing.** In a new conversation, without the file or the Grandet name, ask something like 「帮我找便宜的 Codex API」 or "Find a cheaper Claude API for long answers." If it can't be saved or doesn't load, record the install or triggering as failed and note the blocker; a lookup inside the installation conversation doesn't count. Picking the Skill manually is for debugging only. At a sign-in or permission step, hand that step to the user and continue afterwards.

## Notes for Muse

- Muse documents custom Skills, custom connectors for API/CLI services and a cloud VM. Use what this host actually offers. Don't invent a custom MCP settings screen, and don't use Muse Code's `~/.config/muse/commands` path.
- Keep this workflow private. Submitting to the public connector directory is a separate approval process.
- Use `host=muse` only when Muse itself sends the request and the interface accepts it. The cloud VM's OS is not the user's target OS.
- Connecting a service doesn't show that Muse can switch its own model API; only a returned inference profile can show that.
- Never make paid model calls, ask for supplier keys, change supplier settings or add tracking calls.
- Creating the private workflow or connector, persistence and native lookups still need testing in a real account.

Official sources: [Muse](https://muse.ai/), [Meta's Muse agent capabilities and security model](https://research.meta.ai/blog/security-and-safety-for-ai-agents-our-approach-with-muse), [public connector directory process](https://muse.ai/platform).

Installation receipts are installation-stage only. Persist the complete text and verify the saved host state first. Use the separate current-repository Python companion (not included in the original 0.3.0 .skill) only where the actual saved complete Skill is readable and execution is allowed. No callback/readback means NOT_RUN, not a completed installation. Receipt fields: random IDs, operation, version, content hash, source/host/scope categories, verification and time; 24-month retention; no paths, usernames, accounts, chat or keys. Disable with --no-telemetry or GRANDET_INSTALL_TELEMETRY=0. Sync, binding and enable actions are separate from a new installation.
