#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
// Checks that grandet.ai can follow downloads/latest.json.
//
// grandet.ai reads latest.json, releases.json and installation-approved-builds.json from main
// and switches every download link to the named build. It refuses the switch, and keeps serving
// an older build, if any rule below fails. Errors here are those rules; run this before every
// change to latest.json (write-latest-pointer.py does) and in CI.
//
// Warnings only affect the documents grandet.ai embeds in download.md: a document that names
// another build stays out, and the links still follow.
//
// Usage: node scripts/check-site-follow.mjs [--root DIR] [--previous-ref REF | --previous-root DIR] [--json]
import {execFileSync} from 'node:child_process';
import {existsSync, readFileSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const REPO = 'hanzohanzhe/Grandet';
const BUILD = /^grandet-skill-(0\.3\.0)-build\.(\d{8})([a-z]{0,4})$/;
const HASH = /^[a-f0-9]{64}$/, COMMIT = /^[a-f0-9]{40}$/;
const DOCS = ['INSTALL.md', 'skills/grandet-api-price-finder/references/installation.md', 'docs/skills/installation-receipts.md'];
const APP_FILES = ['docs/skills/installation-routes.json', 'docs/skills/application-distribution.generated.json'];

export function skillhubVersion(build) {
  const m = BUILD.exec(build);
  return m ? `0.3.0-build.${m[2]}.${[...m[3]].reduce((n, c) => n * 26 + c.charCodeAt(0) - 96, 0)}` : null;
}

// Whole identifiers only: grandet-skill-0.3.0-build.20261017 is not inside ...20261017b.
const identifierChar = (c) => c !== undefined && /[A-Za-z0-9._-]/.test(c);
export function containsToken(text, token) {
  if (!token) return false;
  for (let at = text.indexOf(token); at !== -1; at = text.indexOf(token, at + token.length)) {
    const end = at + token.length, next = text[end];
    const rightOk = !identifierChar(next) || (next === '.' && (text[end + 1] === undefined || /[\s,;:!?()[\]{}<>"'`]/.test(text[end + 1])));
    if (!identifierChar(text[at - 1]) && rightOk) return true;
  }
  return false;
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const sameRow = (a, b) => b !== undefined && Object.keys(a).every((k) => k === 'included_at' ? Date.parse(a[k]) === Date.parse(b[k]) : same(a[k], b[k]));

export function checkSiteFollow({latest, releases, approved, previous = null, docs = null, apps = null}) {
  const errors = [], warnings = [];
  const need = (ok, code, detail) => { if (!ok) errors.push(detail ? `${code}: ${detail}` : code); return ok; };
  const p = latest ?? {};
  need(p.schema === 'grandet.skill-latest/v1' && p.version === '0.3.0', 'LATEST_SCHEMA_OR_VERSION');
  const m = typeof p.build === 'string' ? BUILD.exec(p.build) : null;
  const dateOk = m && new Date(`${m[2].slice(0, 4)}-${m[2].slice(4, 6)}-${m[2].slice(6, 8)}T00:00:00Z`).toISOString().slice(0, 10).replaceAll('-', '') === m[2];
  need(dateOk && p.tag === `skill-v0.3.0-build.${m[2]}${m[3]}`, 'LATEST_BUILD_TAG_MISMATCH', `${p.build} / ${p.tag}`);
  need(Number.isSafeInteger(p.releaseId) && p.releaseId > 0 && COMMIT.test(p.sourceCommit ?? ''), 'LATEST_RELEASE_IDENTITY');
  need(p.gate?.result === 'PASS' || (p.gate?.result === 'HOLD' && typeof p.approved?.quote === 'string' && p.approved.quote.trim().length > 0), 'LATEST_GATE_UNAPPROVED', 'HOLD needs the owner\'s words in approved.quote');
  need(p.skillhubVersion === skillhubVersion(p.build ?? ''), 'LATEST_SKILLHUB_VERSION', `${p.skillhubVersion} should be ${skillhubVersion(p.build ?? '')}`);
  const rows = Array.isArray(releases?.assets) ? releases.assets : [];
  need(releases?.schema === 'grandet.release-registry/v1' && rows.length > 0, 'REGISTRY_SCHEMA');
  need(rows.every((a) => a.repository === REPO && a.version === '0.3.0'), 'REGISTRY_ORIGIN_OR_VERSION');
  need(new Set(rows.map((a) => a.asset_id)).size === rows.length, 'REGISTRY_DUPLICATE_ASSET');
  for (const kind of ['zip', 'skill']) {
    const a = p[kind] ?? {};
    need(Object.keys(a).sort().join(',') === 'assetId,bytes,sha256,url' && Number.isSafeInteger(a.assetId) && a.assetId > 0 && Number.isSafeInteger(a.bytes) && a.bytes > 0 && a.bytes <= 10 * 1024 * 1024 && HASH.test(a.sha256 ?? '') && a.url === `https://github.com/${REPO}/releases/download/${p.tag}/grandet-api-price-finder-0.3.0.${kind}`, 'LATEST_ASSET_INVALID', kind);
    const row = rows.find((r) => r.tag === p.tag && r.format === kind);
    need(row && !row.disabled && row.commit === p.sourceCommit && row.release_id === p.releaseId && row.asset_id === a.assetId && row.size === a.bytes && row.sha256 === a.sha256 && row.browser_download_url === a.url, 'LATEST_UNREGISTERED_ASSET', `${kind} must match its row in downloads/releases.json`);
  }
  need(p.zip?.assetId !== p.skill?.assetId, 'LATEST_DUPLICATE_ASSET');
  const builds = Array.isArray(approved?.builds) ? approved.builds : [];
  need(new Set(builds.map((b) => b.build_id)).size === builds.length, 'APPROVED_BUILDS_DUPLICATE');
  if (p.installation !== undefined) {
    const b = builds.find((v) => v.build_id === p.build);
    need(b && p.installation?.contentDigestAlgorithm === b.content_digest_algorithm && same([...(p.installation.contentSha256s ?? [])].sort(), [...b.content_sha256s].sort()), 'LATEST_INSTALLATION_MISMATCH');
  }
  // Order does not matter; every record the site has already admitted must stay, unchanged.
  if (previous) {
    const byId = new Map(rows.map((r) => [r.asset_id, r]));
    for (const old of previous.releases?.assets ?? []) need(sameRow(old, byId.get(old.asset_id)), 'REGISTRY_NOT_APPEND_ONLY', `asset ${old.asset_id} (${old.tag} ${old.format}) was removed or changed`);
    const byBuild = new Map(builds.map((b) => [b.build_id, b]));
    if (previous.approved) {
      need(approved?.status === previous.approved.status && approved?.measurement_start === previous.approved.measurement_start, 'APPROVED_BUILDS_NOT_APPEND_ONLY', 'status or measurement_start changed');
      for (const old of previous.approved.builds ?? []) need(same(old, byBuild.get(old.build_id)), 'APPROVED_BUILDS_NOT_APPEND_ONLY', `${old.build_id} was removed or changed`);
    }
  }
  // Documents: any site, whichever older build it has built in, embeds them only when they
  // name no other build. Otherwise download.md keeps the site's own text, with current links.
  if (docs) {
    const others = rows.filter((r) => r.tag !== p.tag).flatMap((r) => [r.tag, r.tag.replace('skill-v', 'grandet-skill-'), r.sha256]);
    for (const [path, text] of Object.entries(docs)) {
      if (text === null) { warnings.push(`DOCUMENT_MISSING: ${path} at ${p.sourceCommit}`); continue; }
      if (!text.trim()) warnings.push(`DOCUMENT_EMPTY: ${path}`);
      const named = [...new Set(others.filter((t) => containsToken(text, t)))];
      if (named.length) warnings.push(`DOCUMENT_NAMES_OTHER_BUILD: ${path} names ${named.join(', ')}; download.md will keep the site's own text`);
    }
  }
  if (apps) {
    const routes = apps['docs/skills/installation-routes.json'], dist = apps['docs/skills/application-distribution.generated.json'];
    if (routes?.buildId !== p.build) warnings.push(`APP_ROUTES_BUILD: installation-routes.json buildId is ${routes?.buildId ?? 'missing'}, not ${p.build}; per-app instructions keep the site's own text`);
    const hosts = new Set((routes?.routes ?? []).map((r) => r.host)), listed = new Set((dist?.entries ?? []).map((e) => e.appId));
    const missing = [...hosts].filter((h) => !listed.has(h));
    if (missing.length) warnings.push(`APP_DISTRIBUTION_INCOMPLETE: application-distribution.generated.json lacks ${missing.length} of ${hosts.size} routed apps`);
  }
  return {errors, warnings};
}

function readJson(path) { return JSON.parse(readFileSync(path, 'utf8')); }
function gitShow(root, ref, path) {
  try { return execFileSync('git', ['-C', root, 'show', `${ref}:${path}`], {encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024}); } catch { return null; }
}

function main(argv) {
  const arg = (name) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : undefined; };
  const root = resolve(arg('--root') ?? join(fileURLToPath(new URL('.', import.meta.url)), '..'));
  const file = (name) => join(root, 'downloads', name);
  const latest = readJson(file('latest.json')), releases = readJson(file('releases.json'));
  const approved = existsSync(file('installation-approved-builds.json')) ? readJson(file('installation-approved-builds.json')) : null;
  let previous = null;
  if (arg('--previous-root')) {
    const dir = resolve(arg('--previous-root'));
    previous = {releases: readJson(join(dir, 'downloads/releases.json')), approved: existsSync(join(dir, 'downloads/installation-approved-builds.json')) ? readJson(join(dir, 'downloads/installation-approved-builds.json')) : null};
  } else if (arg('--previous-ref')) {
    const ref = arg('--previous-ref'), rel = gitShow(root, ref, 'downloads/releases.json'), appr = gitShow(root, ref, 'downloads/installation-approved-builds.json');
    previous = rel ? {releases: JSON.parse(rel), approved: appr ? JSON.parse(appr) : null} : null;
    if (!previous) console.error(`note: ${ref} has no downloads/releases.json; append-only check skipped`);
  }
  const commit = latest.sourceCommit;
  const haveCommit = typeof commit === 'string' && gitShow(root, commit, 'INSTALL.md') !== null;
  const docs = haveCommit ? Object.fromEntries(DOCS.map((p) => [p, gitShow(root, commit, p)])) : null;
  let apps = null;
  if (haveCommit) { apps = {}; for (const p of APP_FILES) { const t = gitShow(root, commit, p); try { apps[p] = t ? JSON.parse(t) : null; } catch { apps[p] = null; } } }
  const result = checkSiteFollow({latest, releases, approved, previous, docs, apps});
  if (!haveCommit) result.warnings.push(`SOURCE_COMMIT_NOT_LOCAL: ${commit}; documents not checked`);
  if (argv.includes('--json')) console.log(JSON.stringify({build: latest.build, ...result}, null, 1));
  else {
    for (const w of result.warnings) console.log(`warning ${w}`);
    for (const e of result.errors) console.log(`error ${e}`);
    console.log(result.errors.length ? `grandet.ai would NOT follow ${latest.build}; it would keep serving the previous build.` : `grandet.ai can follow ${latest.build}.`);
  }
  return result.errors.length ? 1 : 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = main(process.argv.slice(2));
