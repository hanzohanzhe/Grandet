# Grandet 比价 · Your dot / Grandet API price finder for Your dot

## 你只需要做一步 / What you do

把这个文件发给 Your dot，说：**帮我安装 Grandet。** 装好后新开对话，直接问你的 API 需求。

Send this file to Your dot and say: **Install Grandet for me.** Afterwards, open a new conversation and ask your API question.

## Installation steps for Your dot

The rest of this section is for the assistant.

1. Save the text from the heading "Shared Skill and references / 共同 Skill 与参考资料" to the end of this file, verbatim, through a private Skill or persistent-workflow feature you actually have. Name it "Grandet API price finder". Keep the embedded references and anchors; don't summarise or rewrite. If you can already reach a local Skill with that name, reuse its identity.
2. Enable it.
3. Run the [installation and update checks](#grandet-source-skills-grandet-api-price-finder-references-installation-md): sync the description with the current `SKILL.md`, confirm it is enabled and make one anonymous read. All of these are part of installing.
4. Tell the user in a line or two where it was saved and that they can now ask in a new conversation. If there is no persistent feature or a permission is missing, say the installation isn't finished and what's blocking it. Having read this file in the current conversation is not an installation.

From then on the Skill should trigger by itself in new conversations, following the `SKILL.md` description, without attachments, manual selection or the Grandet name.

**Testing.** In a new conversation, without the file or the Grandet name, ask something like 「帮我找便宜的 Codex API」 or "Which Claude API supplier is cheaper for long answers?" If it doesn't load, record the install or triggering as failed and check what was saved, whether it's enabled and whether access is granted. Attaching the file again doesn't fix this. Picking the Skill manually is for debugging only. Use the persistence feature the product really offers; don't invent a cloud save menu.

## Notes for Your dot

- Your dot can use plugins. Local Skills are only reachable when a computer is connected to **Your dot** specifically. A Codex connection, Work Sync or Codex finding a local Skill doesn't give dot that access.
- By default use the cloud lookup you already have. The local route needs the user's existing dot computer permission; don't turn it on yourself or guess dot's configuration folder.
- Use `host=your-dot` when dot itself sends the request and the interface accepts it. If the lookup is delegated to Codex, use `host=codex`. Add no extra origin fields or tracking.
- The executing computer's OS and tools don't tell you the user's target OS, and don't show that dot can switch its own model API.
- Saving, later triggering, dot computer access and native use are not yet tested. Leave sign-in and permission steps to the user. Never make paid model calls, ask for keys or change client settings.

Official source: [Your dot and connected computers](https://learn.chatgpt.com/docs/dots).

Installation receipts are installation-stage only. Persist the complete text and verify the saved host state first. Use the bundled Python verifier only where the actual saved complete Skill is readable and execution is allowed. No callback/readback means NOT_RUN, not a completed installation. Receipt fields: random IDs, operation, version, content hash, source/host/scope categories, verification and time; 24-month retention; no paths, usernames, accounts, chat or keys. Disable with --no-telemetry or GRANDET_INSTALL_TELEMETRY=0. Sync, binding and enable actions are separate from a new installation.
