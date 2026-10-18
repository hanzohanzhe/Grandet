# How grandet.ai follows a new build / 官网如何跟随新构建

grandet.ai reads three files from `main` about every five minutes: `downloads/latest.json`, `downloads/releases.json` and `downloads/installation-approved-builds.json`. When `latest.json` names a new build, every download entry on the site switches to it: the download pages, `download.md`, `llms.txt`, the `/dl/` links and the SkillHub China mirror. No website release is needed.

官网约每 5 分钟读一次 `main` 上的这三个文件。`latest.json` 指向新构建后，官网所有下载入口都换成它，不需要发布网站。

## What the site checks / 官网检查什么

The site switches only when all of these hold. `node scripts/check-site-follow.mjs` checks them; `write-latest-pointer.py` runs it before keeping a new pointer, and CI runs it on every push.

- The build is `grandet-skill-0.3.0-build.YYYYMMDD` plus at most four lowercase letters, and the tag is `skill-v0.3.0-build.` with the same date and letters.
- `skillhubVersion` is the date plus the letters counted from a = 1 (`20261018` → `.0`, `20261018b` → `.2`).
- The gate is PASS, or HOLD with the owner's words in `approved.quote`.
- Both assets are registered in `releases.json` with the same commit, release, asset ID, size, SHA-256 and URL; the Release is published.
- Every record already in `releases.json` and `installation-approved-builds.json` stays, unchanged. Order does not matter. New records are added.

The site also checks the Release on GitHub (asset digests, tag commit) before it switches.

## Documents / 文档

`download.md` embeds `INSTALL.md`, `references/installation.md` and `docs/skills/installation-receipts.md` from the build's commit when none of them names another build's tag, build ID or asset SHA-256. When one does, or a file is missing, the links still switch and `download.md` keeps the site's own text. The check script reports this as a warning.

文档里写到别的构建号时，链接照样换成新构建，只是 `download.md` 不嵌入这份文档。
