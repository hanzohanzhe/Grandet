#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
import { createHash } from 'node:crypto';
import { lstat, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, posix, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkBuildId } from './check-build-id.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const skillPath = 'skills/grandet-api-price-finder';
const templatePath = 'plugins/grandet-api-price-finder';
const distributionPath = 'docs/skills/application-distribution.generated.json';
// These are package adapters, not application-catalog registrations.
const chatAdapters = ['grok-bot', 'your-dot', 'muse'].map((id) => ({
  id, source: `docs/skills/chat-adapters/${id}.md`, path: `adapters/${id}.md`,
}));
const usage = 'Usage: node scripts/package-price-finder.mjs --out <new-directory>';
const inputs = [
  ['LICENSES/Apache-2.0.txt', 'LICENSE'],
  ['docs/skills/QUICKSTART.md', 'README.md'],
  ['docs/skills/INSTALL.md', 'INSTALL.md'],
  ['scripts/install-price-finder.mjs', 'scripts/install-price-finder.mjs'],
  ['scripts/installation-receipts.mjs','scripts/installation-receipts.mjs'],
  ['scripts/installation-receipts-source-build.json','installation-receipts-source-build.json'],
  ['scripts/verify-installation.py','scripts/verify-installation.py'],
    ['docs/skills/installation-receipts.md','installation-receipts.md'],
  ['docs/skills/installation-routes.json','installation-routes.json'],
  [distributionPath, 'application-distribution.json'],
  ...['SKILL.md', 'scripts/connect.mjs', 'scripts/connect-mcp.mjs', 'agents/openai.yaml', 'references/workloads.md', 'references/http-fallback.md', 'references/response-format.md', 'references/host-setup.md', 'references/app-catalog.md', 'references/entrypoints.md'].map((path) => [`${skillPath}/${path}`, `${skillPath}/${path}`]),
];
function isWithin(parent, child) {
  const rel = relative(parent, child);
  return rel === '' || (rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel));
}
async function rejectLinks(path) {
  let current = resolve(path);
  while (true) {
    try { if ((await lstat(current)).isSymbolicLink()) throw new Error('SYMLINK_NOT_ALLOWED'); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }
}
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const anchor = (source) => `grandet-source-${source.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
function markdownLinks(text, replace) {
  // Handle inline links and reference-style definitions; keep their labels/titles.
  return text.replace(/(\]\()([^\s)]+)([^)]*\))/g, (_, before, destination, after) => `${before}${replace(destination)}${after}`)
    .replace(/^(\s*\[[^\]]+\]:\s*)(\S+)(.*)$/gm, (_, before, destination, after) => `${before}${replace(destination)}${after}`);
}
function skillReference(source, destination) {
  if (/^[a-z][a-z\d+.-]*:/i.test(destination) || destination.startsWith('//')) return null;
  const local = destination.replace(/^<|>$/g, '').split('#')[0];
  const target = local ? posix.normalize(posix.join(posix.dirname(source), local)) : source;
  if (destination.includes('\\') || !new RegExp(`^${skillPath}/(?:SKILL\\.md|references/[a-z0-9-]+\\.md)$`).test(target)) throw new Error(`INVALID_SKILL_REFERENCE: ${source}: ${destination}`);
  return target;
}
async function readSource(source) {
  const path = join(root, source);
  await rejectLinks(path);
  if (!(await lstat(path)).isFile()) throw new Error(`NOT_A_FILE: ${source}`);
  return readFile(path);
}
async function main() {
  const args = process.argv.slice(2);
  if (args.length !== 2 || args[0] !== '--out' || !args[1] || args[1].startsWith('--')) throw new Error(usage);
  const out = resolve(args[1]);
  if (isWithin(out, root) || [skillPath, templatePath, 'docs/skills', 'scripts', 'tests'].some((path) => isWithin(join(root, path), out))) throw new Error('UNSAFE_OUTPUT');
  await rejectLinks(out);
  try { await lstat(out); throw new Error('OUTPUT_EXISTS'); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }

  const ids = await checkBuildId(root, { requireLastLine: false });
  if (ids.problems.length) throw new Error(`BUILD_ID_MISMATCH: ${ids.problems.join('; ')}`);

  await rejectLinks(join(root, distributionPath));
  const distribution = JSON.parse(await readFile(join(root, distributionPath), 'utf8'));
  if (distribution.schema !== 'grandet.price-finder-distribution/v1' || distribution.skillDirectory !== skillPath || !Array.isArray(distribution.entries)) throw new Error('INVALID_DISTRIBUTION');
  const resourcePaths = new Set();
  const pluginPaths = new Set();
  for (const entry of distribution.entries) {
    if (entry.status !== 'DOCUMENTED') continue;
    if (entry.resources.skillDirectory && entry.resources.skillDirectory !== skillPath) throw new Error('MULTIPLE_SKILL_SOURCES');
    for (const source of entry.resources.packageManifests) { resourcePaths.add(source); pluginPaths.add(source); }
    if (entry.resources.mcpConfiguration) resourcePaths.add(entry.resources.mcpConfiguration);
  }
  const resourceTargets = Object.fromEntries([...resourcePaths].sort().map((source) => {
    const target = source.slice(templatePath.length + 1);
    if (!source.startsWith(`${templatePath}/`) || !target || target.includes('\\') || target.split('/').some((part) => part === '..' || part === '.')) throw new Error('INVALID_DISTRIBUTION_RESOURCE');
    return [source, target];
  }));
  const exportInputs = [...inputs, ...Object.entries(resourceTargets)];

  // Read only the explicit export list; never walk the repository or a profile.
  const payload = [];
  const sourceBytes = new Map();
  for (const [source, target] of exportInputs) {
    const bytes = await readSource(source);
    sourceBytes.set(source, bytes);
    // The installation documents move from docs/skills to the package root.
    const exported = ['README.md', 'INSTALL.md'].includes(target)
      ? Buffer.from(markdownLinks(bytes.toString('utf8'), (destination) => destination.startsWith('../../skills/') ? destination.slice(6) : destination))
      : bytes;
    payload.push([target, exported]);
  }
  const manifests = [...pluginPaths].map((source) => JSON.parse(payload.find(([path]) => path === resourceTargets[source])[1].toString('utf8')));
  const manifest = manifests[0];
  if (!manifest || manifests.some((item) => item.name !== manifest.name || item.version !== manifest.version || item.license !== 'Apache-2.0')) throw new Error('MANIFEST_MISMATCH');
  const commonSources = exportInputs.map(([source]) => source).filter((source) => source.startsWith(`${skillPath}/`) && source.endsWith('.md'));
  const discovered = new Set(commonSources);
  // Follow only explicit Markdown references inside this Skill, never a directory walk.
  for (const source of commonSources) {
    const references = [];
    markdownLinks(sourceBytes.get(source).toString('utf8'), (destination) => {
      const target = skillReference(source, destination);
      if (target) references.push(target);
      return destination;
    });
    for (const target of references.sort()) {
      if (discovered.has(target)) continue;
      discovered.add(target);
      commonSources.push(target);
      const bytes = await readSource(target);
      sourceBytes.set(target, bytes);
      payload.push([target, bytes]);
    }
  }
  const embeddedSources = [`${skillPath}/SKILL.md`, ...commonSources.filter((source) => source !== `${skillPath}/SKILL.md`).sort()];
  const commonDocument = embeddedSources.map((source) => {
    const content = markdownLinks(sourceBytes.get(source).toString('utf8'), (destination) => {
      const target = skillReference(source, destination);
      return target ? `#${anchor(target)}` : destination;
    });
    return `<a id="${anchor(source)}"></a>\n\n<!-- Source: ${source} -->\n\n${content.trim()}\n`;
  }).join('\n---\n\n');
  // Native editors can persist one file. Embed the same references, not a
  // separate prompt or a conversation attachment that must be supplied again.
  const skillSource = sourceBytes.get(`${skillPath}/SKILL.md`).toString('utf8');
  const frontmatter = skillSource.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/)?.[0];
  if (!frontmatter) throw new Error('MISSING_SKILL_FRONTMATTER');
  const editorDocument = `${frontmatter}\n${commonDocument.replace(frontmatter.trim(), '').trimStart()}`;
  payload.push(['install/chatgpt-editor.md', Buffer.from(editorDocument)]);
  const adapterMetadata = [];
  for (const adapter of chatAdapters) {
    const template = await readSource(adapter.source);
    const sources = Object.fromEntries([adapter.source, ...embeddedSources].map((source) => [source, hash(source === adapter.source ? template : sourceBytes.get(source))]));
    const document = `> Integrated installation build: grandet-skill-0.3.0-build.20261017b; Receipt-aware tools are included. Product version: ${manifest.version}. PUBLIC_PREVIEW / 公开试用。Native use / 原生使用: NOT_RUN. Packaging does not certify native installation or register an application-catalogue entry / 打包不证明原生安装通过，也不登记应用目录入口。\n\n${template.toString('utf8').trim()}\n\n---\n\n## Shared Skill and references / 共同 Skill 与参考资料\n\nThe following content is generated from the single common Skill source. Local links point to embedded source sections. Source SHA-256 values are recorded in package-manifest.json.\n\n下文从唯一共同 Skill 源文件生成；本地链接指向本文内嵌的源文件段落，源文件 SHA-256 记录在 package-manifest.json。\n\n${commonDocument}`;
    payload.push([adapter.path, Buffer.from(document)]);
    adapterMetadata.push({id: adapter.id, path: adapter.path, version: manifest.version, status: 'PUBLIC_PREVIEW', sourceBuild: 'grandet-skill-0.3.0-build.20261017b', releasePackage: true, nativeUse: 'NOT_RUN', sources});
  }
  const hashes = Object.fromEntries(payload.toSorted(([a], [b]) => a.localeCompare(b, 'en')).map(([path, bytes]) => [path, hash(bytes)]));
  payload.push(['package-manifest.json', Buffer.from(`${JSON.stringify({schema: 'grandet-price-finder-package/v1', name: manifest.name, version: manifest.version, sourceBuild: 'grandet-skill-0.3.0-build.20261017b', releasePackage: true, distributionManifest: 'application-distribution.json', resourceTargets, chatAdapters: adapterMetadata, files: hashes}, null, 2)}\n`)]);
  await mkdir(dirname(out), { recursive: true });
  await mkdir(out); // Atomic refusal of an existing target, including races.
  for (const [path, bytes] of payload) {
    await mkdir(dirname(join(out, path)), { recursive: true });
    await writeFile(join(out, path), bytes, { flag: 'wx' });
  }
  process.stdout.write(`${JSON.stringify({ directory: out, files: payload.length, version: manifest.version, sourceBuild: 'grandet-skill-0.3.0-build.20261017b', releasePackage: true, installed: false, published: false })}\n`);
}
main().catch((error) => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; });
