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
import argparse, hashlib, json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPO_DOWNLOAD = 'https://github.com/hanzohanzhe/Grandet/releases/download/'
UTC = r'\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z'


def build_pointer(manifest, release, commit, gate_result, gate_summary, approved_at, approved_quote, skillhub_version, root=ROOT):
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
        'gate': {'result': gate_result, 'summary': gate_summary.strip()},
        'approved': {'by': 'owner', 'at': approved_at, 'quote': approved_quote.strip()},
    }


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
    p.add_argument('--out', type=Path, default=ROOT / 'downloads/latest.json')
    a = p.parse_args()
    manifest = json.loads((ROOT / 'downloads/manifest.json').read_text())
    pointer = build_pointer(manifest, json.loads(a.release_json.read_text()), a.commit, a.gate_result,
                            a.gate_summary, a.approved_at, a.approved_quote, a.skillhub_version)
    a.out.write_text(json.dumps(pointer, indent=2, ensure_ascii=False) + '\n')
    added = add_to_public_map() if a.out.resolve() == (ROOT / 'downloads/latest.json').resolve() else False
    print(json.dumps({'written': str(a.out), 'build': pointer['build'], 'gate': a.gate_result, 'publicMapUpdated': added}))


if __name__ == '__main__':
    main()
