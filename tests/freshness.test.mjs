// SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  freshnessBucket,
  isEnded,
  isStale,
  recordAgeDays,
  snapshotAgeDays,
  STALE_THRESHOLD_DAYS,
} from '../freshness.mjs';

const now = Date.parse('2026-11-06T00:00:00.000Z');
const ago = days => new Date(now - days * 86_400_000).toISOString();

test('record age and freshness threshold use whole days', () => {
  const record = { checkedAt: ago(33) };
  assert.equal(STALE_THRESHOLD_DAYS, 30);
  assert.equal(recordAgeDays(record, now), 33);
  assert.equal(isStale(record, now), true);
  assert.equal(isStale(record, now, 40), false);
});

test('ended records include past end dates and declared inactive statuses', () => {
  assert.equal(isEnded({ endAt: ago(1) }, now), true);
  assert.equal(isEnded({ declaredStatus: 'ended' }, now), true);
  assert.equal(isEnded({ declaredStatus: 'disabled' }, now), true);
  assert.equal(isEnded({ endAt: new Date(now + 1).toISOString() }, now), false);
});

test('snapshot age prefers observationWindow.last over compiledAt and first', () => {
  assert.equal(snapshotAgeDays({
    compiledAt: ago(1),
    observationWindow: { first: ago(40), last: ago(20) },
    officialOffers: [{ checkedAt: ago(3) }],
  }, now), 20);
});

test('missing and invalid dates return null while future dates clamp to zero', () => {
  assert.equal(recordAgeDays({}, now), null);
  assert.equal(recordAgeDays({ observedAt: 'not-a-date' }, now), null);
  assert.equal(snapshotAgeDays({}, now), null);
  assert.equal(snapshotAgeDays({ observationWindow: { last: 'bad' }, offers: [{ observedAt: 'bad' }] }, now), null);
  assert.equal(recordAgeDays({ observedAt: new Date(now + 50_000_000).toISOString() }, now), 0);
  assert.equal(snapshotAgeDays({ observationWindow: { last: new Date(now + 50_000_000).toISOString() } }, now), 0);
});

test('ended takes precedence over stale in the freshness bucket', () => {
  assert.equal(freshnessBucket({ checkedAt: ago(90), declaredStatus: 'ended' }, now), 'ended');
  assert.equal(freshnessBucket({ checkedAt: ago(33) }, now), 'stale');
  assert.equal(freshnessBucket({ checkedAt: ago(2) }, now), 'fresh');
});

test('page imports freshness helpers and serves every relative app import', async () => {
  const [app, html, server] = await Promise.all([
    readFile(new URL('../app.mjs', import.meta.url), 'utf8'),
    readFile(new URL('../index.html', import.meta.url), 'utf8'),
    readFile(new URL('../scripts/serve.mjs', import.meta.url), 'utf8'),
  ]);
  assert.match(app, /from\s+['"]\.\/freshness\.mjs['"]/);
  assert.match(html, /<select\s+id="freshness"/);
  assert.match(html, /id="snapshot-banner"/);
  const routes = new Map([...server.matchAll(/\['([^']+)',\['([^']+)','([^']+)'/g)].map(match => [match[1], match[3]]));
  const imports = [...app.matchAll(/(?:import\s+(?:[^'";]+?\s+from\s+)?|import\s*\()(['"])(\.\/[^'"]+)\1/g)];
  assert.ok(imports.length > 0, 'app.mjs has relative module imports');
  for (const [, , specifier] of imports) {
    const route = `/${specifier.replace(/^\.\//, '')}`;
    assert.ok(routes.has(route), `serve map includes ${route}`);
    assert.equal(routes.get(route), 'text/javascript', `${route} has a JavaScript MIME type`);
  }
});
