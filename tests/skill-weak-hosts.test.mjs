// SPDX-License-Identifier: Apache-2.0
// Lessons from automated rounds with weak models in Hermes Agent: the Skill must route from a 57-character
// description slice, work without the grandet_* MCP tools, say how to uninstall it, and keep credit apart from cash.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { splitSkill } from '../scripts/stage-registry-skill.mjs';
import { boardRequest } from '../scripts/run-answer-evals.mjs';

const skillDir = new URL('../skills/grandet-api-price-finder/', import.meta.url);
const read = (path) => readFile(new URL(path, skillDir), 'utf8');
const skill = await read('SKILL.md');
const { top, body } = splitSkill(skill);
const build = /Installation build: `([^`]+)`/.exec(body)[1];
const version = /Package version: `([^`]+)`/.exec(body)[1];
const section = (text, heading) => {
  const start = text.indexOf(`\n## ${heading}\n`);
  assert.ok(start >= 0, `missing section: ${heading}`);
  const end = text.indexOf('\n## ', start + 1);
  return text.slice(start, end < 0 ? undefined : end);
};
const blocks = (text, language) => [...text.matchAll(new RegExp('```' + language + '\\n([\\s\\S]*?)\\n```', 'g'))].map((m) => m[1]);
const dataFirst = section(body, 'Get the data first');
// Hermes lists each Skill in its system prompt as "name: description", cut to 57 characters plus "...".
const HERMES_VISIBLE = 57;

test('the description slice Hermes shows decides price questions and rules out web search', () => {
  const description = top.description;
  assert.ok(description.length <= 1024, `${description.length} characters`);
  const visible = description.slice(0, HERMES_VISIBLE);
  for (const words of ['API prices', '中转站', '免费额度', 'not web search']) assert.ok(visible.includes(words), `${words} in "${visible}"`);
  for (const words of ['cheapest API', 'price per million tokens', 'output price', 'which provider is cheaper', '哪家便宜', '多少钱', '倍率', '分组', '纯血/逆向', '公益站', '签到', '中转站黑话']) {
    assert.ok(description.includes(words), words);
  }
  assert.ok(description.indexOf('jargon') < 150, 'relay jargon comes right after the routing clause');
  assert.doesNotMatch(description, /: | #/, 'a plain YAML scalar cannot hold ": " or " #"');
});

test('the body opens with copy-paste requests for hosts without the grandet_* tools', () => {
  assert.ok(body.indexOf('## Get the data first') < body.indexOf('## What this Skill changes'));
  assert.ok(body.indexOf('## Get the data first') < body.indexOf('## Always'));
  assert.match(dataFirst, /Do not web-search prices; this endpoint is the source/);
  assert.match(dataFirst, /no `grandet_\*` tool is there, don't search for one/);
  const [board, free] = blocks(dataFirst, 'sh').filter((block) => block.startsWith('curl '));
  // Hermes denies pipes into interpreters and `python -c` in one-shot sessions; a plain curl GET runs.
  for (const command of [board, free]) assert.ok(!/[|;&]/.test(command.replace(/"[^"]*"/g, '""')), `one plain request, no pipe or chain: ${command}`);

  const request = boardRequest(`exec\n${board}\n succeeded in 1ms:`);
  assert.equal(request.from, 'CURL_COMMAND');
  assert.deepEqual(Object.fromEntries(request.params), { view: 'compact', lang: 'zh-CN', limit: '10', skillVersion: version, skillBuild: build, model: 'Claude Opus 4.6' });

  const freeUrl = new URL(/"(https:\/\/grandet\.ai\/api\/v1\/free-credits\?[^"]+)"/.exec(free)[1]);
  assert.deepEqual(Object.fromEntries(freeUrl.searchParams), { lang: 'zh-CN', limit: '10', skillVersion: version, skillBuild: build });
  assert.match(free, /--data-urlencode "q=gemini"$/);

  const python = blocks(dataFirst, 'sh').find((block) => block.startsWith('python3 -c'));
  const pythonParams = Object.fromEntries([...python.matchAll(/'(\w+)':(?:'([^']*)'|(\d+))/g)].map((m) => [m[1], m[2] ?? m[3]]));
  const [powershell] = blocks(dataFirst, 'powershell');
  const powershellParams = Object.fromEntries([.../@\{([^}]*)\}/.exec(powershell)[1].matchAll(/(\w+)=(?:'([^']*)'|(\d+))/g)].map((m) => [m[1], m[2] ?? m[3]]));
  for (const params of [pythonParams, powershellParams]) assert.deepEqual(params, Object.fromEntries(request.params));
  assert.match(python, /'User-Agent':'grandet-skill\/0\.3\.0'/);
  assert.match(powershell, /^irm https:\/\/grandet\.ai\/api\/v1\/board -UseBasicParsing -UserAgent grandet-skill\/0\.3\.0 /);
});

test('uninstalling is spelled out per host, said the same way everywhere', async () => {
  const short = section(body, 'Uninstall or install this Skill');
  assert.match(short, /Uninstalling means moving the `grandet-api-price-finder` folder out of the app's skills folder; no app has a command for a copied Skill folder\./);
  assert.match(short, /`node scripts\/install-price-finder\.mjs --app <app> --uninstall`/);
  // One wording: the folder move is the uninstall, and the bundled installer can do it. Nothing says there is no way.
  for (const text of [body, await read('references/installation.md')]) assert.doesNotMatch(text, /no uninstall command/i);
  for (const words of ['$HERMES_HOME/skills/', '~/.hermes/skills/', '%LOCALAPPDATA%\\hermes\\skills\\', 'hermes skills list', '~/.claude/skills/', '~/.agents/skills/', '"Uninstalling" in [installation](references/installation.md)']) {
    assert.ok(short.includes(words), words);
  }
  const reference = section(await read('references/installation.md'), 'Uninstalling');
  assert.match(reference, /The apps have no command for a copied Skill folder/);
  assert.match(reference, /--uninstall/);
  assert.match(reference, /`hermes skills uninstall` only removes Hermes hub skills/);
  assert.match(reference, /`hermes skills list` must no longer show `grandet-api-price-finder`/);
  for (const command of [...blocks(reference, 'sh'), ...blocks(reference, 'powershell')]) {
    assert.match(command, /HERMES_HOME/);
    assert.doesNotMatch(command, /\brm\b|Remove-Item/, 'a move keeps a backup, and Hermes denies recursive deletes in one-shot sessions');
  }
});

test('the Hermes uninstall command moves the Skill out of the profile in HERMES_HOME', { skip: process.platform === 'win32' && 'POSIX shell command' }, async (t) => {
  const home = await mkdtemp(join(tmpdir(), 'grandet-hermes-uninstall-'));
  t.after(() => rm(home, { recursive: true, force: true }));
  const profile = join(home, 'profiles', 'test');
  await mkdir(join(profile, 'skills', 'grandet-api-price-finder'), { recursive: true });
  await writeFile(join(profile, 'skills', 'grandet-api-price-finder', 'SKILL.md'), 'test');
  await mkdir(join(home, '.hermes', 'skills', 'grandet-api-price-finder'), { recursive: true });
  const [command] = blocks(section(await read('references/installation.md'), 'Uninstalling'), 'sh');
  const done = spawnSync('sh', ['-c', command], { encoding: 'utf8', env: { ...process.env, HOME: home, HERMES_HOME: profile } });
  assert.equal(done.status, 0, done.stderr);
  assert.deepEqual(await readdir(join(profile, 'skills')), []);
  assert.equal(await readFile(join(profile, '.grandet-skill-backups', 'grandet-api-price-finder', 'SKILL.md'), 'utf8'), 'test');
  assert.deepEqual(await readdir(join(home, '.hermes', 'skills')), ['grandet-api-price-finder'], 'the default folder is not the profile in use');
});

test('Hermes installs follow HERMES_HOME and are checked with hermes skills list', async () => {
  const reference = await read('references/installation.md');
  const hermes = reference.slice(reference.indexOf('**Hermes.**'), reference.indexOf('## Account, web and cloud apps'));
  for (const words of ['$HERMES_HOME/skills/grandet-api-price-finder/', 'only when it is empty use the default', '--app hermes', 'hermes skills list']) assert.ok(hermes.includes(words), words);
});

test('credit rows are compared within one board and never converted by the agent', async () => {
  const rule = body.slice(body.indexOf('**Credit is not cash.**'), body.indexOf('## 2. Free credits'));
  for (const words of ['`USD_CREDIT` and `CNY_CREDIT`', 'compare numbers only within one board', 'Never rank, add or convert numbers across boards', "never look up a site's own pages", 'until Grandet converts them']) {
    assert.ok(rule.includes(words), words);
  }
  // Price lookups only read from grandet.ai; a relay's own pages carry operator-written text and are no rate source.
  const format = await read('references/response-format.md');
  for (const text of [body, format]) assert.doesNotMatch(text, /<sourceId>\/api\/status/);
  assert.match(format, /never convert credit into cash\./);
});
