#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Exercise shipped archive bytes and bundled tools, never a real host or production endpoint."""
import hashlib,json,os,shutil,subprocess,tempfile,threading,unittest,zipfile
from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
class PackagedReceipts(unittest.TestCase):
 def test_both_archives_are_self_contained_and_report_actual_persisted_tree(self):
  events=[]
  class Handler(BaseHTTPRequestHandler):
   def log_message(self,*args):pass
   def do_POST(self):
    e=json.loads(self.rfile.read(int(self.headers['Content-Length'])));events.append(e);self.send_response(200);self.send_header('Content-Type','application/json');self.end_headers();self.wfile.write(json.dumps({'accepted':True,'event_id':e['event_id'],'revision':e['revision'],'duplicate':False}).encode())
  server=ThreadingHTTPServer(('127.0.0.1',0),Handler);thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start();url=f'http://127.0.0.1:{server.server_port}/events'
  try:
   with tempfile.TemporaryDirectory(prefix='grandet-shipped-build-') as d:
    base=Path(d)
    def run(args,cwd):
     p=subprocess.run(args,cwd=cwd,capture_output=True,text=True,env={**os.environ,'GRANDET_INSTALL_TELEMETRY':'1'});self.assertEqual(p.returncode,0,p.stderr);return json.loads(p.stdout)
    def digest(tree):
     files=sorted((p.relative_to(tree).as_posix(),p.read_bytes()) for p in tree.rglob('*') if p.is_file());return hashlib.sha256(''.join(f'{n}\0{hashlib.sha256(b).hexdigest()}\n' for n,b in files).encode()).hexdigest()
    for ext in ['zip','skill']:
     extracted=base/ext;extracted.mkdir()
     with zipfile.ZipFile(ROOT/f'downloads/grandet-api-price-finder-0.3.0.{ext}') as z:z.extractall(extracted)
     source=extracted if ext=='zip' else extracted/'grandet-api-price-finder'
     for n in ['scripts/install-price-finder.mjs','scripts/installation-receipts.mjs','scripts/verify-installation.py','installation-receipts-source-build.json','INSTALL.md']:
      self.assertTrue((source/n).is_file(),n)
     manifest=json.loads((source/'package-manifest.json').read_text());self.assertEqual(manifest['version'],'0.3.0');self.assertEqual(manifest['sourceBuild'],'grandet-skill-0.3.0-build.20261014');self.assertTrue(manifest['releasePackage'])
     for n,h in manifest['files'].items():self.assertEqual(hashlib.sha256((source/n).read_bytes()).hexdigest(),h,n)
     home=base/(ext+'-node-home');r=run(['node','scripts/install-price-finder.mjs','--app','codex','--home',str(home),'--receipt-source','release_'+ext,'--receipt-endpoint',url],source)
     self.assertEqual(r['productVersion'],'0.3.0');self.assertEqual(r['sourceBuild'],'grandet-skill-0.3.0-build.20261014');self.assertEqual(r['nativeAcceptance'],'NOT_RUN')
     event=events[-1];self.assertEqual(event['operation'],'install');self.assertEqual(event['verification'],'files_verified');self.assertTrue(event['test_mode']);self.assertEqual(event['content_sha256'],digest(home/'.agents/skills/grandet-api-price-finder'))
     target=base/(ext+'-python-home')/'skills/grandet-api-price-finder';pySource='skills/grandet-api-price-finder' if ext=='zip' else '.'
     run(['python3','scripts/verify-installation.py','--source',pySource,'--destination',str(target),'--host','codex','--scope','user','--receipt-source','release_'+ext,'--test-mode','--receipt-endpoint',url],source)
     self.assertEqual(events[-1]['operation'],'install');self.assertEqual(events[-1]['content_sha256'],event['content_sha256']);self.assertEqual(events[-1]['content_sha256'],digest(target))
     print(json.dumps({'archive':ext,'bundledNodeAndPython':'PASS','operation':events[-1]['operation'],'verification':events[-1]['verification'],'content_sha256':events[-1]['content_sha256'],'nativeAcceptance':'NOT_RUN','productionEvents':0}),flush=True)
     self.assertEqual(events[-1]['skill_version'],'0.3.0');self.assertEqual(set(events[-1]),{'schema_version','event_id','installation_id','revision','operation','skill_version','content_sha256','source','host','scope','verification','occurred_at','test_mode','exclusion_reason'})
  finally:server.shutdown();thread.join();server.server_close()
if __name__=='__main__':unittest.main(verbosity=2)
