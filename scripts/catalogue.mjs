// SPDX-License-Identifier: AGPL-3.0-only
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
export const root=fileURLToPath(new URL('../',import.meta.url));
const hash=b=>createHash('sha256').update(b).digest('hex');
function assert(ok,message){if(!ok)throw new Error(message)}
export function structuredProjection(data){
 const d=structuredClone(data);delete d.derivedFrom;d.schema='grandet.free-token-offers/v2';
 for(const o of d.offers){delete o.fullStatement;delete o.editorialFacts;delete o.derivedFrom;for(const e of o.evidence)delete e.excerpt;}return d;
}
export function validate(data,bytes,manifest){
 assert(hash(Buffer.from(JSON.stringify(structuredProjection(data))))===manifest.structuralSha256,'Structured source fields changed');
 assert(data.derivedFrom?.sha256==='581a6fcd246070d9a69eacdbbebe1630d734c67c3c168ccf3680fbdcf27f405b','Invalid derivation pin');
 for(const o of data.offers){assert(!Object.hasOwn(o,'fullStatement')&&o.evidence.every(e=>!Object.hasOwn(e,'excerpt')),'Vendor text must be omitted');assert(Array.isArray(o.editorialFacts)&&o.editorialFacts.length&&o.derivedFrom?.recordId===o.id,'Missing factual summary/derivation');}

 assert(data.schema==='grandet.github-free-token-catalogue/v1','Unsupported schema');
 assert(Array.isArray(data.officialOffers)&&data.officialOffers.length===manifest.officialRecords,'Official count mismatch');
 assert(Array.isArray(data.offers)&&data.offers.length===manifest.thirdPartyMechanismRecords,'Third-party count mismatch');
 assert(hash(bytes)===manifest.sha256&&bytes.length===manifest.bytes,'Snapshot hash/length mismatch');
 const ids=new Set();
 for(const [kind,records] of [['official',data.officialOffers],['third-party',data.offers]])for(const o of records){
  assert(typeof o.id==='string'&&o.id&&!ids.has(o.id),'Missing or duplicate record ID');ids.add(o.id);
  assert(o.title&&o.benefitText&&o.conditions,'Missing title/benefit/conditions');
  assert(Array.isArray(o.evidence)&&o.evidence.length,'Missing evidence');
  assert(kind==='official'?typeof o.checkedAt==='string':typeof o.observedAt==='string','Missing observation');
  assert(kind==='official'?Array.isArray(o.conditions['zh-CN'])&&Array.isArray(o.conditions.en):Array.isArray(o.conditions),'Invalid conditions');
  if(kind==='third-party')assert(Object.hasOwn(o,'requiresPayment')&&(typeof o.requiresPayment==='boolean'||o.requiresPayment===null)&&Object.hasOwn(o,'endAt')&&o.declaredStatus,'Missing payment/expiry/status');
  for(const e of o.evidence){const u=new URL(e.url??e.sourceUrl);assert(['https:','http:'].includes(u.protocol)&&!u.username&&!u.password,'Unsafe evidence URL');assert(/^[a-f0-9]{64}$/.test(e.bodySha256),'Invalid evidence hash');}
  if(o.claimUrl){const u=new URL(o.claimUrl);assert(u.protocol==='https:'&&!u.username&&!u.password,'Unsafe claim URL');}
 }
 assert(data.searchCoverage?.providers?.length===data.searchCoverage.fixedProviderCount+data.searchCoverage.extensionProviderCount,'Coverage count mismatch');
 return {official:data.officialOffers.length,thirdParty:data.offers.length,coverage:data.searchCoverage.providers.length,sha256:hash(bytes)};
}
const label=v=>typeof v==='string'?v: `${v?.['zh-CN']??''} / ${v?.en??''}`;
const safe=s=>String(s).replace(/[<>]/g,c=>c==='<'?'&lt;':'&gt;');
export function markdown(data){
 let out='# Complete catalogue / 完整目录\n\nDated source statements; eligibility and redemption are not verified. Full conditions and all derived fields follow every entry; vendor full text and excerpts are omitted. No blanket data license is granted; see DATA-LICENSE.md and data/MANIFEST.json.\n\n';
 for(const [title,rows] of [['Official programmes / 官方项目',data.officialOffers],['Third-party mechanisms / 第三方公告机制',data.offers]]){
  out+=`## ${title} (${rows.length})\n\n`;
  rows.forEach((o,i)=>{
   out+=`### ${i+1}. ${safe(label(o.title))}\n\n${safe(label(o.benefitText))}\n\n`;
   out+=`- Provider/source: ${safe(o.provider??o.sourceDomain)}\n- Category: ${safe(o.category)}\n- Observed/checked: ${safe(o.checkedAt??o.observedAt)}\n`;
   if(Object.hasOwn(o,'requiresPayment'))out+=`- Requires payment: ${o.requiresPayment}\n- Declared status: ${safe(o.declaredStatus)}\n- End: ${safe(o.endAt??'unknown')}\n`;
   if(o.billingText)out+=`- Billing: ${safe(label(o.billingText))}\n`;
   const conditions=Array.isArray(o.conditions)?o.conditions:[...o.conditions['zh-CN'],...o.conditions.en];
   out+='\nConditions / 完整条件:\n\n'+conditions.map(c=>`- ${safe(c)}`).join('\n')+'\n\n';
   out+='Sources / 来源:\n\n'+o.evidence.map(e=>`- [${safe(e.title??'Source statement')}](${e.url??e.sourceUrl}) — SHA-256 \`${e.bodySha256}\``).join('\n')+'\n\n';
   if(o.editorialFacts)out+='Grandet factual notes / 事实摘要（非原文）:\n\n'+o.editorialFacts.map(c=>`- ${safe(c)}`).join('\n')+'\n\n';
   if(o.claimUrl)out+=`[Provider programme page / 提供方入口](${o.claimUrl})\n\n`;
   out+='Complete derived record / 衍生公开版全字段（含条件、摘要及证据）:\n\n```json\n'+JSON.stringify(o,null,2)+'\n```\n\n';
  });
 }
 out+='## Search coverage / 检索覆盖\n\n```json\n'+JSON.stringify(data.searchCoverage,null,2)+'\n```\n\n## Observation window / 观察窗口\n\n```json\n'+JSON.stringify(data.observationWindow,null,2)+'\n```\n';return out;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const bytes=await readFile(path.join(root,'data/free-tokens.json'));const data=JSON.parse(bytes);const manifest=JSON.parse(await readFile(path.join(root,'data/MANIFEST.json'),'utf8'));
 console.log(JSON.stringify(validate(data,bytes,manifest)));
 const command=process.argv[2]??'validate';
 if(command==='generate'){const output=markdown(data),dest=path.join(root,'CATALOGUE.md');if(process.argv.includes('--check'))assert(await readFile(dest,'utf8')===output,'Generated catalogue differs');else await writeFile(dest,output);}
 else assert(command==='validate','Usage: node scripts/catalogue.mjs validate|generate [--check]');
}
