// SPDX-License-Identifier: Apache-2.0
// Shared identity for the application-profile catalogue: one revision id,
// profile count and content hash that the Markdown reference and the
// distribution artifact can both be checked against.
import {createHash} from 'node:crypto';
import {readFile, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

export const CATALOG_PATH = 'skills/grandet-api-price-finder/references/app-catalog.md';
export const IDENTITY_PATH = 'docs/skills/app-catalog-identity.json';
export const DISTRIBUTION_PATH = 'docs/skills/application-distribution.generated.json';
export const IDENTITY_SCHEMA = 'grandet.app-catalog-identity/v1';
export const CATALOG_SCHEMA = 'grandet.app-catalog/v1';
export const MARKER_PREFIX = '<!-- app-catalog-identity: ';

const root = fileURLToPath(new URL('..', import.meta.url));

export function profileRows(markdown) {
  const lines = markdown.split('\n');
  const start = lines.findIndex((line) => line.startsWith('| App ID | Profile ID |'));
  if (start < 0) throw new Error('APP_CATALOG_PROFILE_TABLE_MISSING');
  const rows = [];
  for (const line of lines.slice(start + 2)) {
    if (!line.startsWith('|')) break;
    const cells = line.split('|').slice(1, -1).map((cell) => cell.trim());
    if (cells.length !== 12) throw new Error(`APP_CATALOG_PROFILE_ROW_INVALID: ${line}`);
    const unquote = (cell) => cell.replaceAll('`', '').trim();
    rows.push({
      app: unquote(cells[0]),
      profile: unquote(cells[1]),
      endpoint: unquote(cells[2]),
      format: unquote(cells[3]),
      path: cells[4],
      scope: unquote(cells[5]),
      fields: cells[6],
    });
  }
  if (rows.length === 0) throw new Error('APP_CATALOG_PROFILE_ROWS_EMPTY');
  return rows;
}

export function profileSetSha256(rows) {
  const canonical = rows
    .map((row) => [row.app, row.profile, row.endpoint, row.format, row.path, row.scope, row.fields]
      .map((cell) => cell.replace(/\s+/g, ' ').trim()))
    .sort((left, right) => {
      const a = JSON.stringify(left);
      const b = JSON.stringify(right);
      return a < b ? -1 : a > b ? 1 : 0;
    });
  return createHash('sha256').update(JSON.stringify(canonical)).digest('hex');
}

export function buildIdentity(rows, {updated, sourceCommit, applicationCount, templateCount}) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(updated)) throw new Error(`IDENTITY_DATE_INVALID: ${updated}`);
  if (!/^[0-9a-f]{40}$/.test(sourceCommit)) throw new Error(`IDENTITY_COMMIT_INVALID: ${sourceCommit}`);
  const hash = profileSetSha256(rows);
  return {
    schema: IDENTITY_SCHEMA,
    catalogueSchema: CATALOG_SCHEMA,
    revision: `${CATALOG_SCHEMA}+${hash.slice(0, 12)}`,
    profileCount: rows.length,
    applicationCount,
    templateCount,
    profileSetSha256: hash,
    updated,
    sourceCommit,
  };
}

export function markerLine(identity) {
  return `${MARKER_PREFIX}${JSON.stringify(identity)} -->`;
}

export function summaryLine(identity) {
  return `Catalogue revision / 目录版本: \`${identity.revision}\` · ${identity.profileCount} profiles · updated ${identity.updated} · source commit \`${identity.sourceCommit}\``;
}

export function parseMarker(markdown) {
  const line = markdown.split('\n').find((entry) => entry.startsWith('<!-- app-catalog-identity: '));
  if (!line) throw new Error('APP_CATALOG_IDENTITY_MISSING');
  const json = line.slice(MARKER_PREFIX.length, -' -->'.length);
  return JSON.parse(json);
}

export function withIdentity(markdown, identity) {
  const marker = markerLine(identity);
  const summary = summaryLine(identity);
  const lines = markdown.split('\n');
  const withoutOld = lines.filter((line) => !line.startsWith('<!-- app-catalog-identity: ') && !line.startsWith('Catalogue revision / 目录版本:'));
  const heading = withoutOld.findIndex((line) => line.startsWith('# '));
  const insertAt = heading < 0 ? 0 : heading + 1;
  withoutOld.splice(insertAt, 0, '', marker, summary);
  return withoutOld.join('\n');
}

async function main() {
  const check = process.argv.includes('--check');
  const write = process.argv.includes('--write');
  const catalogFile = path.join(root, CATALOG_PATH);
  const identityFile = path.join(root, IDENTITY_PATH);
  const markdown = await readFile(catalogFile, 'utf8');
  const identity = JSON.parse(await readFile(identityFile, 'utf8'));
  const distribution = JSON.parse(await readFile(path.join(root, DISTRIBUTION_PATH), 'utf8'));
  const built = buildIdentity(profileRows(markdown), {
    updated: identity.updated,
    sourceCommit: identity.sourceCommit,
    applicationCount: distribution.summary.applicationCount,
    templateCount: distribution.summary.templateCount,
  });

  if (write) {
    await writeFile(catalogFile, withIdentity(markdown, built));
    await writeFile(identityFile, `${JSON.stringify(built, null, 2)}\n`);
    console.log(built.revision);
    return;
  }
  if (!check) {
    console.log(JSON.stringify(built, null, 2));
    return;
  }

  const problems = [];
  const marker = parseMarker(markdown);
  for (const key of Object.keys(built)) {
    if (JSON.stringify(marker[key]) !== JSON.stringify(built[key])) problems.push(`header ${key}`);
    if (JSON.stringify(identity[key]) !== JSON.stringify(built[key])) problems.push(`identity ${key}`);
  }
  if (distribution.summary.profileCount !== built.profileCount) problems.push('distribution profileCount');
  if (problems.length) {
    console.error(`APP_CATALOG_IDENTITY_STALE: ${[...new Set(problems)].join(', ')}`);
    process.exitCode = 1;
  } else {
    console.log(`app-catalog identity ok: ${built.revision} (${built.profileCount} profiles)`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
