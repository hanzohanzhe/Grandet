// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, readdir, rm, stat, symlink, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

process.env.GRANDET_INSTALL_TELEMETRY = '0'; // Unit tests never send production receipts.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const script = join(root, 'scripts/install-price-finder.mjs');
const source = join(root, 'skills/grandet-api-price-finder');
const skillName = 'grandet-api-price-finder';
const run = (...args) => spawnSync(process.execPath, [script, ...args], { encoding: 'utf8', cwd: root });
const json = (result) => { assert.equal(result.status, 0, result.stderr); return JSON.parse(result.stdout); };
async function fixture(t) {
  const parent = tmpdir();
  const temporary = await mkdtemp(join(parent, 'skill-installer-test-'));
  t.after(async () => {
    const checked = relative(parent, temporary);
    assert.ok(checked.startsWith('skill-installer-test-') && !checked.includes('..'));
    await rm(temporary, { recursive: true, force: true });
  });
  return { temporary, home: join(temporary, 'home') };
}
async function tree(directory, prefix = '') {
  const result = {};
  for (const entry of await readdir(join(directory, prefix), { withFileTypes: true })) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.name === '.grandet-install-state') continue;
    if (entry.isDirectory()) Object.assign(result, await tree(directory, path));
    else result[path] = (await readFile(join(directory, path))).toString('base64');
  }
  return result;
}
async function absent(path) { await assert.rejects(stat(path), { code: 'ENOENT' }); }

test('lists only documented local copy routes and does not present cloud products as file installs', () => {
  const result = json(run('--list'));
  assert.equal(result.productVersion, '0.3.1');
  for (const app of ['codex', 'claude-code', 'cursor', 'opencode', 'gemini-cli', 'cline', 'roo-code', 'kilo-code', 'windsurf', 'continue', 'hermes', 'openclaw', 'trae-cn', 'trae-intl']) {
    assert.ok(result.applications.some((entry) => entry.id === app), app);
  }
  assert.ok(!result.applications.some((entry) => ['chatgpt', 'cursor-cloud-agent', 'your-dot', 'muse', 'grok-bot'].includes(entry.id)));
  assert.equal(result.nativeAcceptance, 'NOT_RUN');
});

test('one install copies the complete common Skill and preserves other skills and application settings', async (t) => {
  const { home } = await fixture(t);
  const unrelated = join(home, '.agents/skills/other-skill');
  await mkdir(unrelated, { recursive: true });
  await writeFile(join(unrelated, 'SKILL.md'), 'other skill');
  await writeFile(join(home, 'settings.json'), '{"keep":"unchanged"}');
  const result = json(run('--app', 'codex', '--home', home));
  assert.equal(result.status, 'INSTALLED');
  assert.equal(result.productVersion, '0.3.1');
  assert.equal(result.destination, join(home, '.agents/skills', skillName));
  assert.deepEqual(await tree(result.destination), await tree(source));
  for (const path of ['SKILL.md', 'agents/openai.yaml', 'references/app-catalog.md', 'references/entrypoints.md', 'references/host-setup.md', 'references/http-fallback.md', 'references/response-format.md', 'references/workloads.md']) {
    assert.ok((await readFile(join(result.destination, path))).length > 0, path);
  }
  assert.equal(await readFile(join(unrelated, 'SKILL.md'), 'utf8'), 'other skill');
  assert.equal(await readFile(join(home, 'settings.json'), 'utf8'), '{"keep":"unchanged"}');
  assert.equal(result.nativeAcceptance, 'NOT_RUN');
});

test('an identical second install performs no writes or backup creation', async (t) => {
  const { home } = await fixture(t);
  const first = json(run('--app', 'cursor', '--home', home));
  const beforeFiles = await tree(home);
  const beforeStats = await Promise.all(Object.keys(beforeFiles).map(async (file) => [file, (await stat(join(home, file))).mtimeMs]));
  const result = json(run('--app', 'cursor', '--home', home));
  assert.equal(result.status, 'UNCHANGED');
  assert.equal(result.destination, first.destination);
  assert.deepEqual(await tree(home), beforeFiles);
  assert.deepEqual(await Promise.all(Object.keys(beforeFiles).map(async (file) => [file, (await stat(join(home, file))).mtimeMs])), beforeStats);
  assert.equal(result.backup, null);
});

test('a complete matching Skill in a documented alias is reused without a duplicate', async (t) => {
  const { home } = await fixture(t);
  const original = json(run('--app', 'codex', '--home', home));
  const before = await tree(home);
  const result = json(run('--app', 'gemini-cli', '--home', home));
  assert.equal(result.status, 'REUSED');
  assert.equal(result.destination, original.destination);
  assert.deepEqual(await tree(home), before);
  await absent(join(home, '.gemini'));
});

test('Codex reuses a complete legacy .codex Skill without writing a new .agents copy', async (t) => {
  const { home } = await fixture(t);
  const installed = join(home, '.codex/skills', skillName);
  await cp(source, installed, { recursive: true });
  const before = await tree(home);
  const beforeTime = (await stat(join(installed, 'SKILL.md'))).mtimeMs;
  const result = json(run('--app', 'codex', '--home', home));
  assert.equal(result.status, 'REUSED');
  assert.equal(result.destination, installed);
  assert.equal(result.backup, null);
  assert.deepEqual(await tree(home), before);
  assert.equal((await stat(join(installed, 'SKILL.md'))).mtimeMs, beforeTime);
  await absent(join(home, '.agents'));
});

test('Codex legacy content conflicts and duplicate discovery roots leave all copies intact', async (t) => {
  const { home } = await fixture(t);
  const legacy = join(home, '.codex/skills', skillName);
  await cp(source, legacy, { recursive: true });
  await writeFile(join(legacy, 'SKILL.md'), 'existing customized Grandet instructions');
  let before = await tree(home);
  let result = run('--app', 'codex', '--home', home);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /ALIAS_CONTENT_CONFLICT/);
  assert.deepEqual(await tree(home), before);
  await absent(join(home, '.agents'));
  await cp(source, legacy, { recursive: true });
  await cp(source, join(home, '.agents/skills', skillName), { recursive: true });
  before = await tree(home);
  result = run('--app', 'codex', '--home', home);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /MULTIPLE_SKILL_COPIES/);
  assert.deepEqual(await tree(home), before);
});

test('Cursor reuses its documented Claude and Codex aliases without claiming cloud sync readiness', async (t) => {
  const { home } = await fixture(t);
  for (const alias of ['.claude', '.codex']) {
    const isolatedHome = join(home, alias.slice(1));
    const installed = join(isolatedHome, alias, 'skills', skillName);
    await cp(source, installed, { recursive: true });
    const before = await tree(isolatedHome);
    const result = json(run('--app', 'cursor', '--home', isolatedHome));
    assert.equal(result.status, 'REUSED');
    assert.equal(result.destination, installed);
    assert.equal(result.cloudSyncStatus, 'ALIAS_REUSED_LOCAL_ONLY');
    assert.deepEqual(await tree(isolatedHome), before);
    await absent(join(isolatedHome, '.cursor'));
  }
});

test('different alias content or multiple discovered copies fail without moving or changing either copy', async (t) => {
  const { home } = await fixture(t);
  const alias = join(home, '.agents/skills', skillName);
  await cp(source, alias, { recursive: true });
  await writeFile(join(alias, 'SKILL.md'), 'a user-edited different skill');
  let before = await tree(home);
  let result = run('--app', 'cursor', '--home', home);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /ALIAS_CONTENT_CONFLICT/);
  assert.deepEqual(await tree(home), before);
  await cp(source, alias, { recursive: true });
  await cp(source, join(home, '.cursor/skills', skillName), { recursive: true });
  before = await tree(home);
  result = run('--app', 'cursor', '--home', home);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /MULTIPLE_SKILL_COPIES/);
  assert.deepEqual(await tree(home), before);
});

test('regional editions and runtime-specific defaults produce separate plans within an explicit test home', async (t) => {
  const { home } = await fixture(t);
  for (const [app, suffix] of [['trae-cn', '.trae-cn/skills'], ['trae-intl', '.trae/skills'], ['windsurf', '.codeium/windsurf/skills'], ['continue', '.continue/skills'], ['openclaw', '.openclaw/skills']]) {
    const result = json(run('--app', app, '--home', home, '--dry-run'));
    assert.equal(result.destination, join(home, suffix, skillName));
  }
  const hermesWindows = json(run('--app', 'hermes', '--home', home, '--platform', 'win32', '--dry-run'));
  assert.equal(hermesWindows.destination, join(home, 'AppData/Local/hermes/skills', skillName));
  const hermesPosix = json(run('--app', 'hermes', '--home', home, '--platform', 'linux', '--dry-run'));
  assert.equal(hermesPosix.destination, join(home, '.hermes/skills', skillName));
  await absent(home);
});

test('an explicit test home ignores actual per-app environment destinations', async (t) => {
  const { temporary, home } = await fixture(t);
  const external = join(temporary, 'ambient-runtime-do-not-touch');
  const env = { ...process.env, HERMES_HOME: external, CONTINUE_GLOBAL_DIR: external, LOCALAPPDATA: external, OPENCLAW_STATE_DIR: external, OPENCLAW_PROFILE: 'other-profile', OPENCLAW_HOME: external };
  for (const app of ['continue', 'hermes', 'openclaw']) {
    const result = json(spawnSync(process.execPath, [script, '--app', app, '--home', home, '--dry-run'], { encoding: 'utf8', cwd: root, env }));
    assert.ok(result.destination.startsWith(home + sep));
    assert.notEqual(result.destination, join(external, 'skills', skillName));
  }
  await absent(home);
  await absent(external);
});

test('dry-run honors verified runtime-root environment variables without writing to any home', async (t) => {
  const { temporary } = await fixture(t);
  const runtime = join(temporary, 'actual-runtime');
  for (const [app, variable] of [['continue', 'CONTINUE_GLOBAL_DIR'], ['hermes', 'HERMES_HOME'], ['openclaw', 'OPENCLAW_STATE_DIR']]) {
    const env = { ...process.env, OPENCLAW_PROFILE: '', OPENCLAW_HOME: '', [variable]: runtime };
    const result = json(spawnSync(process.execPath, [script, '--app', app, '--dry-run'], { encoding: 'utf8', cwd: root, env }));
    assert.equal(result.destination, join(runtime, 'skills', skillName));
  }
  await absent(runtime);
});

test('an unresolved OpenClaw profile override is reported instead of silently using the default state', async () => {
  const env = { ...process.env, OPENCLAW_STATE_DIR: '', OPENCLAW_PROFILE: 'test-profile', OPENCLAW_HOME: '' };
  const result = spawnSync(process.execPath, [script, '--app', 'openclaw', '--dry-run'], { encoding: 'utf8', cwd: root, env });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /OPENCLAW_STATE_DIR_REQUIRED/);
});

test('an update keeps an exact recoverable old directory outside skill discovery and removes no user material', async (t) => {
  const { temporary, home } = await fixture(t);
  const first = json(run('--app', 'claude-code', '--home', home));
  await writeFile(join(first.destination, 'my-notes.txt'), 'retain my notes');
  const old = await tree(first.destination);
  const revised = join(temporary, 'revised');
  await cp(source, revised, { recursive: true });
  await writeFile(join(revised, 'SKILL.md'), `${await readFile(join(revised, 'SKILL.md'), 'utf8')}\nA test update.\n`);
  const result = json(run('--app', 'claude-code', '--home', home, '--source', revised));
  assert.equal(result.status, 'UPDATED');
  assert.ok(!relative(join(home, '.claude/skills'), result.backup).startsWith(skillName));
  assert.ok(result.backup.startsWith(join(home, '.claude/.grandet-skill-backups')));
  assert.deepEqual(await tree(result.backup), old);
  assert.deepEqual(await tree(result.destination), await tree(revised));
  assert.equal(await readFile(join(result.backup, 'my-notes.txt'), 'utf8'), 'retain my notes');
});

test('a custom runtime keeps update staging and backups beside its discovery root instead of the system home', async (t) => {
  const { temporary } = await fixture(t);
  const runtime = join(temporary, 'custom-runtime');
  const env = { ...process.env, CONTINUE_GLOBAL_DIR: runtime };
  const invoke = () => spawnSync(process.execPath, [script, '--app', 'continue'], { encoding: 'utf8', cwd: root, env });
  const first = json(invoke());
  await writeFile(join(first.destination, 'keep.txt'), 'recover me');
  const result = json(invoke());
  assert.equal(result.status, 'UPDATED');
  assert.ok(result.backup.startsWith(join(runtime, '.grandet-skill-backups')));
  assert.equal(await readFile(join(result.backup, 'keep.txt'), 'utf8'), 'recover me');
  assert.deepEqual(await tree(result.destination), await tree(source));
});

test('dry run plans a single app without creating a home, settings, directories or backups', async (t) => {
  const { home } = await fixture(t);
  const result = json(run('--app', 'opencode', '--home', home, '--dry-run', '--platform', 'linux'));
  assert.equal(result.status, 'DRY_RUN');
  assert.equal(result.plannedAction, 'INSTALLED');
  assert.equal(result.destination, join(home, '.agents/skills', skillName));
  assert.equal(result.platform, 'linux');
  await absent(home);
});

test('unsupported apps, duplicate app choices and unsupported platforms fail before writing', async (t) => {
  const { home } = await fixture(t);
  for (const args of [['--app', 'chatgpt'], ['--app', '../codex'], ['--app', 'codex', '--app', 'cursor'], ['--app', 'codex', '--platform', 'freebsd']]) {
    const result = run(...args, '--home', home);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /UNSUPPORTED_APP|DUPLICATE_OPTION|UNSUPPORTED_PLATFORM/);
    await absent(home);
  }
});

test('cross-platform actual installation is refused while a dry-run remains possible', async (t) => {
  const { home } = await fixture(t);
  const other = process.platform === 'linux' ? 'darwin' : 'linux';
  const result = run('--app', 'codex', '--home', home, '--platform', other);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /CROSS_PLATFORM_REQUIRES_DRY_RUN/);
  await absent(home);
});

test('incomplete sources and missing local references fail without changing an existing installation', async (t) => {
  const { temporary, home } = await fixture(t);
  const first = json(run('--app', 'codex', '--home', home));
  const before = await tree(home);
  const broken = join(temporary, 'broken');
  await cp(source, broken, { recursive: true });
  await rm(join(broken, 'references/workloads.md'));
  let result = run('--app', 'codex', '--home', home, '--source', broken);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /INCOMPLETE_SKILL/);
  await cp(source, broken, { recursive: true });
  await writeFile(join(broken, 'SKILL.md'), `${await readFile(join(broken, 'SKILL.md'), 'utf8')}\n[missing](references/missing.md)\n`);
  result = run('--app', 'codex', '--home', home, '--source', broken);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /MISSING_SKILL_REFERENCE/);
  assert.deepEqual(await tree(home), before);
  assert.ok(await stat(first.destination));
});

test('source and destination overlap is rejected before modification', async (t) => {
  const { home } = await fixture(t);
  const first = json(run('--app', 'codex', '--home', home));
  const before = await tree(home);
  const result = run('--app', 'codex', '--home', home, '--source', first.destination);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /OVERLAPPING_PATHS/);
  assert.deepEqual(await tree(home), before);
});

test('symlinked sources and destination ancestors are rejected instead of following them', async (t) => {
  const { temporary, home } = await fixture(t);
  const linkedSource = join(temporary, 'linked-source');
  await symlink(source, linkedSource, 'junction');
  let result = run('--app', 'codex', '--home', home, '--source', linkedSource);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /SYMLINK_NOT_ALLOWED/);
  await absent(home);
  const outside = join(temporary, 'outside');
  await mkdir(outside);
  await mkdir(home);
  await symlink(outside, join(home, '.agents'), 'junction');
  result = run('--app', 'codex', '--home', home);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /SYMLINK_NOT_ALLOWED/);
  assert.deepEqual(await readdir(outside), []);
});
