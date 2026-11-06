// SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { matchRow, visibleFields } from '../catalogue-ui.mjs';

const data = JSON.parse(await readFile(new URL('../data/free-tokens.json', import.meta.url), 'utf8'));
const rows = [...data.officialOffers, ...data.offers];
const gemini = rows.find(row => row.id === 'google-gemini-free');

test('record id is hidden by default and available in all-fields mode', () => {
  assert.equal(visibleFields(gemini, 'en').some(({ text }) => text.includes('google-gemini-free')), false);
  assert.deepEqual(matchRow(gemini, 'google-gemini-free', 'en'), { matched: null, hidden: false });
  assert.deepEqual(matchRow(gemini, 'google-gemini-free', 'en', { allFields: true }), { matched: 'id', hidden: true });
});

test('provider, benefit, and condition content report their visible field', () => {
  for (const [query, lang, field] of [
    ['Google', 'en', 'provider'],
    ['eligible Gemini models', 'en', 'benefitText'],
    ['supported-region', 'en', 'conditions'],
  ]) {
    const result = matchRow(gemini, query, lang);
    assert.equal(result.matched, field);
    assert.equal(result.hidden, false);
  }
});

test('default matching is constrained to the selected language', () => {
  assert.equal(matchRow(gemini, 'Gemini API 免费层', 'en').matched, null);
  assert.equal(matchRow(gemini, 'Gemini API free tier', 'zh-CN').matched, null);
});

test('every default-mode hit identifies a visible field containing the query', () => {
  const query = 'free';
  for (const row of rows) {
    const result = matchRow(row, query, 'en');
    if (result.matched === null) continue;
    assert.ok(result.matched.length > 0);
    assert.ok(visibleFields(row, 'en').some(({ field, text }) => field === result.matched && text.toLocaleLowerCase().includes(query)));
  }
});

test('the local server serves every relative module app.mjs imports', async () => {
  const app = await readFile(new URL('../app.mjs', import.meta.url), 'utf8');
  const server = await readFile(new URL('../scripts/serve.mjs', import.meta.url), 'utf8');
  const imports = [...app.matchAll(/from\s+'(\.[^']+)'/g)].map((m) => m[1]);
  assert.ok(imports.length > 0, 'app.mjs should import its search module');
  for (const spec of imports) {
    const name = spec.replace(/^\.\//, '');
    assert.ok(server.includes(`['/${name}',['${name}'`), `${name} is imported by app.mjs but not served by scripts/serve.mjs`);
  }
});
