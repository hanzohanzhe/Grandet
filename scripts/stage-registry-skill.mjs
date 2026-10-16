// SPDX-License-Identifier: Apache-2.0
// Stage a Skill release for ClawHub and Tencent SkillHub. Both registries get the complete installation kit
// from the release's pinned .skill archive (Skill, installer, receipt module, Python verifier, INSTALL.md,
// package-manifest.json), so people who cannot reach GitHub, notably in mainland China, download everything
// from the registry. SkillHub receives every file byte-for-byte, with files that have no extension (LICENSE)
// renamed to .txt because SkillHub refuses them. ClawHub, which publishes every Skill as MIT-0, receives the
// kit without the Apache license line and LICENSE file and with its runtime metadata added.
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateRawSync } from 'node:zlib';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const SLUG = 'grandet-api-price-finder';
export const HOMEPAGE = 'https://grandet.ai';
export const CHINA_DOWNLOAD = `https://api.skillhub.cn/api/v1/download?slug=${SLUG}&version=`;
export const LISTING = {
  clawhub: {
    name: 'Grandet API Price Finder',
    categories: 'integrations,finance,research',
    topics: 'llm-api,price-comparison,api-relay,free-credits,model-pricing',
  },
};

const TAG = /^skill-v(\d+\.\d+\.\d+)-build\.(\d{8})([a-z]?)$/;
const BUILD = /^grandet-skill-(\d+\.\d+\.\d+)-build\.(\d{8})([a-z]?)$/;

// Releases are tagged skill-v<product>-build.<YYYYMMDD><letter>, where the product version stays fixed
// and the letter counts same-day rebuilds ('' , b, c, ...). Registries need a distinct, ordered SemVer
// per upload, so the build becomes numeric prerelease identifiers: '' -> .0, a -> .1, b -> .2, c -> .3.
function versionFrom(product, date, letter) {
  const seq = letter ? letter.charCodeAt(0) - 96 : 0;
  return {
    product,
    build: `grandet-skill-${product}-build.${date}${letter}`,
    tag: `skill-v${product}-build.${date}${letter}`,
    registryVersion: `${product}-build.${date}.${seq}`,
  };
}

export function parseTag(tag) {
  const m = TAG.exec(tag);
  if (!m) throw new Error(`UNSUPPORTED_RELEASE_TAG: ${tag}`);
  return versionFrom(m[1], m[2], m[3]);
}

export function parseBuild(build) {
  const m = BUILD.exec(build);
  if (!m) throw new Error(`UNSUPPORTED_BUILD_ID: ${build}`);
  return versionFrom(m[1], m[2], m[3]);
}

// Reads the archives written by scripts/build-skill-archives.py (stored or deflated, no ZIP64).
export function readZip(buffer) {
  const eocd = buffer.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (eocd < 0) throw new Error('ZIP_END_RECORD_MISSING');
  const count = buffer.readUInt16LE(eocd + 10);
  const files = new Map();
  for (let i = 0, p = buffer.readUInt32LE(eocd + 16); i < count; i++) {
    if (buffer.readUInt32LE(p) !== 0x02014b50) throw new Error('ZIP_CENTRAL_HEADER_INVALID');
    const method = buffer.readUInt16LE(p + 10), size = buffer.readUInt32LE(p + 20), length = buffer.readUInt32LE(p + 24);
    const nameLength = buffer.readUInt16LE(p + 28), extra = buffer.readUInt16LE(p + 30), comment = buffer.readUInt16LE(p + 32);
    const local = buffer.readUInt32LE(p + 42);
    const name = buffer.toString('utf8', p + 46, p + 46 + nameLength);
    p += 46 + nameLength + extra + comment;
    if (name.endsWith('/')) continue;
    if (name.startsWith('/') || name.split('/').includes('..') || name.includes('\\')) throw new Error(`ZIP_PATH_UNSAFE: ${name}`);
    const start = local + 30 + buffer.readUInt16LE(local + 26) + buffer.readUInt16LE(local + 28);
    const raw = buffer.subarray(start, start + size);
    const body = method === 8 ? inflateRawSync(raw) : method === 0 ? Buffer.from(raw) : null;
    if (!body || body.length !== length) throw new Error(`ZIP_ENTRY_UNREADABLE: ${name}`);
    files.set(name, body);
  }
  return files;
}

export function splitSkill(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(text);
  if (!m) throw new Error('SKILL_FRONT_MATTER_MISSING');
  const top = {}, metadata = {};
  let inMetadata = false;
  for (const line of m[1].split(/\r?\n/)) {
    if (!line.trim()) continue;
    const kv = /^( *)([A-Za-z][\w-]*):\s?(.*)$/.exec(line);
    if (!kv) throw new Error(`SKILL_FRONT_MATTER_UNSUPPORTED: ${line}`);
    if (kv[1].length === 0) { top[kv[2]] = kv[3]; inMetadata = kv[2] === 'metadata'; }
    else if (inMetadata && kv[1].length === 2) metadata[kv[2]] = kv[3];
    else throw new Error(`SKILL_FRONT_MATTER_TOO_DEEP: ${line}`);
  }
  return { front: m[1], top, metadata, body: text.slice(m[0].length) };
}

// ClawHub publishes every Skill as MIT-0 and refuses other license terms, and reads runtime needs from
// metadata.openclaw. Its copy drops the license line and adds that block; everything else is unchanged.
export function clawhubSkill(text) {
  const { front, body } = splitSkill(text);
  const lines = front.split(/\r?\n/).filter((line) => line.trim() && !/^license:/.test(line));
  const at = lines.indexOf('metadata:');
  if (at < 0 || lines.slice(at + 1).some((line) => !line.startsWith('  '))) throw new Error('SKILL_METADATA_MUST_BE_LAST');
  const openclaw = ['  openclaw:', `    homepage: ${HOMEPAGE}`, '    requires:', '      anyBins:', '        - curl', '        - node'];
  return ['---', ...lines, ...openclaw, '---', ''].join('\n') + body;
}

// Every China download link in the kit must name this build's registry version; a stale one would hand
// mainland users an older build, or a 404 once that version is gone.
export function chinaLinkMismatches(files, registryVersion) {
  const wrong = [];
  for (const [name, bytes] of files) {
    if (!/\.(md|txt|json)$/.test(name)) continue;
    for (const m of bytes.toString('utf8').matchAll(/api\.skillhub\.cn\/api\/v1\/download\?slug=grandet-api-price-finder&version=([0-9A-Za-z.+-]+)/g)) {
      if (m[1] !== registryVersion) wrong.push(`${name}: ${m[1]}`);
    }
  }
  return wrong;
}

// SkillHub's upload rejects files without an extension ("不允许的文件类型: LICENSE"), so they get .txt there.
export function skillhubName(name) {
  const base = name.split('/').pop();
  return base.includes('.') ? name : `${name}.txt`;
}

const sha256 = (b) => createHash('sha256').update(b).digest('hex');

async function exists(p) {
  try { await stat(p); return true; } catch { return false; }
}

export async function stage({ root = ROOT, tag, out }) {
  const manifest = JSON.parse(await readFile(join(root, 'downloads/manifest.json'), 'utf8'));
  const entry = manifest.files.find((f) => f.file.endsWith('.skill'));
  if (!entry) throw new Error('SKILL_ARCHIVE_NOT_IN_MANIFEST');
  const archive = await readFile(join(root, 'downloads', entry.file));
  if (archive.length !== entry.bytes || sha256(archive) !== entry.sha256) throw new Error(`SKILL_ARCHIVE_PIN_MISMATCH: ${entry.file}`);

  const kit = new Map();
  for (const [name, body] of readZip(archive)) {
    if (!name.startsWith(`${SLUG}/`)) throw new Error(`SKILL_ARCHIVE_ROOT_UNEXPECTED: ${name}`);
    kit.set(name.slice(SLUG.length + 1), body);
  }
  const text = kit.get('SKILL.md')?.toString('utf8');
  if (!text) throw new Error('SKILL_MD_MISSING');
  const { top, metadata, body } = splitSkill(text);
  if (top.name !== SLUG) throw new Error(`SKILL_NAME_MISMATCH: ${top.name}`);
  // SkillHub's CLI reads these keys at any indent, so they live under metadata where other hosts accept them.
  if (metadata.slug !== SLUG || !metadata.displayName || !metadata.summary) throw new Error('SKILLHUB_METADATA_MISSING');
  if ('tags' in top || 'tags' in metadata) throw new Error('SKILLHUB_TAGS_NOT_ALLOWED'); // SkillHub treats tags as version pointers.

  const installed = /Installation build: `([^`]+)`/.exec(body);
  if (!installed) throw new Error('INSTALLATION_BUILD_LINE_MISSING');
  const fromSkill = parseBuild(installed[1]);
  if (manifest.buildId !== fromSkill.build) throw new Error(`MANIFEST_BUILD_MISMATCH: ${manifest.buildId}`);
  const package_ = /Package version: `([^`]+)`/.exec(body);
  if (!package_ || package_[1] !== fromSkill.product) throw new Error('PACKAGE_VERSION_MISMATCH');
  const release = tag ? parseTag(tag) : fromSkill;
  if (release.build !== fromSkill.build) throw new Error(`TAG_BUILD_MISMATCH: tag ${release.build}, SKILL.md ${fromSkill.build}`);
  const wrong = chinaLinkMismatches(kit, release.registryVersion);
  if (wrong.length) throw new Error(`CHINA_DOWNLOAD_VERSION_MISMATCH: ${wrong.join(', ')} (build is ${release.registryVersion})`);

  if (await exists(out) && (await readdir(out)).length) throw new Error(`OUTPUT_NOT_EMPTY: ${out}`);
  const targets = {
    skillhub: { dir: join(out, 'skillhub', SLUG), files: new Map([...kit].map(([name, b]) => [skillhubName(name), b])) },
    clawhub: { dir: join(out, 'clawhub', SLUG), files: new Map([...kit].filter(([name]) => name !== 'LICENSE').map(([name, b]) => [name, name === 'SKILL.md' ? Buffer.from(clawhubSkill(text)) : b])) },
  };
  for (const { dir, files } of Object.values(targets)) {
    for (const [name, bytes] of files) {
      await mkdir(dirname(join(dir, name)), { recursive: true });
      await writeFile(join(dir, name), bytes, { flag: 'wx' });
    }
  }
  return {
    schema: 'grandet.registry-stage/v2',
    slug: SLUG,
    tag: release.tag,
    build: release.build,
    productVersion: release.product,
    registryVersion: release.registryVersion,
    archive: { file: entry.file, sha256: entry.sha256, files: kit.size },
    chinaDownload: CHINA_DOWNLOAD + release.registryVersion,
    changelog: `Grandet Skill ${release.product}, build ${release.build}: the complete installation kit. Source: https://github.com/hanzohanzhe/Grandet/releases/tag/${release.tag}`,
    clawhub: { dir: targets.clawhub.dir, files: targets.clawhub.files.size, ...LISTING.clawhub },
    skillhub: { dir: targets.skillhub.dir, files: kit.size },
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
  const out = opt('--out');
  if (!out) {
    console.error('usage: node scripts/stage-registry-skill.mjs --out <empty dir> [--tag skill-v0.3.0-build.YYYYMMDDx] [--root <checkout of that tag>]');
    process.exit(2);
  }
  // --root lets a newer copy of this script stage an older release checkout that predates it.
  const root = opt('--root') ? resolve(opt('--root')) : ROOT;
  const result = await stage({ root, tag: opt('--tag'), out: resolve(out) });
  console.log(JSON.stringify(result, null, 2));
}
