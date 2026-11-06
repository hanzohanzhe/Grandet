// SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {checkSiteFollow} from '../scripts/check-site-follow.mjs';

const read = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));
const routes = read('docs/skills/installation-routes.json');
const distribution = read('docs/skills/application-distribution.generated.json');
const exclusions = read('docs/skills/application-distribution-exclusions.json');
const latest = read('downloads/latest.json');
const releases = read('downloads/releases.json');
const approved = read('downloads/installation-approved-builds.json');
const clone = (value) => JSON.parse(JSON.stringify(value));
const apps = (routeDoc = routes, exclusionDoc = exclusions, dist = distribution) => ({
  'docs/skills/installation-routes.json': routeDoc,
  'docs/skills/application-distribution.generated.json': dist,
  'docs/skills/application-distribution-exclusions.json': exclusionDoc,
});
const coverageErrors = (overrides = {}) => checkSiteFollow({latest, releases, approved, apps: apps(), ...overrides}).errors.filter((e) => /APP_DISTRIBUTION/.test(e));

test('committed routes, artifact and reviewed exclusions reconcile', () => {
  assert.deepEqual(coverageErrors(), []);
  const routeHosts = new Set(routes.routes.map((route) => route.host));
  const entryIds = new Set(distribution.entries.map((entry) => entry.appId));
  assert.equal(exclusions.buildId, routes.buildId);
  for (const row of exclusions.excludedHosts) {
    assert.ok(routeHosts.has(row.host), `${row.host} must have a route`);
    assert.ok(!entryIds.has(row.host), `${row.host} must not have a distribution entry`);
  }
});

test('an unexcluded routed host is a hard coverage error', () => {
  const changedRoutes = {...clone(routes), routes: [...routes.routes, {host: 'synthetic-new-host'}]};
  assert.match(coverageErrors({apps: apps(changedRoutes)}).join('\n'), /APP_DISTRIBUTION_INCOMPLETE/);
});

test('empty exclusion reasons and unknown hosts produce coded errors', () => {
  const emptyReason = clone(exclusions);
  emptyReason.excludedHosts[0].reason = '  ';
  assert.match(coverageErrors({apps: apps(routes, emptyReason)}).join('\n'), /APP_DISTRIBUTION_EXCLUSION_REASON/);

  const unknownHost = clone(exclusions);
  unknownHost.excludedHosts[0].host = 'not-a-route';
  assert.match(coverageErrors({apps: apps(routes, unknownHost)}).join('\n'), /APP_DISTRIBUTION_EXCLUSION_UNKNOWN_HOST/);
});

test('exclusion buildId must match the routes buildId', () => {
  const changed = clone(exclusions);
  changed.buildId = 'grandet-skill-0.3.0-build.20260101';
  assert.match(coverageErrors({apps: apps(routes, changed)}).join('\n'), /APP_DISTRIBUTION_EXCLUSIONS_BUILD/);
});

test('exclusion status must be UNPUBLISHED_IN_PUBLIC_CHECKOUT', () => {
  const changed = clone(exclusions);
  changed.excludedHosts[0].status = "PUBLISHED";
  assert.match(coverageErrors({apps: apps(routes, changed)}).join("\n"), /APP_DISTRIBUTION_EXCLUSION_STATUS/);
});
