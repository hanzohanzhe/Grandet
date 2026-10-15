#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
// Grandet connect executor: preview, apply, key, verify and restore a supplier
// connection for one app. No dependencies. The key never passes through this
// program's output, its arguments or the conversation.
import { createHash, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { copyFile, mkdir, readFile, rename, rm, stat, writeFile, chmod } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join, resolve, isAbsolute } from 'node:path';
import { pathToFileURL } from 'node:url';

export const VERSION = '0.3.0';
const PLACEHOLDER = 'GRANDET_KEY_PLACEHOLDER';
const PROTOCOLS = ['openai', 'openai-response', 'anthropic', 'gemini'];

export const APPS = {
  codex: { name: 'Codex', protocols: ['openai-response'], file: (h, env) => join(env.CODEX_HOME || join(h, '.codex'), 'config.toml'), format: 'toml' },
  'claude-code': { name: 'Claude Code', protocols: ['anthropic'], file: (h, env) => join(env.CLAUDE_CONFIG_DIR || join(h, '.claude'), 'settings.json'), format: 'claude-json' },
  opencode: { name: 'OpenCode', protocols: ['openai', 'openai-response'], file: (h, env) => jsoncPath(join(env.XDG_CONFIG_HOME || join(h, '.config'), 'opencode'), 'opencode'), format: 'opencode-json' },
  'kilo-code': { name: 'Kilo Code', protocols: ['openai', 'openai-response'], file: (h, env) => jsoncPath(join(env.XDG_CONFIG_HOME || join(h, '.config'), 'kilo'), 'kilo', 'jsonc'), format: 'opencode-json' },
  continue: { name: 'Continue', protocols: ['openai'], file: (h) => join(h, '.continue', 'config.yaml'), format: 'continue-yaml' },
  'gemini-cli': { name: 'Gemini CLI', protocols: ['gemini'], file: (h) => join(h, '.env'), format: 'dotenv' },
};
const ALIASES = { kilo: 'kilo-code', claude: 'claude-code', gemini: 'gemini-cli' };

export class ConnectError extends Error {
  constructor(code, message) { super(message || code); this.code = code; }
}
const fail = (code, message) => { throw new ConnectError(code, message); };
const sha = (text) => createHash('sha256').update(text).digest('hex');
const exists = async (path) => { try { await stat(path); return true; } catch { return false; } };
const readText = async (path) => (await exists(path) ? (await readFile(path)).toString('utf8') : null);

function jsoncPath(dir, base, preferred = 'json') {
  // Resolved synchronously later by resolveFile(); placeholder keeps APPS simple.
  return { dir, base, preferred };
}
async function resolveFile(app, home, env) {
  const target = APPS[app].file(home, env);
  if (typeof target === 'string') return target;
  for (const ext of ['jsonc', 'json']) { const p = join(target.dir, `${target.base}.${ext}`); if (await exists(p)) return p; }
  return join(target.dir, `${target.base}.${target.preferred}`);
}

// ---------- inputs ----------
export function normalise(input) {
  const o = { ...input };
  const app = ALIASES[o.app] || o.app;
  if (!APPS[app]) fail('UNKNOWN_APP', `Supported apps: ${Object.keys(APPS).join(', ')}`);
  o.app = app;
  const site = String(o.site || '').trim().toLowerCase();
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(site)) fail('INVALID_SITE', 'Use the row sourceId, for example apijing.com');
  o.site = site;
  let url;
  try { url = new URL(String(o.baseUrl || `https://${site}`)); } catch { fail('INVALID_BASE_URL'); }
  const loopback = ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname);
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && loopback)) fail('BASE_URL_NOT_HTTPS', 'Use https; http is accepted only for 127.0.0.1/localhost');
  if (url.username || url.password || url.search || url.hash) fail('INVALID_BASE_URL', 'No credentials, query or fragment in the address');
  const host = url.hostname.toLowerCase();
  if (!loopback && host !== site && !host.endsWith(`.${site}`) && !o.confirmedOtherDomain) fail('BASE_URL_OTHER_DOMAIN', `The address ${host} is not on ${site}. Ask the user to confirm it, then pass --confirmed-other-domain`);
  o.origin = `${url.protocol}//${url.host}${url.pathname.replace(/\/+$/, '').replace(/\/v1$/, '')}`;
  o.protocol = o.protocol || APPS[app].protocols[0];
  if (!PROTOCOLS.includes(o.protocol)) fail('UNKNOWN_PROTOCOL');
  if (!APPS[app].protocols.includes(o.protocol)) fail('PROTOCOL_NOT_SUPPORTED_BY_APP', `${APPS[app].name} needs ${APPS[app].protocols.join(' or ')}; this offer gives ${o.protocol}. Choose another offer`);
  const model = String(o.model || '').trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._:/@+\-[\]]{0,159}$/.test(model)) fail('INVALID_MODEL', 'Use the exact modelName from the row');
  o.model = model;
  o.group = o.group ? String(o.group).slice(0, 200) : null;
  o.id = `grandet-${site.replace(/[^a-z0-9]+/g, '-')}`;
  o.variable = `GRANDET_${site.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}_KEY`;
  o.home = resolve(o.home || homedir());
  o.platform = o.platform || process.platform;
  o.env = o.home === resolve(homedir()) ? (o.env || process.env) : {};
  o.keyPath = join(o.home, '.grandet', 'keys', site);
  return o;
}

// ---------- editors ----------
const tomlString = (s) => JSON.stringify(s);
function editToml(text, o) {
  const src = text ?? '';
  if (/"""|'''/.test(src)) fail('COMPLEX_TOML', 'config.toml uses multi-line strings; edit it by hand with the snippet');
  const lines = src.length ? src.replace(/\r\n/g, '\n').replace(/\n$/, '').split('\n') : [];
  const isHeader = (l) => /^\s*\[/.test(l);
  const first = lines.findIndex(isHeader);
  const top = first < 0 ? lines : lines.slice(0, first);
  let rest = first < 0 ? [] : lines.slice(first);
  const setTop = (key, value) => {
    const i = top.findIndex((l) => new RegExp(`^\\s*${key}\\s*=`).test(l));
    const line = `${key} = ${tomlString(value)}`;
    if (i >= 0) top[i] = line; else top.unshift(line);
  };
  setTop('model_provider', o.id);
  setTop('model', o.model);
  const header = `[model_providers.${o.id}]`;
  const out = [];
  for (let i = 0; i < rest.length; i++) {
    if (rest[i].trim() === header || rest[i].trim() === `[model_providers."${o.id}"]`) {
      i++;
      while (i < rest.length && !isHeader(rest[i])) i++;
      i--;
      continue;
    }
    out.push(rest[i]);
  }
  rest = out;
  while (rest.length && rest[rest.length - 1].trim() === '') rest.pop();
  const table = [header, `name = ${tomlString(`${o.site} (Grandet)`)}`, `base_url = ${tomlString(`${o.origin}/v1`)}`, 'wire_api = "responses"', `env_key = ${tomlString(o.variable)}`];
  const trim = (ls) => { const c = [...ls]; while (c.length && c[c.length - 1].trim() === '') c.pop(); return c; };
  const groups = [trim(top), rest, table].filter((g) => g.length);
  return groups.map((g) => g.join('\n')).join('\n\n') + '\n';
}

function parseStrictJson(text, what) {
  if (text === null || text.trim() === '') return {};
  try { const v = JSON.parse(text); if (!v || typeof v !== 'object' || Array.isArray(v)) throw 0; return v; } catch { fail('INVALID_JSON', `${what} is not valid JSON; fix it or edit by hand`); }
}
function stripJsonc(text) {
  let out = '', inStr = false, comment = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i], n = text[i + 1];
    if (inStr) { out += c; if (c === '\\') { out += n ?? ''; i++; } else if (c === '"') inStr = false; continue; }
    if (c === '"') { inStr = true; out += c; continue; }
    if (c === '/' && n === '/') { comment = true; while (i < text.length && text[i] !== '\n') i++; out += '\n'; continue; }
    if (c === '/' && n === '*') { comment = true; i += 2; while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) i++; i++; continue; }
    out += c;
  }
  return { json: out.replace(/,(\s*[}\]])/g, '$1'), comment };
}
function editClaude(text, o) {
  const obj = parseStrictJson(text, 'settings.json');
  const env = { ...(obj.env && typeof obj.env === 'object' ? obj.env : {}) };
  const removed = ['ANTHROPIC_API_KEY', 'ANTHROPIC_AUTH_TOKEN'].filter((k) => k in env);
  for (const k of removed) delete env[k];
  env.ANTHROPIC_BASE_URL = o.origin;
  env.ANTHROPIC_MODEL = o.model;
  obj.env = env;
  if (o.platform === 'win32') delete obj.apiKeyHelper;
  else obj.apiKeyHelper = `cat '${o.keyPath.replace(/'/g, "'\\''")}'`;
  return { text: `${JSON.stringify(obj, null, 2)}\n`, notes: removed.length ? [`Removed ${removed.join(', ')} from settings env so the new key is used; undo restores them`] : [] };
}
function editOpencode(text, o) {
  let obj = {};
  if (text !== null && text.trim() !== '') {
    const { json, comment } = stripJsonc(text);
    if (comment) fail('COMMENTS_PRESENT', 'The config has comments that a rewrite would drop; edit it by hand with the snippet');
    try { obj = JSON.parse(json); } catch { fail('INVALID_JSON', 'The config is not valid JSON'); }
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) fail('INVALID_JSON');
  }
  if (!obj.$schema) obj.$schema = 'https://opencode.ai/config.json';
  obj.provider = obj.provider && typeof obj.provider === 'object' ? obj.provider : {};
  obj.provider[o.id] = {
    npm: o.protocol === 'openai-response' ? '@ai-sdk/openai' : '@ai-sdk/openai-compatible',
    name: `${o.site} (Grandet)`,
    options: { baseURL: `${o.origin}/v1`, apiKey: `{file:${o.keyPath}}` },
    models: { [o.model]: { name: o.model } },
  };
  obj.model = `${o.id}/${o.model}`;
  return `${JSON.stringify(obj, null, 2)}\n`;
}
const marker = (o, what) => `# grandet:${o.site} ${what}`;
function removeBlock(lines, o) {
  const b = lines.findIndex((l) => l.trim() === marker(o, 'begin'));
  if (b < 0) return { lines, at: -1 };
  const e = lines.findIndex((l, i) => i > b && l.trim() === marker(o, 'end'));
  if (e < 0) fail('BROKEN_GRANDET_BLOCK', 'A Grandet block has no end marker; fix the file by hand');
  return { lines: [...lines.slice(0, b), ...lines.slice(e + 1)], at: b };
}
function editContinue(text, o) {
  const yamlValue = (s) => JSON.stringify(s);
  if (text === null || text.trim() === '') {
    return ['name: Local Config', 'version: 1.0.0', 'schema: v1', 'models:', ...continueBlock(o, '  ', yamlValue)].join('\n') + '\n';
  }
  if (/\t/.test(text)) fail('COMPLEX_YAML', 'config.yaml uses tabs; edit it by hand with the snippet');
  let { lines } = removeBlock(text.replace(/\r\n/g, '\n').replace(/\n$/, '').split('\n'), o);
  const i = lines.findIndex((l) => /^models:\s*(\[\s*\])?\s*(#.*)?$/.test(l));
  if (i < 0) {
    if (lines.some((l) => /^models:/.test(l))) fail('COMPLEX_YAML', 'models is not a plain list; edit it by hand with the snippet');
    lines = [...lines, 'models:', ...continueBlock(o, '  ', yamlValue)];
  } else {
    lines[i] = 'models:';
    const next = lines.slice(i + 1).find((l) => l.trim() && !l.trim().startsWith('#'));
    const indent = next && /^(\s+)-\s/.test(next) ? next.match(/^(\s+)-/)[1] : next && /^-\s/.test(next) ? '' : '  ';
    lines.splice(i + 1, 0, ...continueBlock(o, indent, yamlValue));
  }
  return lines.join('\n') + '\n';
}
function continueBlock(o, indent, q) {
  return [`${indent}${marker(o, 'begin')}`, `${indent}- name: ${q(`${o.site} ${o.model}`)}`, `${indent}  provider: openai`, `${indent}  model: ${q(o.model)}`, `${indent}  apiBase: ${q(`${o.origin}/v1`)}`, `${indent}  apiKey: ${PLACEHOLDER}`, `${indent}${marker(o, 'end')}`];
}
function editDotenv(text, o) {
  let lines = text === null || text === '' ? [] : text.replace(/\r\n/g, '\n').replace(/\n$/, '').split('\n');
  lines = removeBlock(lines, o).lines;
  while (lines.length && lines[lines.length - 1].trim() === '') lines.pop();
  const block = [marker(o, 'begin'), `GOOGLE_GEMINI_BASE_URL=${o.origin}`, `GEMINI_MODEL=${o.model}`, `GEMINI_API_KEY=${PLACEHOLDER}`, marker(o, 'end')];
  return [...lines, ...(lines.length ? [''] : []), ...block].join('\n') + '\n';
}

// ---------- plan ----------
function lineDiff(before, after) {
  const a = (before ?? '').split('\n'), b = after.split('\n');
  let p = 0; while (p < a.length && p < b.length && a[p] === b[p]) p++;
  let s = 0; while (s < a.length - p && s < b.length - p && a[a.length - 1 - s] === b[b.length - 1 - s]) s++;
  const removed = before === null ? [] : a.slice(p, a.length - s), added = b.slice(p, b.length - s);
  return [`@@ line ${p + 1}`, ...removed.map((l) => `- ${l}`), ...added.map((l) => `+ ${l}`)].join('\n');
}
const redactKeys = (text) => text.replace(/^([+-] \s*(?:apiKey|GEMINI_API_KEY)\s*[:=]\s*)(?!GRANDET_KEY_PLACEHOLDER)\S+/gm, '$1<hidden>');
// Embedded keys (Continue, Gemini CLI) are compared as the placeholder, so storing a key is not a user edit.
const keyNeutral = (text) => text.replace(/^(\s*(?:apiKey:\s*|GEMINI_API_KEY=))\S+$/gm, `$1${PLACEHOLDER}`);

export async function plan(input) {
  const o = normalise(input);
  const file = await resolveFile(o.app, o.home, o.env);
  const before = await readText(file);
  let after, notes = [];
  switch (APPS[o.app].format) {
    case 'toml': after = editToml(before, o); break;
    case 'claude-json': ({ text: after, notes } = editClaude(before, o)); break;
    case 'opencode-json': after = editOpencode(before, o); break;
    case 'continue-yaml': after = editContinue(before, o); break;
    case 'dotenv': after = editDotenv(before, o); break;
  }
  if (APPS[o.app].format === 'continue-yaml' && before !== null) after = keepExistingKey(before, after, o);
  if (APPS[o.app].format === 'dotenv' && before !== null) after = keepExistingKey(before, after, o);
  const changes = before === after ? [] : [{ path: file, action: before === null ? 'create' : 'modify', beforeSha: before === null ? null : sha(before), afterSha: sha(after), diff: redactKeys(lineDiff(before, after)), content: after }];
  const steps = [];
  if (o.group) steps.push(`On ${o.site}, create the token in group 「${o.group}」.`);
  steps.push(`Store the key: node "<skill folder>/scripts/connect.mjs" key --app ${o.app} --site ${o.site}`);
  if (o.app === 'gemini-cli') notes.push('Gemini CLI reads ~/.env only when the working folder and its parents have no .env of their own');
  if (o.app === 'codex' && o.platform !== 'win32') notes.push('Codex reads the key from an environment variable; open a new terminal after storing the key');
  const planHash = sha(JSON.stringify({ app: o.app, site: o.site, origin: o.origin, protocol: o.protocol, model: o.model, changes: changes.map(({ path, beforeSha, afterSha }) => ({ path, beforeSha, afterSha })) }));
  return { o, changes, notes, steps, planHash };
}
function keepExistingKey(before, after, o) {
  // Re-applying keeps a key already filled in by `key`.
  const lines = before.replace(/\r\n/g, '\n').split('\n');
  const b = lines.findIndex((l) => l.trim() === marker(o, 'begin'));
  if (b < 0) return after;
  const keyLine = lines.slice(b).find((l) => /(apiKey:|GEMINI_API_KEY=)/.test(l));
  const m = keyLine && keyLine.match(/(?:apiKey:\s*|GEMINI_API_KEY=)(\S+)/);
  return m && m[1] !== PLACEHOLDER ? after.replace(PLACEHOLDER, m[1]) : after;
}
export const publicPlan = ({ o, changes, notes, steps, planHash }) => ({
  app: o.app, appName: APPS[o.app].name, site: o.site, origin: o.origin, protocol: o.protocol, model: o.model, group: o.group, planHash,
  changes: changes.map(({ path, action, diff }) => ({ path, action, diff })), notes, steps, keyPath: o.keyPath,
});

// ---------- state ----------
const statePath = (home) => join(home, '.grandet', 'connect', 'state.json');
async function loadState(home) { const t = await readText(statePath(home)); return t ? JSON.parse(t) : { schema: 'grandet.connect-state/v1', changes: [] }; }
async function saveState(home, state) { await atomicWrite(statePath(home), `${JSON.stringify(state, null, 2)}\n`); }
async function atomicWrite(path, text, mode) {
  await mkdir(dirname(path), { recursive: true });
  const tmp = `${path}.grandet-tmp-${process.pid}-${randomUUID().slice(0, 8)}`;
  await writeFile(tmp, text, mode ? { mode } : undefined);
  await rename(tmp, path);
}
const stamp = () => new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15);

export async function apply(input) {
  const p = await plan(input);
  if (!input.yes) fail('CONFIRMATION_REQUIRED', 'Show the preview to the user and pass --yes only after they agree');
  if (input.planHash && input.planHash !== p.planHash) fail('PLAN_CHANGED', 'The file changed since the preview; preview again');
  const state = await loadState(p.o.home);
  const record = { id: randomUUID(), at: new Date().toISOString(), app: p.o.app, site: p.o.site, variable: p.o.variable, platform: p.o.platform, files: [], restoredAt: null };
  for (const c of p.changes) {
    let backup = null;
    if (c.action === 'modify') { backup = `${c.path}.grandet-backup-${stamp()}`; let n = 1; while (await exists(backup)) backup = `${c.path}.grandet-backup-${stamp()}-${n++}`; await copyFile(c.path, backup); }
    await atomicWrite(c.path, c.content);
    if (sha((await readFile(c.path)).toString('utf8')) !== c.afterSha) fail('READBACK_MISMATCH', c.path);
    record.files.push({ path: c.path, existed: c.action === 'modify', backup, writtenSha: sha(keyNeutral(c.content)) });
  }
  if (record.files.length) { state.changes.push(record); await saveState(p.o.home, state); }
  return { ...publicPlan(p), applied: record.files.length > 0, changeId: record.files.length ? record.id : null, backups: record.files.map((f) => f.backup).filter(Boolean), unchanged: record.files.length === 0 };
}

// ---------- key ----------
async function readHidden(prompt, input = process.stdin, output = process.stderr) {
  if (!input.isTTY) {
    let data = ''; for await (const chunk of input) data += chunk; return data.split(/\r?\n/)[0];
  }
  output.write(prompt);
  return new Promise((resolveKey, reject) => {
    let value = '';
    input.setRawMode(true); input.resume(); input.setEncoding('utf8');
    const done = (err) => { input.setRawMode(false); input.pause(); input.removeListener('data', onData); output.write('\n'); err ? reject(err) : resolveKey(value); };
    const onData = (chunk) => {
      for (const ch of chunk) {
        if (ch === '\r' || ch === '\n') return done();
        if (ch === '\u0003') return done(new ConnectError('CANCELLED'));
        if (ch === '\u007f' || ch === '\b') value = value.slice(0, -1); else if (ch >= ' ') value += ch;
      }
    };
    input.on('data', onData);
  });
}
const PROFILE_FILES = ['.zshrc', '.bashrc', '.profile'];
function setWindowsUserEnv(name, keyPath) {
  const script = keyPath ? `[Environment]::SetEnvironmentVariable('${name}',(Get-Content -Raw -LiteralPath '${keyPath.replace(/'/g, "''")}').Trim(),'User')` : `[Environment]::SetEnvironmentVariable('${name}',$null,'User')`;
  execFileSync('powershell', ['-NoProfile', '-NonInteractive', '-Command', script], { stdio: 'ignore' });
}
export async function storeKey(input, keyText) {
  const o = normalise({ ...input, model: input.model || 'placeholder-model', protocol: input.protocol, baseUrl: input.baseUrl || `https://${input.site}`, confirmedOtherDomain: true });
  const key = String(keyText ?? '').trim();
  if (!key || /\s/.test(key) || key.length > 512) fail('INVALID_KEY', 'The key is empty or contains spaces');
  await mkdir(dirname(o.keyPath), { recursive: true, mode: 0o700 });
  await atomicWrite(o.keyPath, key, 0o600);
  await chmod(o.keyPath, 0o600).catch(() => {});
  const done = [`Key saved to ${o.keyPath}`];
  if (o.app === 'codex') {
    if (o.platform === 'win32') { setWindowsUserEnv(o.variable, o.keyPath); done.push(`User environment variable ${o.variable} set`); }
    else {
      const line = `export ${o.variable}="$(cat '${o.keyPath.replace(/'/g, "'\\''")}')"  # grandet:${o.site}`;
      const shell = (o.env.SHELL || '').split('/').pop();
      const targets = PROFILE_FILES.filter((f) => f !== '.profile');
      const chosen = [];
      for (const f of targets) if (await exists(join(o.home, f)) || (shell === 'zsh' && f === '.zshrc') || (shell === 'bash' && f === '.bashrc')) chosen.push(f);
      if (!chosen.length) chosen.push('.profile');
      for (const f of chosen) {
        const path = join(o.home, f); const text = (await readText(path)) ?? '';
        const kept = text.split('\n').filter((l) => !l.endsWith(`# grandet:${o.site}`));
        await atomicWrite(path, `${kept.join('\n').replace(/\n*$/, '\n')}${line}\n`);
        done.push(`Added ${o.variable} to ~/${f}`);
      }
    }
  }
  if (o.app === 'claude-code' && o.platform === 'win32') { setWindowsUserEnv('ANTHROPIC_AUTH_TOKEN', o.keyPath); done.push('User environment variable ANTHROPIC_AUTH_TOKEN set'); }
  if (o.app === 'continue' || o.app === 'gemini-cli') {
    const file = await resolveFile(o.app, o.home, o.env);
    const text = await readText(file);
    const block = text && text.split('\n').findIndex((l) => l.trim() === marker(o, 'begin'));
    if (text === null || block < 0) fail('NOT_CONNECTED_YET', 'Apply the connection first, then store the key');
    const lines = text.split('\n');
    for (let i = block; i < lines.length && lines[i].trim() !== marker(o, 'end'); i++) lines[i] = lines[i].replace(/(apiKey:\s*|GEMINI_API_KEY=)\S*$/, `$1${key}`);
    await atomicWrite(file, lines.join('\n'));
    done.push(`Key written into ${file}`);
  }
  return { saved: true, app: o.app, site: o.site, done };
}

// ---------- verify ----------
export async function verify(input) {
  const o = normalise(input);
  const key = (await readText(input.keyFile ? resolve(input.keyFile) : o.keyPath))?.trim();
  if (!key) fail('KEY_NOT_STORED', `No key at ${o.keyPath}. Ask the user to run the key command first`);
  const url = `${o.origin}/v1/models`;
  let response;
  try {
    response = await fetch(url, { headers: { Authorization: `Bearer ${key}`, 'x-api-key': key, 'User-Agent': `grandet-connect/${VERSION}`, Accept: 'application/json' }, redirect: 'manual', signal: AbortSignal.timeout((input.timeout || 20) * 1000) });
  } catch (error) { return { ok: false, status: null, reason: 'NETWORK_ERROR', message: 'Could not reach the site; check the address or try again', url }; }
  const base = { status: response.status, url };
  if (response.status >= 300 && response.status < 400) return { ...base, ok: false, reason: 'REDIRECT_REFUSED', message: 'The site redirected; the key was not sent anywhere else' };
  if (response.status === 401 || response.status === 403) return { ...base, ok: false, reason: 'KEY_REJECTED', message: 'The key is wrong, expired or out of balance' };
  if (response.status !== 200) return { ...base, ok: false, reason: 'HTTP_ERROR', message: `The site answered ${response.status}` };
  let ids = [];
  try {
    const body = await response.json();
    const list = Array.isArray(body?.data) ? body.data : Array.isArray(body?.models) ? body.models : [];
    ids = list.map((m) => String(m?.id ?? m?.name ?? '').replace(/^models\//, '')).filter(Boolean);
  } catch { return { ...base, ok: false, reason: 'NOT_JSON', message: 'The site did not return a model list' }; }
  const listed = ids.includes(o.model);
  return { ...base, ok: listed, reason: listed ? 'MODEL_LISTED' : 'MODEL_NOT_LISTED', modelCount: ids.length, message: listed ? 'Key, group and model name are right' : 'The key works but this model is not in its group; check the group chosen when the token was created' };
}

// ---------- restore ----------
export async function restore(input) {
  const home = resolve(input.home || homedir());
  const state = await loadState(home);
  const record = input.id ? state.changes.find((c) => c.id === input.id) : [...state.changes].reverse().find((c) => !c.restoredAt && (!input.site || c.site === input.site) && (!input.app || c.app === (ALIASES[input.app] || input.app)));
  if (!record) fail('NOTHING_TO_RESTORE');
  if (record.restoredAt) fail('ALREADY_RESTORED');
  const results = [];
  for (const f of record.files) {
    const current = await readText(f.path);
    if (current !== null && sha(keyNeutral(current)) !== f.writtenSha && !input.force) fail('CHANGED_SINCE_APPLY', `${f.path} changed after Grandet wrote it; pass --force to restore anyway`);
  }
  for (const f of record.files) {
    if (f.existed) { await copyFile(f.backup, f.path); results.push({ path: f.path, action: 'restored', from: f.backup }); }
    else { await rm(f.path, { force: true }); results.push({ path: f.path, action: 'removed' }); }
  }
  const platform = record.platform || process.platform;
  if (platform !== 'win32') for (const name of PROFILE_FILES) {
    const path = join(home, name); const text = await readText(path);
    if (text && text.includes(`# grandet:${record.site}`)) { await atomicWrite(path, text.split('\n').filter((l) => !l.endsWith(`# grandet:${record.site}`)).join('\n')); results.push({ path, action: 'profile-line-removed' }); }
  }
  if (platform === 'win32' && input.home === undefined) {
    if (record.app === 'codex') setWindowsUserEnv(record.variable, null);
    if (record.app === 'claude-code') setWindowsUserEnv('ANTHROPIC_AUTH_TOKEN', null);
  }
  const keyPath = join(home, '.grandet', 'keys', record.site);
  if (input.deleteKey) { await rm(keyPath, { force: true }); results.push({ path: keyPath, action: 'key-deleted' }); }
  record.restoredAt = new Date().toISOString();
  await saveState(home, state);
  return { restored: true, changeId: record.id, app: record.app, site: record.site, results, keyKept: input.deleteKey ? null : keyPath };
}
export async function status(input) {
  const home = resolve(input.home || homedir());
  return { changes: (await loadState(home)).changes.map(({ id, at, app, site, files, restoredAt }) => ({ id, at, app, site, files: files.map((f) => f.path), restoredAt })) };
}

// ---------- CLI ----------
const FLAGS = { '--app': 'app', '--site': 'site', '--base-url': 'baseUrl', '--protocol': 'protocol', '--model': 'model', '--group': 'group', '--home': 'home', '--platform': 'platform', '--plan-hash': 'planHash', '--id': 'id', '--key-file': 'keyFile', '--timeout': 'timeout' };
const SWITCHES = { '--yes': 'yes', '--json': 'json', '--confirmed-other-domain': 'confirmedOtherDomain', '--force': 'force', '--delete-key': 'deleteKey' };
const USAGE = `Usage: node connect.mjs <apps|preview|apply|key|verify|restore|status> [options]
  --app <${Object.keys(APPS).join('|')}>  --site <sourceId>  --base-url <https origin>
  --protocol <openai|openai-response|anthropic|gemini>  --model <exact model name>  [--group <token group>]
  apply: --yes [--plan-hash <from preview>]   restore: [--id <change id>] [--delete-key] [--force]
  [--home <test root>] [--platform win32|linux|darwin] [--json]`;
export function parseArgs(argv) {
  const [command, ...rest] = argv; const opts = {};
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (FLAGS[a]) { if (rest[i + 1] === undefined) fail('MISSING_VALUE', a); opts[FLAGS[a]] = rest[++i]; }
    else if (SWITCHES[a]) opts[SWITCHES[a]] = true;
    else fail('UNKNOWN_ARGUMENT', `${a}\n${USAGE}`);
  }
  if (opts.home && !isAbsolute(opts.home)) fail('HOME_MUST_BE_ABSOLUTE');
  if (opts.timeout) opts.timeout = Number(opts.timeout);
  return { command, opts };
}
function human(command, r) {
  if (command === 'preview' || command === 'apply') {
    const head = command === 'apply' ? (r.unchanged ? 'Already connected; nothing changed.' : `Connected. Backups: ${r.backups.join(', ') || 'none (new file)'}`) : `Preview for ${r.appName}: ${r.site} · ${r.model} · ${r.origin}`;
    return [head, ...r.changes.map((c) => `${c.action} ${c.path}\n${c.diff}`), ...r.notes.map((n) => `Note: ${n}`), ...(command === 'preview' ? [`plan-hash ${r.planHash}`] : []), ...r.steps.map((s) => `Next: ${s}`)].join('\n');
  }
  if (command === 'verify') return `${r.ok ? 'OK' : 'FAILED'} (${r.status ?? 'no response'}): ${r.message}`;
  if (command === 'key') return [...r.done, 'The key was not shown. Go back to the assistant and say it is done.'].join('\n');
  if (command === 'restore') return [`Undone: ${r.app} · ${r.site}`, ...r.results.map((x) => `${x.action} ${x.path}`), ...(r.keyKept ? [`The stored key is kept at ${r.keyKept}; delete it if you no longer need it.`] : [])].join('\n');
  return JSON.stringify(r, null, 2);
}
async function main(argv) {
  const { command, opts } = parseArgs(argv);
  let result;
  switch (command) {
    case 'apps': result = Object.entries(APPS).map(([id, a]) => ({ id, name: a.name, protocols: a.protocols })); break;
    case 'preview': result = publicPlan(await plan(opts)); break;
    case 'apply': result = await apply(opts); break;
    case 'key': {
      if (!opts.app || !opts.site) fail('MISSING_VALUE', '--app and --site');
      const key = await readHidden('API Key (hidden): ');
      result = await storeKey(opts, key); break;
    }
    case 'verify': result = await verify(opts); break;
    case 'restore': result = await restore(opts); break;
    case 'status': result = await status(opts); break;
    default: process.stdout.write(`${USAGE}\n`); process.exitCode = command ? 1 : 0; return;
  }
  process.stdout.write(`${opts.json ? JSON.stringify(result, null, 2) : human(command, result)}\n`);
  if (command === 'verify' && !result.ok) process.exitCode = 2;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main(process.argv.slice(2)).catch((error) => { process.stderr.write(`${error.code || 'ERROR'}: ${error.message}\n`); process.exitCode = 1; });
}
