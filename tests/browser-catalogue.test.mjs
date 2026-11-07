// SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {root} from '../scripts/catalogue.mjs';
import {loadCatalogue,loadWebsiteStatus,recordView,runBrowser,safeRepositoryPath,validateCatalogue,validateCatalogueIndex,validateRelease} from '../app.mjs';
import {handleRequest,isMainModule,routes} from '../scripts/serve.mjs';

const readJson=async path=>JSON.parse(await readFile(root+path,'utf8'));
const index=await readJson('catalogue-index.json');
const release=await readJson('data/RELEASE-v3.json');
const v3=await readJson('data/free-tokens-v3.json');

test('browser follows the index and pinned release to validated v3 data',async()=>{
 const requested=[];
 const fixtures=new Map([
  ['catalogue-index.json',await readFile(root+'catalogue-index.json')],
  [index.latest,await readFile(root+index.latest)],
  [release.file,await readFile(root+release.file)]
 ]);
 const fetcher=async path=>{requested.push(path);const body=fixtures.get(path);return body?new Response(body,{status:200}):new Response('Not found',{status:404});};
 const loaded=await loadCatalogue(fetcher);
 assert.deepEqual(requested,['catalogue-index.json','data/RELEASE-v3.json','data/free-tokens-v3.json']);
 assert.equal(loaded.data.schema,'grandet.free-token-offers/v3');
 assert.equal(loaded.release.compiledAt,'2026-10-06');
 assert.equal(loaded.release.websiteStatus,'DEPLOYMENT_IN_PROGRESS_NOT_YET_ACCEPTED');
 assert.equal(loaded.release.desktopReleaseStatus,'NOT_RELEASED');
 assert.equal(loaded.release.personalVerificationPerformed,false);

 const offer=recordView(loaded.data.offers[1],'third','en');
 assert.equal(offer.title,'Referral reward on the first two top-ups');
 assert.ok(offer.conditions.includes('At most two rewards per referred user; posted within one hour after payment.'));
 assert.deepEqual(offer.requirements.find(item=>item.key==='payment'),{
  key:'payment',
  state:'required',
  note:'Actual top-up/purchase is required, possibly by the referred party; not a no-spend signup reward.'
 });
 assert.deepEqual(offer.statuses.find(item=>item.key==='personalEligibility'),{key:'personalEligibility',value:'unverified'});
});

test('browser rejects bytes that do not match the release SHA-256 pin',async()=>{
 const tampered=Buffer.from(await readFile(root+release.file));tampered[tampered.length-2]^=1;
 const fixtures=new Map([
  ['catalogue-index.json',await readFile(root+'catalogue-index.json')],
  [index.latest,await readFile(root+index.latest)],
  [release.file,tampered]
 ]);
 await assert.rejects(()=>loadCatalogue(async path=>new Response(fixtures.get(path),{status:200})),/SHA-256/);
});

test('v1 and count-only lookalikes cannot pass as the browser catalogue',async()=>{
 const v1=await readJson('data/free-tokens.json');
 assert.equal(v1.officialOffers.length,release.officialRecords);
 assert.equal(v1.offers.length,release.thirdPartyMechanismRecords);
 assert.throws(()=>validateCatalogue(v1,release),/v3 is required/);
 const missingV3Field=structuredClone(v3);delete missingV3Field.offers[0].conditionsLocalized;
 assert.throws(()=>validateCatalogue(missingV3Field,release),/conditionsLocalized/);
});

test('index and release reject unsafe or unlisted repository paths',()=>{
 validateCatalogueIndex(index);validateRelease(release,index);
 for(const latest of ['/data/RELEASE-v3.json','../data/RELEASE-v3.json','https://example.test/release.json','data/%2e%2e/release.json','data\\RELEASE-v3.json']){
  const changed={...index,latest,entries:[...index.entries,latest]};
  assert.throws(()=>validateCatalogueIndex(changed),/relative|unsafe/);
 }
 assert.throws(()=>validateCatalogueIndex({...index,schema:'grandet.machine-entry-index/v2'}),/schema/);
 assert.throws(()=>validateCatalogueIndex({...index,latest:'data/not-listed.json'}),/not listed/);
 assert.throws(()=>validateRelease({...release,schema:'grandet.public-catalogue-release/v2'},index),/schema/);
 for(const file of ['/data/free-tokens-v3.json','../free-tokens-v3.json','data/%2e%2e/free-tokens-v3.json']){
  const changedIndex={...index,entries:[...index.entries,file]};
  assert.throws(()=>validateRelease({...release,file},changedIndex),/relative|unsafe/);
 }
 assert.throws(()=>validateRelease({...release,file:'data/not-listed.json'},index),/not listed/);
});

function response(){
 const result={status:undefined,headers:undefined,body:undefined};
 return {result,writeHead(status,headers){result.status=status;result.headers=headers;},end(body){result.body=body;}};
}
async function request(method,url){
 const res=response();
 await handleRequest({method,url},res,{base:'/explicit-root/',read:async path=>Buffer.from(path)});
 return res.result;
}

test('local server exposes only its explicit v3 and historical allowlist',async()=>{
 assert.deepEqual([...routes.keys()],['/','/app.mjs','/style.css','/catalogue-index.json','/data/RELEASE-v3.json','/data/free-tokens-v3.json','/CATALOGUE-v3.md','/WEBSITE-STATUS.json','/data/free-tokens.json','/data/MANIFEST.json','/CATALOGUE.md']);
 const catalogue=await request('GET','/data/free-tokens-v3.json?download=1');
 assert.equal(catalogue.status,200);
 assert.match(catalogue.headers['Content-Type'],/^application\/json/);
 assert.equal(catalogue.headers['Content-Security-Policy'],"default-src 'self'; object-src 'none'; base-uri 'none'");
 assert.match(catalogue.body.toString(),/data\/free-tokens-v3\.json$/);
 const head=await request('HEAD','/catalogue-index.json');assert.equal(head.status,200);assert.equal(head.body,undefined);
 for(const url of ['/data/../catalogue-index.json','/data/%2e%2e/catalogue-index.json','/README.md','https://example.test/'])assert.equal((await request('GET',url)).status,404);
 assert.equal((await request('POST','/catalogue-index.json')).status,405);
});

test('browser page makes v3 primary and labels v1 as historical',async()=>{
 const html=await readFile(root+'index.html','utf8');
 const latest=html.indexOf('Latest structured catalogue (v3)');
 const historical=html.indexOf('Historical v1 snapshot');
 assert.ok(latest>=0&&historical>latest);
 for(const href of ['CATALOGUE-v3.md','data/free-tokens-v3.json','data/RELEASE-v3.json','catalogue-index.json','CATALOGUE.md','data/free-tokens.json'])assert.ok(html.includes(`href="${href}"`));
 for(const field of ['compiledAt','websiteStatus','desktopReleaseStatus','personalVerificationPerformed'])assert.ok((await readFile(root+'app.mjs','utf8')).includes(field));
});

test('the local server still starts when the checkout is reached through a symlink',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'grandet-serve-'));
 try{
  const linked=path.join(dir,'scripts');
  await symlink(path.join(root,'scripts'),linked,'junction');
  const serveUrl=new URL('../scripts/serve.mjs',import.meta.url).href;
  assert.equal(isMainModule(path.join(root,'scripts','serve.mjs'),serveUrl),true);
  assert.equal(isMainModule(path.join(linked,'serve.mjs'),serveUrl),true);
  assert.equal(isMainModule(path.join(linked,'catalogue.mjs'),serveUrl),false);
  assert.equal(isMainModule(path.join(dir,'missing.mjs'),serveUrl),false);
  assert.equal(isMainModule(undefined,serveUrl),false);
 }finally{await rm(dir,{recursive:true,force:true});}
});

// Minimal stand-in for the DOM calls app.mjs makes, so the page can be rendered without a browser.
function fakeDocument(language='en'){
 const make=tag=>({tag,children:[],textContent:'',value:'',append(...nodes){this.children.push(...nodes);},replaceChildren(...nodes){this.children=nodes;},addEventListener(){}});
 const ids={};
 for(const id of ['summary','site-status','release-meta','filters','query','kind','category','language','status','cards','coverage'])ids[id]=make(`#${id}`);
 ids['site-status'].textContent='Loading current status… / 正在读取当前状态…';
 ids.kind.value='all';ids.category.value='all';ids.language.value=language;
 return {ids,getElementById:id=>ids[id]??null,createElement:make};
}
const textOf=node=>[node.textContent,...node.children.map(textOf)].join('\n');
const repositoryFetcher=(missing=new Set())=>async file=>{
 safeRepositoryPath(file);
 if(missing.has(file))return new Response('Not found',{status:404});
 try{return new Response(await readFile(root+file),{status:200});}catch{return new Response('Not found',{status:404});}
};

test('page shows the current status file next to the compile-time release status',async()=>{
 const site=await readJson(index.website.statusManifest);
 assert.deepEqual(await loadWebsiteStatus(index,repositoryFetcher()),site);
 const doc=fakeDocument();
 await runBrowser(doc,repositoryFetcher());
 const status=textOf(doc.ids['site-status']);
 assert.ok(status.includes(`grandet.ai ${site.status}`),status);
 assert.ok(status.includes(`Desktop client / 桌面客户端 ${site.desktopReleaseStatus}`),status);
 const meta=textOf(doc.ids['release-meta']);
 assert.ok(meta.includes('websiteStatus at compilation / 编制时网站状态\n'+release.websiteStatus),meta);
 assert.ok(meta.includes('desktopReleaseStatus at compilation / 编制时桌面端状态\n'+release.desktopReleaseStatus),meta);
 assert.equal(doc.ids.cards.children.length,release.officialRecords+release.thirdPartyMechanismRecords);
 const html=await readFile(root+'index.html','utf8');
 assert.ok(!html.includes('未通过上线验收'),'index.html must not hard-code a website status');
 assert.ok(html.includes('id="site-status"'));
});

test('catalogue still renders when the status file cannot be read',async()=>{
 const doc=fakeDocument();
 await runBrowser(doc,repositoryFetcher(new Set([index.website.statusManifest])));
 assert.match(doc.ids['site-status'].textContent,/could not be loaded.*HTTP 404/);
 assert.equal(doc.ids.cards.children.length,release.officialRecords+release.thirdPartyMechanismRecords);
 const failed=fakeDocument();
 await runBrowser(failed,repositoryFetcher(new Set(['catalogue-index.json'])));
 assert.match(failed.ids.status.textContent,/Catalogue could not be loaded/);
 assert.equal(failed.ids['site-status'].textContent,'Current status not loaded / 当前状态未读取');
 await assert.rejects(()=>loadWebsiteStatus({...index,website:{statusManifest:'../WEBSITE-STATUS.json'}},repositoryFetcher()),/unsafe/);
});
