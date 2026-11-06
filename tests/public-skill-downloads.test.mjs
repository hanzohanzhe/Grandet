// SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const repoRoot=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const root=new URL('../',import.meta.url);
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
for(const version of ['0.3.0'])test(`immutable ${version} downloads match sizes and hashes`,async()=>{
  const manifest=JSON.parse(await readFile(new URL('downloads/manifest.json',root),'utf8'));
  const latest=JSON.parse(await readFile(new URL('downloads/latest.json',root),'utf8'));
  assert.equal(latest.build,manifest.buildId);
  assert.equal(manifest.schema,'grandet.skill-downloads/v1');assert.equal(manifest.version,version);
  assert.deepEqual(manifest.files.map(x=>x.file).sort(),[`grandet-api-price-finder-${version}.skill`,`grandet-api-price-finder-${version}.zip`]);
  for(const file of manifest.files){const bytes=await readFile(new URL(`downloads/${file.file}`,root));assert.equal(bytes.length,file.bytes);assert.equal(hash(bytes),file.sha256);}
  assert.equal(manifest.buildId,'grandet-skill-0.3.0-build.20261018b');
  assert.equal(manifest.plannedTag,'skill-v0.3.0-build.20261018b');
  assert.equal(manifest.receiptSupport,'INCLUDED');
  for(const [path,sha256] of Object.entries(manifest.sourceFiles)){
    const key=path.replaceAll('\\','/');
    let pinned;
    try { pinned=execFileSync('git',['show',`${latest.sourceCommit}:${key}`],{cwd:repoRoot}); }
    catch(error) { assert.fail(`Unable to resolve pinned source ${latest.sourceCommit}:${key}: ${error.message}`); }
    assert.equal(hash(pinned),sha256,path);
  }
  assert.equal(manifest.verification.nativeArchiveIncludesLicense,true);assert.equal(manifest.verification.allHostsNativeAcceptance,'NOT_COMPLETE');
});
