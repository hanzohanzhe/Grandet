# ClawHub and SkillHub / 同步到 ClawHub 和腾讯 SkillHub

Each published `skill-v*` release uploads the complete installation kit to [ClawHub](https://clawhub.ai) and [Tencent SkillHub](https://skillhub.cn) through `.github/workflows/skill-registries.yml`. GitHub stays the source; the registries carry the same files, so nobody needs GitHub to install.

每次发布 `skill-v*` release，工作流会把完整安装包（和 GitHub 上的 `.skill` 一样：Skill、安装器、回执模块、Python 验证器、INSTALL.md、package-manifest.json）上传到 ClawHub 和腾讯 SkillHub。GitHub 仍是唯一来源；中国大陆用户从 SkillHub 就能拿到全部文件，不需要访问 GitHub。

## Mainland China download / 国内下载地址

```text
https://api.skillhub.cn/api/v1/download?slug=grandet-api-price-finder&version=<registry version>
```

No account is needed; SkillHub redirects to Tencent COS. The archive holds the `.skill` contents with the files at its root, plus SkillHub's own `_meta.json`: extract it into a folder named `grandet-api-price-finder` and use it as an extracted `.skill` root. `INSTALL.md`, `references/installation.md`, `references/host-setup.md`, `llms.txt` and `README.zh-CN.md` link to it, pinned to the current build. A version still in SkillHub review returns 404.

不用注册，链接会跳到腾讯云 COS。压缩包里是 `.skill` 的内容（文件在根目录），外加 SkillHub 自己的 `_meta.json`。

## One-time setup / 一次性设置

| Registry | Account | Token | GitHub secret |
|---|---|---|---|
| ClawHub | Sign in at clawhub.ai with the GitHub account that owns this repository (`hanzohanzhe`) | Settings → API tokens → create (`clh_…`) | `CLAWHUB_TOKEN` |
| SkillHub | skillhub.cn 手机号登录 → 个人中心完成实名认证（人脸核身） | 个人中心 → API keys（`/dashboard/keys`）→ 创建 `skh_…` | `SKILLHUB_TOKEN` |

Add both under Settings → Secrets and variables → Actions → Repository secrets. Never paste a token into an issue, commit or chat.

Optional: set the repository **variable** `SKILLHUB_KIT_SHA256` to the kit hash printed in the SkillHub job log. Later runs then stop if Tencent changes the CLI kit, until someone reviews it and updates the value.

Until a secret exists, a release run skips that registry with a warning; a manual non-dry run fails instead.

## What gets uploaded / 上传的内容

`scripts/stage-registry-skill.mjs` takes the release's `downloads/grandet-api-price-finder-0.3.0.skill`, checks its size and SHA-256 against `downloads/manifest.json`, and unpacks it. `tests/registry-stage.test.mjs` checks both copies.

GitHub, SkillHub and ClawHub ship the same Skill. A registry copy differs from the GitHub `.skill` only where that registry requires it:

- SkillHub: every file has the release's bytes. SkillHub refuses files without an extension, so `LICENSE` is uploaded as `LICENSE.txt`. Its CLI reads `slug`, `displayName` and `summary` from the `metadata` block of `SKILL.md`; the version comes from the release tag. `SKILL.md` must not carry `tags`, which SkillHub turns into version pointers.
- ClawHub: no `LICENSE` and no `license:` line in `SKILL.md`, because ClawHub publishes every Skill under MIT-0 and refuses other license terms. `SKILL.md` gains `metadata.openclaw` (homepage; needs `curl` or `node`). The Skill's text and every other file have the release's bytes.

Each copy's `package-manifest.json` lists that copy's own files and hashes. It keeps every other release field and adds `registryCopy`, which names the release manifest's SHA-256 and what the registry required. `INSTALL.md` tells people to check a package against its manifest. A copy that kept the release manifest failed that check, and ClawHub's scan marked build 20261016e (`0.3.0-build.20261016.5`) suspicious for exactly this mismatch.

Anything else the Skill says, such as what it changes on the user's computer, belongs in the source `SKILL.md`, so that all three places get it in the same build.

Registry version numbers: the product version stays `0.3.0`; each build becomes a distinct, ordered SemVer.

| Release tag | Registry version |
|---|---|
| `skill-v0.3.0-build.20261016` | `0.3.0-build.20261016.0` |
| `skill-v0.3.0-build.20261016c` | `0.3.0-build.20261016.3` |
| `skill-v0.3.0-build.20261016d` | `0.3.0-build.20261016.4` |
| `skill-v0.3.0-build.20261016e` | `0.3.0-build.20261016.5` |

The run stops before uploading if the release tag does not match the `Installation build` line in `SKILL.md`, if the archive does not match its pin, or if any China download link in the kit names another registry version. **When you cut a new build, update that version in the China links too** (`tests/registry-stage.test.mjs` fails until you do).

## Timing / 多久生效

- ClawHub holds each upload until its automated security checks pass, then lists it.
- SkillHub runs an automated security scan (about 60 minutes) and may send a version to manual review; until then its China link returns 404. The first upload under this slug also stopped SkillHub from mirroring the ClawHub copy.
- Installed copies do not update themselves. ClawHub users run `clawhub update grandet-api-price-finder`.

## Running it by hand / 手动运行

Actions → **Publish Skill to ClawHub and SkillHub** → Run workflow, with the release tag. `dry_run` is on by default: it validates both uploads without publishing and needs no token. The workflow only runs for releases created by a person or a personal token; releases created with the default `GITHUB_TOKEN` do not start workflows.

ClawHub never replaces a published version. To republish a build's ClawHub copy after a staging fix, run with `targets=clawhub` and `clawhub_revision=N`: the upload becomes `<registry version>.N` (for example `0.3.0-build.20261016.5.1`), which ClawHub orders after the build's own version and before the next build's. SkillHub and the GitHub release are untouched, and the run refuses a revision with any other target.
