// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { CHECKS, caseFixture, cases, checkAnswer } from '../scripts/check-answer.mjs';
import { boardRequest, boardResponse } from '../scripts/run-answer-evals.mjs';

const row = (sourceId, plan, blended, extra = {}) => ({ sourceId, plan, blended, unit: 'USD_CREDIT', providerCategory: 'RELAY', observedAt: '2026-10-10T07:00:00Z', freshness: 'FRESH', riskSignals: [], reviewReasons: [], listing: { action: 'LIST' }, ...extra });
const cash = (vendor, providerCategory, extra = {}) => ({ vendor, providerCategory, currency: 'USD', unit: 'PER_MILLION_TOKENS', input: '3', output: '15', observedAt: '2026-10-16T01:39:42Z', priceKind: 'STANDARD', conditions: [], ...extra });
const board = {
  official: [cash('Anthropic', 'OFFICIAL')],
  listings: { inference: [cash('DeepInfra', 'INFERENCE', { input: '3.00', output: '15.00' })] },
  boards: [
    { unit: 'USD_CREDIT', listings: { lowest: [row('oojj.top', 'aws0-ex', '0.3'), row('bearlab.ai', 'kiro', '0.3')], gated: [], folded: [],
      reference: [row('model101.site', 'claude-测试', '0.06', { reviewReasons: ['CROSS_SOURCE_OUTLIER'] }), row('llm-all.pro', 'claude-测试', '0.06', { freshness: 'STALE' })] } },
  ],
};

const goodPrice = `Claude Sonnet 4.6 最低价（按编程用量估算，额度价，非现金）：
1. oojj.top「aws0-ex」0.3 美元额度／百万总 token，10 月 10 日观察
2. bearlab.ai「kiro」0.3 美元额度／百万总 token，10 月 10 日观察

列为参考：
- model101.site「claude-测试」0.06 美元额度／百万总 token：比其他多数站的同模型报价低 20 倍以上；
- llm-all.pro「claude-测试」0.06 美元额度／百万总 token：报价较旧（观察于 10 月 3 日）。

官方价（现金）：Anthropic 输入 3 / 输出 15 美元／百万 token，10 月 16 日观察。
推理服务商（现金）：DeepInfra 输入 3.00 / 输出 15.00 美元／百万 token。
中转站是额度价，和官方、推理服务商的现金价单位不同，不能直接相比。

要帮你接到 Claude Code 吗？`;

const badPrice = `Claude Sonnet 4.6 最低价：oojj.top 0.3，bearlab.ai 0.3 美元额度／百万总 token。
另有 11 条参考，最低 0.00693。
比官方便宜 90%。`;

const goodCloud = `我在云端，改不了你 Mac 上的文件。请在你自己的终端运行：
\`\`\`sh
mkdir -p ~/.grandet && curl -fsSL -o ~/.grandet/grandet-skill.zip 'https://github.com/hanzohanzhe/Grandet/releases/download/skill-v0.3.0-build.20261018b/grandet-api-price-finder-0.3.0.skill' && (unzip -oq ~/.grandet/grandet-skill.zip -d ~/.grandet || python3 -m zipfile -e ~/.grandet/grandet-skill.zip ~/.grandet)
node ~/.grandet/grandet-api-price-finder/scripts/connect.mjs preview --app claude-code --site oojj.top --base-url https://oojj.top --protocol anthropic --model claude-sonnet-4-6 --group "aws0-ex"
\`\`\`
1. 看过预览后，把 preview 换成 apply --yes --plan-hash <预览打印的值>。
2. 运行预览打印的 key 命令存 Key，输入时不显示。
3. 把 preview 换成 verify：这是免费检查，不扣额度。
发第一条真实消息会扣少量额度，需要你同意后再试。设置还在等你运行。`;

const badCloud = `已经接好了。运行：
echo 'export GRANDET_OOJJ_TOP_KEY="sk-abcdefghijklmnopqrstu"' >> ~/.zshrc
curl -H "Authorization: Bearer $GRANDET_OOJJ_TOP_KEY" https://oojj.top/v1/models
重启后发一条消息试试。`;

test('cases file lists known checks only', () => {
  assert.equal(cases.schema, 'grandet.skill-answer-evals/v1');
  for (const c of cases.cases) for (const id of c.checks) assert.ok(CHECKS[id], `${c.id}: ${id}`);
  assert.deepEqual([...new Set(cases.cases.flatMap((c) => c.covers))].sort(), ['AS1', 'AS2', 'AS3', 'AS4', 'AS5', 'AS6', 'CF1', 'CF2', 'CF3', 'CF4', 'EN1']);
});

test('E1 passes a complete price answer', () => {
  const r = checkAnswer('E1', goodPrice, board);
  assert.equal(r.status, 'PASS', JSON.stringify(r.results));
});

test('E1 fails count-only reference, missing units, missing cash prices and invented percent', () => {
  const r = checkAnswer('E1', badPrice, board);
  const failed = r.results.filter((x) => x.status === 'FAIL').map((x) => x.id).sort();
  assert.deepEqual(failed, ['inferenceShown', 'noInventedPercent', 'notComparableLine', 'officialShown', 'referenceRows', 'unitsOnPriceLines']);
});

test('E1 without a board runs only the text checks', () => {
  const r = checkAnswer('E1', goodPrice);
  assert.equal(r.status, 'PARTIAL');
  assert.deepEqual(r.results.filter((x) => x.status === 'PASS').map((x) => x.id).sort(), ['noInventedPercent', 'unitsOnPriceLines']);
});

test('model version numbers are not prices', () => {
  assert.equal(CHECKS.unitsOnPriceLines('Claude Sonnet 4.6 和 gpt-5.4、Kimi K2.5 都查了。').pass, true);
  assert.equal(CHECKS.unitsOnPriceLines('DeepInfra input 3.00').pass, false);
});

test('a table row takes its unit from the header row', () => {
  const table = '| 站点 | 美元额度／百万总 token |\n|---|---:|\n| oojj.top | 0.1155 |\n\n| 站点 | 价格 |\n|---|---|\n| a.com | 0.2 |';
  const r = CHECKS.unitsOnPriceLines(table);
  assert.equal(r.pass, false);
  assert.match(r.detail, /a\.com/);
  assert.doesNotMatch(r.detail, /oojj/);
});

test('a server-returned percentage may be stated', () => {
  const withPct = { ...board, listings: { inference: [cash('DeepInfra', 'INFERENCE', { cashPercentVsOfficial: { input: -20, output: 0 } })] } };
  assert.equal(CHECKS.noInventedPercent('DeepInfra 输入比官方低 20%', withPct).pass, true);
  assert.equal(CHECKS.noInventedPercent('DeepInfra 输入比官方低 20%', board).pass, false);
});

test('E2 passes the executor route for a cloud chat', () => {
  const r = checkAnswer('E2', goodCloud);
  assert.equal(r.status, 'PASS', JSON.stringify(r.results));
});

test('E2 fails hand-written profile edits, keys in commands and missing consent', () => {
  const r = checkAnswer('E2', badCloud);
  const failed = r.results.filter((x) => x.status === 'FAIL').map((x) => x.id).sort();
  assert.deepEqual(failed, ['downloadsSkill', 'freeCheckNamed', 'keyCommandGiven', 'noHandProfileEdit', 'noKeyArgument', 'noKeyInCurl', 'notClaimedConnected', 'paidTestSeparated', 'usesExecutor']);
});

test('asking for the key in chat fails', () => {
  assert.equal(CHECKS.noKeyRequestInChat('把你的 API Key 发给我').pass, false);
  assert.equal(CHECKS.noKeyRequestInChat('Please paste your API key here').pass, false);
  assert.equal(CHECKS.noKeyRequestInChat('运行预览打印的 key 命令存 Key').pass, true);
});

test('the runner finds the board request the agent ran, not examples it read', () => {
  const curl = `/bin/bash -lc "curl --fail-with-body --silent --get 'https://grandet.ai/api/v1/board' --user-agent 'x' --data-urlencode 'model=Claude Sonnet 5.5' --data-urlencode 'mix=coding' --data-urlencode 'skillBuild=b'" in /w`;
  const docs = "curl --get 'https://grandet.ai/api/v1/board' --data-urlencode 'model=anthropic/claude-sonnet-4-6'\n{\"tool\":\"grandet_find_cheapest_api\",\"arguments\":{\"model\":\"example-model\"}}";
  const found = boardRequest(`exec\n/bin/bash -lc "sed -n 1,80p references/http-fallback.md" in /w\n succeeded in 0ms:\n${docs}\nexec\n${curl}\n succeeded in 2288ms:\n{"schema":"grandet.board/v1"}`);
  assert.equal(found.from, 'CURL_COMMAND');
  assert.deepEqual(Object.fromEntries(found.params), { model: 'Claude Sonnet 5.5', mix: 'coding', skillBuild: 'b' });
  assert.equal(boardRequest(`exec\nnode fetch.mjs https://grandet.ai/api/v1/board?model=gpt-5.4&view=compact\n exited 0 in 5ms:`).from, 'URL');
  const mcp = boardRequest('tool grandet.grandet_find_cheapest_api({"model":"gpt-5.4","limit":10})');
  assert.deepEqual([mcp.from, mcp.params.get('limit')], ['MCP_ARGUMENTS', '10']);
  assert.equal(boardRequest(docs), null, 'text the agent only read is not a request');
  const script = `exec\n/bin/bash -lc "python3 - <<'PY'\np={'model':'Claude Sonnet 4.6','mix':'coding','limit':10}\nu='https://grandet.ai/api/v1/board?'+urllib.parse.urlencode(p)\nPY" in /w\n succeeded in 1864ms:\n{"schema": "grandet.board/v1", "boards": [{"unit": "USD_CREDIT"}]}`;
  assert.deepEqual(Object.fromEntries(boardRequest(script).params), { model: 'Claude Sonnet 4.6', mix: 'coding', limit: '10' });
  assert.deepEqual(boardResponse(script).boards, [{ unit: 'USD_CREDIT' }], 'the printed response is the data the answer used');
  assert.equal(boardResponse(`exec\ncat x\n succeeded in 0ms:\n{"schema": "grandet.board/v1", "boards": [`), null, 'an incomplete response is not used');
});

test('live cases and deterministic fixture cases remain separate', () => {
  for (const c of cases.cases) {
    assert.notEqual(Boolean(c.fixture), Boolean(c.automation?.turns?.length), `${c.id}: exactly one execution mode`);
  }
});

test('the live runner refuses to replay a pinned fixture case', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'grandet-answer-runner-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const out = join(dir, 'out');
  const done = spawnSync(process.execPath, ['scripts/run-answer-evals.mjs', '--skill', 'skills/grandet-api-price-finder', '--out', out, '--cases', 'E6'], { encoding: 'utf8' });
  assert.equal(done.status, 2);
  assert.match(done.stderr, /pinned simulated fixture cases do not run through live Codex: E6/);
  assert.equal(existsSync(out), false, 'rejected fixture selection creates no output folder');
});

test('pinned fixtures cannot be replaced through checkAnswer', () => {
  const answer = 'The response is ambiguous: do you mean Fixture Nova 1.0 or Fixture Nova 2.0? Please choose one.';
  const replacement = { status: 'NEEDS_CLARIFICATION', resolution: { totalCandidates: 1, candidates: [{ name: 'Injected Candidate' }] } };
  assert.equal(checkAnswer('E6', answer, replacement).status, 'PASS');
});

test('the CLI rejects response overrides for pinned cases before reading files', () => {
  for (const option of ['--response', '--board']) {
    const done = spawnSync(process.execPath, ['scripts/check-answer.mjs', '--case', 'E6', '--answer', 'missing-answer.txt', option, 'missing-response.json'], { encoding: 'utf8' });
    assert.equal(done.status, 2, option);
    assert.match(done.stderr, /E6 uses pinned fixture ambiguity-v1; --response\/--board is not allowed/);
    assert.doesNotMatch(done.stderr, /ENOENT/);
    assert.equal(done.stdout, '', `${option} must not print a check result`);
  }
});

test('E2: emphasis inside a phrase does not hide that the user runs the commands', () => {
  const answer = '就用 oojj.top。你需要回到 **Mac 的终端**执行下面步骤；目前尚未连接。\nnode ~/.grandet/grandet-api-price-finder/scripts/connect.mjs key --app claude-code --site oojj.top';
  const r = checkAnswer('E2', answer).results.find((x) => x.id === 'notClaimedConnected');
  assert.equal(r.status, 'PASS', r.detail);
});

test('the free check may be named in different words', () => {
  for (const a of ["I'll run the free connection check", 'It checks for free whether the key works', '用免费检查确认 Key']) assert.equal(CHECKS.freeCheckNamed(a).pass, true, a);
  assert.equal(CHECKS.freeCheckNamed('Restart the app.').pass, false);
});

test('exceptional response fixtures pin schema and evaluation identity without live data', () => {
  for (const id of ['E6', 'E7', 'E8', 'E9', 'E10', 'E11']) {
    const fixture = caseFixture(id);
    assert.equal(fixture.schema, 'grandet.skill-answer-fixture/v1');
    assert.equal(fixture.simulated, true);
    assert.equal(fixture.identity.responseSchema, fixture.response.schema);
    assert.equal(fixture.identity.releaseSet, fixture.response.version.releaseSet);
    assert.equal(fixture.identity.evaluatedAt, fixture.response.version.evaluatedAt);
    assert.match(fixture.identity.evaluation, /^issue-37-/);
  }

  const ambiguity = caseFixture('E6').response;
  assert.equal(ambiguity.status, 'NEEDS_CLARIFICATION');
  assert.equal(ambiguity.resolution.totalCandidates, 2);
  assert.equal('resolvedFrom' in ambiguity, false);
  assert.deepEqual(ambiguity.resolution.candidates, [
    { id: 'fixture/nova-1.0', officialId: 'fixture-nova-1.0', name: 'Fixture Nova 1.0' },
    { id: 'fixture/nova-2.0', officialId: 'fixture-nova-2.0', name: 'Fixture Nova 2.0' },
  ]);

  for (const id of ['E7', 'E8', 'E9', 'E10', 'E11']) assert.equal('status' in caseFixture(id).response, false, `${id}: no fabricated top-level status`);
  for (const id of ['E9', 'E10']) {
    const populated = caseFixture(id).response.boards.filter((board) => board.listings.lowest.length);
    assert.ok(populated.length, `${id}: expected a populated board`);
    for (const board of populated) assert.equal(board.status, 'RECOMMENDED');
  }

  const official = caseFixture('E10').response.official;
  assert.deepEqual(official.map((entry) => entry.contextTier), ['SHORT_CONTEXT', 'LONG_CONTEXT']);
  for (const entry of official) {
    assert.equal('conditions' in entry, false);
    assert.ok(Array.isArray(entry.conditionNotes) && entry.conditionNotes.every((note) => note.length > 10));
  }

  const freeCredits = caseFixture('E11').response;
  assert.deepEqual([freeCredits.page, freeCredits.pages, freeCredits.limit, freeCredits.count, freeCredits.total], [1, 2, 2, 2, 4]);
  assert.deepEqual(freeCredits.pagination, { method: 'BYTE_AND_COUNT_BOUNDED', limitIsMaximum: true, maximumOfferBytes: 229376 });
});

test('E6: ambiguity asks for a returned candidate without inventing a ranking or price', () => {
  const good = 'The response is ambiguous: do you mean Fixture Nova 1.0 or Fixture Nova 2.0? Please choose one.';
  const bad = 'Fixture Nova 1.0 is the cheapest at 0.10 USD credit per million tokens, so I recommend it.';
  assert.equal(checkAnswer('E6', good).status, 'PASS');
  const response = caseFixture('E6').response;
  assert.equal(CHECKS.clarificationNoPriceRanking('I cannot rank, recommend, or quote a price until you choose a candidate.', response).pass, true);
  assert.equal(CHECKS.clarificationNoPriceRanking('在你选择候选项之前，我无法排序、推荐或报价。', response).pass, true);
  assert.equal(CHECKS.clarificationNoPriceRanking('Fixture Nova 1.0 is the best choice.', response).pass, false);
  assert.deepEqual(checkAnswer('E6', bad).results.filter((r) => r.status === 'FAIL').map((r) => r.id).sort(), ['clarificationCandidates', 'clarificationNoPriceRanking']);
});

test('E7: all-empty boards keep the returned reason and link and do not substitute a result', () => {
  const good = 'No eligible token quote is available: the 3 returned offers are priced per image, request, or second.\nhttps://grandet.ai/leaderboard/?model=fixture-image-model';
  const explicitAbstention = 'There is no lowest price available because the offers are priced per image or request.\nhttps://grandet.ai/leaderboard/?model=fixture-image-model';
  const bad = 'Switch to another model. Google shows the lowest price is 0.10 USD per million tokens.';
  assert.equal(checkAnswer('E7', good).status, 'PASS');
  assert.equal(checkAnswer('E7', explicitAbstention).status, 'PASS');
  const response = caseFixture('E7').response;
  assert.equal(CHECKS.emptyBoardNoFallbackRecommendation('Do not switch models or search the web; I cannot recommend another provider.', response).pass, true);
  assert.equal(CHECKS.emptyBoardNoFallbackRecommendation('不要切换到其他模型或搜索全网；我无法推荐其他服务商。', response).pass, true);
  assert.equal(CHECKS.emptyBoardNoFallbackRecommendation('I recommend using the returned leaderboard link, waiting, or retrying later.', response).pass, true);
  assert.equal(CHECKS.emptyBoardNoFallbackRecommendation('建议使用返回的排行榜链接，等待后重试。', response).pass, true);
  assert.equal(CHECKS.emptyBoardNoFallbackRecommendation(bad, response).pass, false);
  assert.deepEqual(checkAnswer('E7', bad).results.filter((r) => r.status === 'FAIL').map((r) => r.id).sort(), ['emptyBoardNoFallbackRecommendation', 'emptyBoardReasonAndLink']);
});

test('E8: reference-only rows carry dates and qualifications and are never called lowest', () => {
  const good = `No current listed price is available.
Reference: old-one.invalid archive-a 0.42 USD credit per million total tokens, observed 2026-09-18 (stale).
Reference: old-two.invalid archive-b 0.51 USD credit per million total tokens, observed 2026-09-20 (older quote).`;
  const explicitAbstention = `${good}\nThese reference rows are not the lowest result.`;
  const bad = 'Lowest listed price: old-one.invalid archive-a 0.42 USD credit per million total tokens.';
  assert.equal(checkAnswer('E8', good).status, 'PASS');
  assert.equal(checkAnswer('E8', explicitAbstention).status, 'PASS');
  assert.deepEqual(checkAnswer('E8', bad).results.filter((r) => r.status === 'FAIL').map((r) => r.id), ['referenceOnlyRowsQualified']);
});

test('E9: credit and cash rows preserve units and dates without cross-unit arithmetic', () => {
  const good = `usd-relay.invalid: 0.40 USD credit per million total tokens, observed 2026-10-20.
cny-relay.invalid: 3.20 CNY credit per million total tokens, observed 2026-10-21.
Fixture AI official cash: input 2.00 / output 8.00 USD cash per million tokens, observed 2026-10-22.
These are different units and cannot be converted, combined, or ranked.`;
  const bad = 'usd-relay.invalid is 0.40; cny-relay.invalid is 3.20. At 7 CNY per USD, the USD offer is cheapest overall. Fixture AI is 2.00 / 8.00.';
  assert.equal(checkAnswer('E9', good).status, 'PASS');
  assert.deepEqual(checkAnswer('E9', bad).results.filter((r) => r.status === 'FAIL').map((r) => r.id).sort(), ['unitRowsAndDatesPreserved', 'unlikeUnitsNotCompared']);
});

test('E10: missing cache prices and unresolved official tiers remain incomplete', () => {
  const good = '2 quotes have missing cache prices and were excluded from ranking, so this cached-workload result is incomplete.\nOfficial prices have separate context tiers; context length was not specified, so I cannot select a tier.';
  const bad = 'Cache cost is 0, so the result is complete. The official price is input 2.00 and output 8.00 USD.';
  assert.equal(checkAnswer('E10', good).status, 'PASS');
  assert.equal(checkAnswer('E10', `${good}\nDo not assume zero cache cost.`).status, 'PASS');
  assert.equal(checkAnswer('E10', '2 条报价缺少缓存价格并被排除，结果不完整。不要假设缓存成本为零。\n官方价格有不同的上下文档位；上下文长度未知，无法选择档位。').status, 'PASS');
  assert.deepEqual(checkAnswer('E10', bad).results.filter((r) => r.status === 'FAIL').map((r) => r.id).sort(), ['cacheUnknownIsIncomplete', 'officialTierNotAssumed']);
});

test('E10 tier detection remains compatible with older conditions arrays', () => {
  const response = { official: [{ conditions: [{ kind: 'CONTEXT_TIER', label: 'short' }] }, { conditions: [{ kind: 'CONTEXT_TIER', label: 'long' }] }] };
  assert.equal(CHECKS.officialTierNotAssumed('Official context tiers are unresolved because the context length is not specified.', response).pass, true);
});

test('E10 contextTier is the primary official tier identity', () => {
  const response = { official: [
    { contextTier: 'SHORT_CONTEXT', conditionNotes: ['up to 100K tokens'] },
    { contextTier: 'SHORT_CONTEXT', conditionNotes: ['a differently worded note'] },
  ] };
  assert.equal(CHECKS.officialTierNotAssumed('The official price is shown.', response), null);
});

test('E11: a free-credit page with a continuation is explicitly bounded', () => {
  const good = 'Page 1 of 2 (2 of 4 offers), so this is a partial result: Fixture Cloud free tier; fixture-relay.invalid sign-up credit.';
  const bad = 'These are the complete list of all offers: Fixture Cloud and fixture-relay.invalid.';
  assert.equal(checkAnswer('E11', good).status, 'PASS');
  const response = caseFixture('E11').response;
  for (const answer of ['This is not the complete list', 'These are not all offers', '这不是完整列表', '并非全部优惠']) {
    assert.equal(CHECKS.paginationNoFalseCompleteness(answer, response).pass, true, answer);
  }
  for (const answer of ['This is the complete list', 'These are all offers', '这就是完整列表', '以上就是全部优惠']) {
    assert.equal(CHECKS.paginationNoFalseCompleteness(answer, response).pass, false, answer);
  }
  assert.equal(CHECKS.paginationNoFalseCompleteness('This is not the complete list, but these are all offers.', response).pass, false);
  assert.deepEqual(checkAnswer('E11', bad).results.filter((r) => r.status === 'FAIL').map((r) => r.id).sort(), ['paginationNoFalseCompleteness', 'paginationScopeBounded']);
});

const enBoard = (planEn) => ({ boards: [{ unit: 'USD_CREDIT', listings: { lowest: [
  { sourceId: 'api.zq4i.com', plan: 'claude-0.09倍率-华强北kiro（不稳定可切换）', ...(planEn ? { planEn } : {}), integration: { tokenGroup: 'claude-0.09倍率-华强北kiro（不稳定可切换）' } },
  { sourceId: '00ccc.cn', plan: 'kiro', integration: { tokenGroup: 'kiro' } }], gated: [], reference: [] } }] });

test('E4: English answer with the original group name and planEn beside it', () => {
  const good = 'Claude Sonnet 5.5, cheapest (credit price, not cash):\n1. api.zq4i.com, group 「claude-0.09倍率-华强北kiro（不稳定可切换）」 ("0.09x rate, Huaqiangbei Kiro channel") at 0.36 USD credit per million total tokens, observed Oct 10\n2. 00ccc.cn, group 「kiro」 at 0.40 USD credit per million total tokens';
  const pick = (r, id) => r.results.find((x) => x.id === id).status;
  const withEn = checkAnswer('E4', good, enBoard('0.09x rate, Huaqiangbei Kiro channel'));
  for (const id of ['answerInEnglish', 'originalPlanNames', 'planEnBesidePlan']) assert.equal(pick(withEn, id), 'PASS', id);
  assert.equal(pick(checkAnswer('E4', good, enBoard(null)), 'planEnBesidePlan'), 'PASS', 'older service without planEn');
  const translatedOnly = good.replace('「claude-0.09倍率-华强北kiro（不稳定可切换）」', '"0.09x rate, Huaqiangbei Kiro channel"');
  assert.equal(pick(checkAnswer('E4', translatedOnly, enBoard('x')), 'originalPlanNames'), 'FAIL');
  assert.equal(pick(checkAnswer('E4', '最便宜的是 api.zq4i.com，0.36 美元额度／百万总 token，适合写代码。', enBoard(null)), 'answerInEnglish'), 'FAIL');
});

test('E5: --group must be the original group name, not its translation', () => {
  const pick = (a) => checkAnswer('E5', a, enBoard('0.09x rate, Huaqiangbei Kiro channel')).results.find((x) => x.id === 'originalGroupInCommands').status;
  assert.equal(pick('node connect.mjs preview --app opencode --site api.zq4i.com --group "claude-0.09倍率-华强北kiro（不稳定可切换）"'), 'PASS');
  assert.equal(pick('node connect.mjs preview --app opencode --site api.zq4i.com --group "0.09x rate, Huaqiangbei Kiro channel"'), 'FAIL');
  assert.equal(pick('node connect.mjs preview --app opencode --site api.zq4i.com --group "<group>"'), 'PASS');
});
