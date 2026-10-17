#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
// Build the price snapshot that ships inside the Skill package (skills/grandet-api-price-finder/data/price-snapshot.json).
// The Skill reads it only when grandet.ai cannot be reached, for example from mainland China, and always states its date.
// Run it right after each website data release, then bump the build: the snapshot is only as new as the build that ships it.
// It reads grandet.ai's public read-only API (no key): one compact board per model page in the sitemap, plus every
// free-credit offer. It writes nothing anywhere else.
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_OUT = resolve(root, 'skills/grandet-api-price-finder/data/price-snapshot.json');
const usage = 'Usage: node scripts/build-price-snapshot.mjs [--base https://grandet.ai] [--as-of <ISO time>] [--out <file>] [--concurrency 4] [--limit-models N]';
const args = process.argv.slice(2);
const opt = (name, fallback) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : fallback; };
if (args.includes('--help')) { console.log(usage); process.exit(0); }
const base = opt('--base', 'https://grandet.ai').replace(/\/$/, '');
const asOf = opt('--as-of', new Date().toISOString());
const out = resolve(opt('--out', DEFAULT_OUT));
const concurrency = Number(opt('--concurrency', '4'));
const limitModels = Number(opt('--limit-models', '0'));
const UA = 'grandet-price-snapshot/1 (+https://github.com/hanzohanzhe/Grandet)';
if (Number.isNaN(Date.parse(asOf))) throw new Error(`INVALID_AS_OF: ${asOf}`);

async function get(path, kind = 'json') {
  for (let attempt = 1; ; attempt += 1) {
    try {
      const response = await fetch(base + path, { headers: { 'user-agent': UA, accept: kind === 'json' ? 'application/json' : '*/*' } });
      if (response.status >= 500 && attempt < 3) throw new Error(`HTTP_${response.status}`);
      const body = kind === 'json' ? await response.json() : await response.text();
      return { status: response.status, body };
    } catch (error) {
      if (attempt >= 3) throw new Error(`FETCH_FAILED ${path}: ${error.message}`);
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
}

const day = (iso) => (iso ? String(iso).slice(0, 10) : null);
const clean = (object) => Object.fromEntries(Object.entries(object).filter(([, v]) => v !== null && v !== undefined && !(Array.isArray(v) && v.length === 0)));

function cash(entry) {
  return clean({
    vendor: entry.vendor, aggregator: entry.aggregator || undefined, currency: entry.currency,
    input: entry.input, output: entry.output, cacheRead: entry.cacheRead,
    priceKind: entry.priceKind, observed: day(entry.observedAt), source: entry.sourceUrl,
    vsOfficial: entry.cashPercentVsOfficial ?? undefined,
  });
}

function row(r) {
  const integration = r.integration || {};
  return clean({
    site: r.sourceId, group: r.plan, model: r.modelName, price: r.blended,
    input: r.input, output: r.output, cacheRead: r.cacheRead,
    observed: day(r.observedAt), freshness: r.freshness,
    hint: r.listing?.hint, reasons: [...(r.reviewReasons || []), ...(r.riskSignals || [])],
    baseUrl: integration.baseUrl, tokenGroup: integration.tokenGroup, protocols: r.endpointTypes,
  });
}

function model(id, board) {
  const boards = (board.boards || []).map((b) => clean({
    unit: b.unit,
    lowest: (b.listings?.lowest || []).slice(0, 2).map(row),
    gated: (b.listings?.gated || []).slice(0, 1).map(row),
    reference: (b.listings?.reference || []).slice(0, 2).map(row),
    folded: (b.listings?.folded || []).map((f) => clean({ client: f.client, count: f.count })),
  })).filter((b) => b.lowest || b.gated || b.reference);
  const firstLowest = (board.boards || []).flatMap((b) => b.listings?.lowest || [])[0];
  const official = (board.official || []).filter((e) => !e.priceKind || e.priceKind === 'STANDARD');
  return clean({
    model: id,
    official: (official.length ? official : board.official || []).slice(0, 2).map(cash),
    inference: (board.listings?.inference || []).slice(0, 2).map(cash),
    boards,
    page: (firstLowest?.boardUrl || `${base}/leaderboard/?model=${encodeURIComponent(id)}`).replace(/&utm_[a-z]+=[^&]*/g, ''),
  });
}

function offer(o) {
  const req = o.requirements || {};
  const needs = Object.entries(req).filter(([, v]) => v && v.state && v.state !== 'not_required').map(([k, v]) => `${k}:${v.state}`);
  return clean({
    id: o.id, kind: o.kind, provider: o.provider, title: o.title, plan: o.plan, benefit: o.benefitText,
    needs, ends: o.deadline?.statedDate || o.deadline?.statedText || undefined,
    claimUrl: o.claimUrl, observed: day(o.observedAt),
  });
}

async function pool(items, worker) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.max(1, concurrency) }, async () => {
    while (next < items.length) { const i = next++; results[i] = await worker(items[i], i); }
  }));
  return results;
}

const version = (await get('/api/v1/catalog-version')).body;
if (!version?.version?.releaseSet) throw new Error('CATALOG_VERSION_UNREADABLE');
const sitemap = (await get('/sitemaps/pages-1.xml', 'text')).body;
let ids = [...new Set([...sitemap.matchAll(/leaderboard\/\?model=([^<&"]+)/g)].map((m) => decodeURIComponent(m[1].replace(/&amp;/g, '&'))))].sort();
if (limitModels > 0) ids = ids.slice(0, limitModels);
if (!ids.length) throw new Error('NO_MODEL_PAGES_IN_SITEMAP');

const failures = [];
const models = (await pool(ids, async (id) => {
  const q = new URLSearchParams({ model: id, view: 'compact', lang: 'zh-CN', asOf, limit: '10' });
  const { status, body } = await get(`/api/v1/board?${q}`);
  if (status !== 200 || body?.version?.releaseSet !== version.version.releaseSet) { failures.push({ model: id, status }); return null; }
  return model(id, body);
})).filter((m) => m && (m.official || m.inference || m.boards));

const offers = [];
for (let page = 1, pages = 1; page <= pages; page += 1) {
  const { status, body } = await get(`/api/v1/free-credits?kind=all&lang=zh-CN&limit=20&page=${page}&asOf=${encodeURIComponent(asOf)}`);
  if (status !== 200) throw new Error(`FREE_CREDITS_HTTP_${status}`);
  pages = body.pages;
  offers.push(...body.offers.map(offer));
}

const snapshot = {
  schema: 'grandet.price-snapshot/v1',
  note: 'Offline copy of grandet.ai prices for when the site cannot be reached. State the snapshot date with every price from it; check the site again when it is reachable. Credit prices (USD_CREDIT, CNY_CREDIT) are site credit, not cash.',
  rights: 'Factual compilation; source rights retained. See https://github.com/hanzohanzhe/Grandet/blob/main/DATA-LICENSE.md',
  source: base,
  releaseSet: version.version.releaseSet,
  currentRevision: version.version.currentRevision,
  observationWindow: version.observationWindow,
  maximumQuoteAgeDays: version.maximumQuoteAgeDays,
  asOf,
  models,
  freeCredits: offers,
};
const bytes = Buffer.from(`${JSON.stringify(snapshot)}\n`);
await mkdir(dirname(out), { recursive: true });
await writeFile(out, bytes);
console.log(JSON.stringify({
  out, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'),
  releaseSet: snapshot.releaseSet, asOf, modelPages: ids.length, models: models.length,
  withLowest: models.filter((m) => (m.boards || []).some((b) => b.lowest)).length,
  withOfficial: models.filter((m) => m.official).length,
  freeCredits: offers.length, failures,
}, null, 2));
if (failures.length) process.exitCode = 1;
