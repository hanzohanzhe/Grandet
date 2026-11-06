// SPDX-License-Identifier: AGPL-3.0-only
import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';
import {STRINGS} from '../strings.mjs';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
// Proper nouns may be added here only when they are intentionally bilingual.
const englishCjkAllowlist = [];
const cjk = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/;

test('catalogue dictionaries have matching keys and non-empty translations', () => {
  assert.deepEqual(Object.keys(STRINGS.en).sort(), Object.keys(STRINGS['zh-CN']).sort());
  for (const [lang, dictionary] of Object.entries(STRINGS)) {
    for (const [key, value] of Object.entries(dictionary)) {
      assert.equal(typeof value, 'string', `${lang}.${key} is a string`);
      assert.ok(value.trim(), `${lang}.${key} is non-empty`);
    }
  }
});

test('English UI strings contain no CJK outside the documented proper-noun allowlist', () => {
  for (const [key, value] of Object.entries(STRINGS.en)) {
    if (!cjk.test(value)) continue;
    assert.ok(englishCjkAllowlist.includes(key), `unexpected CJK in English string ${key}: ${value}`);
  }
});

test('HTML contains no old bilingual catalogue copy', async () => {
  const html = await read('index.html');
  for (const oldCopy of [
    'Grandet · 免费 API 与赠金额度',
    '73 official programmes + 34 third-party mechanisms',
    'Search / 搜索',
    '来源 / Source',
    'Official / 官方',
    'Third-party / 第三方',
    'Search coverage / 检索覆盖'
  ]) assert.ok(!html.includes(oldCopy), `old hard-coded copy remains: ${oldCopy}`);
});

test('every local browser module imported by app.mjs is served by the file map', async () => {
  const app = await read('app.mjs');
  const server = await read('scripts/serve.mjs');
  const mapPaths = new Set([...server.matchAll(/\['(\/[^']*)',\s*\[/g)].map((match) => match[1]));
  const imports = [...app.matchAll(/\bfrom\s+['"]([^'"]+)['"]/g)].map((match) => match[1]);
  assert.ok(imports.length, 'app.mjs imports at least one browser module');
  for (const specifier of imports) {
    assert.ok(specifier.startsWith('./'), `expected a local browser import: ${specifier}`);
    assert.ok(mapPaths.has(`/${specifier.slice(2)}`), `serve.mjs has no file-map entry for ${specifier}`);
  }
  assert.ok(mapPaths.has('/strings.mjs'), 'strings.mjs is explicitly served');
});
