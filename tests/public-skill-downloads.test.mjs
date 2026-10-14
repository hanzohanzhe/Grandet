// SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const root = new URL('../', import.meta.url);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');

test('published downloads match their sizes, hashes, version and complete source inputs', async () => {
  const manifest = JSON.parse(await readFile(new URL('downloads/manifest.json', root), 'utf8'));
  assert.equal(manifest.schema, 'grandet.skill-downloads/v1');
  assert.equal(manifest.version, '0.3.0');
  assert.equal(manifest.status, 'PUBLIC_PREVIEW');
  assert.deepEqual(manifest.files.map(item => item.file).sort(), ['grandet-api-price-finder-0.3.0.skill', 'grandet-api-price-finder-0.3.0.zip']);
  for (const item of manifest.files) {
    const bytes = await readFile(new URL(`downloads/${item.file}`, root));
    assert.equal(bytes.length, item.bytes, item.file);
    assert.equal(hash(bytes), item.sha256, item.file);
  }
  for (const [path, expected] of Object.entries(manifest.sourceFiles)) {
    assert.equal(hash(await readFile(new URL(path, root))), expected, `Rebuild downloads after changing ${path}`);
  }
  assert.equal(manifest.verification.canonicalSkillFiles, 10);
  assert.equal(manifest.verification.nativeArchiveIncludesLicense, true);
  assert.equal(manifest.verification.allHostsNativeAcceptance, 'NOT_COMPLETE');
});
