// SPDX-License-Identifier: AGPL-3.0-only
import assert from 'node:assert/strict';
import {readFile, stat} from 'node:fs/promises';
import path from 'node:path';
import {EventEmitter} from 'node:events';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import {files, resolveRoute, openBrowser} from '../scripts/serve.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));

test('every server route points to a repository file with a text or JSON content type', async () => {
  for (const [pathname, [relativeFile, contentType]] of files) {
    assert.deepEqual(resolveRoute(pathname), [relativeFile, contentType]);
    await stat(path.join(root, relativeFile));
    assert.match(contentType, /^(?:text\/[^;]+|application\/json)$/);
  }
});

test('relative Markdown and JSON README links to repository files are served', async () => {
  for (const readme of ['README.md', 'README.zh-CN.md']) {
    const markdown = await readFile(path.join(root, readme), 'utf8');
    const links = [...markdown.matchAll(/\]\(([^)]+)\)/g)].map(match => match[1]);
    for (const link of links) {
      if (/^https?:\/\//i.test(link) || link.startsWith('#')) continue;
      const target = link.split('#', 1)[0];
      if (!/\.(?:md|json)$/i.test(target)) continue;
      const localFile = path.resolve(path.dirname(path.join(root, readme)), decodeURIComponent(target));
      let exists = true;
      try { await stat(localFile); } catch { exists = false; }
      if (!exists) continue;
      const route = `/${path.relative(root, localFile).split(path.sep).join('/')}`;
      assert.ok(resolveRoute(route), `${readme} links to unserved repository file ${target}`);
    }
  }
});

test('READMEs describe a listener, browser navigation, and Ctrl+C shutdown', async () => {
  for (const [readme, oldClaim] of [
    ['README.md', 'opens a local browser view'],
    ['README.zh-CN.md', '打开本地浏览页'],
  ]) {
    const markdown = await readFile(path.join(root, readme), 'utf8');
    assert.ok(!markdown.includes(oldClaim), `${readme} retains the automatic browser view claim`);
    assert.ok(markdown.includes('http://127.0.0.1:8787/'), `${readme} omits the served URL`);
    assert.ok(markdown.includes('Ctrl+C to stop'), `${readme} omits the printed stop instruction`);
    assert.match(markdown, /(?:open that address in a browser|在浏览器中打开该地址)/);
    assert.ok(markdown.includes('--open'), `${readme} does not document the opt-in browser launch`);
  }
});

test('openBrowser reports success and handles spawn errors without throwing', async () => {
  const successfulSpawn = (command, args) => {
    assert.equal(command, 'xdg-open');
    assert.deepEqual(args, ['http://127.0.0.1:8787/']);
    const child = new EventEmitter();
    child.unref = () => {};
    queueMicrotask(() => child.emit('spawn'));
    return child;
  };
  assert.deepEqual(await openBrowser('http://127.0.0.1:8787/', {platform: 'linux', spawn: successfulSpawn}), {opened: true});

  const failingSpawn = () => {
    const child = new EventEmitter();
    queueMicrotask(() => child.emit('error', new Error('opener missing')));
    return child;
  };
  const result = await openBrowser('http://127.0.0.1:8787/', {platform: 'linux', spawn: failingSpawn});
  assert.equal(result.opened, false);
  assert.match(result.reason, /opener missing/);
});

test('the listener invokes the browser opener only inside the --open branch', async () => {
  const source = await readFile(new URL('../scripts/serve.mjs', import.meta.url), 'utf8');
  assert.match(source, /if\s*\(process\.argv\.includes\('--open'\)\)\s*\{[\s\S]*?openBrowser\(url\)/);
  assert.equal([...source.matchAll(/openBrowser\(url\)/g)].length, 1);
});
