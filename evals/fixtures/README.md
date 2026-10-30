<!-- SPDX-License-Identifier: Apache-2.0 -->
# Answer-evaluation response fixtures

These are deterministic, simulated contract fixtures for response states that are difficult to reproduce on demand. They do not contain a live catalogue capture and tests must never refresh them automatically.

Each `*-v1.json` file uses `grandet.skill-answer-fixture/v1`. Its `identity` pins the API schema, release-set value, evaluation time, and eval revision; `request` records the bounded request; and `response` is the API-shaped value consumed by the checker. `.invalid` suppliers and the repeated `37` release value make the synthetic data recognizable.

To refresh a fixture intentionally:

1. Read the current Skill response documentation and obtain a reviewed response for the same exceptional state outside the unit-test run.
2. Replace only `request` and `response`, remove credentials or private data, update all `identity` fields to match, and increment `revision`. Keep `simulated: true` unless the response is an approved, redistributable capture.
3. Use a new `-v2.json` filename when the wrapper or API contract changes, point the case at it, and retain the old file while an eval still references it.
4. Run `node --test tests/answer-check.test.mjs` and `node scripts/validate-public.mjs`.

Live Codex probes remain in `scripts/run-answer-evals.mjs`. Cases with `fixture` have no `automation.turns`, so that runner cannot replace an exceptional response with a current replay.
