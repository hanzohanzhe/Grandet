// SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const root=new URL('../',import.meta.url);
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
for(const version of ['0.3.0','0.3.1'])test(`immutable ${version} downloads match sizes and hashes`,async()=>{
  const manifest=JSON.parse(await readFile(new URL(version==='0.3.0'?'downloads/manifest.json':'downloads/manifest-0.3.1.json',root),'utf8'));
  assert.equal(manifest.schema,'grandet.skill-downloads/v1');assert.equal(manifest.version,version);
  assert.deepEqual(manifest.files.map(x=>x.file).sort(),[`grandet-api-price-finder-${version}.skill`,`grandet-api-price-finder-${version}.zip`]);
  for(const file of manifest.files){const bytes=await readFile(new URL(`downloads/${file.file}`,root));assert.equal(bytes.length,file.bytes);assert.equal(hash(bytes),file.sha256);}
  // The old manifest identifies its original historical sources, not the current source tree.
  if(version==='0.3.1')for(const [path,expected]of Object.entries(manifest.sourceFiles))assert.equal(hash(await readFile(new URL(path,root))),expected,`Rebuild candidate after changing ${path}`);
  assert.equal(manifest.verification.nativeArchiveIncludesLicense,true);assert.equal(manifest.verification.allHostsNativeAcceptance,'NOT_COMPLETE');
});
