// SPDX-License-Identifier: Apache-2.0
// Lessons from c's 316 live rounds and the c/h A/B, re-judged with the fixed judge (build.20261017):
// no guessed paths or views, stated parameter limits, a hard answer length with the shape inline,
// a page link on free-credit answers, curl-only install instructions, and one build ID everywhere.
import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { splitSkill } from '../scripts/stage-registry-skill.mjs';
import { checkBuildId, identity, mentions, SKILL_BUILD_MENTIONS } from '../scripts/check-build-id.mjs';

const root = new URL('../', import.meta.url);
const skillDir = new URL('skills/grandet-api-price-finder/', root);
const read = (path) => readFile(new URL(path, skillDir), 'utf8');
const { top, body } = splitSkill(await read('SKILL.md'));
const section = (text, heading) => {
  const start = text.indexOf(`\n## ${heading}\n`);
  assert.ok(start >= 0, `missing section: ${heading}`);
  const end = text.indexOf('\n## ', start + 1);
  return text.slice(start, end < 0 ? undefined : end);
};

test('the 57-character Hermes slice is unchanged', () => {
  assert.ok(top.description.slice(0, 57).startsWith('Model API prices, 中转站, 免费额度 — use this, not web search.'), top.description.slice(0, 57));
});

test('"Get the data first" names the only requests and treats an empty board as the answer', async () => {
  const dataFirst = section(body, 'Get the data first');
  for (const words of ['/api/v1/board', '/api/v1/free-credits', '/api/v1/models?q=<name>&scope=all', '/api/v1/glossary?q=<term>&lang=zh-CN', '`compact` (use it), `brief` or `full`, nothing else', '`limit` 1–20', 'No `limit`, no `lang`']) {
    assert.ok(dataFirst.includes(words), words);
  }
  // The paths h made up when a board had no per-token price, and the bulk files that answer 403.
  for (const words of ['/api/v1/models/<id>', '/api/v1/model/<id>', '/models/<id>.json', 'view=declarations', 'evidenceUrl', 'BULK_AUTHORIZATION_REQUIRED']) assert.ok(dataFirst.includes(words), words);
  assert.match(dataFirst, /An empty board is the answer, not an error\./);
  // The one INVALID_QUERY left in the formal gate: a helper sent skillVersion/skillBuild to every path.
  assert.match(dataFirst, /A helper that adds `skillVersion` and `skillBuild` adds them to board, free-credits, models and prices only\./);
  assert.match(dataFirst, /RESPONSE_BUDGET_EXCEEDED/);
  assert.match(dataFirst, /`OTHER_BILLING_UNIT`/);
  assert.match(dataFirst, /no second request with another path, view or name/);
  // No reference tells the agent to add view=declarations to a request any more.
  for (const file of ['references/response-format.md', 'references/glossary.md']) assert.doesNotMatch(await read(file), /with `&view=declarations` added|带 `view=declarations`/, file);
});

test('parameter limits and mix are spelled out with live-checked examples', async () => {
  const always = section(body, 'Always');
  for (const words of ['`limit` above 20', 'INVALID_LIMIT', 'INVALID_MIX', '`MODEL_SELECTOR_REQUIRED`', 'reject `lang`']) assert.ok(always.includes(words), words);
  const workloads = await read('references/workloads.md');
  for (const words of ['`mix=in:50,cacheRead:0,out:50`', '`mix=in:50,out:50` | 400 `INVALID_MIX`', '`mix=20/70/10`', 'adds up to 90', 'whole numbers that add up to 100']) assert.ok(workloads.includes(words), words);
});

test('answers have a hard length and the price shape sits in step 4', () => {
  const always = section(body, 'Always');
  assert.match(always, /\*\*Length\.\*\* Every answer stays within 8 lines and 600 characters \(English: 100 words\), the link and the closing question included/);
  const lowest = section(body, '1. Lowest price');
  const shape = /4\. Answer in this shape[\s\S]*?```text\n([\s\S]*?)\n\s*```/.exec(lowest);
  assert.ok(shape, 'step 4 holds the answer shape');
  const lines = shape[1].split('\n').filter((line) => line.trim());
  assert.ok(lines.length >= 6 && lines.length <= 8, `${lines.length} lines`);
  for (const words of ['额度价，非现金', '报价出处：', '官方价（现金）', '要帮你接到 <app> 吗？']) assert.ok(shape[1].includes(words), words);
  assert.match(lowest, /The last line is always the question "要帮你接到 <app> 吗？"[\s\S]*never the link or the question/);
  assert.match(lowest, /\[Response format\]\(references\/response-format\.md\) is only for what this shape does not cover/);
});

test('a relay term is explained from the glossary file itself, not a folder-wide search', () => {
  const always = section(body, 'Always');
  assert.match(always, /open that file with your skill file reader \(Hermes: `skill_view` with `file_path` `references\/glossary\.md`\)/);
  assert.match(always, /Don't search the whole Skill folder for the word/);
});

test('free-credit answers end with the grandet.ai page link', async () => {
  assert.match(section(body, '2. Free credits'), /https:\/\/grandet\.ai\/zh-CN\/free-tokens\/\?q=<q>/);
  const free = await read('references/free-credits.md');
  assert.match(free, /Then give the page link, always/);
  assert.match(free.slice(free.indexOf('## Example')), /完整列表：https:\/\/grandet\.ai\/zh-CN\/free-tokens\/\?q=gemini/);
});

test('installation reads download.md with curl, checks the build and keeps Hermes in HERMES_HOME', async () => {
  const install = await read('references/installation.md');
  const steps = install.slice(install.indexOf('## Installing or updating'), install.indexOf('## Installation and update checks'));
  for (const words of ['curl -sS https://grandet.ai/download.md', 'web_extract', 'https://grandet.ai/dl/latest.json', '`zip.url`', '`Installation build` line', '`$HERMES_HOME/skills/grandet-api-price-finder/` and nowhere else']) {
    assert.ok(steps.includes(words), words);
  }
  const kit = await readFile(new URL('INSTALL.md', root), 'utf8');
  assert.match(kit, /A copy that names an older build is out of date/);
  assert.match(kit, /\| Hermes \| `hermes` \| `\$HERMES_HOME\/skills\/`/);
});

test('one build ID everywhere a release ships or pins it', async () => {
  const result = await checkBuildId();
  assert.deepEqual(result.problems, []);
  assert.equal(result.skillMentions, SKILL_BUILD_MENTIONS);
  assert.deepEqual(identity('grandet-skill-0.3.0-build.20261017'), { build: 'grandet-skill-0.3.0-build.20261017', tag: 'skill-v0.3.0-build.20261017', registryVersion: '0.3.0-build.20261017.0' });
  assert.equal(identity('grandet-skill-0.3.0-build.20261016h').registryVersion, '0.3.0-build.20261016.8');
  assert.deepEqual(mentions('x 0.3.0-build.20261016.8 y skill-v0.3.0-build.20261016h').map((m) => m.build), ['grandet-skill-0.3.0-build.20261016h', 'grandet-skill-0.3.0-build.20261016h']);
});

test('the check refuses a stale build ID and a wrong SKILL.md count', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'grandet-build-id-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await cp(new URL('skills/grandet-api-price-finder', root), join(dir, 'skills/grandet-api-price-finder'), { recursive: true });
  const free = join(dir, 'skills/grandet-api-price-finder/references/free-credits.md');
  await writeFile(free, (await readFile(free, 'utf8')).replace('build.20261017', 'build.20261016h'));
  const stale = await checkBuildId(dir);
  assert.ok(stale.problems.some((p) => p.includes('free-credits.md') && p.includes('20261016h')), stale.problems.join('\n'));
  const skill = join(dir, 'skills/grandet-api-price-finder/SKILL.md');
  await writeFile(skill, (await readFile(skill, 'utf8')).replace('skillBuild=grandet-skill-0.3.0-build.20261017', 'skillBuild=x'));
  assert.ok((await checkBuildId(dir)).problems.some((p) => p.includes(`expected ${SKILL_BUILD_MENTIONS}`)));
});
