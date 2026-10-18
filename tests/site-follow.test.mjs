// SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {checkSiteFollow, containsToken, skillhubVersion} from '../scripts/check-site-follow.mjs';

const read = (p) => JSON.parse(readFileSync(new URL(`../downloads/${p}`, import.meta.url), 'utf8'));
const latest = read('latest.json'), releases = read('releases.json'), approved = read('installation-approved-builds.json');
const previous = {releases, approved};
const clone = (v) => JSON.parse(JSON.stringify(v));
const check = (over = {}) => checkSiteFollow({latest, releases, approved, previous, ...over});

test('the pointer on main is one grandet.ai can follow', () => {
  assert.deepEqual(check().errors, []);
});

test('upstream list order does not matter; removing or changing an admitted record does', () => {
  assert.deepEqual(check({releases: {...releases, assets: [...releases.assets].reverse()}, approved: {...approved, builds: [...approved.builds].reverse()}}).errors, []);
  const dropped = {...releases, assets: releases.assets.slice(1)};
  assert.match(check({releases: dropped}).errors.join(), /REGISTRY_NOT_APPEND_ONLY/);
  const changed = clone(releases); changed.assets[0].sha256 = 'f'.repeat(64);
  assert.match(check({releases: changed}).errors.join(), /REGISTRY_NOT_APPEND_ONLY/);
  const build = clone(approved); build.builds[0].content_sha256s = ['0'.repeat(64)];
  assert.match(check({approved: build}).errors.join(), /APPROVED_BUILDS_NOT_APPEND_ONLY/);
});

test('pointer rules the site enforces', () => {
  assert.match(check({latest: {...latest, skillhubVersion: '0.3.0-build.20261017.0'}}).errors.join(), /LATEST_SKILLHUB_VERSION/);
  assert.match(check({latest: {...latest, gate: {result: 'HOLD'}, approved: {quote: ' '}}}).errors.join(), /LATEST_GATE_UNAPPROVED/);
  assert.match(check({latest: {...latest, tag: latest.tag + 'x'}}).errors.join(), /LATEST_BUILD_TAG_MISMATCH/);
  assert.match(check({latest: {...latest, zip: {...latest.zip, sha256: 'e'.repeat(64)}}}).errors.join(), /LATEST_UNREGISTERED_ASSET/);
  assert.match(check({latest: {...latest, build: 'grandet-skill-0.3.0-build.20261018-final'}}).errors.join(), /LATEST_BUILD_TAG_MISMATCH/);
});

test('build names are whole tokens and suffixes map to ordered registry versions', () => {
  assert.equal(containsToken('use grandet-skill-0.3.0-build.20261017b', 'grandet-skill-0.3.0-build.20261017'), false);
  assert.equal(containsToken('see grandet-skill-0.3.0-build.20261017.', 'grandet-skill-0.3.0-build.20261017'), true);
  assert.equal(skillhubVersion('grandet-skill-0.3.0-build.20261018'), '0.3.0-build.20261018.0');
  assert.equal(skillhubVersion('grandet-skill-0.3.0-build.20261018b'), '0.3.0-build.20261018.2');
});

test('documents naming another build only warn: the links still follow', () => {
  const other = releases.assets.find((a) => a.tag !== latest.tag).tag;
  const r = check({docs: {'INSTALL.md': `Older ${other} stays historical.`, 'x.md': 'fine'}});
  assert.deepEqual(r.errors, []);
  assert.match(r.warnings.join(), /DOCUMENT_NAMES_OTHER_BUILD/);
});
