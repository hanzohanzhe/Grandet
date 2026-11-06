// SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=new URL('../',import.meta.url);
const rootPath=fileURLToPath(root);
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
function sourceFilePath(key){
  assert.equal(typeof key,'string','sourceFiles key must be a string');
  assert.ok(!key.includes('\\'),`sourceFiles key contains a backslash: ${key}`);
  assert.ok(!key.startsWith('/'),`sourceFiles key is absolute: ${key}`);
  assert.ok(!/^[A-Za-z]:/.test(key),`sourceFiles key has a Windows drive prefix: ${key}`);
  assert.ok(!key.split('/').some(segment=>segment==='.'||segment==='..'),`sourceFiles key has a dot segment: ${key}`);
  return resolve(rootPath,...key.split('/'));
}
function sourceFileAtCommit(commit,key){
  return execFileSync('git',['show',`${commit}:${key}`],{cwd:rootPath});
}
for(const version of ['0.3.0'])test(`immutable ${version} downloads match sizes and hashes`,async()=>{
  const manifest=JSON.parse(await readFile(new URL('downloads/manifest.json',root),'utf8'));
  const latest=JSON.parse(await readFile(new URL('downloads/latest.json',root),'utf8'));
  assert.equal(manifest.schema,'grandet.skill-downloads/v1');assert.equal(manifest.version,version);
  assert.deepEqual(manifest.files.map(x=>x.file).sort(),[`grandet-api-price-finder-${version}.skill`,`grandet-api-price-finder-${version}.zip`]);
  for(const file of manifest.files){const bytes=await readFile(new URL(`downloads/${file.file}`,root));assert.equal(bytes.length,file.bytes);assert.equal(hash(bytes),file.sha256);}
  assert.equal(manifest.buildId,'grandet-skill-0.3.0-build.20261018b');
  assert.equal(manifest.plannedTag,'skill-v0.3.0-build.20261018b');
  assert.equal(manifest.receiptSupport,'INCLUDED');
  assert.equal(latest.build,manifest.buildId);
  assert.ok(latest.sourceCommit, 'downloads/latest.json must pin a sourceCommit');
  try {
    execFileSync('git',['rev-parse','--verify',`${latest.sourceCommit}^{commit}`],{cwd:rootPath,stdio:'ignore'});
  } catch {
    assert.fail(`downloads/latest.json sourceCommit cannot be resolved: ${latest.sourceCommit}`);
  }
  for(const [path,sha256] of Object.entries(manifest.sourceFiles))assert.equal(hash(sourceFileAtCommit(latest.sourceCommit,path)),sha256,path);
  assert.equal(manifest.verification.nativeArchiveIncludesLicense,true);assert.equal(manifest.verification.allHostsNativeAcceptance,'NOT_COMPLETE');
});

test('manifest source paths are POSIX relative paths',async()=>{
  const manifest=JSON.parse(await readFile(new URL('downloads/manifest.json',root),'utf8'));
  assert.ok(Object.keys(manifest.sourceFiles).length>0);
  for(const key of Object.keys(manifest.sourceFiles)){
    assert.match(key,/^[^/].*$/,'sourceFiles key must be nonempty and relative');
    sourceFilePath(key);
  }
});
