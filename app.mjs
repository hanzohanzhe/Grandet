// SPDX-License-Identifier: AGPL-3.0-only
import {statusLines, statusUnavailable} from './status-view.mjs';
import {stringsFor} from './strings.mjs';

const $=id=>document.getElementById(id);
const el=(tag,text)=>{const e=document.createElement(tag);e.textContent=text;return e;};
const format=(template,values)=>template.replace(/\{(\w+)\}/g,(_,key)=>values[key]??'');
const statusElement=$('website-status');
const renderWebsiteStatus=lines=>{statusElement.textContent=lines.join('\n');};
const statusPromise=fetch('WEBSITE-STATUS.json')
 .then(response=>{if(!response.ok)throw new Error(`HTTP ${response.status}`);return response.json();})
 .then(status=>statusLines(status,'WEBSITE-STATUS.json'))
 .catch(()=>statusUnavailable())
 .then(renderWebsiteStatus);
$('status').textContent=stringsFor($('language').value).loading;
try {
 const response=await fetch('data/free-tokens.json');if(!response.ok)throw new Error(`HTTP ${response.status}`);const data=await response.json();
 const rows=[...data.officialOffers.map(o=>({o,kind:'official'})),...data.offers.map(o=>({o,kind:'third'}))];
 for(const c of [...new Set(rows.map(r=>r.o.category))].sort()){const option=el('option',c);option.value=c;$('category').append(option);}
 $('coverage').textContent=JSON.stringify(data.searchCoverage,null,2);
 function render(){const lang=$('language').value;const t=stringsFor(lang);const label=v=>typeof v==='string'?v:v?.[lang]??v?.['zh-CN']??'';const q=$('query').value.toLocaleLowerCase();
  document.documentElement.lang=lang;document.title=t.documentTitle;
  $('heading').textContent=t.heading;$('subtitle').textContent=t.subtitle;
  $('markdown-link').textContent=t.markdownLink;$('json-link').textContent=t.jsonLink;
  $('search-label').textContent=t.searchLabel;$('query').placeholder=t.searchPlaceholder;
  $('source-label').textContent=t.sourceLabel;$('kind').options[0].textContent=t.allOption;$('kind').options[1].textContent=t.officialOption;$('kind').options[2].textContent=t.thirdPartyOption;
  $('category-label').textContent=t.categoryLabel;$('category').options[0].textContent=t.allOption;
  $('language-label').textContent=t.languageLabel;$('language').options[0].textContent=t.chineseLanguageOption;$('language').options[1].textContent=t.englishLanguageOption;
  $('coverage-heading').textContent=t.coverageHeading;
  const selected=rows.filter(r=>($('kind').value==='all'||r.kind===$('kind').value)&&($('category').value==='all'||r.o.category===$('category').value)&&JSON.stringify(r.o).toLocaleLowerCase().includes(q));
  $('cards').replaceChildren();const summary=format(t.resultSummary,{count:selected.length,total:rows.length});$('status').textContent=format(t.statusLine,{summary,snapshotNote:t.snapshotNote});
  for(const {o,kind} of selected){const card=el('article','');card.append(el('h2',label(o.title)),el('p',`${kind==='official'?t.official:t.thirdParty} · ${o.provider??o.sourceDomain} · ${o.category}`),el('p',label(o.benefitText)));
   card.append(el('p',`${t.observed}: ${o.checkedAt??o.observedAt}`));
   if(Object.hasOwn(o,'requiresPayment'))card.append(el('p',`${t.requiresPayment}: ${o.requiresPayment??t.unknown} · ${t.status}: ${o.declaredStatus} · ${t.end}: ${o.endAt??t.unknown}`));
   if(o.billingText)card.append(el('p',label(o.billingText)));
   if(o.editorialFacts){const facts=el('ul','');for(const fact of o.editorialFacts)facts.append(el('li',fact));card.append(el('h3',t.factualNotes),facts);}
   const list=el('ul','');for(const c of (Array.isArray(o.conditions)?o.conditions:o.conditions[lang]??[]))list.append(el('li',c));card.append(list);
   for(const e of o.evidence){const u=new URL(e.url??e.sourceUrl);if(!['https:','http:'].includes(u.protocol))continue;const a=el('a',e.title??t.sourceStatement);a.href=u.href;a.rel='noreferrer noopener';card.append(a,el('p',`${t.sha256}: ${e.bodySha256}`));}
   const details=el('details','');details.append(el('summary',t.completeDetails),el('pre',JSON.stringify(o,null,2)));card.append(details);$('cards').append(card);
  }
 }
 $('filters').addEventListener('submit',e=>e.preventDefault());$('filters').addEventListener('input',render);render();
}catch(e){const t=stringsFor($('language')?.value);$('status').textContent=format(t.loadError,{message:e.message});}
await statusPromise;
