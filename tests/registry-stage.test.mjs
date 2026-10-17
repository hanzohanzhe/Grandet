// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { ROOT, SLUG, chinaLinkMismatches, clawhubVersion, parseBuild, parseTag, readZip, splitSkill, stage } from '../scripts/stage-registry-skill.mjs';

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
// SkillHub CLI 2026.8.5 checks, copied from skills_store_cli.py: its front-matter reader takes every
// `key: value` line at any indent, the version must match this pattern and the slug must be kebab-case.
const SKILLHUB_SEMVER = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/;
const SKILLHUB_SLUG = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
const skillhubFrontMatter = (text) => Object.fromEntries(text.split('\n---\n')[0].split('\n').slice(1)
  .filter((line) => line.includes(':')).map((line) => [line.split(':')[0].trim(), line.slice(line.indexOf(':') + 1).trim()]));
const readTree = async (dir) => new Map(await Promise.all((await readdir(dir, { recursive: true, withFileTypes: true }))
  .filter((d) => d.isFile())
  .map(async (d) => { const p = join(d.parentPath ?? d.path, d.name); return [p.slice(dir.length + 1).replaceAll('\\', '/'), await readFile(p)]; })));
const releaseArchive = async () => {
  const manifest = JSON.parse(await readFile(join(ROOT, 'downloads/manifest.json'), 'utf8'));
  const entry = manifest.files.find((f) => f.file.endsWith('.skill'));
  return new Map([...readZip(await readFile(join(ROOT, 'downloads', entry.file)))].map(([n, b]) => [n.slice(SLUG.length + 1), b]));
};

test('release tags map to ordered registry versions', () => {
  const builds = ['20261015c', '20261015d', '20261015e', '20261016', '20261016b', '20261016c', '20261016d', '20261016e'];
  const versions = builds.map((b) => parseTag(`skill-v0.3.0-build.${b}`).registryVersion);
  assert.deepEqual(versions.slice(-3), ['0.3.0-build.20261016.3', '0.3.0-build.20261016.4', '0.3.0-build.20261016.5']);
  for (let i = 1; i < versions.length; i++) assert.ok(cmpPre(versions[i - 1], versions[i]) < 0, `${versions[i - 1]} < ${versions[i]}`);
  for (const v of versions) assert.match(v, SKILLHUB_SEMVER);
  assert.match(SLUG, SKILLHUB_SLUG);
  assert.equal(parseBuild('grandet-skill-0.3.0-build.20261016c').tag, 'skill-v0.3.0-build.20261016c');
  assert.throws(() => parseTag('v0.3.0'), /UNSUPPORTED_RELEASE_TAG/);
});

test('a ClawHub revision of a build sorts after that build and before the next one', () => {
  const [e, f] = ['20261016e', '20261016f'].map((b) => parseTag(`skill-v0.3.0-build.${b}`).registryVersion);
  assert.equal(clawhubVersion(e), e);
  assert.equal(clawhubVersion(e, ''), e);
  assert.equal(clawhubVersion(e, '1'), '0.3.0-build.20261016.5.1');
  assert.ok(cmpPre(e, clawhubVersion(e, 1)) < 0 && cmpPre(clawhubVersion(e, 1), clawhubVersion(e, 2)) < 0 && cmpPre(clawhubVersion(e, 2), f) < 0);
  assert.match(clawhubVersion(e, 12), SKILLHUB_SEMVER);
  for (const bad of ['0', '01', '-1', '1.2', 'a', '99999']) assert.throws(() => clawhubVersion(e, bad), /CLAWHUB_REVISION_INVALID/, bad);
});

test('GitHub, SkillHub and ClawHub ship the same Skill; each copy differs only where its registry requires and passes its own manifest', async () => {
  const out = await mkdtemp(join(tmpdir(), 'grandet-registry-'));
  try {
    const r = await stage({ out });
    const kit = await releaseArchive();
    for (const name of ['SKILL.md', 'INSTALL.md', 'LICENSE', 'package-manifest.json', 'scripts/install-price-finder.mjs', 'scripts/installation-receipts.mjs', 'scripts/verify-installation.py', 'scripts/connect.mjs']) assert.ok(kit.has(name), name);
    // INSTALL.md tells people to check a package against its package-manifest.json, so every copy must pass:
    // the manifest lists exactly that copy's files, keeps every other release field and names the release manifest.
    const sha = (b) => createHash('sha256').update(b).digest('hex');
    const { files: _release, ...releaseRest } = JSON.parse(kit.get('package-manifest.json').toString('utf8'));
    const ownManifest = (tree, registry) => {
      const { files, registryCopy, ...rest } = JSON.parse(tree.get('package-manifest.json').toString('utf8'));
      assert.deepEqual(files, Object.fromEntries([...tree].filter(([n]) => n !== 'package-manifest.json').map(([n, b]) => [n, sha(b)])), registry);
      assert.deepEqual(Object.keys(files), Object.keys(files).toSorted(), registry);
      assert.deepEqual(rest, releaseRest, registry);
      assert.equal(registryCopy.registry, registry);
      assert.equal(registryCopy.releaseManifestSha256, sha(kit.get('package-manifest.json')));
      return registryCopy.changes;
    };

    // SkillHub refuses files without an extension, so LICENSE travels as LICENSE.txt; every file keeps its bytes.
    const hubTree = await readTree(r.skillhub.dir);
    const hubExpected = new Map([...kit].map(([n, b]) => [n === 'LICENSE' ? 'LICENSE.txt' : n, b]));
    assert.deepEqual([...hubTree.keys()].sort(), [...hubExpected.keys()].sort());
    for (const [name, bytes] of hubTree) if (name !== 'package-manifest.json') assert.deepEqual(bytes, hubExpected.get(name), name);
    for (const name of hubTree.keys()) assert.match(name.split('/').pop(), /\./, `SkillHub would refuse ${name}`);
    assert.deepEqual(ownManifest(hubTree, 'skillhub'), ['LICENSE uploaded as LICENSE.txt: SkillHub refuses files without an extension']);
    assert.equal(r.skillhub.files, hubTree.size);

    // ClawHub publishes every Skill as MIT-0: no LICENSE, no license line, plus its runtime metadata. The Skill
    // body and every other file are the release's.
    const claw = await readTree(r.clawhub.dir);
    assert.deepEqual([...claw.keys()].sort(), [...kit.keys()].filter((n) => n !== 'LICENSE' && n !== 'data/price-snapshot.json').sort());
    for (const [name, bytes] of claw) if (name !== 'SKILL.md' && name !== 'package-manifest.json') assert.deepEqual(bytes, kit.get(name), name);
    const original = kit.get('SKILL.md').toString('utf8'), clawSkill = claw.get('SKILL.md').toString('utf8');
    // splitSkill reads only the source's two-level front matter; ClawHub's metadata.openclaw goes deeper.
    const front = (text) => text.slice(4, text.indexOf('\n---\n')).split('\n');
    assert.equal(clawSkill.slice(clawSkill.indexOf('\n---\n') + 5), splitSkill(original).body);
    const openclaw = ['  openclaw:', '    homepage: https://grandet.ai', '    requires:', '      anyBins:', '        - curl', '        - node'];
    assert.deepEqual(front(clawSkill), [...front(original).filter((l) => !/^license:/.test(l)), ...openclaw]);
    assert.equal(ownManifest(claw, 'clawhub').length, kit.has('data/price-snapshot.json') ? 3 : 2);
    assert.equal(r.clawhub.files, claw.size);
    assert.equal(r.clawhub.version, r.registryVersion);
    assert.equal(r.clawhub.changelog, r.changelog);

    const hub = skillhubFrontMatter(original);
    assert.equal(hub.slug, SLUG);
    for (const key of ['displayName', 'summary', 'description', 'license']) assert.ok(hub[key], key);
    assert.ok(!('tags' in hub), 'SkillHub would turn tags into version pointers');
    assert.ok(original.includes(`Installation build: \`${r.build}\``));
    assert.equal(r.chinaDownload, `https://api.skillhub.cn/api/v1/download?slug=${SLUG}&version=${r.registryVersion}`);
  } finally {
    await rm(out, { recursive: true, force: true });
  }
});

test('every China download link in the repository names the current registry version', async () => {
  const { body } = splitSkill(await readFile(join(ROOT, 'skills', SLUG, 'SKILL.md'), 'utf8'));
  const version = parseBuild(/Installation build: `([^`]+)`/.exec(body)[1]).registryVersion;
  const tracked = JSON.parse(await readFile(join(ROOT, 'public-export-manifest.json'), 'utf8')).files.map((f) => f.path);
  const files = new Map(await Promise.all(tracked.map(async (p) => [p, await readFile(join(ROOT, p))])));
  assert.deepEqual(chinaLinkMismatches(files, version), []);
  assert.ok(files.get('INSTALL.md').toString('utf8').includes(`version=${version}`), 'INSTALL.md offers the China download');
  assert.deepEqual(chinaLinkMismatches(new Map([['x.md', Buffer.from('api.skillhub.cn/api/v1/download?slug=grandet-api-price-finder&version=0.0.1')]]), version), ['x.md: 0.0.1']);
});

test('a changed archive, another build tag or a non-empty output folder is refused', async () => {
  const tmp = await mkdtemp(join(tmpdir(), 'grandet-registry-'));
  try {
    await assert.rejects(stage({ out: join(tmp, 'a'), tag: 'skill-v0.3.0-build.20000101' }), /TAG_BUILD_MISMATCH/);
    await stage({ out: join(tmp, 'b') });
    await assert.rejects(stage({ out: join(tmp, 'b') }), /OUTPUT_NOT_EMPTY/);
    await assert.rejects(stage({ out: join(tmp, 'd'), clawhubRevision: '0' }), /CLAWHUB_REVISION_INVALID/);
    const revised = await stage({ out: join(tmp, 'e'), clawhubRevision: '1' });
    assert.equal(revised.clawhub.version, `${revised.registryVersion}.1`);
    assert.match(revised.clawhub.changelog, /ClawHub revision 1 of the same build/);
    await cp(join(ROOT, 'downloads'), join(tmp, 'root', 'downloads'), { recursive: true });
    const manifestPath = join(tmp, 'root', 'downloads', 'manifest.json');
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    manifest.files.find((f) => f.file.endsWith('.skill')).sha256 = '0'.repeat(64);
    await writeFile(manifestPath, JSON.stringify(manifest));
    await assert.rejects(stage({ root: join(tmp, 'root'), out: join(tmp, 'c') }), /SKILL_ARCHIVE_PIN_MISMATCH/);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});
