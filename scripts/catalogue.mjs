// SPDX-License-Identifier: AGPL-3.0-only
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
export const root=fileURLToPath(new URL('../',import.meta.url));
const hash=b=>createHash('sha256').update(b).digest('hex');
function assert(ok,message){if(!ok)throw new Error(message)}
const calendarPattern=/^(\d{4})-(\d{2})-(\d{2})$/;
const timestampPattern=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?(Z|([+-])(\d{2}):(\d{2}))$/;
const leapYear=year=>year%4===0&&(year%100!==0||year%400===0);
const monthDays=(year,month)=>[31,leapYear(year)?29:28,31,30,31,30,31,31,30,31,30,31][month-1];
export function validateCalendarDate(value,field='date'){
 const match=typeof value==='string'&&calendarPattern.exec(value);
 assert(match,`${field} must be a YYYY-MM-DD calendar date`);
 const [year,month,day]=match.slice(1).map(Number);
 assert(month>=1&&month<=12&&day>=1&&day<=monthDays(year,month),`${field} must be a real YYYY-MM-DD calendar date`);
 return {year,month,day};
}
const epochDay=({year,month,day})=>{year-=month<=2?1:0;const era=Math.floor(year/400),yearOfEra=year-era*400,dayOfYear=Math.floor((153*(month+(month>2?-3:9))+2)/5)+day-1;return era*146097+yearOfEra*365+Math.floor(yearOfEra/4)-Math.floor(yearOfEra/100)+dayOfYear-719468;};
export function validateRfc3339(value,field='timestamp'){
 const match=typeof value==='string'&&timestampPattern.exec(value);
 assert(match,`${field} must be an RFC 3339 timestamp with a Z or numeric timezone offset`);
 const date=validateCalendarDate(match.slice(1,4).join('-'),field);
 const hour=Number(match[4]),minute=Number(match[5]),second=Number(match[6]);
 assert(hour<=23&&minute<=59&&second<=59,`${field} must contain a real RFC 3339 time`);
 const offsetHour=match[8]==='Z'?0:Number(match[10]),offsetMinute=match[8]==='Z'?0:Number(match[11]);
 assert(offsetHour<=23&&offsetMinute<=59,`${field} must contain a valid RFC 3339 timezone offset`);
 const offsetSign=match[9]==='-'?-1:1;
 const seconds=BigInt(epochDay(date))*86400n+BigInt(hour*3600+minute*60+second-offsetSign*(offsetHour*3600+offsetMinute*60));
 return {seconds,fraction:match[7]??''};
}
const compareInstants=(left,right)=>{if(left.seconds!==right.seconds)return left.seconds<right.seconds?-1:1;const width=Math.max(left.fraction.length,right.fraction.length),a=left.fraction.padEnd(width,'0'),b=right.fraction.padEnd(width,'0');return a===b?0:a<b?-1:1;};
const nextDate=({year,month,day},field)=>{day+=1;if(day>monthDays(year,month)){day=1;month+=1;if(month>12){month=1;year+=1;}}assert(year<=9999,`${field} cannot define a conservative upper bound after 9999-12-31`);return `${String(year).padStart(4,'0')}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;};
const validateWindow=(window,field)=>{
 assert(window&&typeof window==='object'&&!Array.isArray(window),`${field} must be an observation window`);
 const first=validateRfc3339(window.first,`${field}.first`),last=validateRfc3339(window.last,`${field}.last`);
 assert(compareInstants(first,last)<=0,`${field}.first must be at or before ${field}.last`);
};
const validateOptionalTimestamp=(record,key,field,nullable=false)=>{
 if(!Object.hasOwn(record,key))return null;
 if(record[key]===null){assert(nullable,`${field}.${key} must be an RFC 3339 timestamp when present`);return null;}
 return validateRfc3339(record[key],`${field}.${key}`);
};
const validateUpperBound=(exact,upper,exactField,upperField)=>{if(exact&&upper)assert(compareInstants(exact,upper)<=0,`${exactField} must be at or before ${upperField}`);};
const validateStructuredDeadline=(deadline,field)=>{
 assert(deadline&&typeof deadline==='object'&&!Array.isArray(deadline),`${field} must be a structured calendar deadline`);
 const date=validateCalendarDate(deadline.date,`${field}.date`);
 assert(deadline.timezone==='unspecified',`${field}.timezone must be "unspecified"`);
 const upper=validateRfc3339(deadline.expiryUpperBound,`${field}.expiryUpperBound`);
 const expected=validateRfc3339(`${nextDate(date,`${field}.date`)}T12:00:00Z`,`${field}.expiryUpperBound`);
 assert(compareInstants(upper,expected)===0,`${field}.expiryUpperBound must equal 12:00:00Z on the day after ${field}.date`);
 return upper;
};
export function validateCatalogueDates(data,field='catalogue'){
 const v1=data.schema==='grandet.github-free-token-catalogue/v1',v3=data.schema==='grandet.free-token-offers/v3';
 validateWindow(data.observationWindow,`${field}.observationWindow`);
 validateRfc3339(data.searchCoverage?.checkedAt,`${field}.searchCoverage.checkedAt`);
 for(const [index,record] of data.officialOffers.entries()){
  const recordField=`${field}.officialOffers[${index}]`;
  validateRfc3339(record.checkedAt,`${recordField}.checkedAt`);
  for(const [evidenceIndex,evidence] of record.evidence.entries())validateRfc3339(evidence.capturedAt,`${recordField}.evidence[${evidenceIndex}].capturedAt`);
  if(v3)assert(Object.hasOwn(record,'activityEndAt'),`${recordField}.activityEndAt must be null or an RFC 3339 timestamp`);
  const exact=validateOptionalTimestamp(record,'activityEndAt',recordField,true);
  const upper=Object.hasOwn(record,'activityDeadline')?validateStructuredDeadline(record.activityDeadline,`${recordField}.activityDeadline`):null;
  validateUpperBound(exact,upper,`${recordField}.activityEndAt`,`${recordField}.activityDeadline.expiryUpperBound`);
 }
 for(const [index,record] of data.offers.entries()){
  const recordField=`${field}.offers[${index}]`;
  validateRfc3339(record.observedAt,`${recordField}.observedAt`);
  if(v1||record.derivedFrom?.observedAt!==undefined)validateRfc3339(record.derivedFrom?.observedAt,`${recordField}.derivedFrom.observedAt`);
  for(const [evidenceIndex,evidence] of record.evidence.entries())validateRfc3339(evidence.observedAt,`${recordField}.evidence[${evidenceIndex}].observedAt`);
  assert(Object.hasOwn(record,'endAt'),`${recordField}.endAt must be null or an RFC 3339 timestamp`);
  const exact=validateOptionalTimestamp(record,'endAt',recordField,true),explicitUpper=validateOptionalTimestamp(record,'expiryUpperBound',recordField);
  const structuredUpper=Object.hasOwn(record,'activityDeadline')?validateStructuredDeadline(record.activityDeadline,`${recordField}.activityDeadline`):null;
  validateUpperBound(exact,explicitUpper,`${recordField}.endAt`,`${recordField}.expiryUpperBound`);
  validateUpperBound(exact,structuredUpper,`${recordField}.endAt`,`${recordField}.activityDeadline.expiryUpperBound`);
 }
 return data;
}
export function validateReleaseDates(release,field='release'){
 validateCalendarDate(release.compiledAt,`${field}.compiledAt`);
 validateWindow(release.observationWindow,`${field}.observationWindow`);
 return release;
}
export function structuredProjection(data){
 const d=structuredClone(data);delete d.derivedFrom;d.schema='grandet.free-token-offers/v2';
 for(const o of d.offers){delete o.fullStatement;delete o.editorialFacts;delete o.derivedFrom;for(const e of o.evidence)delete e.excerpt;}return d;
}
export function validate(data,bytes,manifest){
 assert(data.schema==='grandet.github-free-token-catalogue/v1','Unsupported schema');
 assert(Array.isArray(data.officialOffers)&&data.officialOffers.length===manifest.officialRecords,'Official count mismatch');
 assert(Array.isArray(data.offers)&&data.offers.length===manifest.thirdPartyMechanismRecords,'Third-party count mismatch');
 validateCatalogueDates(data,'data/free-tokens.json');
 assert(hash(Buffer.from(JSON.stringify(structuredProjection(data))))===manifest.structuralSha256,'Structured source fields changed');
 assert(data.derivedFrom?.sha256==='581a6fcd246070d9a69eacdbbebe1630d734c67c3c168ccf3680fbdcf27f405b','Invalid derivation pin');
 for(const o of data.offers){assert(!Object.hasOwn(o,'fullStatement')&&o.evidence.every(e=>!Object.hasOwn(e,'excerpt')),'Vendor text must be omitted');assert(Array.isArray(o.editorialFacts)&&o.editorialFacts.length&&o.derivedFrom?.recordId===o.id,'Missing factual summary/derivation');}

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
