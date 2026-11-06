// SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const read = (file) => readFile(resolve(file), 'utf8');

test('serve instructions describe the actual local server behavior', async () => {
  const [server, readme, readmeZh] = await Promise.all([
    read('scripts/serve.mjs'),
    read('README.md'),
    read('README.zh-CN.md'),
  ]);

  assert.match(server, /listen\(8787,\s*'127\.0\.0\.1'/);
  assert.match(server, /http:\/\/127\.0\.0\.1:8787\/.*Ctrl\+C/s);
  assert.doesNotMatch(
    server,
    /\b(?:spawn|exec|xdg-open|open)\b/i,
    'A browser launcher was added; update this test and the docs to describe it.',
  );

  for (const [file, content] of [['README.md', readme], ['README.zh-CN.md', readmeZh]]) {
    assert.match(content, /http:\/\/127\.0\.0\.1:8787\//, `${file} should include the local server address`);
    assert.match(content, /Ctrl\+C/i, `${file} should explain how to stop the server`);
  }
  assert.match(readmeZh, /Ctrl\+C[^。\n]*停止/, 'README.zh-CN.md should explain that Ctrl+C stops the server');
  assert.doesNotMatch(readme, /opens a local browser view/i);
  assert.doesNotMatch(readmeZh, /打开本地浏览页/);
});
