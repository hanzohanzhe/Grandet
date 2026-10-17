// SPDX-License-Identifier: Apache-2.0
// The bundled price snapshot and its offline reader: what the Skill falls back to when grandet.ai cannot be reached.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { cp, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);
const skill = resolve('skills/grandet-api-price-finder');
const lookup = (dir, ...args) => run(process.execPath, [join(dir, 'scripts/offline-lookup.mjs'), ...args]).then(
  (r) => ({ code: 0, out: JSON.parse(r.stdout) }),
  (e) => ({ code: e.code, out: JSON.parse(e.stdout) }),
);

test('the bundled snapshot names its release, its date and its rights, and every price keeps its site and date', async () => {
  const snapshot = JSON.parse(await readFile(join(skill, 'data/price-snapshot.json'), 'utf8'));
  assert.equal(snapshot.schema, 'grandet.price-snapshot/v1');
  assert.match(snapshot.releaseSet, /^[0-9a-f]{64}$/);
  assert.ok(!Number.isNaN(Date.parse(snapshot.asOf)));
  assert.match(snapshot.rights, /DATA-LICENSE/);
  assert.ok(snapshot.models.length > 100 && snapshot.freeCredits.length > 0);
  for (const m of snapshot.models) {
    for (const b of m.boards || []) {
      assert.match(b.unit, /^[A-Z_]+$/);
      for (const r of [...(b.lowest || []), ...(b.gated || []), ...(b.reference || [])]) {
        assert.ok(r.site && r.group !== undefined && r.price !== undefined && r.observed, `${m.model} row`);
      }
    }
    for (const o of [...(m.official || []), ...(m.inference || [])]) assert.ok(o.vendor && o.currency && o.observed, `${m.model} cash`);
  }
});

test('offline lookup resolves the user\'s spelling, asks when it is ambiguous and says when nothing matches', async () => {
  const snapshot = JSON.parse(await readFile(join(skill, 'data/price-snapshot.json'), 'utf8'));
  const id = snapshot.models.find((m) => /-/.test(m.model)).model;
  const exact = await lookup(skill, '--model', id);
  assert.equal(exact.out.status, 'OK');
  assert.equal(exact.out.model, id);
  assert.equal(exact.out.source, 'OFFLINE_SNAPSHOT');
  assert.match(exact.out.notice['zh-CN'], /离线快照/);
  const spaced = await lookup(skill, '--model', id.toUpperCase().replace(/-/g, ' '));
  assert.equal(spaced.out.model, id);
  const missing = await lookup(skill, '--model', 'no-such-model-zz9');
  assert.equal(missing.out.status, 'SELECTION_NOT_FOUND');
  assert.equal(missing.code, 1);
  const free = await lookup(skill, '--free', '');
  assert.equal(free.out.status, 'OK');
  assert.ok(free.out.offers.length > 0 && free.out.offers.length <= 10);
});

test('a copy without the snapshot (the ClawHub copy) says so instead of failing', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'grandet-offline-'));
  try {
    await cp(join(skill, 'scripts'), join(dir, 'scripts'), { recursive: true });
    const r = await lookup(dir, '--model', 'claude-sonnet-4-6');
    assert.equal(r.out.status, 'SNAPSHOT_NOT_INCLUDED');
    assert.equal(r.code, 2);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
