#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
// One build, named the same everywhere a release ships or pins it. SKILL.md's last line names the build;
// every build ID, release tag and SkillHub version in the Skill folder and the release files must match it,
// and SKILL.md must name it exactly SKILL_BUILD_MENTIONS times (the requests in "Get the data first",
// "Always" and step 2, plus that last line). Packaging and registry staging refuse a mismatch.
import { readFile, readdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const SKILL_DIR = 'skills/grandet-api-price-finder';
export const SKILL_BUILD_MENTIONS = 7;
export const RELEASE_FILES = [
  'INSTALL.md', 'llms.txt', 'downloads/manifest.json', 'evals/answer-quality.json',
  'docs/skills/INSTALL.md', 'docs/skills/QUICKSTART.md', 'docs/skills/README.md',
  'docs/skills/installation-receipts.md', 'docs/skills/installation-routes.json',
  'scripts/build-skill-archives.py', 'scripts/install-price-finder.mjs', 'scripts/installation-receipts-source-build.json',
  'scripts/package-price-finder.mjs', 'scripts/register-skill-release.py', 'scripts/verify-installation.py',
];
// Sentences that name an earlier release on purpose.
const HISTORICAL = ['the earlier `skill-v0.3.0` and `skill-v0.3.0-build.20261014` releases remain historical'];
const TEXT = /\.(md|json|mjs|js|py|txt|ya?ml)$/;
const MENTION = /\bgrandet-skill-(\d+\.\d+\.\d+)-build\.(\d{8}[a-z]*)\b|\bskill-v(\d+\.\d+\.\d+)-build\.(\d{8}[a-z]*)\b|\b(\d+\.\d+\.\d+)-build\.(\d{8})\.(\d+)\b/g;
const BUILD_LINE = /^Installation build: `(grandet-skill-\d+\.\d+\.\d+-build\.\d{8}[a-z]?)`/m;

export function identity(build) {
  const m = /^grandet-skill-(\d+\.\d+\.\d+)-build\.(\d{8})([a-z]?)$/.exec(build);
  if (!m) throw new Error(`NOT_A_BUILD_ID: ${build}`);
  const [, product, date, letter] = m;
  return { build, tag: `skill-v${product}-build.${date}${letter}`, registryVersion: `${product}-build.${date}.${letter ? letter.charCodeAt(0) - 96 : 0}` };
}

/** Every build named in text, as a build ID; SkillHub versions are mapped back (0 = no letter, 1 = a …). */
export function mentions(text) {
  let body = text;
  for (const sentence of HISTORICAL) body = body.replaceAll(sentence, '');
  const found = [];
  for (const m of body.matchAll(MENTION)) {
    if (m[1]) found.push({ text: m[0], build: `grandet-skill-${m[1]}-build.${m[2]}` });
    else if (m[3]) found.push({ text: m[0], build: `grandet-skill-${m[3]}-build.${m[4]}` });
    else found.push({ text: m[0], build: `grandet-skill-${m[5]}-build.${m[6]}${Number(m[7]) ? String.fromCharCode(96 + Number(m[7])) : ''}` });
  }
  return found;
}

export function skillBuild(skillText) {
  const m = BUILD_LINE.exec(skillText);
  if (!m) throw new Error('INSTALLATION_BUILD_LINE_MISSING');
  return m[1];
}
/** The website's install check reads the last line of the installed SKILL.md. */
export const buildLineIsLast = (skillText) => BUILD_LINE.test(skillText.trimEnd().split(/\r?\n/).at(-1));

/** Problems with one set of named files ({path: text}) for the expected build. */
export function fileProblems(files, build) {
  const problems = [];
  for (const [path, text] of Object.entries(files)) {
    for (const m of mentions(text)) if (m.build !== build) problems.push(`${path}: ${m.text}`);
  }
  return problems;
}

async function walk(root, dir) {
  const out = [];
  for (const entry of await readdir(join(root, dir), { withFileTypes: true })) {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) out.push(...await walk(root, path));
    else if (TEXT.test(entry.name)) out.push(path);
  }
  return out;
}
const readIfPresent = (path) => readFile(path, 'utf8').catch((error) => { if (error.code === 'ENOENT') return null; throw error; });

export async function checkBuildId(root = ROOT, { requireLastLine = true } = {}) {
  const skill = await readFile(join(root, SKILL_DIR, 'SKILL.md'), 'utf8');
  const build = skillBuild(skill);
  const id = identity(build);
  const problems = [];
  if (requireLastLine && !buildLineIsLast(skill)) problems.push(`${SKILL_DIR}/SKILL.md: the Installation build line is not the last line`);
  const count = skill.split(build).length - 1;
  if (count !== SKILL_BUILD_MENTIONS) problems.push(`${SKILL_DIR}/SKILL.md: names ${build} ${count} times, expected ${SKILL_BUILD_MENTIONS}`);
  const files = {};
  for (const path of [...await walk(root, SKILL_DIR), ...RELEASE_FILES]) {
    const text = await readIfPresent(join(root, path));
    if (text !== null) files[path] = text;
  }
  problems.push(...fileProblems(files, build));
  const registries = await readIfPresent(join(root, 'docs/skills/registries.md'));
  if (registries !== null && !registries.includes(`| \`${id.tag}\` | \`${id.registryVersion}\` |`)) problems.push(`docs/skills/registries.md: no row for ${id.tag} → ${id.registryVersion}`);
  return { ...id, skillMentions: count, files: Object.keys(files).length, problems };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const at = process.argv.indexOf('--root');
  const result = await checkBuildId(at > 0 ? resolve(process.argv[at + 1]) : ROOT);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (result.problems.length) process.exitCode = 1;
}
