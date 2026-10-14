# Installation receipts

Grandet 0.3.1 sends a small receipt during installation or an explicit later installation verification/flush. Ordinary price questions send no extra tracking request. A receipt is a client report, not a person, account or independent proof of use.

The request contains only random installation/event UUIDs, event revision, operation, Skill version, file-content SHA-256, known source category, host/scope categories, verification level, occurrence time and test classification. The server adds receipt time. It collects no local path, username, account, chat, query, key, device fingerprint or installer stdout. Raw records are retained for 24 months; later archive policy is separate.

Disable sending with `--no-telemetry` or `GRANDET_INSTALL_TELEMETRY=0`. Installation and readback still work offline or with reporting blocked. Disabling also clears this installation's unsent queue. Do not download again to repair statistics. Deleting local receipt state loses its continuity; it does not prove a fresh installation.

## Local file installation

The ZIP includes the complete Skill and both runtimes. With Node, use `node scripts/install-price-finder.mjs --app codex` (replace the app ID). Without Node, use Python 3:

```sh
python3 scripts/verify-installation.py --source skills/grandet-api-price-finder --destination <actual-persistent-skill-folder> --host codex --scope user --receipt-source release_zip
```

For manual copies or readable native imports, omit `--source` to read the already-persisted complete folder. That first observation is `existing_seen`, never an invented install date. A newer verifier accepts complete 0.3.0 copies too; their receipt retains version 0.3.0. The .skill contains the Python helper at `scripts/verify-installation.py` inside the native Skill folder. Run it only if the host permits execution and exposes the actual saved contents. Uploading a file does not run the helper automatically.

Pass known `--receipt-source release_zip|release_skill|source|checkout|raw|cache|local`; otherwise leave `unknown`. An existing checkout or cache works without any download. Keep exactly one active folder; shared discovery aliases share a single installation ID. A genuinely independent persistent folder gets its own ID.

The verifier checks all required files and relative references; when `--source` is supplied it compares the entire target tree to the complete input after the write. Before relying on a downloaded input, independently verify it against the published content manifest and asset SHA-256. A local digest identifies contents; it does not authenticate their author.

## Transactions, offline delivery and operations

A private sidecar outside the Skill discovery folder holds random IDs, receipt state, an atomic transaction journal, backups and an outbox. None is included in any public package. A staged copy is verified before moving; the target is then read back before queuing success. Re-running after a crash recovers the original journal/event ID. A live process lock prevents concurrent installers for the same target. Failed target verification never queues install success.

New targets record `install`; differing content/version records `update`; matching known installs record `reuse`; known contents damaged or missing record `repair`/`reinstall`; a previously unmanaged matching copy records `existing_seen`. Explicit `--operation repair|reinstall` supports maintenance; `bind|sync|enable` on already-verified content records those actions separately. These flags report an action actually performed by the operator; they do not operate a cloud UI or enable a Skill themselves. Failure events are a separate schema operation, never a successful installation.

There are at most three attempts per queued event and ten events per invocation, with 2.5-second request timeouts. Non-429 4xx rejections stop immediately. Only a matching `accepted`, `event_id` and at-least-sent `revision` acknowledgment clears an event. Failed deliveries stay pending. On a later installation-stage entry, use `--flush` with the same target (Node also uses the same `--app`); it sends the stored events without reinstalling. No background task or price-query hook is installed. Forever-offline, opted-out and bypassed installs remain unobservable.

`files_verified` confirms local bytes only. `host_accepted` and `session_triggered` require real host evidence. A later explicit Python `--verification host_accepted --host-confirmed` or `--verification session_triggered --host-confirmed` raises the last transaction's revision, retaining its ID, operation and occurrence time. Never use those switches based on file-copy success. All package `nativeAcceptance` values remain `NOT_RUN` until separately recorded host tests. Native save, enabling, binding, network reachability and natural new-session trigger are different checks.

The public endpoint is `POST https://grandet.ai/api/community/v1/installation-events`. An alternate endpoint is allowed only for `--test-mode` (Python) or isolated `--home` (Node), and only on loopback HTTP. Test receipts are marked and excluded. Never test against production. Detailed events and exports are OWNER-only. Public download counts, received install receipts and recorded successful price lookups are separate metrics.

## Native editors and cloud assistants

ChatGPT/Claude import, text editors, Grok Bot, Your dot, Muse, Cursor Cloud private sync and Cherry binding need an accessible persistent host state or a documented host completion callback. The packaged text includes complete instructions but cannot execute itself. If no readable state/callback exists, retain `NOT_RUN` and the specific gap; an agent claim is only `agent_reported`. A chat attachment, MCP connection or first lookup is not install completion. See the [route matrix](installation-routes.json) for exact current coverage and missing host checks.
