// SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { APPS } from '../skills/grandet-api-price-finder/scripts/connect.mjs';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

async function profileRows() {
  const catalog = await read('skills/grandet-api-price-finder/references/app-catalog.md');
  const section = catalog.split('## Profile details / 配置详情')[1]?.split('\n## ')[0];
  assert.ok(section, 'profile details section exists');
  return section.split('\n').filter((line) => line.startsWith('| `')).map((line) => {
    const cells = line.split('|').slice(1, -1).map((cell) => cell.trim());
    assert.equal(cells.length, 12, `profile row has all columns: ${line}`);
    return { app: cells[0].replaceAll('`', ''), profile: cells[1].replaceAll('`', ''), format: cells[3].replaceAll('`', ''), path: cells[4], scope: cells[5] };
  });
}

test('every application profile declares scope according to where the executor writes', async () => {
  const rows = await profileRows();
  assert.equal(rows.length, 29);
  const allowed = new Set(['USER', 'PROCESS', 'GUI', 'MANUAL', '—']);
  for (const row of rows) {
    assert.ok(allowed.has(row.scope), `${row.app}/${row.profile} has an allowed scope`);
    const expected = APPS[row.app]
      ? 'USER'
      : ({ LAUNCH_ENVIRONMENT: 'PROCESS', GUI_FIELDS: 'GUI', MANUAL_GUIDE: 'MANUAL' })[row.format] || 'USER';
    assert.equal(row.scope, expected, `${row.app}/${row.profile} scope matches ${row.format}`);
  }
  for (const app of Object.keys(APPS)) {
    assert.ok(rows.some((row) => row.app === app && row.scope === 'USER'), `${app} has a USER profile`);
  }
});

test('USER profile paths match connect executor filenames and environment fallbacks', async () => {
  const rows = (await profileRows()).filter((row) => row.scope === 'USER');
  const envFallback = {
    codex: 'CODEX_HOME', opencode: 'XDG_CONFIG_HOME', hermes: 'HERMES_HOME', openclaw: 'OPENCLAW_CONFIG_PATH', 'kilo-code': 'XDG_CONFIG_HOME', 'claude-code': 'CLAUDE_CONFIG_DIR',
  };
  const home = '/synthetic/grandet-home';

  for (const row of rows) {
    assert.ok(APPS[row.app], `${row.app} exists in connect.mjs APPS`);
    assert.match(row.path, /(?:~\/|\$)/, `${row.app}/${row.profile} path has user scope`);
    assert.doesNotMatch(row.path, /^(?!~\/|\$)[^/]+\.[A-Za-z0-9]+$/, `${row.app}/${row.profile} path is not a bare relative filename`);
    const target = APPS[row.app].file(home, {}, 'linux');
    const basenames = typeof target === 'string'
      ? [basename(target)]
      : ['jsonc', 'json'].map((extension) => `${target.base}.${extension}`);
    for (const name of basenames) assert.ok(row.path.includes(name), `${row.app}/${row.profile} documents executor filename ${name}`);
    if (envFallback[row.app]) assert.ok(row.path.includes(`$${envFallback[row.app]}`), `${row.app}/${row.profile} documents ${envFallback[row.app]} fallback`);
  }

  for (const app of ['opencode', 'kilo-code']) {
    const paths = rows.filter((row) => row.app === app).map((row) => row.path);
    assert.ok(paths.every((path) => path.includes('.jsonc') && path.includes('.json')), `${app} documents both JSONC and JSON filenames`);
  }
});

test('connect executor currently has no project-root or cwd option', async () => {
  const source = await read('skills/grandet-api-price-finder/scripts/connect.mjs');
  assert.doesNotMatch(source, /--(?:project|cwd|root)\b|\bo\.(?:project|cwd)\b|process\.cwd\(\)/);
});
