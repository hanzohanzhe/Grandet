// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import test from 'node:test';
import {
  CATALOG_PATH,
  DISTRIBUTION_PATH,
  IDENTITY_PATH,
  IDENTITY_SCHEMA,
  CATALOG_SCHEMA,
  parseMarker,
  profileRows,
  profileSetSha256,
} from '../scripts/app-catalog-identity.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = (relative) => readFile(path.join(root, relative), 'utf8');

test('the catalogue header and identity file describe the same profile set', async () => {
  const markdown = await read(CATALOG_PATH);
  const identity = JSON.parse(await read(IDENTITY_PATH));
  const marker = parseMarker(markdown);
  const rows = profileRows(markdown);
  const hash = profileSetSha256(rows);

  assert.deepEqual(marker, identity, 'header marker and identity file agree');
  assert.equal(identity.schema, IDENTITY_SCHEMA);
  assert.equal(identity.catalogueSchema, CATALOG_SCHEMA);
  assert.equal(identity.profileCount, rows.length, 'declared profile count matches rows');
  assert.equal(marker.profileCount, rows.length);
  assert.equal(identity.profileSetSha256, hash, 'declared hash matches the profile rows');
  assert.equal(identity.revision, `${CATALOG_SCHEMA}+${hash.slice(0, 12)}`);
  assert.match(identity.updated, /^\d{4}-\d{2}-\d{2}$/);
  assert.match(identity.sourceCommit, /^[0-9a-f]{40}$/);
});

test('the distribution artifact reports the same profile set size', async () => {
  const identity = JSON.parse(await read(IDENTITY_PATH));
  const distribution = JSON.parse(await read(DISTRIBUTION_PATH));
  assert.equal(distribution.schema, 'grandet.price-finder-distribution/v1');
  assert.equal(distribution.summary.profileCount, identity.profileCount);
  assert.equal(distribution.summary.applicationCount, identity.applicationCount);
  assert.equal(distribution.summary.templateCount, identity.templateCount);
  assert.deepEqual(distribution.catalogueIdentity, {
    schema: identity.schema,
    revision: identity.revision,
    profileSetSha256: identity.profileSetSha256,
    profileCount: identity.profileCount,
  }, 'the distribution artifact embeds the catalogue identity');
  assert.ok(Array.isArray(distribution.generatedFrom) && distribution.generatedFrom.length > 0);
});

test('a changed profile row makes the recorded identity stale', async () => {
  const markdown = await read(CATALOG_PATH);
  const identity = JSON.parse(await read(IDENTITY_PATH));
  const changed = markdown.replace(/(\| `codex` \| `openai-responses` \| `openai-response` \| `TOML` \| `[^`]+`)/, '$1 (edited)');
  assert.notEqual(changed, markdown, 'fixture edit applies');
  assert.notEqual(profileSetSha256(profileRows(changed)), identity.profileSetSha256);
});
