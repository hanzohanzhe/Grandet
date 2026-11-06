// SPDX-License-Identifier: AGPL-3.0-only
import { matchRow } from './catalogue-ui.mjs';
const $=id=>document.getElementById(id);
const el=(tag,text)=>{const e=document.createElement(tag);e.textContent=text;return e;};
try {
 const response=await fetch('data/free-tokens.json');if(!response.ok)throw new Error(`HTTP ${response.status}`);const data=await response.json();
 const rows=[...data.officialOffers.map(o=>({o,kind:'official'})),...data.offers.map(o=>({o,kind:'third'}))];
 for(const c of [...new Set(rows.map(r=>r.o.category))].sort()){const option=el('option',c);option.value=c;$('category').append(option);}
 $('coverage').textContent=JSON.stringify(data.searchCoverage,null,2);
 function render(){const lang=$('language').value;const label=v=>typeof v==='string'?v:v?.[lang]??v?.['zh-CN']??'';const q=$('query').value;
  const selected=rows.map(r=>({r,match:matchRow(r,q,lang,{allFields:$('all-fields').checked})})).filter(({r,match})=>
   ($('kind').value==='all'||r.kind===$('kind').value)&&
   ($('category').value==='all'||r.o.category===$('category').value)&&
   (!q.trim()||match.matched!==null));
  $('cards').replaceChildren();$('status').textContent=`${selected.length} / ${rows.length} records · 快照，非实时资格检查 / Snapshot, not live eligibility`;
  for(const {r:{o,kind},match} of selected){const card=el('article','');card.append(el('h2',label(o.title)),el('p',`${kind==='official'?'Official / 官方':'Third-party / 第三方'} · ${o.provider??o.sourceDomain} · ${o.category}`),el('p',label(o.benefitText)));
   if(match.matched)card.append(el('small',match.hidden?`${lang==='en'?'Matched: hidden field':'匹配：隐藏字段'} (${fieldLabel(match.matched,lang)})`:`${lang==='en'?'Matched: ':'匹配：'}${fieldLabel(match.matched,lang)}`));
   card.append(el('p',`Observed/checked: ${o.checkedAt??o.observedAt}`));
   if(Object.hasOwn(o,'requiresPayment'))card.append(el('p',`Requires payment / 需付费: ${o.requiresPayment??'unknown / 未知'} · Status: ${o.declaredStatus} · End: ${o.endAt??'unknown / 未知'}`));
   if(o.billingText)card.append(el('p',label(o.billingText)));
   if(o.editorialFacts){const facts=el('ul','');for(const fact of o.editorialFacts)facts.append(el('li',fact));card.append(el('h3','Grandet factual notes / 事实摘要（非原文）'),facts);}
   const list=el('ul','');for(const c of (Array.isArray(o.conditions)?o.conditions:o.conditions[lang]??[]))list.append(el('li',c));card.append(list);
   for(const e of o.evidence){const u=new URL(e.url??e.sourceUrl);if(!['https:','http:'].includes(u.protocol))continue;const a=el('a',e.title??'Source statement / 来源声明');a.href=u.href;a.rel='noreferrer noopener';card.append(a,el('p',`SHA-256: ${e.bodySha256}`));}
   const details=el('details','');details.append(el('summary','Complete derived fields / 衍生公开版全字段'),el('pre',JSON.stringify(o,null,2)));card.append(details);$('cards').append(card);
  }
 }
 function fieldLabel(field,lang){const labels={title:['标题','title'],provider:['提供方','provider'],sourceDomain:['来源域名','source domain'],category:['类别','category'],benefitText:['权益说明','benefit'],billingText:['计费说明','billing'],conditions:['条件','conditions'],editorialFacts:['事实摘要','editorial facts'],'evidence.title':['证据标题','evidence title'],'hidden field':['隐藏字段','hidden field']};return labels[field]?.[lang==='en'?1:0]??field;}
 $('filters').addEventListener('submit',e=>e.preventDefault());$('filters').addEventListener('input',render);render();
}catch(e){$('status').textContent=`Catalogue could not be loaded: ${e.message}`;}
