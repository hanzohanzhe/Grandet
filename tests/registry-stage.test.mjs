// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { ROOT, SKILL_DIR, SLUG, parseBuild, parseTag, splitSkill, stage } from '../scripts/stage-registry-skill.mjs';

// SemVer 2.0 precedence for the prerelease part, enough to check registry ordering.
const cmpPre = (a, b) => {
  const x = a.split('-')[1].split('.'), y = b.split('-')[1].split('.');
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    if (x[i] === undefined) return -1;
    if (y[i] === undefined) return 1;
    const nx = /^\d+$/.test(x[i]), ny = /^\d+$/.test(y[i]);
    if (nx && ny && Number(x[i]) !== Number(y[i])) return Number(x[i]) - Number(y[i]);
    if (nx !== ny) return nx ? -1 : 1;
    if (!nx && x[i] !== y[i]) return x[i] < y[i] ? -1 : 1;
  }
  return 0;
};
// SkillHub CLI 2026.8.5 checks, copied from skills_store_cli.py.
const SKILLHUB_SEMVER = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/;
const SKILLHUB_SLUG = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

test('release tags map to ordered registry versions', () => {
  const builds = ['20261015c', '20261015d', '20261015e', '20261016', '20261016b', '20261016c'];
  const versions = builds.map((b) => parseTag(`skill-v0.3.0-build.${b}`).registryVersion);
  assert.deepEqual(versions.slice(-3), ['0.3.0-build.20261016.0', '0.3.0-build.20261016.2', '0.3.0-build.20261016.3']);
  for (let i = 1; i < versions.length; i++) assert.ok(cmpPre(versions[i - 1], versions[i]) < 0, `${versions[i - 1]} < ${versions[i]}`);
  for (const v of versions) assert.match(v, SKILLHUB_SEMVER);
  assert.match(SLUG, SKILLHUB_SLUG);
  assert.equal(parseBuild('grandet-skill-0.3.0-build.20261016c').tag, 'skill-v0.3.0-build.20261016c');
  assert.throws(() => parseTag('v0.3.0'), /UNSUPPORTED_RELEASE_TAG/);
});

test('staged copies keep the Skill body and files, and only rewrite front matter', async () => {
  const out = await mkdtemp(join(tmpdir(), 'grandet-registry-'));
  try {
    const source = await readFile(join(ROOT, SKILL_DIR, 'SKILL.md'), 'utf8');
    const { body } = splitSkill(source);
    const r = await stage({ out });
    assert.equal(r.slug, SLUG);
    assert.ok(body.includes(`Installation build: \`${r.build}\``));
    const sourceFiles = (await readdir(join(ROOT, SKILL_DIR), { recursive: true })).sort();
    for (const registry of ['clawhub', 'skillhub']) {
      const dir = r[registry].dir;
      assert.deepEqual((await readdir(dir, { recursive: true })).sort(), sourceFiles);
      const staged = await readFile(join(dir, 'SKILL.md'), 'utf8');
      assert.equal(staged.slice(staged.indexOf('\n---\n') + 5), body);
      assert.match(staged, new RegExp(`^version: ${r.registryVersion.replaceAll('.', '\\.')}$`, 'm'));
      for (const file of sourceFiles) {
        if (file === 'SKILL.md' || (await stat(join(dir, file))).isDirectory()) continue;
        assert.deepEqual(await readFile(join(dir, file)), await readFile(join(ROOT, SKILL_DIR, file)), file);
      }
    }
    const claw = await readFile(join(r.clawhub.dir, 'SKILL.md'), 'utf8');
    assert.doesNotMatch(claw.split('\n---\n')[0], /^license:/m, 'ClawHub publishes every Skill as MIT-0');
    assert.match(claw, /^ {4}requires:$/m);
    const hub = (await readFile(join(r.skillhub.dir, 'SKILL.md'), 'utf8')).split('\n---\n')[0].split('\n').slice(1);
    for (const line of hub) assert.match(line, /^[A-Za-z]\w*: \S/, `SkillHub reads flat lines only: ${line}`);
    for (const key of ['slug', 'displayName', 'version', 'summary', 'license']) assert.ok(hub.some((l) => l.startsWith(`${key}: `)), key);
  } finally {
    await rm(out, { recursive: true, force: true });
  }
});

test('a tag for another build is refused, and so is a non-empty output folder', async () => {
  const out = await mkdtemp(join(tmpdir(), 'grandet-registry-'));
  try {
    await assert.rejects(stage({ out, tag: 'skill-v0.3.0-build.20000101' }), /TAG_BUILD_MISMATCH/);
    await stage({ out });
    await assert.rejects(stage({ out }), /OUTPUT_NOT_EMPTY/);
  } finally {
    await rm(out, { recursive: true, force: true });
  }
});
