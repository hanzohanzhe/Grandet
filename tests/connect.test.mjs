// SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import { chmod, mkdtemp, mkdir, readFile, writeFile, stat, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { plan, publicPlan, apply, storeKey, verify, restore } from '../skills/grandet-api-price-finder/scripts/connect.mjs';

const script = new URL('../skills/grandet-api-price-finder/scripts/connect.mjs', import.meta.url).pathname;
const mcp = new URL('../skills/grandet-api-price-finder/scripts/connect-mcp.mjs', import.meta.url).pathname;
const home = () => mkdtemp(join(tmpdir(), 'grandet-connect-'));
const base = (h, app, extra = {}) => ({ app, site: 'apijing.com', baseUrl: 'https://apijing.com', model: 'claude-sonnet-4-6', group: 'claudecode带缓存', home: h, platform: 'linux', ...extra });
const read = async (p) => (await readFile(p)).toString('utf8');
const KEY = 'sk-test-0123456789abcdef';
const POSIX = process.platform !== 'win32';
const mode = async (p) => (await stat(p)).mode & 0o777;

test('codex: preview, apply, key, restore keep other settings byte-exact', async () => {
  const h = await home(); await mkdir(join(h, '.codex'), { recursive: true });
  const original = 'model = "gpt-6"\napproval_policy = "on-request"\n\n[mcp_servers.x]\ncommand = "x"\n';
  await writeFile(join(h, '.codex/config.toml'), original);
  await writeFile(join(h, '.bashrc'), '# mine\n');
  const opts = base(h, 'codex', { protocol: 'openai-response' });
  const preview = publicPlan(await plan(opts));
  assert.equal(preview.changes.length, 1); assert.match(preview.changes[0].diff, /model_provider = "grandet-apijing-com"/);
  await assert.rejects(apply(opts), { code: 'CONFIRMATION_REQUIRED' });
  const done = await apply({ ...opts, yes: true, planHash: preview.planHash });
  const text = await read(join(h, '.codex/config.toml'));
  assert.match(text, /^model = "claude-sonnet-4-6"$/m); assert.match(text, /^approval_policy = "on-request"$/m);
  assert.match(text, /\[mcp_servers\.x\]\ncommand = "x"/); assert.match(text, /\[model_providers\.grandet-apijing-com\]\nname = "apijing\.com \(Grandet\)"\nbase_url = "https:\/\/apijing\.com\/v1"\nwire_api = "responses"\nenv_key = "GRANDET_APIJING_COM_KEY"/);
  assert.equal(done.backups.length, 1);
  assert.equal((await apply({ ...opts, yes: true })).unchanged, true);
  await storeKey(opts, KEY);
  assert.equal(await read(join(h, '.grandet/keys/apijing.com')), KEY);
  assert.equal(((await stat(join(h, '.grandet/keys/apijing.com'))).mode & 0o777), 0o600);
  assert.match(await read(join(h, '.bashrc')), /export GRANDET_APIJING_COM_KEY=".*"  # grandet:apijing\.com/);
  assert.doesNotMatch(JSON.stringify(publicPlan(await plan(opts))), new RegExp(KEY));
  const undo = await restore({ home: h });
  assert.equal(await read(join(h, '.codex/config.toml')), original);
  assert.equal(await read(join(h, '.bashrc')), '# mine\n');
  assert.ok(undo.keyKept);
  await assert.rejects(restore({ home: h }), { code: 'NOTHING_TO_RESTORE' });
});

test('codex key and undo: a profile Grandet created is removed, others come back byte-exact, re-running key keeps one line', async () => {
  const fresh = await home(); const opts = base(fresh, 'codex');
  await apply({ ...opts, yes: true });
  await storeKey(opts, KEY);
  assert.equal(await read(join(fresh, '.profile')), `export GRANDET_APIJING_COM_KEY="$(cat '${join(fresh, '.grandet/keys/apijing.com')}')"  # grandet:apijing.com\n`);
  await storeKey(opts, KEY);
  assert.equal((await read(join(fresh, '.profile'))).split('\n').filter((l) => l.includes('grandet:apijing.com')).length, 1);
  await restore({ home: fresh });
  await assert.rejects(stat(join(fresh, '.profile')), 'a profile file created by Grandet is removed');
  await assert.rejects(stat(join(fresh, '.codex/config.toml')));
  const kept = await home(); await writeFile(join(kept, '.bashrc'), 'alias ll="ls -l"');
  const o2 = base(kept, 'codex');
  await apply({ ...o2, yes: true }); await storeKey(o2, KEY);
  await writeFile(join(kept, '.zshrc'), '# zsh\n');
  await restore({ home: kept });
  assert.equal(await read(join(kept, '.bashrc')), 'alias ll="ls -l"', 'no trailing newline added or left behind');
  assert.equal(await read(join(kept, '.zshrc')), '# zsh\n');
});

test('preview gives the exact key command with this script path', async () => {
  const h = await home(); const p = publicPlan(await plan(base(h, 'opencode', { protocol: 'openai' })));
  assert.equal(p.keyCommand, `node "${script}" key --app opencode --site apijing.com --home "${h}"`);
  assert.ok(p.steps.some((x) => x.includes(p.keyCommand)));
});

test('codex refuses protocols it cannot use and multi-line TOML', async () => {
  const h = await home();
  await assert.rejects(plan(base(h, 'codex', { protocol: 'anthropic' })), { code: 'PROTOCOL_NOT_SUPPORTED_BY_APP' });
  await mkdir(join(h, '.codex'), { recursive: true }); await writeFile(join(h, '.codex/config.toml'), 'x = """\na\n"""\n');
  await assert.rejects(plan(base(h, 'codex')), { code: 'COMPLEX_TOML' });
});

test('claude-code: merge settings, drop conflicting key, undo restores them', async () => {
  const h = await home(); await mkdir(join(h, '.claude'), { recursive: true });
  const original = `${JSON.stringify({ permissions: { allow: ['Bash(ls)'] }, env: { ANTHROPIC_API_KEY: 'old', FOO: '1' } }, null, 2)}\n`;
  await writeFile(join(h, '.claude/settings.json'), original);
  const opts = base(h, 'claude-code', { protocol: 'anthropic' });
  const p = publicPlan(await plan(opts));
  assert.match(p.notes.join(' '), /ANTHROPIC_API_KEY/);
  await apply({ ...opts, yes: true });
  const s = JSON.parse(await read(join(h, '.claude/settings.json')));
  assert.deepEqual(s.permissions, { allow: ['Bash(ls)'] }); assert.equal(s.env.FOO, '1'); assert.equal(s.env.ANTHROPIC_API_KEY, undefined);
  assert.equal(s.env.ANTHROPIC_BASE_URL, 'https://apijing.com'); assert.equal(s.env.ANTHROPIC_MODEL, 'claude-sonnet-4-6');
  assert.equal(s.apiKeyHelper, `cat '${join(h, '.grandet/keys/apijing.com')}'`);
  await restore({ home: h, app: 'claude-code' });
  assert.equal(await read(join(h, '.claude/settings.json')), original);
});

test('claude-code: a new settings file is removed again on undo; invalid JSON is refused', async () => {
  const h = await home(); const opts = base(h, 'claude-code');
  await apply({ ...opts, yes: true });
  await restore({ home: h });
  await assert.rejects(stat(join(h, '.claude/settings.json')));
  await mkdir(join(h, '.claude'), { recursive: true }); await writeFile(join(h, '.claude/settings.json'), '{ broken');
  await assert.rejects(plan(opts), { code: 'INVALID_JSON' });
});

test('opencode and kilo: provider uses a file reference, comments are refused', async () => {
  const h = await home(); await mkdir(join(h, '.config/opencode'), { recursive: true });
  await writeFile(join(h, '.config/opencode/opencode.json'), '{"theme":"x","provider":{"other":{"npm":"y"}}}\n');
  const opts = base(h, 'opencode', { protocol: 'openai', model: 'gpt-6.1-sol' });
  await apply({ ...opts, yes: true });
  const c = JSON.parse(await read(join(h, '.config/opencode/opencode.json')));
  assert.equal(c.theme, 'x'); assert.ok(c.provider.other); assert.equal(c.model, 'grandet-apijing-com/gpt-6.1-sol');
  assert.equal(c.provider['grandet-apijing-com'].options.apiKey, `{file:${join(h, '.grandet/keys/apijing.com')}}`);
  assert.equal(c.provider['grandet-apijing-com'].npm, '@ai-sdk/openai-compatible');
  const k = await home(); await mkdir(join(k, '.config/kilo'), { recursive: true });
  await writeFile(join(k, '.config/kilo/kilo.jsonc'), '{\n  // mine\n  "theme": "x"\n}\n');
  await assert.rejects(plan(base(k, 'kilo-code', { protocol: 'openai' })), { code: 'COMMENTS_PRESENT' });
  const k2 = await home();
  const r = await apply({ ...base(k2, 'kilo', { protocol: 'openai-response' }), yes: true });
  assert.equal(r.changes[0].path, join(k2, '.config/kilo/kilo.jsonc'));
  assert.equal(JSON.parse(await read(r.changes[0].path)).provider['grandet-apijing-com'].npm, '@ai-sdk/openai');
});

test('continue: inserts first model, key fills placeholder, undo is byte-exact', async () => {
  const h = await home(); await mkdir(join(h, '.continue'), { recursive: true });
  const original = 'name: Mine\nversion: 1.0.0\nschema: v1\nmodels:\n  - name: Local\n    provider: ollama\n    model: llama\ncontext:\n  - provider: code\n';
  await writeFile(join(h, '.continue/config.yaml'), original);
  const opts = base(h, 'continue', { protocol: 'openai', model: 'deepseek-v4' });
  await apply({ ...opts, yes: true });
  const y = await read(join(h, '.continue/config.yaml'));
  assert.match(y, /models:\n  # grandet:apijing\.com begin\n  - name: "apijing\.com deepseek-v4"\n    provider: openai\n    model: "deepseek-v4"\n    apiBase: "https:\/\/apijing\.com\/v1"\n    apiKey: GRANDET_KEY_PLACEHOLDER\n  # grandet:apijing\.com end\n  - name: Local/);
  await storeKey(opts, KEY);
  assert.match(await read(join(h, '.continue/config.yaml')), new RegExp(`apiKey: ${KEY}`));
  if (POSIX) assert.equal(await mode(join(h, '.continue/config.yaml')), 0o600, 'a config holding the key is readable by its owner only');
  const again = publicPlan(await plan(opts));
  assert.equal(again.changes.length, 0, 're-applying keeps the stored key');
  await restore({ home: h });
  assert.equal(await read(join(h, '.continue/config.yaml')), original);
});

test('gemini-cli: dotenv block, key, undo', async () => {
  const h = await home(); await writeFile(join(h, '.env'), 'OTHER=1\n');
  const opts = base(h, 'gemini-cli', { protocol: 'gemini', model: 'gemini-3.8-flash' });
  await assert.rejects(storeKey(opts, KEY), { code: 'NOT_CONNECTED_YET' });
  await apply({ ...opts, yes: true });
  await storeKey(opts, KEY);
  const e = await read(join(h, '.env'));
  assert.match(e, /^OTHER=1\n\n# grandet:apijing\.com begin\nGOOGLE_GEMINI_BASE_URL=https:\/\/apijing\.com\nGEMINI_MODEL=gemini-3\.8-flash\nGEMINI_API_KEY=sk-test/);
  if (POSIX) assert.equal(await mode(join(h, '.env')), 0o600, 'a config holding the key is readable by its owner only');
  await restore({ home: h });
  assert.equal(await read(join(h, '.env')), 'OTHER=1\n');
});

test('apply, key and undo keep the permissions of a locked-down config', { skip: !POSIX && 'POSIX modes only' }, async () => {
  const h = await home(); await writeFile(join(h, '.env'), 'OTHER_SECRET=1\n'); await chmod(join(h, '.env'), 0o600);
  const opts = base(h, 'gemini-cli', { protocol: 'gemini', model: 'gemini-3.8-flash' });
  await apply({ ...opts, yes: true });
  assert.equal(await mode(join(h, '.env')), 0o600, 'apply does not widen it');
  await storeKey(opts, KEY);
  assert.equal(await mode(join(h, '.env')), 0o600);
  await restore({ home: h });
  assert.equal(await mode(join(h, '.env')), 0o600, 'undo does not widen it');
  const c = await home(); await mkdir(join(c, '.continue'), { recursive: true });
  await writeFile(join(c, '.continue/config.yaml'), 'name: Mine\nversion: 1.0.0\nschema: v1\nmodels:\n  - name: Local\n    provider: ollama\n    model: llama\n'); await chmod(join(c, '.continue/config.yaml'), 0o644);
  const co = base(c, 'continue', { protocol: 'openai', model: 'deepseek-v4' });
  await apply({ ...co, yes: true }); await storeKey(co, KEY);
  assert.equal(await mode(join(c, '.continue/config.yaml')), 0o600);
  await restore({ home: c });
  assert.equal(await mode(join(c, '.continue/config.yaml')), 0o644, 'undo puts back the mode the user had');
});

test('claude-code preview hides an existing token in the diff', async () => {
  const h = await home(); await mkdir(join(h, '.claude'), { recursive: true });
  await writeFile(join(h, '.claude/settings.json'), `${JSON.stringify({ env: { ANTHROPIC_AUTH_TOKEN: KEY, ANTHROPIC_BASE_URL: 'https://old.example' } }, null, 2)}\n`);
  const preview = publicPlan(await plan(base(h, 'claude-code', { protocol: 'anthropic' })));
  assert.doesNotMatch(JSON.stringify(preview), new RegExp(KEY));
  assert.match(preview.changes[0].diff, /"ANTHROPIC_AUTH_TOKEN": "<hidden>"/);
  const one = await home(); await mkdir(join(one, '.config/opencode'), { recursive: true });
  await writeFile(join(one, '.config/opencode/opencode.json'), JSON.stringify({ provider: { x: { options: { apiKey: KEY, headers: { Authorization: `Bearer ${KEY}` } } } } }));
  const minified = publicPlan(await plan(base(one, 'opencode', { protocol: 'openai' })));
  assert.doesNotMatch(JSON.stringify(minified), new RegExp(KEY), 'a key inside a one-line JSON file is hidden too');
  assert.match(minified.changes[0].diff, /"apiKey": "\{file:/, 'the Grandet file reference stays visible');
});

test('hermes: named provider with key_cmd, other settings kept, undo is byte-exact', async () => {
  const h = await home(); await mkdir(join(h, '.hermes'), { recursive: true });
  const original = 'model:\n  default: old-model\n  provider: custom\n  base_url: http://localhost:8000/v1\n  api_key: sk-old-9999\nproviders:\n  local:\n    api: http://localhost:8080/v1\nagent:\n  max_turns: 40\n';
  await writeFile(join(h, '.hermes/config.yaml'), original);
  const opts = base(h, 'hermes', { protocol: 'openai' });
  const preview = publicPlan(await plan(opts));
  assert.doesNotMatch(JSON.stringify(preview), /sk-old-9999/);
  assert.ok(preview.notes.some((n) => /model\.base_url, model\.api_key/.test(n)));
  await apply({ ...opts, yes: true, planHash: preview.planHash });
  const text = await read(join(h, '.hermes/config.yaml'));
  const keyFile = join(h, '.grandet/keys/apijing.com');
  assert.equal(text, `model:\n  default: "claude-sonnet-4-6"\n  provider: "custom:grandet-apijing-com"\nproviders:\n  # grandet:apijing.com begin\n  grandet-apijing-com:\n    api: "https://apijing.com/v1"\n    key_cmd: "cat '${keyFile}'"\n    transport: chat_completions\n    default_model: "claude-sonnet-4-6"\n  # grandet:apijing.com end\n  local:\n    api: http://localhost:8080/v1\nagent:\n  max_turns: 40\n`);
  assert.equal((await apply({ ...opts, yes: true })).unchanged, true);
  await storeKey(opts, KEY);
  assert.doesNotMatch(await read(join(h, '.hermes/config.yaml')), new RegExp(KEY));
  await restore({ home: h });
  assert.equal(await read(join(h, '.hermes/config.yaml')), original);
});

test('hermes: new file, anthropic and responses transports, Windows key_env, refuses complex YAML', async () => {
  const h = await home();
  await apply({ ...base(h, 'hermes', { protocol: 'anthropic' }), yes: true });
  const text = await read(join(h, '.hermes/config.yaml'));
  assert.match(text, /api: "https:\/\/apijing\.com"\n/); assert.match(text, /transport: anthropic_messages/);
  assert.match(text, /^model:\n  default: "claude-sonnet-4-6"\n  provider: "custom:grandet-apijing-com"\n$/m);
  assert.match(publicPlan(await plan(base(h, 'hermes', { protocol: 'openai-response' }))).changes[0].diff, /transport: codex_responses/);
  const w = await home();
  const win = publicPlan(await plan(base(w, 'hermes', { platform: 'win32' })));
  assert.equal(win.changes[0].path, join(w, 'AppData', 'Local', 'hermes', 'config.yaml'));
  assert.match(win.changes[0].diff, /key_env: GRANDET_APIJING_COM_KEY/);
  await assert.rejects(plan(base(h, 'hermes', { protocol: 'gemini' })), { code: 'PROTOCOL_NOT_SUPPORTED_BY_APP' });
  for (const bad of ['providers: {local: {api: x}}\n', 'model:\n\tdefault: x\n', 'model:\n  default: >\n    long\n', 'providers:\n  grandet-apijing-com:\n    api: mine\n', 'model: [a, b]\n']) {
    const c = await home(); await mkdir(join(c, '.hermes'), { recursive: true }); await writeFile(join(c, '.hermes/config.yaml'), bad);
    await assert.rejects(plan(base(c, 'hermes')), { code: 'COMPLEX_YAML' }, bad);
  }
  const one = await home(); await mkdir(join(one, '.hermes'), { recursive: true }); await writeFile(join(one, '.hermes/config.yaml'), 'model: gpt-5\n');
  assert.match(await (async () => { await apply({ ...base(one, 'hermes'), yes: true }); return read(join(one, '.hermes/config.yaml')); })(), /^model:\n  default: "claude-sonnet-4-6"\n  provider: "custom:grandet-apijing-com"$/m);
});

test('openclaw: provider with a file SecretRef, key never in openclaw.json, undo is byte-exact', async () => {
  const h = await home(); await mkdir(join(h, '.openclaw'), { recursive: true });
  const original = `${JSON.stringify({ gateway: { port: 18789 }, agents: { defaults: { workspace: '~/w', model: { primary: 'openai/gpt-6', fallbacks: ['x/y'] } } }, models: { providers: { moonshot: { baseUrl: 'https://api.moonshot.ai/v1', apiKey: 'sk-moon-1111', api: 'openai-completions', models: [] } } } }, null, 2)}\n`;
  await writeFile(join(h, '.openclaw/openclaw.json'), original);
  const opts = base(h, 'openclaw', { protocol: 'openai' });
  const preview = publicPlan(await plan(opts));
  assert.doesNotMatch(JSON.stringify(preview), /sk-moon-1111/);
  await apply({ ...opts, yes: true, planHash: preview.planHash });
  const cfg = JSON.parse(await read(join(h, '.openclaw/openclaw.json')));
  const keyFile = join(h, '.grandet/keys/apijing.com');
  assert.deepEqual(cfg.secrets.providers['grandet-apijing-com'], { source: 'file', path: keyFile, mode: 'singleValue' });
  assert.deepEqual(cfg.models.providers['grandet-apijing-com'], { baseUrl: 'https://apijing.com/v1', apiKey: { source: 'file', provider: 'grandet-apijing-com', id: 'value' }, api: 'openai-completions', models: [{ id: 'claude-sonnet-4-6', name: 'claude-sonnet-4-6' }] });
  assert.equal(cfg.models.mode, 'merge'); assert.equal(cfg.models.providers.moonshot.apiKey, 'sk-moon-1111');
  assert.deepEqual(cfg.agents.defaults.model, { primary: 'grandet-apijing-com/claude-sonnet-4-6', fallbacks: ['x/y'] });
  assert.equal(cfg.agents.defaults.workspace, '~/w'); assert.equal(cfg.gateway.port, 18789);
  await storeKey(opts, KEY);
  assert.doesNotMatch(await read(join(h, '.openclaw/openclaw.json')), new RegExp(KEY));
  assert.equal(await read(keyFile), KEY);
  assert.equal((await apply({ ...opts, yes: true })).unchanged, true);
  await restore({ home: h });
  assert.equal(await read(join(h, '.openclaw/openclaw.json')), original);
});

test('openclaw: anthropic proxy, JSON5 and comments are refused', async () => {
  const h = await home();
  await apply({ ...base(h, 'openclaw', { protocol: 'anthropic' }), yes: true });
  const cfg = JSON.parse(await read(join(h, '.openclaw/openclaw.json')));
  assert.equal(cfg.models.providers['grandet-apijing-com'].api, 'anthropic-messages');
  assert.equal(cfg.models.providers['grandet-apijing-com'].baseUrl, 'https://apijing.com');
  for (const [bad, code] of [['{ models: { mode: "merge" } }\n', 'INVALID_JSON'], ['{\n  // mine\n  "a": 1\n}\n', 'COMMENTS_PRESENT']]) {
    const c = await home(); await mkdir(join(c, '.openclaw'), { recursive: true }); await writeFile(join(c, '.openclaw/openclaw.json'), bad);
    await assert.rejects(plan(base(c, 'openclaw')), { code }, bad);
  }
  await assert.rejects(plan(base(h, 'openclaw', { protocol: 'openai-response' })), { code: 'PROTOCOL_NOT_SUPPORTED_BY_APP' });
});

test('address guard: other domain needs confirmation, http only on loopback, /v1 is stripped', async () => {
  const h = await home();
  await assert.rejects(plan(base(h, 'codex', { baseUrl: 'https://api.other.com' })), { code: 'BASE_URL_OTHER_DOMAIN' });
  assert.equal((await plan(base(h, 'codex', { baseUrl: 'https://api.other.com', confirmedOtherDomain: true }))).o.origin, 'https://api.other.com');
  await assert.rejects(plan(base(h, 'codex', { baseUrl: 'http://apijing.com' })), { code: 'BASE_URL_NOT_HTTPS' });
  assert.equal((await plan(base(h, 'codex', { baseUrl: 'https://api.apijing.com/v1/' }))).o.origin, 'https://api.apijing.com');
  await assert.rejects(plan(base(h, 'codex', { model: 'bad model; rm' })), { code: 'INVALID_MODEL' });
});

test('restore refuses when the user edited the file after apply', async () => {
  const h = await home(); const opts = base(h, 'claude-code');
  await apply({ ...opts, yes: true });
  await writeFile(join(h, '.claude/settings.json'), '{"changed":true}\n');
  await assert.rejects(restore({ home: h }), { code: 'CHANGED_SINCE_APPLY' });
  await restore({ home: h, force: true });
});

test('verify: free model list check, key rejection, redirect refusal, missing key', async () => {
  const seen = [];
  const server = createServer((req, res) => {
    seen.push({ url: req.url, auth: req.headers.authorization });
    if (req.headers.authorization !== `Bearer ${KEY}`) { res.writeHead(401).end('{}'); return; }
    if (req.url === '/redir/v1/models') { res.writeHead(302, { Location: 'https://evil.example/' }).end(); return; }
    res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ data: [{ id: 'claude-sonnet-4-6' }, { id: 'x' }] }));
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;
  try {
    const h = await home(); const opts = base(h, 'claude-code', { baseUrl: `http://127.0.0.1:${port}` });
    await assert.rejects(verify(opts), { code: 'KEY_NOT_STORED' });
    await storeKey(opts, KEY);
    const ok = await verify(opts);
    assert.equal(ok.ok, true); assert.equal(ok.reason, 'MODEL_LISTED'); assert.equal(seen.at(-1).url, '/v1/models');
    assert.doesNotMatch(JSON.stringify(ok), new RegExp(KEY));
    assert.equal((await verify({ ...opts, model: 'other-model' })).reason, 'MODEL_NOT_LISTED');
    assert.equal((await verify({ ...opts, baseUrl: `http://127.0.0.1:${port}/redir` })).reason, 'REDIRECT_REFUSED');
    await storeKey(opts, 'sk-wrong-key');
    assert.equal((await verify(opts)).reason, 'KEY_REJECTED');
  } finally { server.close(); }
});

const run = (args, input) => new Promise((resolve) => {
  const child = spawn(process.execPath, [script, ...args], { stdio: ['pipe', 'pipe', 'pipe'] });
  let out = '', err = ''; child.stdout.on('data', (d) => (out += d)); child.stderr.on('data', (d) => (err += d));
  child.on('close', (code) => resolve({ code, out, err })); child.stdin.end(input ?? '');
});

test('CLI: preview, apply with plan hash, key from stdin, restore; the key never appears in output', async () => {
  const h = await home(); const common = ['--app', 'codex', '--site', 'apijing.com', '--base-url', 'https://apijing.com', '--model', 'gpt-6.1-sol', '--home', h, '--platform', 'linux'];
  const preview = JSON.parse((await run(['preview', ...common, '--json'])).out);
  const applied = await run(['apply', ...common, '--yes', '--plan-hash', preview.planHash]);
  assert.equal(applied.code, 0, applied.err); assert.match(applied.out, /Connected/);
  const key = await run(['key', '--app', 'codex', '--site', 'apijing.com', '--home', h, '--platform', 'linux'], `${KEY}\n`);
  assert.equal(key.code, 0, key.err); assert.doesNotMatch(key.out + key.err, new RegExp(KEY));
  const wrong = await run(['apply', ...common, '--yes', '--plan-hash', 'stale']);
  assert.notEqual(wrong.code, 0); assert.match(wrong.err, /PLAN_CHANGED/);
  const undo = await run(['restore', '--home', h, '--delete-key', '--json']);
  assert.equal(undo.code, 0, undo.err); assert.ok(JSON.parse(undo.out).results.some((r) => r.action === 'key-deleted'));
  assert.equal((await readdir(join(h, '.grandet/keys'))).length, 0);
  assert.match((await run(['bogus-flag-test', '--nope'])).err, /UNKNOWN_ARGUMENT/);
});

test('codex and opencode: preview says the default model changes, undo brings the old default back', async () => {
  const h = await home(); await mkdir(join(h, '.codex'), { recursive: true });
  await writeFile(join(h, '.codex/config.toml'), 'model = "gpt-6"\n');
  const opts = base(h, 'codex', { protocol: 'openai-response' });
  const p = publicPlan(await plan(opts));
  assert.deepEqual(p.defaultModel, { from: 'gpt-6', to: 'claude-sonnet-4-6 (grandet-apijing-com)' });
  assert.equal(p.notes[0], 'Will change the default model from gpt-6 to claude-sonnet-4-6 (grandet-apijing-com); undo restores gpt-6');
  await apply({ ...opts, yes: true, planHash: p.planHash });
  assert.equal((await apply({ ...opts, yes: true })).defaultModel, null, 'a second apply changes nothing');
  const undo = await restore({ home: h });
  assert.equal(undo.results.find((r) => r.action === 'default-model-restored').model, 'gpt-6');
  assert.equal(await read(join(h, '.codex/config.toml')), 'model = "gpt-6"\n');

  const o = await home(); const oc = base(o, 'opencode', { protocol: 'openai' });
  assert.equal(publicPlan(await plan(oc)).notes[0], 'Will set grandet-apijing-com/claude-sonnet-4-6 as the default model; undo removes it');
  await mkdir(join(o, '.config/opencode'), { recursive: true });
  await writeFile(join(o, '.config/opencode/opencode.jsonc'), '{"model":"anthropic/claude-haiku-4-5"}\n');
  const p2 = publicPlan(await plan(oc));
  assert.equal(p2.changes[0].path, join(o, '.config/opencode/opencode.jsonc'));
  assert.deepEqual(p2.defaultModel, { from: 'anthropic/claude-haiku-4-5', to: 'grandet-apijing-com/claude-sonnet-4-6' });
  await apply({ ...oc, yes: true });
  const cli = await run(['restore', '--home', o]);
  assert.equal(cli.code, 0, cli.err); assert.match(cli.out, /^Default model back to anthropic\/claude-haiku-4-5$/m);
  assert.equal(await read(join(o, '.config/opencode/opencode.jsonc')), '{"model":"anthropic/claude-haiku-4-5"}\n');
  assert.equal(publicPlan(await plan(base(o, 'claude-code'))).defaultModel, null, 'only Codex, OpenCode and Kilo Code report it');
});

test('MCP: lists four tools and previews without writing', async () => {
  const h = await home();
  const child = spawn(process.execPath, [mcp], { stdio: ['pipe', 'pipe', 'pipe'] });
  const replies = []; let buffer = '';
  child.stdout.on('data', (d) => { buffer += d; let i; while ((i = buffer.indexOf('\n')) >= 0) { replies.push(JSON.parse(buffer.slice(0, i))); buffer = buffer.slice(i + 1); } });
  const send = (m) => child.stdin.write(`${JSON.stringify(m)}\n`);
  const wait = async (id) => { for (let t = 0; t < 200; t++) { const r = replies.find((x) => x.id === id); if (r) return r; await new Promise((r2) => setTimeout(r2, 10)); } throw new Error(`no reply ${id}`); };
  send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 't', version: '1' } } });
  assert.equal((await wait(1)).result.serverInfo.name, 'grandet-connect');
  send({ jsonrpc: '2.0', method: 'notifications/initialized' });
  send({ jsonrpc: '2.0', id: 2, method: 'tools/list' });
  assert.deepEqual((await wait(2)).result.tools.map((t) => t.name), ['grandet_connect_preview', 'grandet_connect_apply', 'grandet_connect_verify', 'grandet_connect_restore']);
  send({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'grandet_connect_preview', arguments: { app: 'codex', site: 'apijing.com', baseUrl: 'https://apijing.com', model: 'gpt-6.1-sol', home: h } } });
  const r = await wait(3); assert.equal(r.result.isError, false); assert.match(r.result.content[0].text, /model_provider/);
  send({ jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'grandet_connect_apply', arguments: { app: 'codex', site: 'apijing.com', model: 'gpt-6.1-sol', home: h } } });
  const refused = await wait(4);
  assert.equal(refused.result.isError, true, 'apply without confirmed=true is refused');
  assert.match(refused.result.content[0].text, /confirmed: true/); assert.doesNotMatch(refused.result.content[0].text, /--yes/);
  await assert.rejects(stat(join(h, '.codex/config.toml')));
  child.stdin.end(); child.kill();
});
