// SPDX-License-Identifier: Apache-2.0
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { APP_PROTOCOLS } from "../skills/grandet-api-price-finder/scripts/connect.mjs";

const catalogPath = new URL(
  "../skills/grandet-api-price-finder/references/app-catalog.md",
  import.meta.url,
);

function parseProfileRows(markdown) {
  const lines = markdown.split(/\r?\n/);
  const headerIndex = lines.findIndex((line) =>
    line.startsWith("| App ID | Profile ID |"),
  );
  assert.notEqual(headerIndex, -1, "app-catalog.md: profile table header missing");
  const rows = [];
  for (
    let index = headerIndex + 1;
    index < lines.length && lines[index].startsWith("|");
    index++
  ) {
    const line = lines[index];
    if (/^\|\s*[-:| ]+\|$/.test(line)) continue;
    const cells = line
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim());
    if (cells.length < 12) continue;
    rows.push({
      app: cells[0].replaceAll("`", ""),
      profile: cells[1].replaceAll("`", ""),
      endpoint: cells[2].replaceAll("`", ""),
      automation: cells[10],
      line: index + 1,
      source: line,
    });
  }
  return rows;
}

test("catalogue automation labels agree with the connect executor matrix", async () => {
  const rows = parseProfileRows(await readFile(catalogPath, "utf8"));
  assert.ok(rows.length, "app-catalog.md: profile table has no rows");

  for (const row of rows) {
    const where = `app-catalog.md:${row.line}: ${row.source}`;
    const supported =
      Object.hasOwn(APP_PROTOCOLS, row.app) &&
      APP_PROTOCOLS[row.app].includes(row.endpoint);
    if (row.automation.startsWith("MANUAL_ONLY")) {
      assert.match(
        row.automation,
        /MANUAL_ONLY\s*:\s*\S/i,
        `${where} — MANUAL_ONLY row must name a reason`,
      );
      if (supported) {
        assert.fail(
          `${where} — executor supports ${row.endpoint} for ${row.app}; mark the row ADAPTER instead of MANUAL_ONLY`,
        );
      }
      continue;
    }
    assert.equal(row.automation, "ADAPTER", `${where} — unknown automation label`);
    assert.ok(
      Object.hasOwn(APP_PROTOCOLS, row.app),
      `${where} — app is absent from the connect executor matrix`,
    );
    assert.ok(
      APP_PROTOCOLS[row.app].includes(row.endpoint),
      `${where} — executor does not accept ${row.endpoint} for ${row.app}`,
    );
  }
});

test("workbuddy, kilo-code and continue keep their supported ADAPTER rows", async () => {
  const rows = parseProfileRows(await readFile(catalogPath, "utf8"));
  for (const app of ["workbuddy", "kilo-code", "continue"]) {
    const supported = rows.filter(
      (row) =>
        row.app === app &&
        !row.automation.startsWith("MANUAL_ONLY") &&
        APP_PROTOCOLS[app]?.includes(row.endpoint),
    );
    assert.ok(supported.length, `${app}: no supported ADAPTER row`);
    for (const row of supported) {
      assert.equal(
        row.automation,
        "ADAPTER",
        `app-catalog.md:${row.line}: ${row.source}`,
      );
    }
  }
});

test("OpenClaw automated profiles are exactly chat completions and Anthropic messages", async () => {
  const rows = parseProfileRows(await readFile(catalogPath, "utf8"));
  const automated = rows.filter(
    (row) =>
      row.app === "openclaw" && !row.automation.startsWith("MANUAL_ONLY"),
  );
  assert.deepEqual(
    automated.map((row) => row.profile).sort(),
    ["anthropic-messages", "openai-chat-completions"],
  );
  for (const row of automated) {
    assert.equal(
      row.automation,
      "ADAPTER",
      `app-catalog.md:${row.line}: ${row.source}`,
    );
  }
  for (const row of rows.filter((row) => row.app === "openclaw")) {
    if (row.automation.startsWith("MANUAL_ONLY")) {
      assert.match(
        row.automation,
        /custom-provider/i,
        `app-catalog.md:${row.line} — manual OpenClaw row must link a manual path`,
      );
    }
  }
});
