// SPDX-License-Identifier: Apache-2.0
// Checks a saved Skill answer against the fixed answer-quality cases in evals/answer-quality.json.
//
//   node scripts/check-answer.mjs --list
//   node scripts/check-answer.mjs --case E1 --answer answer.txt [--board board.json] [--json]
//
// Text checks only: they catch the known answer problems (CF1–CF4) and are not a full review.
// No network request. Exit code 0 = all run checks passed, 1 = a check failed, 2 = usage error.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const casesPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'evals', 'answer-quality.json');
export const cases = JSON.parse(readFileSync(casesPath, 'utf8'));

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

export const CHECKS = {
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

export function checkAnswer(caseId, answer, board = null) {
  const c = cases.cases.find((x) => x.id === caseId);
  if (!c) throw new Error(`unknown case ${caseId}`);
  // Bold and italic markers can split a phrase ("回到 **Mac 的终端**"); the checks read the text without them.
  const text = answer.replace(/\*\*|__/g, '');
  const results = c.checks.map((id) => {
    const r = CHECKS[id](text, board);
    return r === null ? { id, status: 'NOT_RUN', detail: 'needs --board' } : { id, status: r.pass ? 'PASS' : 'FAIL', detail: r.detail };
  });
  const failed = results.filter((r) => r.status === 'FAIL').length;
  return { schema: 'grandet.skill-answer-check/v1', case: c.id, covers: c.covers, build: cases.build, results, status: failed ? 'FAIL' : results.some((r) => r.status === 'NOT_RUN') ? 'PARTIAL' : 'PASS' };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
  if (args.includes('--list')) {
    for (const c of cases.cases) console.log(`${c.id} (${c.covers.join(', ')}) — ${c.host}\n  setup: ${c.setup}\n  prompt: ${c.prompt}\n`);
    process.exit(0);
  }
  const id = opt('--case'), file = opt('--answer');
  if (!id || !file) { console.error('Usage: node scripts/check-answer.mjs --list | --case <id> --answer <file> [--board <file>] [--json]'); process.exit(2); }
  const boardFile = opt('--board');
  const out = checkAnswer(id, readFileSync(file, 'utf8'), boardFile ? JSON.parse(readFileSync(boardFile, 'utf8')) : null);
  if (args.includes('--json')) console.log(JSON.stringify(out, null, 1));
  else { for (const r of out.results) console.log(`${r.status.padEnd(7)} ${r.id}: ${r.detail}`); console.log(`${out.case}: ${out.status}`); }
  process.exit(out.status === 'FAIL' ? 1 : 0);
}
