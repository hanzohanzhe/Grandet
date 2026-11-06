// SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, readdir, stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));

test('package declares the supported Node runtime and test entry point', () => {
  assert.equal(pkg.private, true);
  const engine = /^>=\s*(\d+)(?:\.|$)/.exec(pkg.engines?.node ?? '');
  assert.ok(engine && Number(engine[1]) >= 20, `Expected Node >=20, got ${pkg.engines?.node}`);
  assert.equal(pkg.scripts?.test, 'node --test tests/*.test.mjs');
});

test('every package script points to an existing script file', async () => {
  for (const command of Object.values(pkg.scripts ?? {})) {
    const target = command.trim().split(/\s+/).at(-1);
    const match = /^(scripts|tests)\/([^/]+)$/.exec(target);
    assert.ok(match, `Could not parse script target from: ${command}`);
    const [, dir, file] = match;
    const entries = await readdir(path.join(root, dir));
    if (file.includes('*')) {
      const pattern = new RegExp(`^${file.replaceAll('.', '\\.').replaceAll('*', '.*')}$`);
      const matches = entries.filter((entry) => pattern.test(entry));
      assert.ok(matches.length, `No file matches ${target}`);
      for (const match of matches) {
        assert.ok((await stat(path.join(root, dir, match))).isFile(), `Script target is not a file: ${dir}/${match}`);
      }
    } else {
      assert.ok(entries.includes(file), `Missing script target ${target}`);
    }
  }
});

test('both READMEs document npm test and npm run serve', async () => {
  for (const filename of ['README.md', 'README.zh-CN.md']) {
    const readme = await readFile(path.join(root, filename), 'utf8');
    assert.match(readme, /npm test/);
    assert.match(readme, /npm run serve/);
  }
});

test('package remains dependency-free', () => {
  assert.equal(Object.hasOwn(pkg, 'dependencies'), false);
  assert.equal(Object.hasOwn(pkg, 'devDependencies'), false);
});
