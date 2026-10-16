// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import test from 'node:test';
import { CHECKS, cases, checkAnswer } from '../scripts/check-answer.mjs';
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
mkdir -p ~/.grandet && curl -fsSL -o ~/.grandet/grandet-skill.zip 'https://github.com/hanzohanzhe/Grandet/releases/download/skill-v0.3.0-build.20261016c/grandet-api-price-finder-0.3.0.skill' && (unzip -oq ~/.grandet/grandet-skill.zip -d ~/.grandet || python3 -m zipfile -e ~/.grandet/grandet-skill.zip ~/.grandet)
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
  assert.deepEqual([...new Set(cases.cases.flatMap((c) => c.covers))].sort(), ['CF1', 'CF2', 'CF3', 'CF4']);
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

test('every case has automation turns', () => {
  for (const c of cases.cases) assert.ok(c.automation?.turns?.length >= 1, c.id);
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
