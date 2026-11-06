// SPDX-License-Identifier: AGPL-3.0-only

/** Records older than this many whole days are considered stale. */
export const STALE_THRESHOLD_DAYS = 30;

const timestamp = value => {
  if (typeof value !== 'string' || !value.trim()) return null;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : null;
};

const daysSince = (value, nowMs) => {
  const ms = timestamp(value);
  if (ms === null || !Number.isFinite(nowMs)) return null;
  return Math.max(0, Math.floor((nowMs - ms) / 86_400_000));
};

/** Whole days since the record's checkedAt/observedAt timestamp, or null. */
export function recordAgeDays(record, nowMs) {
  return daysSince(record?.checkedAt ?? record?.observedAt, nowMs);
}

/** Whether the offer is explicitly inactive or its end timestamp has passed. */
export function isEnded(record, nowMs) {
  const status = typeof record?.declaredStatus === 'string' ? record.declaredStatus.toLowerCase() : '';
  if (status === 'ended' || status === 'disabled') return true;
  const endMs = timestamp(record?.endAt);
  return endMs !== null && Number.isFinite(nowMs) && endMs < nowMs;
}

/** A record is stale when its whole-day age is greater than 30 by default. */
export function isStale(record, nowMs, thresholdDays = STALE_THRESHOLD_DAYS) {
  const age = recordAgeDays(record, nowMs);
  return age !== null && age > thresholdDays;
}

/**
 * Whole days since the last snapshot observation. If that window date is
 * unavailable, falls back to the newest record checkedAt/observedAt date.
 */
export function snapshotAgeDays(data, nowMs) {
  const windowLast = daysSince(data?.observationWindow?.last, nowMs);
  if (windowLast !== null) return windowLast;
  const records = [...(Array.isArray(data?.officialOffers) ? data.officialOffers : []), ...(Array.isArray(data?.offers) ? data.offers : [])];
  const newest = records.reduce((latest, record) => {
    const date = timestamp(record?.checkedAt ?? record?.observedAt);
    return date !== null && (latest === null || date > latest) ? date : latest;
  }, null);
  return newest === null || !Number.isFinite(nowMs) ? null : Math.max(0, Math.floor((nowMs - newest) / 86_400_000));
}

/** Ended records take precedence over age when assigning a freshness filter. */
export function freshnessBucket(record, nowMs) {
  if (isEnded(record, nowMs)) return 'ended';
  return isStale(record, nowMs) ? 'stale' : 'fresh';
}
