// SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {createHash} from 'node:crypto';import {root,validate,markdown,validateCatalogueDates,validateReleaseDates} from '../scripts/catalogue.mjs';import {validatePublicData} from '../scripts/validate-public.mjs';
const bytes=await readFile(root+'data/free-tokens.json'),data=JSON.parse(bytes),manifest=JSON.parse(await readFile(root+'data/MANIFEST.json'));
const v3Bytes=await readFile(root+'data/free-tokens-v3.json'),v3=JSON.parse(v3Bytes),release=JSON.parse(await readFile(root+'data/RELEASE-v3.json'));
const checked=d=>{const b=Buffer.from(JSON.stringify(d));return validate(d,b,{...manifest,bytes:b.length,sha256:createHash('sha256').update(b).digest('hex')});};
test('pinned complete snapshot',()=>assert.equal(validate(data,bytes,manifest).official,73));
test('reject changed body',()=>assert.throws(()=>validate(data,Buffer.concat([bytes,Buffer.from(' ')]),manifest)));
test('reject duplicate identity',()=>{const d=structuredClone(data);d.offers[0].id=d.officialOffers[0].id;assert.throws(()=>checked(d),/Structured|duplicate/);});
test('reject dropped payment condition field',()=>{const d=structuredClone(data);delete d.offers[0].requiresPayment;assert.throws(()=>checked(d),/Structured|payment/);});
test('reject unsafe evidence URL',()=>{const d=structuredClone(data);d.officialOffers[0].evidence[0].url='javascript:alert(1)';assert.throws(()=>checked(d),/Structured|Unsafe/);});
test('Markdown retains every exact record',()=>{const m=markdown(data);for(const o of [...data.officialOffers,...data.offers])assert.ok(m.includes(JSON.stringify(o,null,2)));});

test('vendor full statements and excerpts excluded',()=>{for(const o of data.offers){assert.ok(!Object.hasOwn(o,'fullStatement'));for(const e of o.evidence)assert.ok(!Object.hasOwn(e,'excerpt'));}});
test('changed original structured condition rejected',()=>{const d=structuredClone(data);d.offers[0].conditions.pop();assert.throws(()=>checked(d),/Structured/);});
test('derivation pinned per record',()=>{for(const o of data.offers){assert.equal(o.derivedFrom.recordId,o.id);assert.equal(o.derivedFrom.snapshotSha256,data.derivedFrom.sha256);assert.equal(o.derivedFrom.observedAt,o.observedAt);}});
test('hub license text and explicit file map resolve',async()=>{const {readdir}=await import('node:fs/promises');const exportMap=JSON.parse(await readFile(root+'public-export-manifest.json'));const walk=async(dir,prefix='')=>{const paths=[];for(const e of await readdir(dir,{withFileTypes:true})){if(e.name==='.git')continue;const name=prefix+e.name;if(e.isDirectory())paths.push(...await walk(dir+e.name+'/',name+'/'));else paths.push(name);}return paths;};assert.deepEqual(exportMap.files.map(x=>x.path).sort(),(await walk(root)).sort());const license=await readFile(root+'LICENSE','utf8');assert.ok(license.includes('AGPL-3.0-only'));assert.ok(license.includes('Apache-2.0.txt'));assert.ok((await readFile(root+'LICENSES/Apache-2.0.txt','utf8')).includes('Apache License'));const rights=Object.fromEntries(exportMap.files.map(x=>[x.path,x.rights]));assert.equal(rights['scripts/catalogue.mjs'],'AGPL-3.0-only');assert.equal(rights['skills/grandet-api-price-finder/SKILL.md'],'Apache-2.0');assert.equal(rights['data/free-tokens.json'],'FACTUAL_COMPILATION_SOURCE_RIGHTS_RETAINED');assert.ok((await readFile(root+'LICENSES/AGPL-3.0-only.txt','utf8')).includes('GNU AFFERO GENERAL PUBLIC LICENSE'));for(const name of ['README.md','README.zh-CN.md','DATA-LICENSE.md']){const text=await readFile(root+name,'utf8');for(const match of text.matchAll(/\]\(([^)]+)\)/g)){const path=match[1].split('#')[0];if(path&&!/^https?:/.test(match[1]))await readFile(root+path);}}});

test('calendar dates reject impossible days and apply Gregorian leap years',()=>{
 const mutated=structuredClone(release);mutated.compiledAt='2024-02-29';assert.doesNotThrow(()=>validateReleaseDates(mutated,'release'));
 mutated.compiledAt='2023-02-29';assert.throws(()=>validateReleaseDates(mutated,'release'),/release\.compiledAt/);
 mutated.compiledAt='2026-04-31';assert.throws(()=>validateReleaseDates(mutated,'release'),/release\.compiledAt/);
});
test('timestamps require real dates, timezones, and well-formed offsets',()=>{
 const mutated=structuredClone(data);mutated.offers[0].observedAt='2026-02-29T23:46:25.488Z';assert.throws(()=>validateCatalogueDates(mutated,'catalogue'),/offers\[0\]\.observedAt/);
 mutated.offers[0].observedAt='2026-10-03T23:46:25.488';assert.throws(()=>validateCatalogueDates(mutated,'catalogue'),/offers\[0\]\.observedAt/);
 mutated.offers[0].observedAt='2024-02-29T18:16:25.488-05:30';assert.doesNotThrow(()=>validateCatalogueDates(mutated,'catalogue'));
 mutated.offers[0].observedAt='2026-10-03T23:46:25.488+24:00';assert.throws(()=>validateCatalogueDates(mutated,'catalogue'),/offers\[0\]\.observedAt/);
 mutated.offers[0].observedAt='2026-10-03T23:46:25.488+0800';assert.throws(()=>validateCatalogueDates(mutated,'catalogue'),/offers\[0\]\.observedAt/);
});
test('exact deadline may equal but not exceed its explicit upper bound',()=>{
 const index=data.offers.findIndex(record=>Object.hasOwn(record,'expiryUpperBound')),mutated=structuredClone(data);
 mutated.offers[index].endAt='2026-10-08T00:00:00+08:00';assert.doesNotThrow(()=>validateCatalogueDates(mutated,'catalogue'));
 mutated.offers[index].endAt='2026-10-08T00:00:00.000001+08:00';assert.throws(()=>validateCatalogueDates(mutated,'catalogue'),/endAt.*expiryUpperBound/);
});
test('observation windows reject reversed endpoints',()=>{
 const mutated=structuredClone(v3);[mutated.observationWindow.first,mutated.observationWindow.last]=[mutated.observationWindow.last,mutated.observationWindow.first];
 assert.throws(()=>validateCatalogueDates(mutated,'catalogue'),/observationWindow\.first.*observationWindow\.last/);
});
test('structured calendar deadlines enforce their conservative bound',()=>{
 const index=v3.officialOffers.findIndex(record=>Object.hasOwn(record,'activityDeadline')),mutated=structuredClone(v3);
 mutated.officialOffers[index].activityDeadline.expiryUpperBound='2027-01-01T20:00:00+08:00';mutated.officialOffers[index].activityEndAt='2027-01-01T12:00:00Z';assert.doesNotThrow(()=>validateCatalogueDates(mutated,'catalogue'));
 mutated.officialOffers[index].activityEndAt='2027-01-01T12:00:00.000001Z';assert.throws(()=>validateCatalogueDates(mutated,'catalogue'),/activityEndAt.*activityDeadline\.expiryUpperBound/);
 mutated.officialOffers[index].activityEndAt=null;mutated.officialOffers[index].activityDeadline.date='2026-12-30';assert.throws(()=>validateCatalogueDates(mutated,'catalogue'),/activityDeadline\.expiryUpperBound/);
});
test('historical and unknown deadlines remain valid',()=>{
 const historical=data.offers.find(record=>record.declaredStatus==='ended'&&record.endAt);assert.ok(historical.observedAt>historical.endAt);
 assert.doesNotThrow(()=>validateCatalogueDates(data,'catalogue'));assert.ok(data.offers.some(record=>record.endAt===null));
});
test('importable public validator applies the shared temporal contract',()=>assert.equal(validatePublicData(v3,data,release,v3Bytes),642));
