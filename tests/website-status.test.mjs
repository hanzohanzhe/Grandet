// SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {statusLines, statusUnavailable} from '../status-view.mjs';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('index leaves current website status to the status module', async () => {
  const html = await read('index.html');
  assert.doesNotMatch(html, /未通过上线验收|未通过上线|LIVE_ACCEPTED/);
  assert.match(html, /<p id="website-status"[^>]*role="status"><\/p>/);
});

test('website status data has the current schema and release fields', async () => {
  const status = JSON.parse(await read('WEBSITE-STATUS.json'));
  assert.equal(status.schema, 'grandet.website-status/v1');
  assert.equal(status.status, 'LIVE_ACCEPTED');
  assert.equal(status.desktopReleaseStatus, 'NOT_RELEASED');
  assert.equal(status.skillReleaseStatus, 'PUBLIC_PREVIEW');
});

test('status lines separate each status, name their source and omit an absent date', async () => {
  const status = JSON.parse(await read('WEBSITE-STATUS.json'));
  const lines = statusLines(status, 'WEBSITE-STATUS.json');
  assert.match(lines[0], /LIVE_ACCEPTED/);
  assert.match(lines[0], /Website status/);
  assert.match(lines[1], /Desktop release status: NOT_RELEASED/);
  assert.match(lines[2], /Skill release status: PUBLIC_PREVIEW/);
  assert.match(lines.at(-1), /WEBSITE-STATUS\.json/);
  assert.ok(!lines.some(line => /date|checked at/i.test(line)));
  assert.ok(statusLines({...status, checkedAt: '2026-11-06T10:00:00Z'}).some(line => line.includes('2026-11-06')));
});

test('invalid and missing status payloads render unknown and never claim acceptance', () => {
  const unknown = statusUnavailable();
  for (const lines of [unknown, statusLines(undefined), statusLines({status: 'LIVE_ACCEPTED'})]) {
    assert.match(lines[0], /Website status: unknown/);
    assert.match(lines[1], /Desktop release status: unknown/);
    assert.match(lines[2], /Skill release status: unknown/);
    assert.doesNotMatch(lines.join(' '), /LIVE_ACCEPTED/);
  }
});

test('current app does not load historical release metadata and imports are in the server map', async () => {
  const app = await read('app.mjs');
  const server = await read('scripts/serve.mjs');
  assert.doesNotMatch(app, /RELEASE-v3\.json/);
  const mapped = new Set([...server.matchAll(/\[['"]([^'"]+)['"],\[['"]([^'"]+)['"],\s*['"]([^'"]+)['"]\]\]/g)].map(match => match[2]));
  const imports = [...app.matchAll(/\bfrom\s*['"](\.\/[^'"]+)['"]/g)].map(match => new URL(match[1], 'file:///app.mjs').pathname.slice(1));
  assert.ok(imports.length > 0, 'app should have a relative module import');
  for (const path of imports) assert.ok(mapped.has(path), `${path} is absent from the explicit server file map`);
  assert.match(server, /\['\/status-view\.mjs',\['status-view\.mjs','text\/javascript'\]\]/);
});
