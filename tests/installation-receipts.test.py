# SPDX-License-Identifier: Apache-2.0
import hashlib,json,os,shutil,subprocess,tempfile,threading,unittest,zipfile
from pathlib import Path
from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
ROOT=Path(__file__).resolve().parents[1]
NODE=shutil.which('node') or 'node'
SOURCE=ROOT/'skills/grandet-api-price-finder'
KEYS=set('schema_version event_id installation_id revision operation skill_version content_sha256 source host scope verification occurred_at test_mode exclusion_reason'.split())
class Receipts(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.events=[];cls.unique={};cls.mode='ok'
        class Handler(BaseHTTPRequestHandler):
            def log_message(self,*a):pass
            def do_POST(self):
                e=json.loads(self.rfile.read(int(self.headers['content-length'])));cls.events.append(e)
                self.send_response(429 if cls.mode=='429' else 400 if cls.mode=='reject' else 200);self.send_header('content-type','application/json');self.end_headers()
                if cls.mode=='ok':
                    cls.unique[(e['event_id'],e['revision'])]=e
                    self.wfile.write(json.dumps({'accepted':True,'event_id':e['event_id'],'revision':e['revision'],'duplicate':False}).encode())
                else:self.wfile.write(b'{}')
        cls.server=ThreadingHTTPServer(('127.0.0.1',0),Handler);cls.url='http://127.0.0.1:'+str(cls.server.server_port)+'/api/community/v1/installation-events'
        cls.thread=threading.Thread(target=cls.server.serve_forever,daemon=True);cls.thread.start()
    @classmethod
    def tearDownClass(cls):cls.server.shutdown();cls.server.server_close()
    def setUp(self):self.temp=tempfile.TemporaryDirectory();self.home=Path(self.temp.name)/'home';self.dest=self.home/'.agents/skills/grandet-api-price-finder';type(self).mode='ok';self.events.clear();self.unique.clear()
    def tearDown(self):self.temp.cleanup()
    def node(self,*args,env=None,success=True):
        r=subprocess.run([NODE,str(ROOT/'scripts/install-price-finder.mjs'),'--app','codex','--home',str(self.home),'--receipt-endpoint',self.url,*args],capture_output=True,text=True,env={**os.environ,**(env or {})})
        if success:self.assertEqual(r.returncode,0,r.stderr);return json.loads(r.stdout)
        return r
    def py(self,*args,env=None,success=True):
        r=subprocess.run(['python3',str(ROOT/'scripts/verify-installation.py'),'--destination',str(self.dest),'--host','codex','--scope','user','--test-mode','--receipt-endpoint',self.url,*args],capture_output=True,text=True,env={**os.environ,**(env or {})})
        if success:self.assertEqual(r.returncode,0,r.stderr);return json.loads(r.stdout)
        return r
    def state(self):return json.loads(next(self.home.rglob('state.json')).read_text(encoding='utf-8'))
    def test_sources_and_no_leaked_fields(self):
        for source in ['release_zip','release_skill','source','checkout','raw','cache','local','unknown']:
            self.node('--receipt-source',source)
            e=self.events[-1];self.assertEqual(set(e),KEYS);self.assertEqual(e['source'],source);self.assertEqual(e['verification'],'files_verified');self.assertFalse(e['test_mode']);self.assertEqual(e['exclusion_reason'],'none');self.assertNotIn(str(self.home),json.dumps(e))
        self.assertEqual(self.events[0]['operation'],'install');self.assertTrue(all(e['operation']=='reuse' for e in self.events[1:]));self.assertEqual(len({e['installation_id'] for e in self.events}),1)
    def test_alias_shared_installation_id(self):
        self.node();first=self.events[-1]
        r=subprocess.run([NODE,str(ROOT/'scripts/install-price-finder.mjs'),'--app','cursor','--home',str(self.home),'--receipt-endpoint',self.url],capture_output=True,text=True)
        self.assertEqual(r.returncode,0,r.stderr);self.assertEqual(json.loads(r.stdout)['status'],'REUSED');self.assertEqual(self.events[-1]['installation_id'],first['installation_id']);self.assertFalse((self.home/'.cursor/skills/grandet-api-price-finder').exists())
    def test_no_node_copy_and_manual_existing(self):
        self.py('--source',str(SOURCE),'--receipt-source','checkout');self.assertEqual(self.events[-1]['operation'],'install')
        independent=Path(self.temp.name)/'native/skills/manual';shutil.copytree(SOURCE,independent)
        r=subprocess.run(['python3',str(ROOT/'scripts/verify-installation.py'),'--destination',str(independent),'--test-mode','--receipt-endpoint',self.url],capture_output=True,text=True)
        self.assertEqual(r.returncode,0,r.stderr);self.assertEqual(self.events[-1]['operation'],'existing_seen')
    def test_offline_bounded_retry_then_flush(self):
        type(self).mode='429';r=self.node();self.assertEqual(r['receipt']['pending'],1);self.assertEqual(r['receipt']['attempts'],3);e=self.events[0]
        type(self).mode='ok';r=self.py('--flush');self.assertEqual(r['receipt']['pending'],0);self.assertEqual(self.events[-1],e);self.assertEqual(len(self.unique),1)
    def test_disconnected_socket_preserves_then_flushes(self):
        import socket
        sock=socket.socket();sock.bind(('127.0.0.1',0));port=sock.getsockname()[1];sock.close()
        old=self.url;self.url='http://127.0.0.1:'+str(port)+'/events'
        r=self.node();self.assertEqual(r['receipt']['attempts'],3);self.assertEqual(r['receipt']['pending'],1);pending=self.state()['outbox'][0]
        self.url=old;self.py('--flush');self.assertEqual(self.events[-1],pending);self.assertEqual(self.state()['outbox'],[])
    def test_400_stops_and_ack_dedup(self):
        type(self).mode='reject';r=self.node();self.assertEqual(r['receipt']['attempts'],1);self.assertEqual(r['receipt']['pending'],1)
        e=self.events[0];type(self).mode='ok';self.node('--flush');self.assertEqual(self.events[-1],e);self.assertEqual(len(self.unique),1);self.node('--flush');self.assertEqual(len(self.unique),1)
    def test_crash_after_write_recovers_original_event(self):
        r=self.node(env={'GRANDET_INSTALL_CRASH_AFTER_WRITE':'1'},success=False);self.assertEqual(r.returncode,86);self.assertTrue(self.dest.exists());self.assertEqual(self.events,[])
        journal=json.loads(next(self.home.rglob('journal.json')).read_text(encoding='utf-8'));self.node('--flush');self.assertEqual(len(self.events),1);self.assertEqual(self.events[0],journal['event']);self.assertFalse(list(self.home.rglob('journal.json')))
    def test_update_crash_before_move_resumes_without_counting_install(self):
        self.node();old=self.events[-1]
        changed=Path(self.temp.name)/'changed';shutil.copytree(SOURCE,changed);(changed/'SKILL.md').write_bytes((changed/'SKILL.md').read_bytes()+b'\nUpdate\n')
        r=self.node('--source',str(changed),env={'GRANDET_INSTALL_CRASH_BEFORE_MOVE':'1'},success=False);self.assertEqual(r.returncode,86)
        journal=json.loads(next(self.home.rglob('journal.json')).read_text(encoding='utf-8'));self.py('--source',str(changed),'--flush');self.assertEqual(self.events[-1],journal['event']);self.assertEqual(self.events[-1]['operation'],'update');self.assertEqual(self.events[-1]['installation_id'],old['installation_id'])
    def test_deep_home_python_staging_fits_windows_path_limit(self):
        # Native Windows without long-path support rejects paths over 259 characters; staging must fit wherever the receipt state fits.
        base=Path(self.temp.name);pad=170-len(str(base))-41
        if pad<1:self.skipTest('temporary directory too deep')
        self.home=base/('h'*pad);self.dest=self.home/'.agents/skills/grandet-api-price-finder';self.assertEqual(len(str(self.dest)),170)
        self.py('--source',str(SOURCE))
        changed=base/'changed';shutil.copytree(SOURCE,changed);(changed/'SKILL.md').write_bytes((SOURCE/'SKILL.md').read_bytes()+b'\nUpdate\n')
        self.py('--source',str(changed));self.assertEqual(self.events[-1]['operation'],'update');self.assertEqual((self.dest/'SKILL.md').read_bytes(),(changed/'SKILL.md').read_bytes())
        # Stage and backup folders share one depth; the kept backup shows it.
        backups=[p.parent for p in self.home.rglob('SKILL.md') if self.dest not in p.parents];self.assertEqual(len(backups),1)
        self.assertEqual((backups[0]/'SKILL.md').read_bytes(),(SOURCE/'SKILL.md').read_bytes());self.assertLessEqual(max(len(str(p)) for p in backups[0].rglob('*')),259)
    def test_python_crash_node_recovery(self):
        r=self.py('--source',str(SOURCE),env={'GRANDET_INSTALL_CRASH_AFTER_WRITE':'1'},success=False);self.assertEqual(r.returncode,86);journal=json.loads(next(self.home.rglob('journal.json')).read_text(encoding='utf-8'));self.node('--flush');self.assertEqual(self.events[0],journal['event'])
    def test_update_same_version_repair_reinstall_and_actions(self):
        self.node();first=self.events[-1]
        changed=Path(self.temp.name)/'changed';shutil.copytree(SOURCE,changed);(changed/'SKILL.md').write_bytes((changed/'SKILL.md').read_bytes()+b'\nNew content\n')
        self.node('--source',str(changed));self.assertEqual(self.events[-1]['operation'],'update');self.assertEqual(self.events[-1]['skill_version'],first['skill_version']);self.assertNotEqual(self.events[-1]['content_sha256'],first['content_sha256'])
        (self.dest/'SKILL.md').write_bytes(b'damaged');self.node('--source',str(changed));self.assertEqual(self.events[-1]['operation'],'repair')
        self.py('--source',str(changed),'--operation','reinstall');self.assertEqual(self.events[-1]['operation'],'reinstall')
        for op in ['bind','sync','enable']:self.py('--operation',op);self.assertEqual(self.events[-1]['operation'],op)
        self.assertTrue(all(e['installation_id']==first['installation_id'] for e in self.events))
    def test_revision_upgrades_original_event_not_install_count(self):
        self.node();e=self.events[-1]
        self.py('--verification','host_accepted','--host-confirmed');e2=self.events[-1];self.assertEqual(e2['event_id'],e['event_id']);self.assertEqual(e2['revision'],2);self.assertEqual(e2['occurred_at'],e['occurred_at']);self.assertEqual(e2['operation'],'install')
        self.py('--verification','session_triggered','--host-confirmed');self.assertEqual(self.events[-1]['revision'],3);self.assertEqual(self.events[-1]['event_id'],e['event_id'])
    def test_optout_install_no_delivery_or_forced_download(self):
        r=self.node('--no-telemetry');self.assertTrue(self.dest.exists());self.assertEqual(self.events,[]);self.assertEqual(r['receipt']['status'],'DISABLED')
        self.node(env={'GRANDET_INSTALL_TELEMETRY':'0'});self.assertEqual(self.events,[])
    def test_failed_validation_and_dryrun_no_success(self):
        self.node('--dry-run');self.assertFalse(self.home.exists());self.assertEqual(self.events,[])
        bad=Path(self.temp.name)/'bad';shutil.copytree(SOURCE,bad);(bad/'references/workloads.md').unlink();r=self.node('--source',str(bad),success=False);self.assertNotEqual(r.returncode,0);self.assertEqual(self.events,[])
    def test_source_build_is_030_compatible_and_rejects_candidate_version(self):
        result=self.node();self.assertEqual(result['productVersion'],'0.3.0');self.assertEqual(result['sourceBuild'],'grandet-skill-0.3.0-build.20261016c');self.assertEqual(self.events[-1]['skill_version'],'0.3.0')
        wrong=Path(self.temp.name)/'candidate';shutil.copytree(SOURCE,wrong);(wrong/'SKILL.md').write_bytes((wrong/'SKILL.md').read_bytes().replace(b'Package version: `0.3.0`',b'Package version: `0.3.1`'))
        before=len(self.events);result=self.node('--source',str(wrong),success=False);self.assertNotEqual(result.returncode,0);self.assertEqual(len(self.events),before)
    def test_reported_digest_matches_receipt_digest(self):
        result=self.node();self.assertEqual(result['contentSha256'],self.events[-1]['content_sha256'])
    def test_unregistered_cloud_hosts_remain_unknown_and_editions_use_catalog_id(self):
        self.node()
        for host,want in [('chatgpt','unknown'),('claude-web','unknown'),('cursor-cloud-agent','unknown'),('grok-bot','unknown'),('muse','unknown'),('your-dot','unknown'),('trae-cn','trae'),('trae-intl','trae'),('workbuddy-cn','workbuddy'),('workbuddy-intl','workbuddy')]:
            self.py('--host',host);self.assertEqual(self.events[-1]['host'],want)
    def test_bundled_native_030_content_verifier(self):
        old=Path(self.temp.name)/'old';old.mkdir()
        with zipfile.ZipFile(ROOT/'downloads/grandet-api-price-finder-0.3.0.skill') as z:z.extractall(old)
        folder=old/'grandet-api-price-finder';self.py('--source',str(folder),'--receipt-source','cache');self.assertEqual(self.events[-1]['skill_version'],'0.3.0')
    def test_failure_endpoint_and_unconfirmed_host_rejected(self):
        self.node();r=self.py('--verification','host_accepted',success=False);self.assertNotEqual(r.returncode,0)
        r=self.node('--receipt-endpoint','https://example.com/events',success=False);self.assertNotEqual(r.returncode,0)
    def test_missing_target_reinstall_continues_id(self):
        self.node();first=self.events[-1];shutil.rmtree(self.dest);self.node();self.assertEqual(self.events[-1]['operation'],'reinstall');self.assertEqual(self.events[-1]['installation_id'],first['installation_id'])
if __name__=='__main__':unittest.main(verbosity=2)
