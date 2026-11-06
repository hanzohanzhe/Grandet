// SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root=new URL('../',import.meta.url);
const repoRoot=fileURLToPath(root);
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
for(const version of ['0.3.0'])test(`immutable ${version} downloads match sizes and hashes`,async()=>{
  const manifest=JSON.parse(await readFile(new URL('downloads/manifest.json',root),'utf8'));
  const latest=JSON.parse(await readFile(new URL('downloads/latest.json',root),'utf8'));
  assert.equal(manifest.schema,'grandet.skill-downloads/v1');assert.equal(manifest.version,version);
  assert.equal(latest.build,manifest.buildId,'latest pointer build must match the immutable manifest');
  assert.deepEqual(manifest.files.map(x=>x.file).sort(),[`grandet-api-price-finder-${version}.skill`,`grandet-api-price-finder-${version}.zip`]);
  for(const file of manifest.files){const bytes=await readFile(new URL(`downloads/${file.file}`,root));assert.equal(bytes.length,file.bytes);assert.equal(hash(bytes),file.sha256);}
  assert.equal(manifest.buildId,'grandet-skill-0.3.0-build.20261018b');
  assert.equal(manifest.plannedTag,'skill-v0.3.0-build.20261018b');
  assert.equal(manifest.receiptSupport,'INCLUDED');
  try{execFileSync('git',['cat-file','-e',`${latest.sourceCommit}^{commit}`],{cwd:repoRoot,stdio:'ignore'});}catch{assert.fail(`downloads/latest.json sourceCommit cannot be resolved: ${latest.sourceCommit}`);}
  for(const [path,sha256] of Object.entries(manifest.sourceFiles)){
    const key=path.replace(/\\/g,'/');
    let source;
    try{source=execFileSync('git',['show',`${latest.sourceCommit}:${key}`],{cwd:repoRoot});}catch{assert.fail(`Could not read pinned source ${key} at downloads/latest.json sourceCommit ${latest.sourceCommit}`);}
    assert.equal(hash(source),sha256,`${key} at ${latest.sourceCommit}`);
  }
  assert.equal(manifest.verification.nativeArchiveIncludesLicense,true);assert.equal(manifest.verification.allHostsNativeAcceptance,'NOT_COMPLETE');
});
