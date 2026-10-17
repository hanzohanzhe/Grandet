#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Point grandet.ai at a published build by writing downloads/latest.json.

grandet.ai reads downloads/latest.json on main at request time and serves that
build on every download entry (owner decision R52, 2026-10-17). Run this LAST,
after the Release is published and its assets are registered, and only when the
build may become the recommended download: gate PASS and the owner's confirmation
(R47). A HOLD gate result needs the owner's own words in --approved-quote.

To roll back, restore the previous downloads/latest.json (git revert of the commit
that changed it). The site follows within its cache window; no website deploy.
"""
import argparse, hashlib, json, re, shutil, subprocess, tempfile, zipfile
from pathlib import Path, PurePosixPath

ROOT = Path(__file__).resolve().parents[1]
REPO_DOWNLOAD = 'https://github.com/hanzohanzhe/Grandet/releases/download/'
UTC = r'\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z'
SKILL = 'grandet-api-price-finder'
DIGEST_ALGORITHM = 'sha256-path-nul-file-sha256-lf-codepoint-v1'


def _extract(archive, target):
    with zipfile.ZipFile(archive) as z:
        for info in z.infolist():
            name = PurePosixPath(info.filename)
            if name.is_absolute() or '..' in name.parts or (info.external_attr >> 16) & 0o170000 == 0o120000:
                raise ValueError('UNSAFE_ARCHIVE_ENTRY')
        z.extractall(target)


def installation_digests(root=ROOT, manifest=None, node='node'):
    """Content digests grandet.ai uses to accept install receipts, one per archive.

    Each archive is extracted and the build's own installer computes the digest of
    the Skill folder in --dry-run mode (no install, no receipt), exactly as a real
    install would report it."""
    manifest = manifest or json.loads((root / 'downloads/manifest.json').read_text())
    out = {}
    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        for file in manifest['files']:
            kind = 'zip' if file['file'].endswith('.zip') else 'skill'
            target = tmp / kind
            _extract(root / 'downloads' / file['file'], target)
            skill_dir = target / 'skills' / SKILL if kind == 'zip' else target / SKILL
            installer = (target / 'scripts' if kind == 'zip' else skill_dir / 'scripts') / 'install-price-finder.mjs'
            if not (skill_dir / 'SKILL.md').is_file() or not installer.is_file():
                raise ValueError('ARCHIVE_LAYOUT_UNEXPECTED')
            r = subprocess.run([node, str(installer), '--app', 'codex', '--home', str(tmp / ('home-' + kind)),
                                '--source', str(skill_dir), '--dry-run', '--no-telemetry'],
                               capture_output=True, text=True, timeout=120)
            if r.returncode != 0:
                raise ValueError('INSTALLER_DRY_RUN_FAILED: ' + r.stderr.strip()[:200])
            digest = json.loads(r.stdout).get('contentSha256', '')
            if not re.fullmatch(r'[a-f0-9]{64}', digest):
                raise ValueError('CONTENT_DIGEST_MISSING')
            out[kind] = digest
    return [out['zip'], out['skill']]


def build_pointer(manifest, release, commit, gate_result, gate_summary, approved_at, approved_quote, skillhub_version, content_sha256s, root=ROOT):
    version, build = manifest.get('version'), manifest.get('buildId', '')
    if version != '0.3.0':
        raise ValueError('CONTRACT_VERSION_MUST_BE_0.3.0')
    m = re.fullmatch(r'grandet-skill-0\.3\.0-build\.(\d{8}[a-z]?)', build)
    if not m:
        raise ValueError('BUILD_ID_FORMAT')
    tag = 'skill-v0.3.0-build.' + m.group(1)
    if not re.fullmatch(r'[a-f0-9]{40}', commit):
        raise ValueError('FIXED_SOURCE_COMMIT_REQUIRED')
    if release.get('draft') is not False:
        raise ValueError('PUBLIC_BUILD_RELEASE_REQUIRED')
    if release.get('tag_name') != tag or type(release.get('id')) is not int:
        raise ValueError('RELEASE_IDENTITY_MISMATCH')
    if gate_result not in ('PASS', 'HOLD'):
        raise ValueError('GATE_RESULT_PASS_OR_HOLD')
    if not gate_summary.strip():
        raise ValueError('GATE_SUMMARY_REQUIRED')
    if gate_result == 'HOLD' and not approved_quote.strip():
        raise ValueError('HOLD_NEEDS_OWNER_QUOTE')
    if not re.fullmatch(UTC, approved_at):
        raise ValueError('UTC_APPROVAL_TIME_REQUIRED')
    if not re.fullmatch(r'0\.3\.0-build\.\d{8}\.\d+', skillhub_version):
        raise ValueError('SKILLHUB_VERSION_FORMAT')
    files = {}
    for file in manifest['files']:
        name = file['file']
        kind = 'zip' if name.endswith('.zip') else 'skill' if name.endswith('.skill') else None
        if kind is None or kind in files:
            raise ValueError('MANIFEST_FILES_MUST_BE_ONE_ZIP_ONE_SKILL')
        matches = [x for x in release.get('assets', []) if x.get('name') == name]
        if len(matches) != 1:
            raise ValueError('MISSING_OR_DUPLICATE_RELEASE_ASSET')
        x = matches[0]
        url = REPO_DOWNLOAD + tag + '/' + name
        if type(x.get('id')) is not int or x.get('size') != file['bytes'] or x.get('browser_download_url') != url:
            raise ValueError('ASSET_METADATA_MISMATCH')
        if x.get('digest') not in (None, 'sha256:' + file['sha256']):
            raise ValueError('GITHUB_DIGEST_MISMATCH')
        if hashlib.sha256((root / 'downloads' / name).read_bytes()).hexdigest() != file['sha256']:
            raise ValueError('LOCAL_ASSET_CHANGED')
        files[kind] = {'url': url, 'bytes': file['bytes'], 'sha256': file['sha256'], 'assetId': x['id']}
    if set(files) != {'zip', 'skill'}:
        raise ValueError('MANIFEST_FILES_MUST_BE_ONE_ZIP_ONE_SKILL')
    if len(content_sha256s) != 2 or not all(re.fullmatch(r'[a-f0-9]{64}', d) for d in content_sha256s):
        raise ValueError('INSTALLATION_CONTENT_DIGESTS_REQUIRED')
    return {
        'schema': 'grandet.skill-latest/v1',
        'version': version,
        'build': build,
        'tag': tag,
        'releaseId': release['id'],
        'sourceCommit': commit,
        'zip': files['zip'],
        'skill': files['skill'],
        'skillhubVersion': skillhub_version,
        'installation': {'contentDigestAlgorithm': DIGEST_ALGORITHM, 'contentSha256s': list(content_sha256s)},
        'gate': {'result': gate_result, 'summary': gate_summary.strip()},
        'approved': {'by': 'owner', 'at': approved_at, 'quote': approved_quote.strip()},
    }


def append_approved_build(build, content_sha256s, root=ROOT):
    """Append this build to downloads/installation-approved-builds.json (append-only).

    grandet.ai accepts install receipts whose content digest is listed here, so users
    who stay on an older build keep counting after the pointer moves on."""
    path = root / 'downloads/installation-approved-builds.json'
    data = json.loads(path.read_text())
    if data.get('schema') != 'grandet.installation-approved-builds/v1' or not isinstance(data.get('builds'), list):
        raise ValueError('APPROVED_BUILDS_SCHEMA')
    entry = {'build_id': build, 'skill_version': '0.3.0', 'content_digest_algorithm': DIGEST_ALGORITHM,
             'content_sha256s': list(content_sha256s)}
    old = [b for b in data['builds'] if b.get('build_id') == build]
    if old:
        if old[0] != entry:
            raise ValueError('APPROVED_BUILD_ALREADY_LISTED_WITH_OTHER_DIGESTS')
        return False
    data['builds'].append(entry)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n')
    return True


def add_to_public_map(root=ROOT):
    """The public file map must list every file in the tree (validate-public.mjs)."""
    path = root / 'public-export-manifest.json'
    text = path.read_text()
    data = json.loads(text)
    if any(f.get('path') == 'downloads/latest.json' for f in data['files']):
        return False
    i = next(n for n, f in enumerate(data['files']) if f.get('path') == 'downloads/releases.json')
    data['files'].insert(i, {'path': 'downloads/latest.json', 'rights': 'Apache-2.0'})
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + ('\n' if text.endswith('\n') else ''))
    return True


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument('--release-json', type=Path, required=True, help='GitHub API JSON of the published release')
    p.add_argument('--commit', required=True, help='40-hex source commit of the build')
    p.add_argument('--gate-result', required=True, choices=['PASS', 'HOLD'])
    p.add_argument('--gate-summary', required=True, help='one line from gate.md')
    p.add_argument('--approved-at', required=True, help='UTC time of the owner confirmation, e.g. 2026-10-17T12:30:00Z')
    p.add_argument('--approved-quote', default='', help="owner's words; required when the gate result is HOLD")
    p.add_argument('--skillhub-version', required=True, help='e.g. 0.3.0-build.20261017.0')
    p.add_argument('--node', default=shutil.which('node') or 'node', help='Node.js used to run the build\'s own installer in --dry-run mode')
    p.add_argument('--out', type=Path, default=ROOT / 'downloads/latest.json')
    a = p.parse_args()
    manifest = json.loads((ROOT / 'downloads/manifest.json').read_text())
    pointer = build_pointer(manifest, json.loads(a.release_json.read_text()), a.commit, a.gate_result,
                            a.gate_summary, a.approved_at, a.approved_quote, a.skillhub_version,
                            installation_digests(ROOT, manifest, a.node))
    a.out.write_text(json.dumps(pointer, indent=2, ensure_ascii=False) + '\n')
    real = a.out.resolve() == (ROOT / 'downloads/latest.json').resolve()
    added = add_to_public_map() if real else False
    appended = append_approved_build(pointer['build'], pointer['installation']['contentSha256s']) if real else False
    print(json.dumps({'written': str(a.out), 'build': pointer['build'], 'gate': a.gate_result,
                      'installationContentSha256s': pointer['installation']['contentSha256s'],
                      'approvedBuildsAppended': appended, 'publicMapUpdated': added}))


if __name__ == '__main__':
    main()
