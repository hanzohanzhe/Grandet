// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { cp, mkdtemp, readFile, readdir, rm, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test from 'node:test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const script = join(root, 'scripts/package-price-finder.mjs');
const run = (...args) => spawnSync(process.execPath, [script, ...args], { encoding: 'utf8', cwd: root });
const adapters = ['grok-bot', 'your-dot', 'muse'];
const commonPath = 'skills/grandet-api-price-finder';
const fixturePaths = ['scripts/package-price-finder.mjs', 'scripts/check-build-id.mjs', 'scripts/installation-receipts.mjs','scripts/installation-receipts-source-build.json','scripts/verify-installation.py','docs/skills/installation-receipts.md','docs/skills/installation-routes.json', 'scripts/install-price-finder.mjs', 'LICENSES/Apache-2.0.txt', 'docs/skills/QUICKSTART.md', 'docs/skills/INSTALL.md', 'docs/skills/application-distribution.generated.json', 'docs/skills/chat-adapters', commonPath, 'plugins/grandet-api-price-finder'];
async function copySource(fixture) {
  for (const path of fixturePaths) {
    await mkdir(dirname(join(fixture, path)), { recursive: true });
    await cp(join(root, path), join(fixture, path), { recursive: true });
  }
}
async function workspace(t) {
  const parent = tmpdir();
  const directory = await mkdtemp(join(parent, 'grandet-package-test-'));
  t.after(async () => {
    const checked = relative(parent, directory);
    assert.ok(checked.startsWith('grandet-package-test-') && !checked.includes('..'));
    await rm(directory, { recursive: true, force: true });
  });
  return directory;
}
async function filesAt(directory, prefix = '') {
  const files = [];
  for (const entry of await readdir(join(directory, prefix), { withFileTypes: true })) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) files.push(...await filesAt(directory, path));
    else files.push(path);
  }
  return files.sort();
}

test('a portable package contains one complete skill and working host manifest references', async (t) => {
  const directory = await workspace(t);
  const out = join(directory, 'plugin');
  const result = run('--out', out);
  assert.equal(result.status, 0, result.stderr);
  const files = await filesAt(out);
  assert.deepEqual(files.filter((file) => file.endsWith('/SKILL.md')), ['skills/grandet-api-price-finder/SKILL.md']);
  const distribution = JSON.parse(await readFile(join(out, 'application-distribution.json'), 'utf8'));
  const receipt = JSON.parse(await readFile(join(out, 'package-manifest.json'), 'utf8'));
  const manifests = new Set(distribution.entries.flatMap((entry) => entry.resources.packageManifests));
  assert.ok(manifests.size > 0);
  for (const resource of manifests) {
    const manifest = JSON.parse(await readFile(join(out, receipt.resourceTargets[resource]), 'utf8'));
    assert.equal(manifest.name, 'grandet-api-price-finder');
    assert.equal(manifest.version, '0.3.0');
    assert.equal(manifest.license, 'Apache-2.0');
    const skillDirectory = manifest.skills ?? './skills/';
    assert.ok((await readdir(resolve(out, skillDirectory))).includes('grandet-api-price-finder'));
    const mcp = JSON.parse(await readFile(resolve(out, manifest.mcpServers ?? './.mcp.json'), 'utf8'));
    assert.equal(mcp.mcpServers.grandet.type, 'http');
    assert.equal(mcp.mcpServers.grandet.url, 'https://grandet.ai/mcp');
    assert.equal(mcp.mcpServers.grandet.headers, undefined);
  }
  const skill = await readFile(join(out, 'skills/grandet-api-price-finder/SKILL.md'), 'utf8');
  for (const match of skill.matchAll(/\]\((references\/[^)]+)\)/g)) {
    assert.ok((await readFile(join(out, 'skills/grandet-api-price-finder', match[1]))).length > 0);
  }
  const catalogPath = 'skills/grandet-api-price-finder/references/app-catalog.md';
  assert.ok(files.includes(catalogPath), 'The generated application reference ships with every host package');
  assert.deepEqual(await readFile(join(out, catalogPath)), await readFile(join(root, catalogPath)));
  for (const entry of distribution.entries) {
    for (const resource of [...entry.resources.packageManifests, entry.resources.mcpConfiguration].filter(Boolean)) {
      assert.ok(files.includes(receipt.resourceTargets[resource]), `${entry.appId}: ${resource}`);
    }
    assert.equal(entry.validation, 'NOT_RUN', 'Packaging cannot certify installed entrypoint use');
  }
  assert.equal(receipt.distributionManifest, 'application-distribution.json');
});

test('the package includes only audited files with hashes matching every shipped byte', async (t) => {
  const directory = await workspace(t);
  const out = join(directory, 'plugin');
  const result = run('--out', out);
  assert.equal(result.status, 0, result.stderr);
  const receipt = JSON.parse(await readFile(join(out, 'package-manifest.json'), 'utf8'));
  const files = (await filesAt(out)).filter((file) => file !== 'package-manifest.json');
  assert.deepEqual(Object.keys(receipt.files).sort(), files);
  assert.equal(receipt.schema, 'grandet-price-finder-package/v1');
  for (const file of files) {
    assert.ok(['LICENSE', 'README.md', 'INSTALL.md', 'application-distribution.json', 'install/chatgpt-editor.md', 'scripts/install-price-finder.mjs', 'scripts/installation-receipts.mjs','scripts/installation-receipts-source-build.json','scripts/verify-installation.py','installation-receipts.md','installation-routes.json','installation-receipts-source-build.json', ...adapters.map((app) => `adapters/${app}.md`), ...Object.values(receipt.resourceTargets)].includes(file) || /^skills\/grandet-api-price-finder\/(?:SKILL\.md|agents\/openai\.yaml|references\/[a-z-]+\.md|scripts\/verify-installation\.py|scripts\/connect(?:-mcp)?\.mjs|scripts\/offline-lookup\.mjs|data\/price-snapshot\.json)$/.test(file));
    assert.equal(createHash('sha256').update(await readFile(join(out, file))).digest('hex'), receipt.files[file]);
  }
});

test('three chat onboarding documents embed the complete common instructions and linked references', async (t) => {
  const directory = await workspace(t);
  const out = join(directory, 'plugin');
  const result = run('--out', out);
  assert.equal(result.status, 0, result.stderr);
  const files = await filesAt(out);
  assert.deepEqual(files.filter((file) => file.startsWith('adapters/')), adapters.map((app) => `adapters/${app}.md`).sort());
  const receipt = JSON.parse(await readFile(join(out, 'package-manifest.json'), 'utf8'));
  const sources = files.filter((file) => file.startsWith(`${commonPath}/`) && file.endsWith('.md'));
  assert.ok(sources.length >= 7);
  for (const app of adapters) {
    const target = `adapters/${app}.md`;
    const document = await readFile(join(out, target), 'utf8');
    const metadata = receipt.chatAdapters.find((entry) => entry.id === app);
    assert.equal(metadata.path, target);
    assert.equal(metadata.version, '0.3.0');
    assert.equal(metadata.status, 'PUBLIC_PREVIEW');
    assert.equal(metadata.nativeUse, 'NOT_RUN');
    assert.ok(!Object.hasOwn(metadata, 'published'), 'Packaging does not decide publication status');
    assert.match(document, /0\.3\.0/);
    assert.match(document, /PUBLIC_PREVIEW/);
    assert.doesNotMatch(document, /INTERNAL_CANDIDATE|未发布|Not published/);
    assert.match(document, /NOT_RUN/);
    for (const source of sources) {
      const bytes = await readFile(join(root, source));
      assert.equal(metadata.sources[source], createHash('sha256').update(bytes).digest('hex'));
      // Only destinations change when standalone documents replace local links.
      const withoutDestinations = (value) => value.replace(/\]\([^)]+\)/g, ']()').replace(/\r\n/g, '\n').trim();
      assert.ok(withoutDestinations(document).includes(withoutDestinations(bytes.toString('utf8'))), `${app} must include all of ${source}`);
    }
    const template = `docs/skills/chat-adapters/${app}.md`;
    assert.equal(metadata.sources[template], createHash('sha256').update(await readFile(join(root, template))).digest('hex'));
    const anchors = new Set([...document.matchAll(/<a id="([^"]+)"><\/a>/g)].map((match) => match[1]));
    for (const match of document.matchAll(/\]\(([^)]+)\)/g)) {
      const destination = match[1];
      assert.ok(/^(?:[a-z][a-z\d+.-]*:|#)/i.test(destination), `${app} has a dangling relative link: ${destination}`);
      if (destination.startsWith('#')) assert.ok(anchors.has(destination.slice(1)), `${app} is missing anchor ${destination}`);
    }
    assert.equal(anchors.size, sources.length, 'Each common source is embedded only once');
  }
});

test('common source changes and a newly linked reference propagate to all three chat documents', async (t) => {
  const directory = await workspace(t);
  const fixture = join(directory, 'source');
  await copySource(fixture);
  const fixtureScript = join(fixture, 'scripts/package-price-finder.mjs');
  const before = join(directory, 'before');
  assert.equal(spawnSync(process.execPath, [fixtureScript, '--out', before], { encoding: 'utf8' }).status, 0);
  const skill = join(fixture, commonPath, 'SKILL.md');
  await writeFile(skill, `${await readFile(skill, 'utf8')}\nCOMMON_SOURCE_REVISION_2 [additional guidance](references/additional-guidance.md)\n`);
  const extra = `${commonPath}/references/additional-guidance.md`;
  await writeFile(join(fixture, extra), '# Additional guidance\nNEW_REFERENCE_CONTENT [back to skill](../SKILL.md)\n');
  const workload = join(fixture, commonPath, 'references/workloads.md');
  await writeFile(workload, `${await readFile(workload, 'utf8')}\nWORKLOAD_REVISION_2\n`);
  // Files outside the explicit adapter list and the linked Skill graph must stay private.
  await writeFile(join(fixture, 'docs/skills/chat-adapters/private-notes.md'), 'DO_NOT_EXPORT_PRIVATE_TEMPLATE');
  await writeFile(join(fixture, commonPath, 'references/private-notes.md'), 'DO_NOT_EXPORT_UNLINKED_REFERENCE');
  const after = join(directory, 'after');
  const result = spawnSync(process.execPath, [fixtureScript, '--out', after], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const receipt = JSON.parse(await readFile(join(after, 'package-manifest.json'), 'utf8'));
  assert.deepEqual(await readFile(join(after, extra)), await readFile(join(fixture, extra)));
  for (const app of adapters) {
    const target = `adapters/${app}.md`;
    const document = await readFile(join(after, target), 'utf8');
    assert.match(document, /COMMON_SOURCE_REVISION_2/);
    assert.match(document, /WORKLOAD_REVISION_2/);
    assert.match(document, /NEW_REFERENCE_CONTENT/);
    assert.doesNotMatch(document, /DO_NOT_EXPORT/);
    assert.equal(document.match(/NEW_REFERENCE_CONTENT/g).length, 1, 'A cyclic link does not duplicate content');
    assert.notDeepEqual(await readFile(join(before, target)), await readFile(join(after, target)));
    assert.equal(receipt.chatAdapters.find((entry) => entry.id === app).sources[extra], createHash('sha256').update(await readFile(join(fixture, extra))).digest('hex'));
  }
  assert.ok(!(await filesAt(after)).some((file) => file.includes('private-notes')));
});

test('a persistent editor document contains the same common skill and all references without local file dependencies', async (t) => {
  const directory = await workspace(t);
  const out = join(directory, 'plugin');
  const result = run('--out', out);
  assert.equal(result.status, 0, result.stderr);
  const document = await readFile(join(out, 'install/chatgpt-editor.md'), 'utf8');
  const skill = await readFile(join(root, commonPath, 'SKILL.md'), 'utf8');
  const frontmatter = skill.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/)[0];
  assert.ok(document.startsWith(frontmatter), 'Keep the common discovery metadata');
  const normalize = (value) => value.replace(/\]\([^)]+\)/g, ']()').replace(/\r\n/g, '\n').trim();
  assert.ok(normalize(document).includes(normalize(skill.slice(frontmatter.length))));
  const sources = (await filesAt(out)).filter((path) => path.startsWith(`${commonPath}/references/`) && path.endsWith('.md'));
  for (const source of sources) assert.ok(normalize(document).includes(normalize(await readFile(join(out, source), 'utf8'))), source);
  const anchors = new Set([...document.matchAll(/<a id="([^"]+)"><\/a>/g)].map((match) => match[1]));
  for (const match of document.matchAll(/\]\(([^)]+)\)/g)) {
    assert.ok(/^(?:[a-z][a-z\d+.-]*:|#)/i.test(match[1]), `Unresolved reference: ${match[1]}`);
    if (match[1].startsWith('#')) assert.ok(anchors.has(match[1].slice(1)));
  }
  const receipt = JSON.parse(await readFile(join(out, 'package-manifest.json'), 'utf8'));
  assert.equal(receipt.files['install/chatgpt-editor.md'], createHash('sha256').update(document).digest('hex'));
  assert.equal(receipt.version, '0.3.0');
});

test('standalone generation rejects a local reference outside the common Skill before any package write', async (t) => {
  const directory = await workspace(t);
  const fixture = join(directory, 'source');
  await copySource(fixture);
  const skill = join(fixture, commonPath, 'SKILL.md');
  await writeFile(skill, `${await readFile(skill, 'utf8')}\n[private file](../../../private.md)\n`);
  await writeFile(join(fixture, 'private.md'), 'PRIVATE_SOURCE');
  const out = join(directory, 'plugin');
  const result = spawnSync(process.execPath, [join(fixture, 'scripts/package-price-finder.mjs'), '--out', out], { encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /INVALID_SKILL_REFERENCE/);
  await assert.rejects(readdir(out), { code: 'ENOENT' });
});

test('packaging does not read home configuration or depend on personal settings', async (t) => {
  const directory = await workspace(t);
  const fakeProfile = join(directory, 'profile');
  await mkdir(fakeProfile);
  await writeFile(join(fakeProfile, 'config.json'), 'PRIVATE_PROFILE_NOT_AN_EXPORT');
  const guard = join(directory, 'guard.cjs');
  await writeFile(guard, `
    const fs = require('node:fs');
    const fsp = require('node:fs/promises');
    const path = require('node:path');
    const {syncBuiltinESMExports} = require('node:module');
    const forbidden = path.resolve(process.env.HOME);
    for (const api of [fs, fsp]) for (const name of ['readFile', 'readFileSync', 'readdir', 'readdirSync', 'open', 'openSync']) {
      if (!api[name]) continue;
      const original = api[name];
      api[name] = function(file, ...args) {
        if (typeof file === 'string' && (path.resolve(file) === forbidden || path.resolve(file).startsWith(forbidden + path.sep))) throw new Error('HOME_CONFIG_READ');
        return original.call(this, file, ...args);
      };
    }
    syncBuiltinESMExports();
  `);
  const guarded = join(directory, 'guarded');
  const result = spawnSync(process.execPath, ['--require', guard, script, '--out', guarded], {
    encoding: 'utf8', cwd: root,
    env: {...process.env, HOME: fakeProfile, USERPROFILE: fakeProfile, CODEX_HOME: fakeProfile, APPDATA: fakeProfile, LOCALAPPDATA: fakeProfile, XDG_CONFIG_HOME: fakeProfile},
  });
  assert.equal(result.status, 0, result.stderr);
  const ordinary = join(directory, 'ordinary');
  assert.equal(run('--out', ordinary).status, 0);
  for (const file of await filesAt(ordinary)) assert.deepEqual(await readFile(join(guarded, file)), await readFile(join(ordinary, file)));
});

test('the first page gives consumer installation steps without source-building prerequisites', async (t) => {
  const directory = await workspace(t);
  const out = join(directory, 'plugin');
  const result = run('--out', out);
  assert.equal(result.status, 0, result.stderr);
  const readme = await readFile(join(out, 'README.md'), 'utf8');
  assert.doesNotMatch(readme, /npm run|node --test|npm install|git clone/);
  assert.match(readme, /INSTALL\.md/);
  assert.match(readme, /帮我安装\s*Grandet/);
  assert.match(readme, /新会话|new (?:chat|conversation)/i);
});

test('source and exported installation documents resolve their local links in their respective layouts', async (t) => {
  const directory = await workspace(t);
  const out = join(directory, 'plugin');
  const result = run('--out', out);
  assert.equal(result.status, 0, result.stderr);
  for (const [source, target] of [['docs/skills/QUICKSTART.md', 'README.md'], ['docs/skills/INSTALL.md', 'INSTALL.md']]) {
    for (const path of [join(root, source), join(out, target)]) {
      const text = await readFile(path, 'utf8');
      for (const match of text.matchAll(/\]\(([^\s)]+)(?:[^)]*)\)/g)) {
        const destination = match[1].replace(/^<|>$/g, '').split('#')[0];
        if (!destination || /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(destination)) continue;
        assert.ok((await readFile(resolve(dirname(path), destination))).length > 0, `${path}: ${destination}`);
      }
    }
    const original = await readFile(join(root, source), 'utf8');
    const exported = await readFile(join(out, target), 'utf8');
    assert.equal(exported, original.replace(/\]\(\.\.\/\.\.\/skills\//g, '](skills/'));
  }
});

test('the repository INSTALL.md is the same page the package ships', async () => {
  const source = await readFile(join(root, 'docs/skills/INSTALL.md'), 'utf8');
  assert.equal(await readFile(join(root, 'INSTALL.md'), 'utf8'), source.replace(/\]\(\.\.\/\.\.\/skills\//g, '](skills/'));
});

test('source marketplaces never advertise an incomplete plugin template as installable', async () => {
  for (const file of ['.agents/plugins/marketplace.json', '.claude-plugin/marketplace.json']) {
    let text;
    try { text = await readFile(join(root, file), 'utf8'); }
    catch (error) { if (error.code === 'ENOENT') continue; throw error; }
    const marketplace = JSON.parse(text);
    for (const plugin of marketplace.plugins) {
      const pluginRoot = resolve(root, plugin.source.path);
      assert.ok((await filesAt(pluginRoot)).some((path) => /^skills\/[^/]+\/SKILL\.md$/.test(path)), `${file}: ${plugin.name} must contain a complete Skill before it is listed`);
    }
  }
});

test('adding a documented entrypoint requires only its generated resource declaration, not builder edits', async (t) => {
  const directory = await workspace(t);
  const fixture = join(directory, 'source');
  await copySource(fixture);
  const path = join(fixture, 'docs/skills/application-distribution.generated.json');
  const distribution = JSON.parse(await readFile(path, 'utf8'));
  const source = distribution.entries.find((entry) => entry.resources.packageManifests.length);
  const resource = 'plugins/grandet-api-price-finder/.example-plugin/plugin.json';
  await mkdir(dirname(join(fixture, resource)), { recursive: true });
  await cp(join(fixture, source.resources.packageManifests[0]), join(fixture, resource));
  distribution.entries.push({...source, appId: 'example-app', appName: 'Example app', id: 'example-skill-plugin', resources: {...source.resources, packageManifests: [resource]}});
  await writeFile(path, `${JSON.stringify(distribution)}\n`);
  const out = join(directory, 'plugin');
  const result = spawnSync(process.execPath, [join(fixture, 'scripts/package-price-finder.mjs'), '--out', out], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const receipt = JSON.parse(await readFile(join(out, 'package-manifest.json'), 'utf8'));
  assert.equal(receipt.resourceTargets[resource], '.example-plugin/plugin.json');
  assert.deepEqual(await readFile(join(out, receipt.resourceTargets[resource])), await readFile(join(fixture, resource)));
  assert.deepEqual((await filesAt(out)).filter((file) => file.endsWith('/SKILL.md')), ['skills/grandet-api-price-finder/SKILL.md']);
});

test('rebuilding the same source produces byte-identical manifests and payloads', async (t) => {
  const directory = await workspace(t);
  const first = join(directory, 'first');
  const second = join(directory, 'second');
  assert.equal(run('--out', first).status, 0);
  assert.equal(run('--out', second).status, 0);
  const files = await filesAt(first);
  assert.deepEqual(await filesAt(second), files);
  for (const file of files) assert.deepEqual(await readFile(join(first, file)), await readFile(join(second, file)));
});

test('an existing output is rejected without altering unrelated files', async (t) => {
  const directory = await workspace(t);
  const out = join(directory, 'existing');
  await mkdir(out);
  await writeFile(join(out, 'keep.txt'), 'user content');
  const result = run('--out', out);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /OUTPUT_EXISTS/);
  assert.equal(await readFile(join(out, 'keep.txt'), 'utf8'), 'user content');
  assert.deepEqual(await filesAt(out), ['keep.txt']);
});

test('source and source-parent destinations are rejected before writes', () => {
  for (const out of [root, dirname(root), join(root, 'skills/grandet-api-price-finder/export')]) {
    const result = run('--out', out);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /UNSAFE_OUTPUT/);
  }
});

test('missing or unknown arguments fail instead of writing a default package', () => {
  for (const args of [[], ['--out'], ['--unknown', 'value']]) {
    const result = run(...args);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Usage:/);
  }
});

test('packaged MCP examples are accepted by the actual registered tool schemas', async (t) => {
  try { await readFile(join(root, 'website/src/price-finder-mcp.ts')); }
  catch (error) {
    if (error.code !== 'ENOENT') throw error;
    t.skip('Website implementation and its MCP dependencies are maintained in the website repository');
    return;
  }
  const directory = await workspace(t);
  const out = join(directory, 'plugin');
  assert.equal(run('--out', out).status, 0);
  const reference = await readFile(join(out, 'skills/grandet-api-price-finder/references/http-fallback.md'), 'utf8');
  const examples = [...reference.matchAll(/```json\s*\n([\s\S]*?)\n```/g)].map((match) => JSON.parse(match[1])).filter((value) => value.tool && value.arguments);
  assert.deepEqual(examples.map((value) => value.tool).sort(), ['grandet_find_cheapest_api', 'grandet_list_apps', 'grandet_quote_evidence', 'grandet_resolve_model']);
  const probe = `
    import {Client} from '@modelcontextprotocol/sdk/client/index.js';
    import {StreamableHTTPClientTransport} from '@modelcontextprotocol/sdk/client/streamableHttp.js';
    import {createGrandetMcpHandler} from ${JSON.stringify(pathToFileURL(join(root, 'website/src/price-finder-mcp.ts')).href)};
    const examples = ${JSON.stringify(examples)};
    const calls = [];
    const query = async (url) => { calls.push(url.pathname); return {status:200,body:{boards:[],data:{items:[],providers:[]},pagination:{page:1,pages:1}}}; };
    const handle = createGrandetMcpHandler({boardQuery:query,catalogQuery:query,now:()=> '2026-10-12T12:00:00.000Z'});
    const client = new Client({name:'packaged-contract-test',version:'1.0.0'});
    const transport = new StreamableHTTPClientTransport(new URL('https://grandet.ai/mcp'), {fetch:async(input,init)=>handle(new Request(input,init))});
    await client.connect(transport);
    try {
      const declared = await client.listTools();
      const results = [];
      for (const example of examples) {
        const response = await client.callTool({name:example.tool,arguments:example.arguments});
        results.push({tool:example.tool,accepted:response.isError!==true,error:response.isError?response.content:null});
      }
      process.stdout.write(JSON.stringify({names:declared.tools.map(tool=>tool.name),results,calls}));
    } finally {await client.close();}
  `;
  const result = spawnSync(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', probe], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const observed = JSON.parse(result.stdout);
  for (const example of observed.results) assert.equal(example.accepted, true, JSON.stringify(example));
  assert.deepEqual(observed.calls, ['/api/v1/board', '/api/v1/models', '/api/v1/prices']);
});

test('test and release package entry points verify the generated application catalog first', async (t) => {
  try { await readFile(join(root, 'tools/website/generate-price-finder-app-catalog.ts')); }
  catch (error) {
    if (error.code !== 'ENOENT') throw error;
    t.skip('Website catalogue generation is outside this public Skill source export');
    return;
  }
  const { scripts } = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
  assert.equal(scripts['price-finder:catalog'], 'tsx tools/website/generate-price-finder-app-catalog.ts');
  assert.equal(scripts['price-finder:catalog:check'], 'npm run price-finder:catalog -- --check');
  for (const command of ['price-finder:test', 'price-finder:package']) {
    assert.match(scripts[command], /^npm run price-finder:catalog:check && /, command);
  }
});
