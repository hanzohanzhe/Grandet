# SPDX-License-Identifier: Apache-2.0
import copy, hashlib, importlib.util, json, sys, tempfile, unittest
from pathlib import Path

sys.dont_write_bytecode = True  # validate-public.mjs runs after this and rejects stray __pycache__ files

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('pointer', ROOT / 'scripts/write-latest-pointer.py')
pointer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pointer)

COMMIT = 'a' * 40


class LatestPointer(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        (self.root / 'downloads').mkdir()
        files = []
        for name, body in (('grandet-api-price-finder-0.3.0.zip', b'zip bytes'), ('grandet-api-price-finder-0.3.0.skill', b'skill bytes')):
            (self.root / 'downloads' / name).write_bytes(body)
            files.append({'file': name, 'bytes': len(body), 'sha256': hashlib.sha256(body).hexdigest()})
        self.manifest = {'version': '0.3.0', 'buildId': 'grandet-skill-0.3.0-build.20261017a', 'files': files}
        tag = 'skill-v0.3.0-build.20261017a'
        self.release = {'draft': False, 'tag_name': tag, 'id': 4242, 'assets': [
            {'name': f['file'], 'id': 100 + n, 'size': f['bytes'], 'digest': 'sha256:' + f['sha256'],
             'browser_download_url': 'https://github.com/hanzohanzhe/Grandet/releases/download/' + tag + '/' + f['file']}
            for n, f in enumerate(files)]}

    def tearDown(self):
        self.temp.cleanup()

    def build(self, manifest=None, release=None, gate='PASS', quote='', approved_at='2026-10-17T12:30:00Z', skillhub='0.3.0-build.20261017.1'):
        return pointer.build_pointer(manifest or self.manifest, release or self.release, COMMIT, gate, 'targets 10/10, no regression',
                                     approved_at, quote, skillhub, root=self.root)

    def test_pass_writes_the_published_build(self):
        p = self.build()
        self.assertEqual(p['schema'], 'grandet.skill-latest/v1')
        self.assertEqual((p['version'], p['build'], p['tag'], p['releaseId']), ('0.3.0', 'grandet-skill-0.3.0-build.20261017a', 'skill-v0.3.0-build.20261017a', 4242))
        self.assertEqual(p['zip']['url'], 'https://github.com/hanzohanzhe/Grandet/releases/download/skill-v0.3.0-build.20261017a/grandet-api-price-finder-0.3.0.zip')
        self.assertEqual(p['skill']['assetId'], 101)
        self.assertEqual(p['zip']['sha256'], self.manifest['files'][0]['sha256'])
        self.assertEqual(p['gate']['result'], 'PASS')

    def test_hold_needs_the_owner_quote(self):
        with self.assertRaisesRegex(ValueError, 'HOLD_NEEDS_OWNER_QUOTE'):
            self.build(gate='HOLD')
        self.assertEqual(self.build(gate='HOLD', quote='发 i5')['approved']['quote'], '发 i5')

    def test_refuses_a_draft(self):
        r = copy.deepcopy(self.release); r['draft'] = True
        with self.assertRaisesRegex(ValueError, 'PUBLIC_BUILD_RELEASE_REQUIRED'):
            self.build(release=r)

    def test_refuses_another_tag(self):
        r = copy.deepcopy(self.release); r['tag_name'] = 'skill-v0.3.0-build.20261016h'
        with self.assertRaisesRegex(ValueError, 'RELEASE_IDENTITY_MISMATCH'):
            self.build(release=r)

    def test_refuses_another_contract_version(self):
        m = copy.deepcopy(self.manifest); m['version'] = '0.3.1'
        with self.assertRaisesRegex(ValueError, 'CONTRACT_VERSION_MUST_BE_0.3.0'):
            self.build(manifest=m)

    def test_refuses_size_url_or_digest_mismatch(self):
        for field, value, code in (('size', 1, 'ASSET_METADATA_MISMATCH'),
                                   ('browser_download_url', 'https://example.com/x.zip', 'ASSET_METADATA_MISMATCH'),
                                   ('digest', 'sha256:' + '0' * 64, 'GITHUB_DIGEST_MISMATCH')):
            r = copy.deepcopy(self.release); r['assets'][0][field] = value
            with self.assertRaisesRegex(ValueError, code):
                self.build(release=r)

    def test_refuses_changed_local_asset(self):
        (self.root / 'downloads' / 'grandet-api-price-finder-0.3.0.zip').write_bytes(b'changed')
        with self.assertRaisesRegex(ValueError, 'LOCAL_ASSET_CHANGED'):
            self.build()

    def test_refuses_bad_times_and_versions(self):
        with self.assertRaisesRegex(ValueError, 'UTC_APPROVAL_TIME_REQUIRED'):
            self.build(approved_at='today')
        with self.assertRaisesRegex(ValueError, 'SKILLHUB_VERSION_FORMAT'):
            self.build(skillhub='latest')

    def test_public_map_entry_added_once(self):
        (self.root / 'public-export-manifest.json').write_text(json.dumps({'files': [{'path': 'downloads/manifest.json'}, {'path': 'downloads/releases.json'}]}, indent=2) + '\n')
        self.assertTrue(pointer.add_to_public_map(root=self.root))
        self.assertFalse(pointer.add_to_public_map(root=self.root))
        paths = [f['path'] for f in json.loads((self.root / 'public-export-manifest.json').read_text())['files']]
        self.assertEqual(paths, ['downloads/manifest.json', 'downloads/latest.json', 'downloads/releases.json'])


if __name__ == '__main__':
    unittest.main(verbosity=2)
