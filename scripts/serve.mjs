// SPDX-License-Identifier: AGPL-3.0-only
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {spawn as nodeSpawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {root} from './catalogue.mjs';

export const files = new Map([
  ['/', ['index.html', 'text/html']],
  ['/app.mjs', ['app.mjs', 'text/javascript']],
  ['/style.css', ['style.css', 'text/css']],
  ['/data/free-tokens.json', ['data/free-tokens.json', 'application/json']],
  ['/data/free-tokens-v3.json', ['data/free-tokens-v3.json', 'application/json']],
  ['/data/RELEASE-v3.json', ['data/RELEASE-v3.json', 'application/json']],
  ['/data/MANIFEST.json', ['data/MANIFEST.json', 'application/json']],
  ['/CATALOGUE.md', ['CATALOGUE.md', 'text/plain']],
  ['/CATALOGUE-v3.md', ['CATALOGUE-v3.md', 'text/plain']],
  ['/INSTALL.md', ['INSTALL.md', 'text/plain']],
  ['/skills/grandet-api-price-finder/references/installation.md', ['skills/grandet-api-price-finder/references/installation.md', 'text/plain']],
  ['/skills/grandet-api-price-finder/references/glossary.md', ['skills/grandet-api-price-finder/references/glossary.md', 'text/plain']],
  ['/catalogue-index.json', ['catalogue-index.json', 'application/json']],
  ['/CONTRIBUTING.md', ['CONTRIBUTING.md', 'text/plain']],
  ['/METHODOLOGY.md', ['METHODOLOGY.md', 'text/plain']],
  ['/DATA-LICENSE.md', ['DATA-LICENSE.md', 'text/plain']],
  ['/TRADEMARKS.md', ['TRADEMARKS.md', 'text/plain']],
  ['/README.md', ['README.md', 'text/plain']],
  ['/README.zh-CN.md', ['README.zh-CN.md', 'text/plain']],
]);

export function resolveRoute(pathname) {
  return files.get(pathname);
}

export function openBrowser(url, {platform = process.platform, spawn = nodeSpawn} = {}) {
  const command = platform === 'darwin' ? 'open'
    : platform === 'linux' ? 'xdg-open'
      : platform === 'win32' ? 'cmd' : null;
  if (!command) return Promise.resolve({opened: false, reason: `No browser opener for ${platform}`});

  const args = platform === 'win32' ? ['/c', 'start', '', url] : [url];
  return new Promise(resolve => {
    let settled = false;
    const finish = result => {
      if (settled) return;
      settled = true;
      resolve(result);
    };
    try {
      const child = spawn(command, args, {detached: true, stdio: 'ignore'});
      child.once('error', error => finish({opened: false, reason: error.message}));
      child.once('spawn', () => {
        child.unref?.();
        finish({opened: true});
      });
    } catch (error) {
      finish({opened: false, reason: error.message});
    }
  });
}

async function start() {
  const url = 'http://127.0.0.1:8787/';
  const server = createServer(async (req, res) => {
    try {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.writeHead(405);
        res.end();
        return;
      }
      const file = resolveRoute(new URL(req.url, 'http://localhost').pathname);
      if (!file) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      const body = await readFile(path.join(root, file[0]));
      res.writeHead(200, {
        'Content-Type': `${file[1]}; charset=utf-8`,
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'self'; object-src 'none'; base-uri 'none'",
      });
      res.end(req.method === 'HEAD' ? undefined : body);
    } catch {
      res.writeHead(500);
      res.end('Read failed');
    }
  });
  server.listen(8787, '127.0.0.1', async () => {
    console.log(`Grandet catalogue: ${url} (Ctrl+C to stop)`);
    if (process.argv.includes('--open')) {
      const result = await openBrowser(url);
      if (!result.opened) console.log('OPEN_UNAVAILABLE');
    }
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await start();
}
