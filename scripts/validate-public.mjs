// SPDX-License-Identifier: AGPL-3.0-only
import {readFile,readdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {root,markdown} from './catalogue.mjs';
const read=p=>readFile(root+p,'utf8');
const manifest=JSON.parse(await read('data/RELEASE-v3.json'));
const bytes=await readFile(root+manifest.file);const data=JSON.parse(bytes);
assert.equal(createHash('sha256').update(bytes).digest('hex'),manifest.sha256);assert.equal(bytes.length,manifest.bytes);
assert.equal(data.schema,'grandet.free-token-offers/v3');
const old=JSON.parse(await read('data/free-tokens.json'));let prerequisites=0;
for(const group of ['offers','officialOffers']){
 assert.equal(data[group].length,old[group].length);
 for(let i=0;i<data[group].length;i++){
  const a=data[group][i],b=old[group][i];assert.equal(a.id,b.id);
  for(const k of ['conditions','observedAt','checkedAt','endAt','claimUrl'])if(k in b)assert.deepEqual(a[k],b[k]);
  const clean=es=>es.map(({title,label,...e})=>e);assert.deepEqual(clean(a.evidence),clean(b.evidence));
  assert.deepEqual(Object.keys(a.requirements).sort(),['application','card','identity','invite','payment','renewal']);prerequisites+=6;
  for(const r of Object.values(a.requirements)){assert(['unknown','required','not-required','conditional'].includes(r.state));assert(r.note['zh-CN']&&r.note.en);}
  assert.equal(a.personalEligibility,'unverified');assert(!('fullStatement'in a));
  for(const e of a.evidence){assert(!('excerpt'in e));const u=new URL(e.url??e.sourceUrl);assert(['http:','https:'].includes(u.protocol));assert(!u.username&&!u.password);}
 }
}
assert.equal(prerequisites,642);
const walk=async(d='')=>(await Promise.all((await readdir(root+d,{withFileTypes:true})).filter(x=>x.name!=='.git').map(async x=>x.isDirectory()?walk(d+x.name+'/'):[d+x.name]))).flat();
const paths=(await walk()).sort(),allow=JSON.parse(await read('public-export-manifest.json')).files.map(x=>x.path).sort();assert.deepEqual(paths,allow);
const output=markdown(data);if(process.argv.includes('--generate'))await writeFile(root+'CATALOGUE-v3.md',output);else assert.equal(await read('CATALOGUE-v3.md'),output);
console.log(JSON.stringify({cards:107,structuredPrerequisites:prerequisites,publicFiles:paths.length,sha256:manifest.sha256,oldFactsAndEvidenceRetained:true}));
