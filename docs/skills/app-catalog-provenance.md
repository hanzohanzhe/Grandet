# Application catalogue provenance / 应用目录来源

The public checkout ships two generated application-catalogue artifacts:

- `skills/grandet-api-price-finder/references/app-catalog.md` — the human-readable
  app and profile reference.
- `docs/skills/application-distribution.generated.json` — the packaged
  distribution summary.

Both describe one profile set. The Markdown header,
`docs/skills/app-catalog-identity.json` and the distribution artifact embed the
same revision (`grandet.app-catalog/v1+<12-hex>`), profile count and SHA-256 over
the canonical profile rows. Any change to an app, profile, endpoint, format, path, scope or
field list changes the hash.

## Public check / 公共校验

```sh
node scripts/app-catalog-identity.mjs --check
```

The check fails with `APP_CATALOG_IDENTITY_STALE` when the Markdown profile table,
the identity file or the distribution profile count disagree. CI runs it in
`.github/workflows/catalogue.yml` before packaging, so a hand edit cannot ship
without updating the identity.

## Updating the catalogue / 更新目录

The upstream generation sources live in the website repository
(`lib/control-plane/integrations/*.ts` and
`tools/website/generate-price-finder-app-catalog.ts`); they are not part of this
public Skill export. When those sources change:

1. Regenerate the two artifacts from the website checkout.
2. Copy them into this checkout.
3. Run `node scripts/app-catalog-identity.mjs --write` to refresh the header,
   identity file and counts.
4. Run `node scripts/app-catalog-identity.mjs --check` and the full test suite.

The public check detects generation drift; it does not rebuild the artifacts from
the website sources. This split is intentional: the website repository owns the
generator, while the public checkout owns a reproducible identity and a CI guard.
