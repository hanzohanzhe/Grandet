// SPDX-License-Identifier: AGPL-3.0-only
const INDEX_SCHEMA='grandet.machine-entry-index/v1';
const RELEASE_SCHEMA='grandet.public-catalogue-release/v1';
const CATALOGUE_SCHEMA='grandet.free-token-offers/v3';
const REQUIREMENTS=['card','identity','payment','invite','application','renewal'];
const REQUIREMENT_STATES=new Set(['unknown','required','not-required','conditional']);

const assert=(ok,message)=>{if(!ok)throw new Error(message);};
const object=(value,message)=>{assert(value&&typeof value==='object'&&!Array.isArray(value),message);return value;};
const text=(value,message)=>{assert(typeof value==='string'&&value.length>0,message);return value;};
const localized=(value,message)=>{object(value,message);text(value['zh-CN'],message);text(value.en,message);return value;};
const localizedList=(value,message)=>{object(value,message);for(const lang of ['zh-CN','en'])assert(Array.isArray(value[lang])&&value[lang].every(v=>typeof v==='string'&&v.length>0),message);return value;};
const safeHttpUrl=(value,message,httpsOnly=false)=>{let url;try{url=new URL(value);}catch{throw new Error(message);}assert((httpsOnly?url.protocol==='https:':['https:','http:'].includes(url.protocol))&&!url.username&&!url.password,message);return url;};

export function safeRepositoryPath(value,label='Repository path'){
 text(value,`${label} is missing`);
 assert(!value.startsWith('/')&&!value.includes('\\')&&!value.includes('?')&&!value.includes('#'),`${label} must be repository-relative`);
 const segments=value.split('/');
 assert(segments.every(segment=>segment&&segment!=='.'&&segment!=='..'&&/^[A-Za-z0-9._-]+$/.test(segment)),`${label} is unsafe`);
 return value;
}

export function validateCatalogueIndex(index){
 object(index,'Catalogue index must be an object');
 assert(index.schema===INDEX_SCHEMA,`Unsupported catalogue index schema: ${index.schema??'missing'}`);
 assert(Array.isArray(index.entries)&&index.entries.length>0,'Catalogue index entries are missing');
 const entries=index.entries.map((entry,i)=>safeRepositoryPath(entry,`Catalogue index entry ${i}`));
 assert(new Set(entries).size===entries.length,'Catalogue index entries must be unique');
 const latest=safeRepositoryPath(index.latest,'Latest release path');
 assert(latest.endsWith('.json'),'Latest release path must be JSON');
 assert(entries.includes(latest),'Latest release path is not listed in catalogue index entries');
 if(index.website?.statusManifest!==undefined)safeRepositoryPath(index.website.statusManifest,'Website status manifest path');
 return index;
}

export function validateRelease(release,index){
 object(release,'Release metadata must be an object');
 assert(release.schema===RELEASE_SCHEMA,`Unsupported release metadata schema: ${release.schema??'missing'}`);
 text(release.compiledAt,'Release compiledAt is missing');
 const file=safeRepositoryPath(release.file,'Pinned catalogue data path');
 assert(file.endsWith('.json'),'Pinned catalogue data path must be JSON');
 if(index)assert(index.entries.includes(file),'Pinned catalogue data path is not listed in catalogue index entries');
 assert(/^[a-f0-9]{64}$/.test(release.sha256??''),'Release SHA-256 pin is invalid');
 for(const key of ['bytes','officialRecords','thirdPartyMechanismRecords'])assert(Number.isSafeInteger(release[key])&&release[key]>=0,`Release ${key} is invalid`);
 for(const key of ['websiteStatus','desktopReleaseStatus'])text(release[key],`Release ${key} is missing`);
 assert(typeof release.personalVerificationPerformed==='boolean','Release personalVerificationPerformed must be boolean');
 text(release.dataLicense,'Release dataLicense is missing');
 if(release.previousRelease!==undefined)safeRepositoryPath(release.previousRelease,'Previous release path');
 return release;
}

function validateRecord(record,kind,index){
 object(record,`Record ${index} must be an object`);
 text(record.id,`Record ${index} ID is missing`);
 text(record.category,`Record ${record.id} category is missing`);
 assert(Array.isArray(record.evidence)&&record.evidence.length>0,`Record ${record.id} evidence is missing`);
 for(const evidence of record.evidence){object(evidence,`Record ${record.id} evidence is invalid`);safeHttpUrl(evidence.url??evidence.sourceUrl,`Record ${record.id} evidence URL is unsafe`);assert(/^[a-f0-9]{64}$/.test(evidence.bodySha256??''),`Record ${record.id} evidence SHA-256 is invalid`);}
 if(record.claimUrl!==null&&record.claimUrl!==undefined)safeHttpUrl(record.claimUrl,`Record ${record.id} claim URL is unsafe`,true);
 object(record.requirements,`Record ${record.id} requirements are missing`);
 assert(Object.keys(record.requirements).sort().join(',')===[...REQUIREMENTS].sort().join(','),`Record ${record.id} requirements are incomplete`);
 for(const key of REQUIREMENTS){
  const requirement=object(record.requirements[key],`Record ${record.id} ${key} requirement is missing`);
  assert(REQUIREMENT_STATES.has(requirement.state),`Record ${record.id} ${key} requirement state is invalid`);
  localized(requirement.note,`Record ${record.id} ${key} requirement note is not localized`);
 }
 text(record.personalEligibility,`Record ${record.id} personalEligibility is missing`);
 text(record.documentStatus,`Record ${record.id} documentStatus is missing`);
 text(record.activityStatus,`Record ${record.id} activityStatus is missing`);
 if(kind==='third'){
  localized(record.titleText,`Record ${record.id} titleText is not localized`);
  localized(record.benefitTextLocalized,`Record ${record.id} benefitTextLocalized is not localized`);
  localizedList(record.conditionsLocalized,`Record ${record.id} conditionsLocalized is invalid`);
 }else{
  localized(record.title,`Record ${record.id} title is not localized`);
  localized(record.benefitText,`Record ${record.id} benefitText is not localized`);
  localizedList(record.conditions,`Record ${record.id} conditions are invalid`);
 }
}

export function validateCatalogue(data,release){
 object(data,'Catalogue must be an object');
 assert(data.schema===CATALOGUE_SCHEMA,`Unsupported catalogue schema: ${data.schema??'missing'}; v3 is required`);
 assert(Array.isArray(data.officialOffers),'Catalogue officialOffers are missing');
 assert(Array.isArray(data.offers),'Catalogue offers are missing');
 assert(data.officialOffers.length===release.officialRecords,'Official record count does not match release metadata');
 assert(data.offers.length===release.thirdPartyMechanismRecords,'Third-party record count does not match release metadata');
 const ids=new Set();
 for(const [kind,records] of [['official',data.officialOffers],['third',data.offers]])records.forEach((record,index)=>{validateRecord(record,kind,index);assert(!ids.has(record.id),`Duplicate record ID: ${record.id}`);ids.add(record.id);});
 return data;
}

const hex=buffer=>[...new Uint8Array(buffer)].map(byte=>byte.toString(16).padStart(2,'0')).join('');
export async function sha256(buffer){
 assert(globalThis.crypto?.subtle,'SHA-256 is unavailable in this browser');
 return hex(await globalThis.crypto.subtle.digest('SHA-256',buffer));
}

async function fetchJson(fetcher,path,label){
 const response=await fetcher(path);
 if(!response.ok)throw new Error(`${label} returned HTTP ${response.status}`);
 try{return await response.json();}catch{throw new Error(`${label} is not valid JSON`);}
}

export async function loadCatalogue(fetcher=globalThis.fetch){
 assert(typeof fetcher==='function','Fetch is unavailable in this browser');
 const index=validateCatalogueIndex(await fetchJson(fetcher,'catalogue-index.json','Catalogue index'));
 const release=validateRelease(await fetchJson(fetcher,index.latest,'Release metadata'),index);
 const response=await fetcher(release.file);
 if(!response.ok)throw new Error(`Pinned catalogue data returned HTTP ${response.status}`);
 const bytes=await response.arrayBuffer();
 assert(bytes.byteLength===release.bytes,'Pinned catalogue byte count does not match release metadata');
 assert(await sha256(bytes)===release.sha256,'Pinned catalogue SHA-256 does not match release metadata');
 let data;
 try{data=JSON.parse(new TextDecoder().decode(bytes));}catch{throw new Error('Pinned catalogue data is not valid JSON');}
 return {index,release,data:validateCatalogue(data,release)};
}

const valueFor=(value,lang)=>typeof value==='string'?value:value?.[lang]??'';
export function recordView(record,kind,lang){
 const third=kind==='third';
 return {
  title:valueFor(third?record.titleText:record.title,lang),
  benefit:valueFor(third?record.benefitTextLocalized:record.benefitText,lang),
  conditions:(third?record.conditionsLocalized:record.conditions)[lang],
  requirements:REQUIREMENTS.map(key=>({key,state:record.requirements[key].state,note:record.requirements[key].note[lang]})),
  statuses:['personalEligibility','documentStatus','activityStatus','rewardKind'].filter(key=>Object.hasOwn(record,key)).map(key=>({key,value:record[key]}))
 };
}

const requirementLabels={card:'Card / 银行卡',identity:'Identity / 实名',payment:'Payment / 付费',invite:'Invitation / 邀请',application:'Application / 申请',renewal:'Renewal / 续期'};

export async function runBrowser(doc=document,fetcher=globalThis.fetch){
 const $=id=>doc.getElementById(id);
 const el=(tag,content)=>{const node=doc.createElement(tag);if(content!==undefined)node.textContent=content;return node;};
 try{
  const {release,data}=await loadCatalogue(fetcher);
  const rows=[...data.officialOffers.map(record=>({record,kind:'official'})),...data.offers.map(record=>({record,kind:'third'}))];
  for(const category of [...new Set(rows.map(row=>row.record.category))].sort()){const option=el('option',category);option.value=category;$('category').append(option);}
  $('coverage').textContent=JSON.stringify(data.searchCoverage,null,2);
  const metadata=[
   ['compiledAt (compilation date, not a new observation)',release.compiledAt],
   ['websiteStatus',release.websiteStatus],
   ['desktopReleaseStatus',release.desktopReleaseStatus],
   ['personalVerificationPerformed',String(release.personalVerificationPerformed)]
  ];
  for(const [key,value] of metadata)$('release-meta').append(el('dt',key),el('dd',value));
  $('summary').textContent=`${release.officialRecords} official programmes + ${release.thirdPartyMechanismRecords} third-party mechanisms · Full conditions retained; individual eligibility or redemption is not guaranteed. Source units are not converted to tokens or cash. / 保留完整条件，不保证个人资格或实际领取。原单位不换算 Token/现金。`;
  function render(){
   const lang=$('language').value,q=$('query').value.toLocaleLowerCase();
   const selected=rows.filter(({record,kind})=>($('kind').value==='all'||kind===$('kind').value)&&($('category').value==='all'||record.category===$('category').value)&&JSON.stringify(record).toLocaleLowerCase().includes(q));
   $('cards').replaceChildren();
   $('status').textContent=`${selected.length} / ${rows.length} records · Snapshot, not live eligibility / 快照，非实时资格检查`;
   for(const {record,kind} of selected){
    const view=recordView(record,kind,lang),card=el('article');
    card.append(el('h2',view.title),el('p',`${kind==='official'?'Official / 官方':'Third-party / 第三方'} · ${record.provider??record.sourceDomain} · ${record.category}`),el('p',view.benefit));
    card.append(el('p',`Observed/checked: ${record.checkedAt??record.observedAt}`));
    if(Object.hasOwn(record,'requiresPayment'))card.append(el('p',`Requires payment / 需付费: ${record.requiresPayment??'unknown / 未知'} · Declared status: ${record.declaredStatus} · End: ${record.endAt??'unknown / 未知'}`));
    if(record.billingText)card.append(el('p',valueFor(record.billingText,lang)));
    const statuses=el('ul');for(const status of view.statuses)statuses.append(el('li',`${status.key}: ${status.value}`));card.append(el('h3','v3 status fields / v3 状态字段'),statuses);
    const requirements=el('ul');for(const requirement of view.requirements)requirements.append(el('li',`${requirementLabels[requirement.key]} — ${requirement.state}: ${requirement.note}`));card.append(el('h3','Structured requirements / 结构化条件'),requirements);
    const conditions=el('ul');for(const condition of view.conditions)conditions.append(el('li',condition));card.append(el('h3','Localized conditions / 本地化完整条件'),conditions);
    for(const evidence of record.evidence){const url=new URL(evidence.url??evidence.sourceUrl);if(!['https:','http:'].includes(url.protocol)||url.username||url.password)continue;const link=el('a',evidence.title??'Source statement / 来源声明');link.href=url.href;link.rel='noreferrer noopener';card.append(link,el('p',`SHA-256: ${evidence.bodySha256}`));}
    const details=el('details');details.append(el('summary','Complete derived fields / 衍生公开版全字段'),el('pre',JSON.stringify(record,null,2)));card.append(details);$('cards').append(card);
   }
  }
  $('filters').addEventListener('submit',event=>event.preventDefault());$('filters').addEventListener('input',render);render();
 }catch(error){$('status').textContent=`Catalogue could not be loaded: ${error.message}`;}
}

if(typeof document!=='undefined')runBrowser();
