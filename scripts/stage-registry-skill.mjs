// SPDX-License-Identifier: Apache-2.0
// Stage the GitHub Skill folder for ClawHub and Tencent SkillHub. The source folder is never edited:
// each registry gets a copy whose SKILL.md front matter is rewritten and whose body stays byte-identical.
import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const SKILL_DIR = 'skills/grandet-api-price-finder';
export const SLUG = 'grandet-api-price-finder';
export const HOMEPAGE = 'https://grandet.ai';
export const LISTING = {
  clawhub: {
    name: 'Grandet API Price Finder',
    categories: 'integrations,finance,research',
    topics: 'llm-api,price-comparison,api-relay,free-credits,model-pricing',
  },
  skillhub: {
    displayName: 'Grandet API 比价',
    summary: '找模型 API 和中转站的最低标价与免费额度，并把选好的 API 接到你的应用里',
    tags: ['api', 'llm', '比价', '中转站', '免费额度'],
    license: 'Apache-2.0',
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

export function splitSkill(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(text);
  if (!m) throw new Error('SKILL_FRONT_MATTER_MISSING');
  const fields = {};
  for (const line of m[1].split(/\r?\n/)) {
    if (!line.trim()) continue;
    const kv = /^([A-Za-z][\w-]*):\s?(.*)$/.exec(line);
    if (!kv) throw new Error(`SKILL_FRONT_MATTER_NOT_FLAT: ${line}`);
    fields[kv[1]] = kv[2];
  }
  for (const key of ['name', 'description']) if (!fields[key]) throw new Error(`SKILL_FRONT_MATTER_FIELD_MISSING: ${key}`);
  return { fields, body: text.slice(m[0].length) };
}

// The registries read different front matter: ClawHub parses full YAML; SkillHub's CLI reads only flat
// `key: value` and `key: [a, b]` lines. Strings are JSON-quoted, which YAML reads as double-quoted scalars.
const q = (s) => JSON.stringify(s);

export function clawhubFrontMatter(fields, version) {
  return [
    '---',
    `name: ${fields.name}`,
    `description: ${q(fields.description)}`,
    `version: ${version}`,
    'metadata:',
    '  openclaw:',
    `    homepage: ${HOMEPAGE}`,
    '    requires:',
    '      anyBins:',
    '        - curl',
    '        - node',
    '---',
    '',
  ].join('\n');
}

export function skillhubFrontMatter(fields, version) {
  const { displayName, summary, tags, license } = LISTING.skillhub;
  for (const s of [fields.description, displayName, summary, ...tags]) {
    if (/["\\]/.test(s)) throw new Error('SKILLHUB_VALUE_NEEDS_ESCAPING');
  }
  return [
    '---',
    `name: ${fields.name}`,
    `slug: ${SLUG}`,
    `displayName: ${displayName}`,
    `version: ${version}`,
    `summary: ${summary}`,
    `description: ${q(fields.description)}`,
    `tags: [${tags.join(', ')}]`,
    `license: ${license}`,
    `homepage: ${HOMEPAGE}`,
    '---',
    '',
  ].join('\n');
}

const sha256 = (b) => createHash('sha256').update(b).digest('hex');

async function exists(p) {
  try { await stat(p); return true; } catch { return false; }
}

export async function stage({ root = ROOT, tag, out }) {
  const source = join(root, SKILL_DIR);
  const text = await readFile(join(source, 'SKILL.md'), 'utf8');
  const { fields, body } = splitSkill(text);
  if (fields.name !== SLUG) throw new Error(`SKILL_NAME_MISMATCH: ${fields.name}`);
  const installed = /Installation build: `([^`]+)`/.exec(body);
  if (!installed) throw new Error('INSTALLATION_BUILD_LINE_MISSING');
  const fromSkill = parseBuild(installed[1]);
  const package_ = /Package version: `([^`]+)`/.exec(body);
  if (!package_ || package_[1] !== fromSkill.product) throw new Error('PACKAGE_VERSION_MISMATCH');
  const release = tag ? parseTag(tag) : fromSkill;
  if (release.build !== fromSkill.build) throw new Error(`TAG_BUILD_MISMATCH: tag ${release.build}, SKILL.md ${fromSkill.build}`);

  if (await exists(out) && (await readdir(out)).length) throw new Error(`OUTPUT_NOT_EMPTY: ${out}`);
  const targets = {
    clawhub: { dir: join(out, 'clawhub', SLUG), front: clawhubFrontMatter(fields, release.registryVersion) },
    skillhub: { dir: join(out, 'skillhub', SLUG), front: skillhubFrontMatter(fields, release.registryVersion) },
  };
  for (const { dir, front } of Object.values(targets)) {
    await mkdir(dirname(dir), { recursive: true });
    await cp(source, dir, { recursive: true });
    await writeFile(join(dir, 'SKILL.md'), front + body);
  }
  return {
    schema: 'grandet.registry-stage/v1',
    slug: SLUG,
    tag: release.tag,
    build: release.build,
    productVersion: release.product,
    registryVersion: release.registryVersion,
    bodySha256: sha256(body),
    changelog: `Grandet Skill ${release.product}, build ${release.build}. Source: https://github.com/hanzohanzhe/Grandet/releases/tag/${release.tag}`,
    clawhub: { dir: targets.clawhub.dir, ...LISTING.clawhub },
    skillhub: { dir: targets.skillhub.dir },
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
