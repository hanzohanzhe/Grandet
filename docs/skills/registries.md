# ClawHub and SkillHub / 同步到 ClawHub 和腾讯 SkillHub

Each published `skill-v*` release uploads the same Skill folder to [ClawHub](https://clawhub.ai) and [Tencent SkillHub](https://skillhub.cn) through `.github/workflows/skill-registries.yml`. GitHub stays the source: the website, `download.md` and both registries all point back to the release.

每次发布 `skill-v*` release，工作流会把同一个 Skill 文件夹上传到 ClawHub 和腾讯 SkillHub。GitHub 仍是唯一来源。

## One-time setup / 一次性设置

| Registry | Account | Token | GitHub secret |
|---|---|---|---|
| ClawHub | Sign in at clawhub.ai with the GitHub account that owns this repository (`hanzohanzhe`) | Settings → API tokens → create (`clh_…`) | `CLAWHUB_TOKEN` |
| SkillHub | skillhub.cn 手机号登录 → 个人中心完成实名认证（人脸核身） | 个人中心 → API keys（`/dashboard/keys`）→ 创建 `skh_…` | `SKILLHUB_TOKEN` |

Add both under Settings → Secrets and variables → Actions → Repository secrets. Never paste a token into an issue, commit or chat.

Optional: set the repository **variable** `SKILLHUB_KIT_SHA256` to the kit hash printed in the SkillHub job log. Later runs then stop if Tencent changes the CLI kit, until someone reviews it and updates the value.

Until a secret exists, a release run skips that registry with a warning; a manual non-dry run fails instead.

## What gets uploaded / 上传的内容

The job copies `skills/grandet-api-price-finder/` and rewrites only the `SKILL.md` front matter. The body and every other file stay byte-identical; `tests/registry-stage.test.mjs` checks this.

- ClawHub: adds `version` and `metadata.openclaw` (homepage; needs `curl` or `node`). The `license` line is dropped because ClawHub publishes every Skill under MIT-0 and refuses other license terms.
- SkillHub: adds `slug`, `displayName`, `version`, `summary`, `license: Apache-2.0` and `homepage` as flat lines, which is what its CLI reads. There is deliberately no `tags` line: SkillHub's publish API treats front-matter tags as distribution tags (like `latest`) and points each one at the uploaded version, so they would not work as search keywords.

Registry version numbers: the product version stays `0.3.0`; each build becomes a distinct, ordered SemVer.

| Release tag | Registry version |
|---|---|
| `skill-v0.3.0-build.20261016` | `0.3.0-build.20261016.0` |
| `skill-v0.3.0-build.20261016b` | `0.3.0-build.20261016.2` |
| `skill-v0.3.0-build.20261016c` | `0.3.0-build.20261016.3` |

The release tag must match the `Installation build` line in `SKILL.md`, or the run stops before uploading. The staging script is taken from the branch the workflow runs on and the Skill from the tag, so a release tagged before this workflow existed (such as `skill-v0.3.0-build.20261016c`) can be published with a manual run.

## Timing / 多久生效

- ClawHub holds each upload until its automated security checks pass, then lists it.
- If ClawHub rate-limits the upload, its CLI retries. A retry can repeat an upload that already went through, and ClawHub then answers `Version … already exists`. The job accepts that answer only after the ClawHub API shows this exact version under `hanzohanzhe`, with the same files as the staged folder. Because a new version stays hidden until the security checks pass, the job waits up to 20 minutes for it. Any other error fails the job.
- SkillHub runs an automated security scan (about 60 minutes) and may send a version to manual review. The first upload under this slug also stops SkillHub from mirroring the ClawHub copy.
- Installed copies do not update themselves. ClawHub users run `clawhub update grandet-api-price-finder`.

## Running it by hand / 手动运行

Actions → **Publish Skill to ClawHub and SkillHub** → Run workflow, with the release tag. `dry_run` is on by default: it validates both uploads without publishing and needs no token. The workflow only runs for releases created by a person or a personal token; releases created with the default `GITHUB_TOKEN` do not start workflows.
