// SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { APPS } from '../skills/grandet-api-price-finder/scripts/connect.mjs';

const root = resolve(new URL('..', import.meta.url).pathname);
const matrixPath = resolve(root, 'docs/skills/connect-capability-matrix.md');
const manifestPath = resolve(root, 'downloads/manifest.json');
const ACTIONS = ['Preview', 'Apply', 'Key', 'Verify', 'Restore', 'Native acceptance'];
const STATES = new Set(['IMPLEMENTED', 'FIXTURE_TESTED', 'NOT_IMPLEMENTED', 'NOT_RUN', 'PASS', 'FAIL']);

function markdownRows(markdown) {
  const lines = markdown.split(/\r?\n/);
  const headerIndex = lines.findIndex((line) => line.startsWith('| App ID |'));
  assert.notEqual(headerIndex, -1, 'matrix table header exists');
  const header = lines[headerIndex].split('|').slice(1, -1).map((cell) => cell.trim());
  assert.deepEqual(header, ['App ID', 'Protocols', ...ACTIONS, 'Evidence']);
  assert.match(lines[headerIndex + 1], /^\|\s*-+/);
  const rows = [];
  for (const line of lines.slice(headerIndex + 2)) {
    if (!line.startsWith('|')) break;
    const cells = line.split('|').slice(1, -1).map((cell) => cell.trim());
    assert.equal(cells.length, header.length, `table row has ${header.length} cells: ${line}`);
    rows.push(cells);
  }
  return rows;
}

test('connect capability matrix matches executor apps and evidence', async () => {
  const [markdown, manifestText] = await Promise.all([
    readFile(matrixPath, 'utf8'),
    readFile(manifestPath, 'utf8'),
  ]);
  const rows = markdownRows(markdown);
  const manifest = JSON.parse(manifestText);
  const ids = rows.map(([id]) => id.replace(/^`|`$/g, ''));
  assert.equal(new Set(ids).size, ids.length, 'app IDs have no duplicate rows');
  assert.deepEqual([...ids].sort(), Object.keys(APPS).sort(), 'matrix has exactly one row per executor app');

  const testRoot = resolve(root, 'tests');
  for (const row of rows) {
    const [rawId, protocols, ...rest] = row;
    const id = rawId.replace(/^`|`$/g, '');
    const actions = rest.slice(0, ACTIONS.length);
    const evidence = rest.at(-1);
    assert.equal(protocols.replaceAll('`', ''), APPS[id].protocols.join(', '), `${id} protocols match APPS`);
    for (const [index, state] of actions.entries()) {
      assert.ok(STATES.has(state), `${id} ${ACTIONS[index]} uses a documented state`);
    }
    const evidencePaths = [...evidence.matchAll(/`([^`]+)`/g)].map((match) => match[1]);
    for (const path of evidencePaths) {
      if (path.startsWith('tests/')) {
        const resolved = resolve(root, path);
        assert.ok(resolved.startsWith(`${testRoot}${sep}`), `${path} stays under tests/`);
        await access(resolved);
      }
    }
    if (actions[ACTIONS.indexOf('Native acceptance')] === 'PASS') {
      const receipts = evidencePaths.filter((path) => !path.startsWith('tests/'));
      assert.ok(receipts.length > 0, `${id} native PASS names a receipt`);
      for (const receipt of receipts) await access(resolve(root, receipt));
    }
    assert.equal(actions[ACTIONS.indexOf('Native acceptance')], 'NOT_RUN', `${id} native acceptance is NOT_RUN`);
  }
  assert.equal(manifest.verification.nativeAcceptance, 'NOT_RUN');
});
