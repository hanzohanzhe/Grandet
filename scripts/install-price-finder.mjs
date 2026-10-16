#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
import { randomUUID } from 'node:crypto';
import { lstat, mkdir, readFile, readdir, rename, rmdir, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { openReceipt, digest, notice, sources } from './installation-receipts.mjs';

const productVersion = '0.3.0';
const sourceBuild = 'grandet-skill-0.3.0-build.20261016b';
const skillName = 'grandet-api-price-finder';
const scriptRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const defaultSource = await lstat(join(scriptRoot, 'SKILL.md')).then(() => scriptRoot, () => join(scriptRoot, 'skills', skillName));
const platforms = ['win32', 'linux', 'darwin'];
// Installation destinations only. Runtime model/app identities remain the website's contract.
// Verified 2026-10-13 against the official Skills documentation for the named applications.
const routes = [
  { id: 'codex', root: '.agents/skills', aliases: ['.codex/skills'], scope: 'Local user; shared Agent Skills directory' },
  { id: 'claude-code', root: '.claude/skills', scope: 'Local user; excludes cloud/Cowork' },
  { id: 'cursor', root: '.cursor/skills', aliases: ['.agents/skills', '.claude/skills', '.codex/skills'], scope: 'Local IDE user; cloud requires separate private sync' },
  { id: 'opencode', root: '.agents/skills', aliases: ['.config/opencode/skills', '.claude/skills'], scope: 'Local user; documented shared directory' },
  { id: 'gemini-cli', root: '.gemini/skills', aliases: ['.agents/skills'], scope: 'Local user; host activation consent remains' },
  { id: 'cline', root: '.cline/skills', scope: 'Local user; no claim of cloud synchronization' },
  { id: 'roo-code', root: '.roo/skills', aliases: ['.agents/skills'], scope: 'Local user; all modes unless host overrides' },
  { id: 'kilo-code', root: '.kilo/skills', aliases: ['.agents/skills'], scope: 'Current local Kilo platform; excludes cloud runners' },
  { id: 'windsurf', root: '.codeium/windsurf/skills', scope: 'Local Cascade user across workspaces' },
  { id: 'continue', root: '.continue/skills', environment: 'CONTINUE_GLOBAL_DIR', scope: 'Selected local Continue runtime/build' },
  { id: 'hermes', root: '.hermes/skills', environment: 'HERMES_HOME', scope: 'Selected local Hermes runtime/profile; not remote backend' },
  { id: 'openclaw', root: '.openclaw/skills', environment: 'OPENCLAW_STATE_DIR', scope: 'Actual local Gateway state; WSL/remote runtimes install there separately' },
  { id: 'trae-cn', catalogAppId: 'trae', root: '.trae-cn/skills', scope: 'TRAE China local user' },
  { id: 'trae-intl', catalogAppId: 'trae', root: '.trae/skills', scope: 'TRAE International local user' },
];
const required = ['SKILL.md', 'agents/openai.yaml', 'references/app-catalog.md', 'references/entrypoints.md', 'references/host-setup.md', 'references/http-fallback.md', 'references/response-format.md', 'references/workloads.md'];
const usage = 'Usage: node install-price-finder.mjs --app <id> [--dry-run] [--home <explicit-test-root>] [--source <complete-skill-folder>] [--platform win32|linux|darwin]\n       node install-price-finder.mjs --list';
function fail(code, detail = '') { throw new Error(`${code}${detail ? `: ${detail}` : ''}`); }
function inside(parent, child) {
  const rel = relative(parent, child);
  return rel === '' || (rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel));
}
async function entry(path) {
  try { return await lstat(path); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}
async function rejectLinks(path) {
  for (let current = resolve(path); ; current = dirname(current)) {
    if ((await entry(current))?.isSymbolicLink()) fail('SYMLINK_NOT_ALLOWED', current);
    if (dirname(current) === current) return;
  }
}
async function readTree(directory, prefix = '', files = new Map()) {
  const current = join(directory, prefix);
  const info = await lstat(current);
  if (info.isSymbolicLink()) fail('SYMLINK_NOT_ALLOWED', current);
  if (!info.isDirectory()) fail('NOT_A_DIRECTORY', current);
  for (const item of await readdir(current, { withFileTypes: true })) {
    const path = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.isSymbolicLink()) fail('SYMLINK_NOT_ALLOWED', join(directory, path));
    if (item.isDirectory()) await readTree(directory, path, files);
    else if (item.isFile()) files.set(path, await readFile(join(directory, path)));
    else fail('UNSUPPORTED_FILE_TYPE', path);
  }
  return files;
}
function validateSource(files, source) {
  for (const path of required) if (!files.has(path)) fail('INCOMPLETE_SKILL', path);
  const skill = files.get('SKILL.md').toString('utf8');
  if (!/^name:\s*grandet-api-price-finder\s*$/m.test(skill) || !/Package version:\s*`0\.3\.0`/.test(skill)) fail('INVALID_SKILL_IDENTITY');
  for (const [path, bytes] of files) {
    if (!path.endsWith('.md')) continue;
    const markdown = bytes.toString('utf8');
    const links = [...markdown.matchAll(/\]\(([^\s)]+)(?:\s+[^)]*)?\)/g), ...markdown.matchAll(/^\s*\[[^\]]+\]:\s*(\S+)/gm)];
    for (const match of links) {
      const link = match[1].replace(/^<|>$/g, '');
      if (/^(?:[a-z][a-z\d+.-]*:|#|\/\/)/i.test(link)) continue;
      const target = resolve(dirname(join(source, path)), decodeURIComponent(link.split(/[?#]/)[0]));
      if (!inside(source, target)) fail('INVALID_SKILL_REFERENCE', `${path}: ${link}`);
      const targetName = relative(source, target).split(sep).join('/');
      if (!files.has(targetName)) fail('MISSING_SKILL_REFERENCE', `${path}: ${link}`);
    }
  }
}
function same(left, right) {
  return left.size === right.size && [...left].every(([path, bytes]) => right.get(path)?.equals(bytes));
}
function argumentsFor(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index++) {
    const flag = argv[index];
    if (!['--app', '--dry-run', '--home', '--source', '--platform', '--list', '--no-telemetry', '--receipt-source', '--receipt-endpoint', '--flush', '--operation'].includes(flag)) fail('INVALID_ARGUMENT', usage);
    if (Object.hasOwn(options, flag)) fail('DUPLICATE_OPTION', flag);
    if (['--dry-run', '--list', '--no-telemetry', '--flush'].includes(flag)) options[flag] = true;
    else {
      const value = argv[++index];
      if (!value || value.startsWith('--')) fail('MISSING_ARGUMENT', flag);
      options[flag] = value;
    }
  }
  if (options['--list'] && options['--app']) fail('INVALID_ARGUMENT', 'Choose --list or one --app');
  return options;
}
function destinationRoot(route, home, platform, explicitHome) {
  // --home is an isolated test root: never read real per-app environment paths.
  if (!explicitHome && route.environment && process.env[route.environment]) {
    const configured = process.env[route.environment];
    if (!isAbsolute(configured)) fail('RUNTIME_HOME_MUST_BE_ABSOLUTE', route.environment);
    return join(configured, 'skills');
  }
  if (!explicitHome && route.id === 'openclaw' && (process.env.OPENCLAW_HOME || process.env.OPENCLAW_PROFILE)) {
    fail('OPENCLAW_STATE_DIR_REQUIRED', 'Set the actual Gateway state directory when using a home/profile override');
  }
  if (route.id === 'hermes' && platform === 'win32') {
    if (explicitHome) return join(home, 'AppData/Local/hermes/skills');
    const localData = process.env.LOCALAPPDATA;
    if (!localData || !isAbsolute(localData)) fail('LOCALAPPDATA_REQUIRED', 'Set the actual Hermes runtime home through HERMES_HOME');
    return join(localData, 'hermes/skills');
  }
  return join(home, route.root);
}
async function main() {
  const options = argumentsFor(process.argv.slice(2));
  const platform = options['--platform'] ?? process.platform;
  if (!platforms.includes(platform)) fail('UNSUPPORTED_PLATFORM', platform);
  if (options['--list']) {
    return { productVersion, sourceBuild, nativeAcceptance: 'NOT_RUN', applications: routes.map((route) => ({ id: route.id, catalogAppId: route.catalogAppId ?? route.id, userRoot: route.id === 'hermes' && platform === 'win32' ? '%LOCALAPPDATA%/hermes/skills (HERMES_HOME overrides)' : `~/${route.root}`, scope: route.scope, documentedAliases: (route.aliases ?? []).map((path) => `~/${path}`) })) };
  }
  const route = routes.find((item) => item.id === options['--app']);
  if (!route) fail('UNSUPPORTED_APP', options['--app'] ?? usage);
  if (platform !== process.platform && !options['--dry-run']) fail('CROSS_PLATFORM_REQUIRES_DRY_RUN');
  if (options['--home'] && !isAbsolute(options['--home'])) fail('TEST_HOME_MUST_BE_ABSOLUTE');
  const home = resolve(options['--home'] ?? homedir());
  const source = resolve(options['--source'] ?? defaultSource);
  const discovery = destinationRoot(route, home, platform, Boolean(options['--home']));
  const destination = join(discovery, skillName);
  const aliases = (route.aliases ?? []).map((path) => join(home, path, skillName));
  // A sibling of discovery stays on the runtime volume, including redirected app homes.
  const backups = join(dirname(discovery), '.grandet-skill-backups');
  if ([destination, ...aliases, backups].some((path) => inside(source, path) || inside(path, source))) fail('OVERLAPPING_PATHS');
  await rejectLinks(source);
  const payload = await readTree(source);
  validateSource(payload, source);
  await rejectLinks(home);
  await rejectLinks(backups);
  if (!sources.includes(options['--receipt-source'] ?? 'unknown')) fail('INVALID_RECEIPT_SOURCE');
  if (options['--operation'] && !['repair','reinstall','bind','sync','enable'].includes(options['--operation'])) fail('INVALID_OPERATION');
  let receipt;
  if (!options['--dry-run']) {
    process.stderr.write(notice + '\n');
    const found=[];for(const path of [destination,...aliases]) {await rejectLinks(path);if(await entry(path))found.push(path);}
    if(found.length>1)fail('MULTIPLE_SKILL_COPIES');
    receipt = await openReceipt(found[0] ?? destination, {disabled:Boolean(options['--no-telemetry']),test:Boolean(options['--home']),url:options['--receipt-endpoint']});
    try { await receipt.recover(readTree); } catch(error) { await receipt.close(); throw error; }
  }
  try {
  const installed = [];
  for (const path of [destination, ...aliases]) {
    await rejectLinks(path);
    if (await entry(path)) installed.push({ path, files: await readTree(path) });
  }
  if (installed.length > 1) fail('MULTIPLE_SKILL_COPIES', installed.map((item) => item.path).join(' | '));
  const existing = installed[0];
  const identical = existing && same(existing.files, payload);
  if (existing && existing.path !== destination && !identical) fail('ALIAS_CONTENT_CONFLICT', existing.path);
  const action = identical ? (existing.path === destination ? 'UNCHANGED' : 'REUSED') : existing ? 'UPDATED' : 'INSTALLED';
  const report = { productVersion, sourceBuild, app: route.id, catalogAppId: route.catalogAppId ?? route.id, platform, scope: route.scope, source, destination: identical ? existing.path : destination, status: options['--dry-run'] ? 'DRY_RUN' : action, plannedAction: action, backup: null, files: payload.size, nativeAcceptance: 'NOT_RUN', explicitTestHome: Boolean(options['--home']), nextStep: 'Start a fresh session and ask an ordinary API-price question without an attachment, Skill selection or the Grandet name. File installation alone does not verify activation or network access.' };
  if (route.id === 'cursor') {
    report.cloudSyncStatus = report.destination === destination ? 'REQUIRES_PRIVATE_SYNC' : 'ALIAS_REUSED_LOCAL_ONLY';
    report.nextStep += report.destination === destination
      ? ' Cloud Agents additionally require the private Sync Skills step in Cursor settings.'
      : ' The reused alias is available to local Cursor; Cloud Agents sync only ~/.cursor/skills. Resolve a single-copy migration before cloud sync rather than creating a duplicate.';
  }
  const version = payload.get('SKILL.md').toString('utf8').match(/Package version:\s*`([^`]+)`/)?.[1];
  const content = digest(payload);
  report.contentSha256 = content;
  if (options['--dry-run']) return report;
  // Shared aliases use the state of their actual persistent directory.
  if (identical && existing.path !== destination) { await receipt.close(); receipt=await openReceipt(existing.path,{disabled:Boolean(options['--no-telemetry']),test:Boolean(options['--home']),url:options['--receipt-endpoint']});await receipt.recover(readTree); }
  if (options['--flush']) { report.status='FLUSHED';report.receipt=await receipt.flush();return report; }
  if (identical && options['--operation'] && !['reinstall'].includes(options['--operation'])) {
    if(!['bind','sync','enable'].includes(options['--operation'])) fail('REPAIR_REQUIRES_CHANGED_OR_MISSING_FILES');
  }
  if (identical && existing.path!==destination && options['--operation']==='reinstall') fail('ALIAS_REINSTALL_USE_VERIFIER_AT_ACTUAL_DESTINATION');
  if (identical && options['--operation']!=='reinstall') {
    if (!same(payload,await readTree(existing.path))) fail('TARGET_READBACK_MISMATCH');
    const operation=options['--operation'] ?? (receipt.state.installation_id?'reuse':'existing_seen');
    const j=await receipt.prepare({destination:existing.path,operation,content,version,source:options['--receipt-source'],host:route.catalogAppId??route.id});
    await receipt.complete(j);report.receipt=await receipt.flush();return report;
  }
  const transaction = join(backups, `${route.id}-${Date.now()}-${randomUUID()}`);
  const stage = join(transaction, 'new-skill');
  const backup = join(transaction, skillName);
  // Stage outside all skill-discovery directories. Existing content is moved intact, never deleted.
  await mkdir(stage, { recursive: true });
  for (const [path, bytes] of payload) {
    await mkdir(dirname(join(stage, path)), { recursive: true });
    await writeFile(join(stage, path), bytes, { flag: 'wx' });
  }
  if (!same(payload, await readTree(stage))) fail('STAGED_COPY_MISMATCH', stage);
  await rejectLinks(destination);
  const current = await entry(destination);
  if (Boolean(current) !== Boolean(existing) || (current && !same(existing.files, await readTree(destination)))) fail('DESTINATION_CHANGED', `Prepared files retained at ${stage}`);
  await mkdir(discovery, { recursive: true });
  const operation=options['--operation'] ?? (!existing ? (receipt.state.installation_id?'reinstall':'install') : receipt.state.digest===content?'repair':'update');
  const journal=await receipt.prepare({destination,stage,backup:existing?backup:null,previous_content:existing?digest(existing.files):null,operation,content,version,source:options['--receipt-source'],host:route.catalogAppId??route.id});
  if (options['--home'] && process.env.GRANDET_INSTALL_CRASH_BEFORE_MOVE==='1') process.exit(86);
  if (existing) {
    await rename(destination, backup);
    report.backup = backup;
  }
  try { await rename(stage, destination); }
  catch (error) {
    if (existing && !(await entry(destination))) await rename(backup, destination);
    fail('INSTALL_MOVE_FAILED', `${error.code}; prepared files retained at ${stage}`);
  }
  if (options['--home'] && process.env.GRANDET_INSTALL_CRASH_AFTER_WRITE==='1') process.exit(86);
  if(!same(payload,await readTree(destination))) fail('TARGET_READBACK_MISMATCH');
  await receipt.complete(journal);
  report.receipt=await receipt.flush();
  if (!existing) await rmdir(transaction); // Only our now-empty transaction directory.
  report.contentSha256 = content; // Same canonical digest as the installation receipt.
  return report;
  } catch(error) {
    if(receipt)await receipt.failure({content:digest(payload),version:payload.get('SKILL.md').toString('utf8').match(/Package version:\s*`([^`]+)`/)?.[1],source:options['--receipt-source'],host:route.catalogAppId??route.id}).catch(()=>{});
    throw error;
  } finally { await receipt?.close(); }
}
main().then((result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)).catch((error) => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; });
