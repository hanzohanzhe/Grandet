#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
// Read the price snapshot bundled with this Skill (data/price-snapshot.json). Use it only when grandet.ai cannot be
// reached (MCP and HTTP both failed). It makes no network request and writes nothing.
//   node scripts/offline-lookup.mjs --model claude-sonnet-4-6
//   node scripts/offline-lookup.mjs --free gemini
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const file = join(here, '..', 'data', 'price-snapshot.json');
const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const print = (value, code = 0) => { process.stdout.write(`${JSON.stringify(value, null, 2)}\n`); process.exitCode = code; };
const usage = 'Usage: node scripts/offline-lookup.mjs --model <model name> | --free <query>';

let snapshot;
try {
  snapshot = JSON.parse(await readFile(file, 'utf8'));
} catch {
  print({ schema: 'grandet.offline-lookup/v1', status: 'SNAPSHOT_NOT_INCLUDED', next: 'This copy has no price snapshot. Give https://grandet.ai/ and say the price could not be checked.' }, 2);
  process.exit();
}
if (snapshot.schema !== 'grandet.price-snapshot/v1') { print({ schema: 'grandet.offline-lookup/v1', status: 'SNAPSHOT_SCHEMA_UNKNOWN' }, 2); process.exit(); }

const takenOn = String(snapshot.asOf).slice(0, 10);
const ageDays = Math.floor((Date.now() - Date.parse(snapshot.asOf)) / 86400000);
const header = {
  schema: 'grandet.offline-lookup/v1',
  source: 'OFFLINE_SNAPSHOT',
  snapshot: { takenOn, ageDays, releaseSet: snapshot.releaseSet, observationWindow: snapshot.observationWindow },
  notice: {
    'zh-CN': `grandet.ai 暂时连不上，以下价格来自 ${takenOn} 的离线快照（距今 ${ageDays} 天）。`,
    en: `grandet.ai could not be reached; these prices come from the offline snapshot of ${takenOn} (${ageDays} days old).`,
  },
};

const norm = (s) => String(s).toLowerCase().replace(/[\s_]+/g, '-').replace(/-+/g, '-').trim();
const model = opt('--model');
const free = opt('--free');
if (!model && free === undefined) { console.error(usage); process.exit(2); }

if (model) {
  const want = norm(model);
  const exact = snapshot.models.find((m) => m.model === model) || snapshot.models.find((m) => norm(m.model) === want);
  if (exact) print({ ...header, status: 'OK', ...exact });
  else {
    const loose = want.replace(/[-.]/g, '');
    const candidates = snapshot.models.map((m) => m.model).filter((id) => {
      const k = norm(id).replace(/[-.]/g, '');
      return k.includes(loose) || loose.includes(k);
    }).slice(0, 5);
    if (candidates.length === 1) print({ ...header, status: 'OK', resolvedFrom: model, ...snapshot.models.find((m) => m.model === candidates[0]) });
    else if (candidates.length) print({ ...header, status: 'NEEDS_CLARIFICATION', candidates });
    else print({ ...header, status: 'SELECTION_NOT_FOUND' }, 1);
  }
} else {
  const q = String(free).toLowerCase();
  const offers = snapshot.freeCredits.filter((o) => !q || [o.provider, o.title, o.plan, o.benefit].some((v) => v && String(v).toLowerCase().includes(q))).slice(0, 10);
  print({ ...header, status: offers.length ? 'OK' : 'NO_MATCH', query: free, offers });
}
