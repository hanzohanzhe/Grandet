<!-- SPDX-License-Identifier: Apache-2.0 -->
# Connect capability matrix

This matrix describes the nine app adapters in `skills/grandet-api-price-finder/scripts/connect.mjs`.

Executor support means the corresponding code path is implemented. Fixture testing means an offline test exercises that path using a temporary configuration; it does not show that a real app accepts the configuration. Native acceptance requires a receipt from testing with the native app. No native acceptance receipts are recorded today, so every app is `NOT_RUN`.

The states used below are:

- `IMPLEMENTED`: the executor code path exists.
- `FIXTURE_TESTED`: an offline fixture exercises the app action.
- `NOT_IMPLEMENTED`: the executor action is not implemented.
- `NOT_RUN`: native acceptance has not been run or recorded.
- `PASS` and `FAIL`: reserved for recorded native acceptance outcomes; neither is claimed here.

`NOT_RUN` is visible before choosing automated connect. Preview and fixture results describe the executor, not native app acceptance. Evidence names the existing test file that exercises the executor paths; it is not a native acceptance receipt.

| App ID | Protocols | Preview | Apply | Key | Verify | Restore | Native acceptance | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `codex` | `openai-response` | FIXTURE_TESTED | FIXTURE_TESTED | FIXTURE_TESTED | IMPLEMENTED | FIXTURE_TESTED | NOT_RUN | `tests/connect.test.mjs` |
| `claude-code` | `anthropic` | FIXTURE_TESTED | FIXTURE_TESTED | FIXTURE_TESTED | FIXTURE_TESTED | FIXTURE_TESTED | NOT_RUN | `tests/connect.test.mjs` |
| `opencode` | `openai, openai-response` | FIXTURE_TESTED | FIXTURE_TESTED | FIXTURE_TESTED | IMPLEMENTED | FIXTURE_TESTED | NOT_RUN | `tests/connect.test.mjs` |
| `kilo-code` | `openai, openai-response` | FIXTURE_TESTED | FIXTURE_TESTED | FIXTURE_TESTED | IMPLEMENTED | FIXTURE_TESTED | NOT_RUN | `tests/connect.test.mjs` |
| `continue` | `openai` | FIXTURE_TESTED | FIXTURE_TESTED | FIXTURE_TESTED | IMPLEMENTED | FIXTURE_TESTED | NOT_RUN | `tests/connect.test.mjs` |
| `gemini-cli` | `gemini` | FIXTURE_TESTED | FIXTURE_TESTED | FIXTURE_TESTED | IMPLEMENTED | FIXTURE_TESTED | NOT_RUN | `tests/connect.test.mjs` |
| `hermes` | `openai, openai-response, anthropic` | FIXTURE_TESTED | FIXTURE_TESTED | FIXTURE_TESTED | IMPLEMENTED | FIXTURE_TESTED | NOT_RUN | `tests/connect.test.mjs` |
| `openclaw` | `openai, anthropic` | FIXTURE_TESTED | FIXTURE_TESTED | FIXTURE_TESTED | IMPLEMENTED | FIXTURE_TESTED | NOT_RUN | `tests/connect.test.mjs` |
| `workbuddy` | `openai, openai-response` | FIXTURE_TESTED | FIXTURE_TESTED | FIXTURE_TESTED | IMPLEMENTED | FIXTURE_TESTED | NOT_RUN | `tests/connect.test.mjs` |

`verify` has a shared executor implementation. Its offline integration fixture currently exercises Claude Code; the other rows indicate implementation only. Native acceptance remains unrun for every app regardless of fixture coverage.
