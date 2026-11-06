// SPDX-License-Identifier: AGPL-3.0-only
const localized = (value, lang) => typeof value === 'string'
  ? value
  : value?.[lang] ?? value?.['zh-CN'] ?? '';

function rawField(record, query, path = '') {
  if (record === null || record === undefined) return null;
  if (typeof record !== 'object') {
    return String(record).toLocaleLowerCase().includes(query) ? (path || 'value') : null;
  }
  for (const [key, value] of Object.entries(record)) {
    const field = path ? `${path}.${key}` : key;
    if (key.toLocaleLowerCase().includes(query)) return field;
    const found = rawField(value, query, field);
    if (found) return found;
  }
  return null;
}

/** Return searchable text for the fields shown on a catalogue card. */
export function visibleFields(row, lang) {
  const o = row?.o ?? row ?? {};
  const fields = [];
  const add = (field, value) => {
    const text = String(value ?? '').trim();
    if (text) fields.push({ field, text });
  };

  add('title', localized(o.title, lang));
  add(o.provider ? 'provider' : 'sourceDomain', o.provider ?? o.sourceDomain);
  add('category', o.category);
  add('benefitText', localized(o.benefitText, lang));
  add('billingText', localized(o.billingText, lang));

  const conditions = Array.isArray(o.conditions)
    ? o.conditions
    : (o.conditions?.[lang] ?? []);
  for (const condition of conditions) add('conditions', condition);

  for (const fact of o.editorialFacts ?? []) add('editorialFacts', fact);
  for (const evidence of o.evidence ?? []) add('evidence.title', evidence.title);
  return fields;
}

/** Match the visible card fields, optionally including undisplayed record data. */
export function matchRow(row, query, lang, options = {}) {
  const q = String(query ?? '').trim().toLocaleLowerCase();
  if (!q) return { matched: null, hidden: false };

  for (const { field, text } of visibleFields(row, lang)) {
    if (text.toLocaleLowerCase().includes(q)) return { matched: field, hidden: false };
  }

  if (options.allFields === true) {
    const record = row?.o ?? row;
    if (JSON.stringify(record).toLocaleLowerCase().includes(q)) {
      return { matched: rawField(record, q) ?? 'record', hidden: true };
    }
  }
  return { matched: null, hidden: false };
}
