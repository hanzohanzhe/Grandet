// SPDX-License-Identifier: Apache-2.0
// Checks a saved Skill answer against the fixed answer-quality cases in evals/answer-quality.json.
//
//   node scripts/check-answer.mjs --list
//   node scripts/check-answer.mjs --case E1 --answer answer.txt [--response response.json] [--json]
//
// Response-aware text checks catch the named contracts in the case file; they are not a full answer review.
// No network request. Exit code 0 = all run checks passed, 1 = a check failed, 2 = usage error.
import { readFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fixtureRoot = join(root, 'evals', 'fixtures');
const casesPath = join(root, 'evals', 'answer-quality.json');
export const cases = JSON.parse(readFileSync(casesPath, 'utf8'));

/** Load and validate a case's pinned fixture. Live cases deliberately return null. */
export function caseFixture(caseId) {
  const c = cases.cases.find((x) => x.id === caseId);
  if (!c) throw new Error(`unknown case ${caseId}`);
  if (!c.fixture) return null;
  const path = resolve(root, c.fixture.path);
  const rel = relative(fixtureRoot, path);
  if (!rel || rel.startsWith('..') || isAbsolute(rel)) throw new Error(`${caseId}: fixture must be below evals/fixtures`);
  const fixture = JSON.parse(readFileSync(path, 'utf8'));
  if (fixture.schema !== 'grandet.skill-answer-fixture/v1') throw new Error(`${caseId}: unsupported fixture schema ${fixture.schema}`);
  if (fixture.id !== c.fixture.id) throw new Error(`${caseId}: fixture id ${fixture.id} does not match ${c.fixture.id}`);
  if (typeof fixture.simulated !== 'boolean') throw new Error(`${caseId}: fixture must declare simulated truthfully`);
  if (!fixture.revision || !fixture.request?.path || !fixture.response?.schema) throw new Error(`${caseId}: incomplete fixture envelope`);
  if (fixture.identity?.responseSchema !== fixture.response.schema) throw new Error(`${caseId}: fixture response schema identity mismatch`);
  for (const key of ['releaseSet', 'evaluatedAt']) {
    if (!fixture.identity?.[key] || fixture.identity[key] !== fixture.response.version?.[key]) throw new Error(`${caseId}: fixture ${key} identity mismatch`);
  }
  return fixture;
}

const has = (text, re) => re.test(text);
const includesSite = (text, site) => text.toLowerCase().includes(String(site).toLowerCase());

/** The board the answer should use: the first unit board with a non-empty `listings.lowest`. */
export function chosenBoard(board) {
  return (board?.boards ?? []).find((b) => (b.listings?.lowest ?? []).length > 0) ?? null;
}

const UNIT = /百万|million|\/\s?M\b|per M\b|\/1M\b/i;
const NUMBER_WORDS = new Set(['input', 'output', 'in', 'out', 'cache', 'read', 'write', 'usd', 'cny', 'price', 'at', 'is', 'from', 'to', 'credit', 'credits', 'only', 'and', 'or', 'of', 'for', 'about', 'costs', 'cost']);
/** Removes model and version names such as "Sonnet 4.6" or "gpt-5.4", so only price-like numbers remain. */
function withoutModelNames(line) {
  return line.replace(/([A-Za-z][A-Za-z0-9]*)([\s-]?)v?(\d+(?:\.\d+)+)/g, (all, word, sep) => (NUMBER_WORDS.has(word.toLowerCase()) && sep ? all : ' '));
}
const DECIMAL = /(?<![\d.])\d+\.\d+(?![\d.])/;

const PERCENT_CLAIM = /(便宜|低|高|贵|省|cheaper|lower|higher|less|more|save|saving)[^\n%]{0,12}\d+(?:\.\d+)?\s*[%％]|\d+(?:\.\d+)?\s*[%％][^\n]{0,12}(便宜|低|高|贵|省|cheaper|lower|higher|off|less|saving)/i;

const CJK = /[\u3400-\u9fff\uf900-\ufaff]/g;
/** Text outside quotes, 「」, parentheses and code: what the answer itself says, not quoted site names. */
const ownWords = (a) => a.replace(/```[\s\S]*?```|`[^`]*`|「[^」]*」|"[^"\n]*"|“[^”\n]*”|\([^)\n]*\)|（[^）\n]*）|<[^>\n]*>/g, ' ');
const lowestPlans = (board) => (chosenBoard(board)?.listings.lowest ?? []).map((r) => r);
const lineFor = (answer, value) => answer.split('\n').find((line) => line.toLowerCase().includes(String(value).toLowerCase())) ?? '';
const dateShown = (line, value) => {
  const iso = String(value ?? '').slice(0, 10), date = new Date(value);
  if (iso && line.includes(iso)) return true;
  if (Number.isNaN(date.valueOf())) return false;
  const m = date.getUTCMonth() + 1, d = date.getUTCDate();
  const en = date.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
  return new RegExp(`(?:${m}\\s*月\\s*${d}\\s*日|${en}\\.?\\s+${d}\\b)`, 'i').test(line);
};
const boardUnit = (unit) => ({
  USD_CREDIT: /USD\s+credit|dollar\s+credit|美元额度/i,
  CNY_CREDIT: /CNY\s+credit|RMB\s+credit|人民币额度/i,
  USD: /USD|dollars?|美元/i,
  CNY: /CNY|RMB|人民币/i,
}[unit] ?? new RegExp(String(unit), 'i'));
const candidateName = (candidate) => candidate?.name ?? candidate?.modelName ?? candidate?.model ?? candidate?.label;
const pagination = (response) => {
  const p = response?.pagination ?? {};
  const page = Number(p.page ?? response?.page), pages = Number(p.pages ?? response?.pages);
  const count = Number(p.count ?? response?.count ?? response?.offers?.length);
  return { page, pages, count, total: Number(p.total ?? response?.total), more: p.hasNext === true || p.nextPage != null || (page > 0 && pages > page) };
};
const officialTierKey = (entry) => {
  if (entry?.contextTier != null) return JSON.stringify(entry.contextTier);
  return entry?.conditions != null ? JSON.stringify(entry.conditions) : null;
};
const explicitlyProhibitsAction = (text, match) => {
  const before = text.slice(0, match.index);
  const boundary = Math.max(
    before.search(/[^.!?;\n。！？；]*$/),
    before.search(/(?:\b(?:but|however)\b|但(?:是)?|不过)[^.!?;\n。！？；]*$/i),
  );
  const scope = text.slice(boundary, match.index + match[0].length);
  return /(?:do\s+not|don't|never|must\s+not|should\s+not|cannot|can't|will\s+not|won't|unable\s+to|avoid)\s+(?:to\s+)?(?:rank|recommend|quote|switch|change|search|choose|select)\b[^.!?;\n。！？；]{0,100}$|(?:不要|不能|不可|不应|切勿|无法|避免)[^.!?;\n。！？；]{0,8}(?:排序|排名|推荐|报价|切换|更换|改查|搜索|选择)[^.!?;\n。！？；]{0,80}$/i.test(scope);
};
const zeroCacheAssumption = (answer) => {
  const pattern = /(?:cache|缓存)(?:\s+(?:read\s+)?)?(?:price|cost|价格|成本)?\s*(?:is|=|按|为|当作|假设)?\s*(?:0|zero|零)|(?:0|zero|零)\s*(?:cache|缓存)(?:\s+(?:price|cost|价格|成本))?/gi;
  for (const match of answer.matchAll(pattern)) {
    const before = answer.slice(0, match.index).search(/[^.!?;\n。！？；]*$/);
    const afterAt = answer.slice(match.index + match[0].length).search(/[.!?;\n。！？；]/);
    const end = afterAt < 0 ? answer.length : match.index + match[0].length + afterAt;
    const clause = answer.slice(before, end);
    const prohibited = /(?:do\s+not|don't|never|must\s+not|should\s+not|cannot|can't|without)\s+(?:assum(?:e|ing)|treat(?:ing)?|set(?:ting)?|count(?:ing)?|regard(?:ing)?|us(?:e|ing))[^.!?;\n]{0,80}(?:cache|zero|\b0\b)|(?:am|are|is|was|were)\s+not\s+(?:assuming|treating|setting|counting|regarding|using)[^.!?;\n]{0,80}(?:cache|zero|\b0\b)|(?:不要|不能|不可|不应|切勿|并未|没有)[^。！？；\n]{0,50}(?:假设|当作|视为|按)[^。！？；\n]{0,50}(?:缓存|零|0)|(?:cache|zero|\b0\b)[^.!?;\n]{0,60}(?:must|should|can)\s+not\s+be\s+(?:assumed|treated|set|counted|regarded|used)/i.test(clause);
    if (!prohibited) return match[0];
  }
  return null;
};

export const CHECKS = {
  answerInEnglish: (a) => {
    const text = ownWords(a), cjk = (text.match(CJK) ?? []).length, latin = (text.match(/[A-Za-z]/g) ?? []).length;
    const share = cjk / Math.max(1, cjk + latin);
    return { pass: share < 0.05, detail: `${Math.round(share * 100)}% of the answer's own words are Chinese (quoted site names excluded)` };
  },
  originalPlanNames: (a, board) => {
    const rows = lowestPlans(board); if (!rows.length) return null;
    const missing = rows.filter((r) => CJK.test(r.plan) && (CJK.lastIndex = 0, !a.includes(r.plan))).map((r) => `${r.sourceId} 「${r.plan}」`);
    CJK.lastIndex = 0;
    return { pass: missing.length === 0, detail: missing.length ? `original group name not given verbatim: ${missing.join(', ')}` : 'original group names given verbatim' };
  },
  planEnBesidePlan: (a, board) => {
    const rows = lowestPlans(board).filter((r) => r.planEn); if (!lowestPlans(board).length) return null;
    if (!rows.length) return { pass: true, detail: 'no planEn in the response (older service)' };
    const missing = rows.filter((r) => !a.toLowerCase().includes(String(r.planEn).toLowerCase())).map((r) => r.sourceId);
    return { pass: missing.length === 0, detail: missing.length ? `planEn not shown next to the group: ${missing.join(', ')}` : 'planEn shown next to the group' };
  },
  originalGroupInCommands: (a, board) => {
    const groups = [...a.matchAll(/--group\s+(?:"([^"]*)"|'([^']*)'|(\S+))/g)].map((m) => m[1] ?? m[2] ?? m[3]);
    if (!groups.length) return { pass: true, detail: 'no --group in the answer' };
    const known = new Set((board?.boards ?? []).flatMap((b) => [...(b.listings?.lowest ?? []), ...(b.listings?.gated ?? []), ...(b.listings?.reference ?? []), ...(b.rows ?? [])])
      .flatMap((r) => [r.plan, r.integration?.tokenGroup]).filter(Boolean));
    const translated = new Set((board?.boards ?? []).flatMap((b) => [...(b.listings?.lowest ?? []), ...(b.rows ?? [])]).map((r) => r.planEn).filter(Boolean));
    const bad = groups.filter((g) => translated.has(g) || (known.size && !known.has(g) && !/^<[^>]+>$/.test(g)));
    return { pass: bad.length === 0, detail: bad.length ? `--group is not the site's original group name: ${bad.join(', ')}` : 'commands use the original group name' };
  },
  lowestRows: (a, board) => {
    const b = chosenBoard(board); if (!b) return null;
    const missing = b.listings.lowest.map((r) => r.sourceId).filter((s) => !includesSite(a, s));
    return { pass: missing.length === 0, detail: missing.length ? `missing lowest sites: ${missing.join(', ')}` : 'all lowest sites listed' };
  },
  referenceRows: (a, board) => {
    const b = chosenBoard(board); if (!b) return null;
    const rows = (b.listings.reference ?? []).slice(0, 2);
    if (!rows.length) return { pass: true, detail: 'no reference rows' };
    const missing = [...new Set(rows.map((r) => r.sourceId))].filter((s) => !includesSite(a, s));
    return { pass: missing.length === 0, detail: missing.length ? `reference rows not listed (a count is not enough): ${missing.join(', ')}` : 'reference rows listed' };
  },
  unitsOnPriceLines: (a) => {
    // A Markdown table row inherits a unit written in its table's header row.
    let headerHasUnit = false, inTable = false;
    const bad = a.split('\n').filter((line) => {
      const row = line.trimStart().startsWith('|');
      if (row && !inTable) headerHasUnit = UNIT.test(line);
      inTable = row;
      return DECIMAL.test(withoutModelNames(line)) && !UNIT.test(line) && !(row && headerHasUnit);
    });
    return { pass: bad.length === 0, detail: bad.length ? `price without unit: ${bad.slice(0, 3).map((l) => l.trim()).join(' | ')}` : 'every price line has a unit' };
  },
  officialShown: (a, board) => {
    if (!board) return null;
    const vendors = [...new Set((board.official ?? []).map((e) => e.vendor))];
    if (!vendors.length) return { pass: true, detail: 'no official price in the response' };
    const missing = vendors.filter((v) => !includesSite(a, v));
    return { pass: missing.length === 0, detail: missing.length ? `official price not shown: ${missing.join(', ')}` : 'official price shown' };
  },
  inferenceShown: (a, board) => {
    if (!board) return null;
    const vendors = [...new Set((board.listings?.inference ?? []).map((e) => e.vendor))];
    if (!vendors.length) return { pass: true, detail: 'no inference-provider price in the response' };
    const missing = vendors.filter((v) => !includesSite(a, v));
    return { pass: missing.length === 0, detail: missing.length ? `inference-provider price not shown: ${missing.join(', ')}` : 'inference-provider price shown' };
  },
  notComparableLine: (a, board) => {
    if (!board) return null;
    if (!(board.official ?? []).length && !(board.listings?.inference ?? []).length) return { pass: true, detail: 'no cash prices in the response' };
    const ok = has(a, /不能直接(相)?比|无法直接(相)?比|单位不同|not directly comparable|cannot be (directly )?compared|can't be (directly )?compared|different units?/i);
    return { pass: ok, detail: ok ? 'says credit and cash cannot be compared directly' : 'missing the line that credit and cash prices cannot be compared directly' };
  },
  noInventedPercent: (a, board) => {
    const given = (board?.listings?.inference ?? []).some((e) => e.cashPercentVsOfficial && (e.cashPercentVsOfficial.input != null || e.cashPercentVsOfficial.output != null));
    if (given) return { pass: true, detail: 'server returned cashPercentVsOfficial' };
    const m = a.match(PERCENT_CLAIM);
    return { pass: !m, detail: m ? `percentage claim the server did not return: "${m[0]}"` : 'no invented percentage' };
  },
  clarificationCandidates: (a, response) => {
    const resolution = response?.resolution ?? response?.error?.resolution;
    if (response?.status !== 'NEEDS_CLARIFICATION' || !resolution?.candidates?.length) return null;
    const wanted = resolution.candidates.slice(0, resolution.totalCandidates <= 2 ? 2 : 0).map(candidateName).filter(Boolean);
    const missing = wanted.filter((name) => !a.toLowerCase().includes(String(name).toLowerCase()));
    const asks = /(which|choose|select|did you mean|你指的是|请选择|选哪|确认.*型号)/i.test(a);
    return { pass: !missing.length && asks, detail: missing.length ? `returned candidates not offered: ${missing.join(', ')}` : asks ? 'asks the user to choose among returned candidates' : 'lists candidates but does not ask the user to choose' };
  },
  clarificationNoPriceRanking: (a, response) => {
    if (response?.status !== 'NEEDS_CLARIFICATION') return null;
    const text = ownWords(a), price = DECIMAL.test(withoutModelNames(text)) || /\$|¥|USD\s*(?:credit|\d)|CNY\s*(?:credit|\d)|美元额度|人民币额度|per million|每百万/i.test(text);
    const ranking = [...text.matchAll(/(最便宜|最低价|首选|推荐(?:的是|选择)?|cheapest|lowest price|ranked first|best choice|recommend(?:ed)?\s+(?:is|the))/gi)]
      .find((match) => !explicitlyProhibitsAction(text, match));
    const faults = [price && 'price not present in the response', ranking && 'candidate ranking before clarification'].filter(Boolean);
    return { pass: !faults.length, detail: faults.length ? faults.join('; ') : 'no price or ranking invented before clarification' };
  },
  emptyBoardReasonAndLink: (a, response, fixture) => {
    const boards = response?.boards ?? [];
    if (!boards.length || boards.some((b) => b.status !== 'NO_ELIGIBLE_RECOMMENDATION')) return null;
    const excluded = Object.entries(response?.coverage?.excluded ?? {}).filter(([, count]) => Number(count) > 0).map(([reason]) => reason);
    const terms = {
      OTHER_BILLING_UNIT: /OTHER_BILLING_UNIT|per[- ](?:image|request|second)|priced by (?:image|request|second)|按(?:张|次|秒)计价/i,
      SOURCE_UPDATE_HELD_PENDING_REVIEW_PREVIOUS_DATA: /SOURCE_UPDATE_HELD_PENDING_REVIEW_PREVIOUS_DATA|await(?:s|ing)? .*review|等待.*复核/i,
      POSSIBLE_UNSET_RATIO_DEFAULT: /POSSIBLE_UNSET_RATIO_DEFAULT|unset default|倍率.*(?:默认|未设置|占位)/i,
    };
    const missing = excluded.filter((reason) => !(terms[reason] ?? new RegExp(reason, 'i')).test(a));
    const model = fixture?.request?.params?.model;
    const link = /https:\/\/grandet\.ai\/leaderboard\/\?[^\s)]*model=/i.test(a) && (!model || a.includes(encodeURIComponent(model)) || a.includes(String(model)));
    return { pass: !missing.length && link, detail: missing.length ? `returned exclusion reason not stated: ${missing.join(', ')}` : link ? 'returned reason and model leaderboard link stated' : 'missing the model leaderboard link' };
  },
  emptyBoardNoFallbackRecommendation: (a, response) => {
    const boards = response?.boards ?? [];
    if (!boards.length || boards.some((b) => b.status !== 'NO_ELIGIBLE_RECOMMENDATION')) return null;
    const text = ownWords(a);
    const switchOrSearch = [...text.matchAll(/(?:改查|换成|切换到|换个模型|搜索全网|外部搜索|Google\s+(?:says|shows)|Bing\s+(?:says|shows)|switch(?:ing)? to (?:another|a different)|try another model|search(?:ed|ing)? (?:the )?web)/gi)]
      .find((match) => !explicitlyProhibitsAction(text, match));
    const recommendation = text.split('\n').map((line) => {
      const match = line.match(/(?:最低价|最低结果)\s*(?:是|为|[:：])|最便宜的是|推荐(?:选择|使用)?\s*[^。\n]+|(?:lowest|cheapest)(?: available)? (?:price|result)?\s*(?:is|:)|I recommend\b/i);
      const allowedNextStep = /I recommend\s+(?:(?:that\s+you\s+)?(?:us(?:e|ing)|open(?:ing)?|follow(?:ing)?|check(?:ing)?)\s+(?:the\s+)?(?:returned\s+)?(?:leaderboard|link)|(?:that\s+you\s+)?(?:wait(?:ing)?|retr(?:y|ying)|try(?:ing)? again)\b)|(?:推荐|建议)(?:你)?(?:使用|打开|查看).{0,12}(?:排行榜|链接)|(?:推荐|建议)(?:你)?(?:等待|稍后(?:再试|重试)?|重试|再试)/i.test(line);
      return { line, match, allowedNextStep };
    }).find(({ line, match, allowedNextStep }) => match && !allowedNextStep && !explicitlyProhibitsAction(line, match)
      && !/(?:no|not|never|without|没有|无|未返回|不存在).{0,20}(?:lowest|cheapest|最低|最便宜)/i.test(line))?.match;
    const faults = [switchOrSearch && `model switch or outside search: "${switchOrSearch[0]}"`, recommendation && `unavailable recommendation: "${recommendation[0]}"`].filter(Boolean);
    return { pass: !faults.length, detail: faults.length ? faults.join('; ') : 'no model switch, outside search, or unavailable recommendation' };
  },
  referenceOnlyRowsQualified: (a, response) => {
    const boards = response?.boards ?? [];
    const rows = boards.flatMap((b) => (b.listings?.reference ?? []).slice(0, 2).map((row) => ({ row, unit: b.unit }))).slice(0, 2);
    if (!rows.length || boards.some((b) => (b.listings?.lowest ?? []).length)) return null;
    const current = /(no current (?:listed )?price|no currently listed price|没有当前.{0,8}(?:列出|挂牌|可列出).{0,6}(?:价格|报价)|当前没有.{0,8}(?:价格|报价))/i.test(a);
    const bad = [];
    for (const { row, unit } of rows) {
      const line = lineFor(a, row.sourceId);
      if (!line) { bad.push(`${row.sourceId}: missing reference row`); continue; }
      if (!line.includes(String(row.blended))) bad.push(`${row.sourceId}: missing returned price`);
      if (!boardUnit(unit).test(line)) bad.push(`${row.sourceId}: missing ${unit} unit`);
      if (!dateShown(line, row.observedAt)) bad.push(`${row.sourceId}: missing observation date`);
      if (!/(reference|stale|older quote|old quote|参考|报价较旧|旧报价)/i.test(line)) bad.push(`${row.sourceId}: not qualified as reference or stale`);
    }
    const lowest = a.split('\n').map((line) => ({ line, match: line.match(/(?:最低结果|最低价|最便宜|lowest result|cheapest|lowest listed price)/i) }))
      .find(({ line, match }) => match && !/(?:not|never|不是|并非|不称为).{0,16}(?:lowest|cheapest|最低|最便宜)|(?:lowest|cheapest|最低|最便宜).{0,16}(?:not|unavailable|没有|不存在)/i.test(line))?.match;
    if (!current) bad.push('does not say there is no current listed price');
    if (lowest) bad.push(`reference called a lowest result: "${lowest[0]}"`);
    return { pass: !bad.length, detail: bad.length ? bad.join('; ') : 'reference rows have dates and qualifications and are not called lowest' };
  },
  unitRowsAndDatesPreserved: (a, response) => {
    if (!response?.boards?.length) return null;
    const bad = [];
    for (const board of response.boards) for (const row of board.listings?.lowest ?? []) {
      const line = lineFor(a, row.sourceId);
      if (!line) { bad.push(`${row.sourceId}: missing row`); continue; }
      if (!line.includes(String(row.blended))) bad.push(`${row.sourceId}: missing returned price`);
      if (!boardUnit(board.unit).test(line) || !UNIT.test(line)) bad.push(`${row.sourceId}: missing ${board.unit} per-million unit`);
      if (!dateShown(line, row.observedAt)) bad.push(`${row.sourceId}: missing observation date`);
    }
    for (const entry of [...(response.official ?? []), ...(response.listings?.inference ?? [])]) {
      const line = lineFor(a, entry.vendor);
      if (!line) { bad.push(`${entry.vendor}: missing cash row`); continue; }
      if (!line.includes(String(entry.input)) || !line.includes(String(entry.output))) bad.push(`${entry.vendor}: missing returned input/output prices`);
      if (!new RegExp(entry.currency, 'i').test(line) || !/(cash|现金)/i.test(line) || !UNIT.test(line)) bad.push(`${entry.vendor}: missing ${entry.currency} cash per-million unit`);
      if (!dateShown(line, entry.observedAt)) bad.push(`${entry.vendor}: missing observation date`);
    }
    return { pass: !bad.length, detail: bad.length ? bad.join('; ') : 'all returned prices retain their units and evidence dates' };
  },
  unlikeUnitsNotCompared: (a, response) => {
    const units = new Set((response?.boards ?? []).map((b) => b.unit));
    if (units.size < 2 || (!(response?.official ?? []).length && !(response?.listings?.inference ?? []).length)) return null;
    const separation = /(different|distinct|separate) units?.{0,50}(cannot|can't|must not|not directly).{0,30}(compare|convert|combine|rank)|(cannot|can't|must not|not directly).{0,40}(compare|convert|combine|rank).{0,40}(different|distinct|separate) units?|单位不同.{0,30}(?:不能|不可|无法).{0,20}(?:比较|换算|合并|排序)|(?:不能|不可|无法).{0,20}(?:比较|换算|合并|排序).{0,30}单位不同/i.test(a);
    const bad = [];
    for (const line of a.split('\n')) {
      const labels = [/USD\s+credit|美元额度/i, /CNY\s+credit|人民币额度/i, /(?:USD|CNY).{0,12}cash|现金/i].filter((re) => re.test(line)).length;
      if (labels > 1 && /(cheaper|lowest|rank|better|便宜|最低|排序|更低|[<>])/i.test(line)) bad.push(`cross-unit ranking: "${line.trim()}"`);
      if (/(convert(?:ed|ing)?\s+(?:at|to|into)|换算(?:成|为)|按.{0,8}汇率|USD equivalent|CNY equivalent)/i.test(line)) bad.push(`cross-unit conversion: "${line.trim()}"`);
    }
    if (/(overall cheapest|cheapest overall|lowest overall|overall lowest|综合最低|总成本最低)/i.test(a)) bad.push('combined overall ranking');
    if (/\b\d+(?:\.\d+)?\s*CNY\s+per\s+USD\b|\b\d+(?:\.\d+)?\s*RMB\s+per\s+(?:USD|dollar)\b/i.test(a)) bad.push('cross-unit exchange rate');
    if (!separation) bad.push('does not state that unlike units remain separate');
    return { pass: !bad.length, detail: bad.length ? bad.slice(0, 3).join('; ') : 'unlike credit and cash units are explicitly kept separate' };
  },
  cacheUnknownIsIncomplete: (a, response) => {
    const count = Number(response?.coverage?.excluded?.CACHE_PRICE_UNKNOWN ?? 0), share = Number(response?.scope?.mix?.cacheRead ?? 0);
    if (!count || !share) return null;
    const names = /cache|缓存/i.test(a), countShown = new RegExp(`\\b${count}\\b`).test(a);
    const incomplete = (/(missing|unknown|not listed|未标|未知|缺少).{0,16}(cache|缓存)|(cache|缓存).{0,16}(missing|unknown|not listed|未标|未知|缺少)/i.test(a))
      && /(excluded|not ranked|incomplete|left out|未参与排序|排除|不完整)/i.test(a);
    const zero = zeroCacheAssumption(a);
    const faults = [!names && 'cache exclusion not named', !countShown && `excluded count ${count} not stated`, !incomplete && 'missing cache prices not explained as excluded or incomplete', zero && `assumes zero cache cost: "${zero}"`].filter(Boolean);
    return { pass: !faults.length, detail: faults.length ? faults.join('; ') : 'missing cache prices and incomplete ranking are explained without a zero-cost assumption' };
  },
  officialTierNotAssumed: (a, response) => {
    const official = response?.official ?? [];
    const tiers = new Set(official.map(officialTierKey).filter((tier) => tier != null));
    if (official.length < 2 || tiers.size < 2) return null;
    const context = /context|上下文/i.test(a), tier = /tier|档位|分层/i.test(a);
    const unresolved = /(not specified|unknown|unresolved|cannot (?:choose|select)|need(?:s)? (?:the )?context|must know (?:the )?context|未提供|未知|未确定|不能选|无法选择|需(?:要)?知道.*上下文)/i.test(a);
    const faults = [!context && 'context condition not named', !tier && 'official price tiers not named', !unresolved && 'silently selects a tier instead of leaving it unresolved'].filter(Boolean);
    return { pass: !faults.length, detail: faults.length ? faults.join('; ') : 'official context tier is left unresolved pending context information' };
  },
  paginationScopeBounded: (a, response) => {
    const p = pagination(response); if (!p.more) return null;
    const pageScope = new RegExp(`page\\s*${p.page}\\s*(?:of|/)\\s*${p.pages}|第\\s*${p.page}\\s*页.{0,10}(?:共|/).{0,4}${p.pages}\\s*页`, 'i').test(a);
    const partial = /(partial|incomplete|bounded|more pages?|not exhaustive|仅(?:列|显示|返回)|只(?:列|显示|返回)|不完整|还有后续页)/i.test(a);
    const countScope = Number.isFinite(p.count) && Number.isFinite(p.total) && new RegExp(`(?:first|showing|returned|前|仅)\\s*${p.count}\\s*(?:of|/|条.{0,4}共)\\s*${p.total}`, 'i').test(a);
    return { pass: pageScope || partial || countScope, detail: pageScope ? `states page ${p.page} of ${p.pages}` : partial ? 'states that the returned scope is partial' : countScope ? `states ${p.count} of ${p.total}` : `more pages exist (${p.page}/${p.pages}) but the answer is not bounded` };
  },
  paginationNoFalseCompleteness: (a, response) => {
    const p = pagination(response); if (!p.more) return null;
    const claims = /(?:this is|these are|以上(?:就是|是)|这(?:就是|是)).{0,20}(?:complete|entire|all|全部|完整).{0,20}(?:list|offers?|results?|列表|优惠|结果)|(?:complete|entire) list\s*(?:is|:)|(?:all|全部)\s*\d*\s*(?:offers?|results?|优惠|结果)(?:\s+(?:are|如下))?/gi;
    const claim = [...a.matchAll(claims)].find((match) => {
      const before = a.slice(0, match.index);
      let start = 0;
      for (const boundary of before.matchAll(/[.!?;\n。！？；]|\b(?:but|however)\b|但(?:是)?|不过/gi)) start = boundary.index + boundary[0].length;
      const clause = a.slice(start, match.index + match[0].length);
      return !/\b(?:this|these)\s+(?:is|are)\s+(?:not|never)\b.{0,16}\b(?:complete|entire|all)\b|(?:这|这些|以上).{0,4}(?:不是|并非).{0,12}(?:完整|全部)|并非.{0,12}(?:全部|完整)/i.test(clause);
    });
    return { pass: !claim, detail: claim ? `claims a partial page is complete: "${claim[0]}"` : 'does not claim the partial page is complete' };
  },
  usesExecutor: (a) => ({ pass: has(a, /connect\.mjs/), detail: 'mentions scripts/connect.mjs' }),
  downloadsSkill: (a) => ({ pass: has(a, /releases\/download\/skill-v0\.3\.0-build\.[\w.]+\/grandet-api-price-finder-0\.3\.0\.(skill|zip)/), detail: 'gives the Skill download address' }),
  noHandProfileEdit: (a) => {
    const m = a.match(/>>\s*["']?(~|\$HOME|\$\{HOME\})?\/?\.(zshrc|bashrc|bash_profile|profile|zprofile)\b|echo\s+['"]?export\s+[A-Z_][A-Z0-9_]*=/);
    return { pass: !m, detail: m ? `hand-written profile edit: "${m[0]}"` : 'no hand-written profile edit' };
  },
  notClaimedConnected: (a) => {
    const claimed = a.match(/(已经?接好了?|已连接|接入完成|已完成接入|connected successfully|is now connected|setup is complete)/i);
    const waiting = has(a, /(等你|等待你|你来运行|你运行|在你(自己)?的(电脑|终端|Mac)|自己的终端|在 ?Mac ?(上|终端)|尚未接[通好]|还没接[通好]|尚未连接|还没连接|运行后|waiting for you|on your (own )?(computer|terminal|Mac)|in your (own )?terminal|run (these|this|the following)|not connected yet)/i);
    return { pass: !claimed && waiting, detail: claimed ? `claims it is connected: "${claimed[0]}"` : waiting ? 'says the user runs the commands' : 'does not say the user runs the commands on their computer' };
  },
  noKeyInCurl: (a) => {
    const m = a.match(/curl[^\n]*(-H|--header)\s*["']?Authorization/i);
    return { pass: !m, detail: m ? 'key passed to curl as a command-line header' : 'no key in a curl argument' };
  },
  noKeyArgument: (a) => {
    const m = a.match(/connect\.mjs[^\n]*--key(?!-file)\b|(api[_-]?key|token)\s*[=:]\s*["']?sk-[A-Za-z0-9]|\bsk-[A-Za-z0-9_-]{16,}/i);
    return { pass: !m, detail: m ? `key in a command or the text: "${m[0].slice(0, 40)}"` : 'no key in an argument or the text' };
  },
  noKeyRequestInChat: (a) => {
    const m = a.match(/(把|将)?\s*(你的)?\s*(API\s*)?Key\s*(发|贴|粘贴|告诉|给)(给)?我|(send|paste|share|give)\s+(me\s+)?(your\s+)?(api\s+)?key/i);
    return { pass: !m, detail: m ? `asks for the key in chat: "${m[0]}"` : 'does not ask for the key in chat' };
  },
  keyCommandGiven: (a) => {
    const ok = has(a, /connect\.mjs["']?\s+key\b|(key|Key)\s*命令|存\s*Key\s*的命令|key command|stores? the key/i);
    return { pass: ok, detail: ok ? 'gives the executor key step' : 'missing the key command the user runs' };
  },
  freeCheckNamed: (a) => {
    const ok = has(a, /免费[^\n]{0,8}检查|不扣(费|额度|钱)|不花(钱|额度)|不消耗额度|without spending|free (model[- ]list |connection |key )?check|check(s|ed)? (it )?(for free|without spending)|no credit|doesn't spend|does not spend/i);
    return { pass: ok, detail: ok ? 'names the free check' : 'does not say the check is free' };
  },
  paidTestSeparated: (a) => {
    // Some sentence must say a real message or request spends credit (not "不消耗额度").
    // Consent for an agent-sent test only matters after a passed free check, which a fake key never reaches.
    const ok = /(?<![不免没無无]|不会|不用|无需|without |no |doesn't |does not )(扣|花|消耗|spends?|costs?)[^\n]{0,20}(额度|费|钱|credit)/i.test(a);
    return { pass: ok, detail: ok ? 'says a real request spends credit' : 'does not say a real request spends credit' };
  },
  notCalledWorking: (a) => {
    const m = a.match(/(免费检查|free check)[^\n]{0,30}(说明|证明|表示|means|shows)[^\n]{0,10}(已经?)?(能用|可用|接好|works|working|is connected)/i);
    return { pass: !m, detail: m ? `calls the free check a working connection: "${m[0]}"` : 'free check not called a working connection' };
  },
};

export function checkAnswer(caseId, answer, response = null) {
  const c = cases.cases.find((x) => x.id === caseId);
  if (!c) throw new Error(`unknown case ${caseId}`);
  const fixture = caseFixture(caseId);
  const data = fixture?.response ?? response;
  // Bold and italic markers can split a phrase ("回到 **Mac 的终端**"); the checks read the text without them.
  const text = answer.replace(/\*\*|__/g, '');
  const results = c.checks.map((id) => {
    const r = CHECKS[id](text, data, fixture);
    return r === null ? { id, status: 'NOT_RUN', detail: c.fixture ? 'fixture does not contain the required response state' : 'needs --board' } : { id, status: r.pass ? 'PASS' : 'FAIL', detail: r.detail };
  });
  const failed = results.filter((r) => r.status === 'FAIL').length;
  return { schema: 'grandet.skill-answer-check/v1', case: c.id, covers: c.covers, build: cases.build,
    ...(fixture ? { fixture: { id: fixture.id, revision: fixture.revision, simulated: fixture.simulated, evaluation: fixture.identity.evaluation } } : {}),
    results, status: failed ? 'FAIL' : results.some((r) => r.status === 'NOT_RUN') ? 'PARTIAL' : 'PASS' };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
  if (args.includes('--list')) {
    for (const c of cases.cases) console.log(`${c.id} (${c.covers.join(', ')}) — ${c.host}\n  setup: ${c.setup}\n  prompt: ${c.prompt}\n`);
    process.exit(0);
  }
  const id = opt('--case'), file = opt('--answer');
  if (!id || !file) { console.error('Usage: node scripts/check-answer.mjs --list | --case <id> --answer <file> [--response <file> | --board <file>] [--json]'); process.exit(2); }
  const responseFile = opt('--response'), boardFile = opt('--board');
  if (responseFile && boardFile) { console.error('Use only one of --response or --board'); process.exit(2); }
  const dataFile = responseFile ?? boardFile;
  const selected = cases.cases.find((c) => c.id === id);
  if (dataFile && selected?.fixture) { console.error(`${id} uses pinned fixture ${selected.fixture.id}; --response/--board is not allowed`); process.exit(2); }
  const out = checkAnswer(id, readFileSync(file, 'utf8'), dataFile ? JSON.parse(readFileSync(dataFile, 'utf8')) : null);
  if (args.includes('--json')) console.log(JSON.stringify(out, null, 1));
  else { if (out.fixture) console.log(`FIXTURE ${out.fixture.id} revision ${out.fixture.revision} · simulated: ${out.fixture.simulated}`); for (const r of out.results) console.log(`${r.status.padEnd(7)} ${r.id}: ${r.detail}`); console.log(`${out.case}: ${out.status}`); }
  process.exit(out.status === 'FAIL' ? 1 : 0);
}
