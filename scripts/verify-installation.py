#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""No-Node file installer/verifier. Only category-limited receipts leave this process."""
import argparse, hashlib, json, os, re, shutil, sys, time, uuid
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from urllib.parse import urlparse

ENDPOINT='https://grandet.ai/api/community/v1/installation-events'
NOTICE='Grandet installation receipts: random installation/event IDs, operation, version, SHA-256, source/host/scope categories, verification and UTC time; installation statistics; retained 24 months. No paths, usernames, chats, keys or fingerprints. Installation-stage only. --no-telemetry or GRANDET_INSTALL_TELEMETRY=0 disables delivery without blocking installation.'
SOURCES=['release_zip','release_skill','source','checkout','raw','cache','local','unknown']
HOSTS=['codex','claude-code','cursor','cursor-cloud-agent','opencode','gemini-cli','windsurf','cline','hermes','openclaw','trae','trae-cn','trae-intl','kilo-code','continue','roo-code','chatgpt','claude-web','cherry-studio','chatbox','workbuddy','workbuddy-cn','workbuddy-intl','grok-bot','your-dot','muse','unknown']
REGISTERED_HOSTS={'codex','claude-code','cursor','opencode','gemini-cli','windsurf','cline','hermes','openclaw','trae','kilo-code','continue','roo-code','cherry-studio','chatbox','workbuddy','generic','unknown'}
HOST_ALIASES={'trae-cn':'trae','trae-intl':'trae','workbuddy-cn':'workbuddy','workbuddy-intl':'workbuddy'}
LEVELS=['agent_reported','files_verified','host_accepted','session_triggered']
REQUIRED=['SKILL.md','agents/openai.yaml','references/app-catalog.md','references/entrypoints.md','references/host-setup.md','references/http-fallback.md','references/response-format.md','references/workloads.md']
def sha(b): return hashlib.sha256(b).hexdigest()
def safe(path):
    path=Path(os.path.abspath(path))
    if any(p.is_symlink() for p in [path,*path.parents]): raise ValueError('SYMLINK_NOT_ALLOWED')
def tree(path):
    safe(path)
    if not path.is_dir(): raise ValueError('NOT_A_DIRECTORY')
    files={}
    for p in sorted(path.rglob('*')):
        if p.is_symlink(): raise ValueError('SYMLINK_NOT_ALLOWED')
        if p.is_file(): files[p.relative_to(path).as_posix()]=p.read_bytes()
        elif not p.is_dir(): raise ValueError('UNSUPPORTED_FILE_TYPE')
    return files
def digest(files): return sha(''.join(p+'\0'+sha(b)+'\n' for p,b in sorted(files.items())).encode())
def version(files):
    if any(p not in files for p in REQUIRED): raise ValueError('INCOMPLETE_SKILL')
    text=files['SKILL.md'].decode('utf8')
    m=re.search(r'Package version:\s*`(0\.3\.0)`',text)
    if not m or not re.search(r'^name:\s*grandet-api-price-finder\s*$',text,re.M): raise ValueError('INVALID_SKILL_IDENTITY')
    for p,b in files.items():
        if not p.endswith('.md'): continue
        for target in re.findall(r'\]\(([^\s)]+)',b.decode())+re.findall(r'^\s*\[[^\]]+\]:\s*(\S+)',b.decode(),re.M):
            if re.match(r'^(?:[a-z][a-z\d+.-]*:|#|//)',target,re.I): continue
            from urllib.parse import unquote
            local=unquote(target.split('#')[0].split('?')[0].strip('<>'))
            resolved=Path(os.path.normpath(str(Path(p).parent/local))).as_posix()
            if resolved.startswith('../') or resolved.startswith('/') or resolved not in files: raise ValueError('MISSING_OR_INVALID_SKILL_REFERENCE')
    return m[1]
def atomic(path,data):
    safe(path); path.parent.mkdir(parents=True,exist_ok=True,mode=0o700)
    temp=path.with_name(path.name+'.'+str(uuid.uuid4())+'.tmp')
    fd=os.open(temp,os.O_CREAT|os.O_EXCL|os.O_WRONLY,0o600)
    with os.fdopen(fd,'w') as f: json.dump(data,f,indent=2); f.write('\n'); f.flush(); os.fsync(f.fileno())
    os.replace(temp,path)
def read(path,default=None): return json.loads(path.read_text()) if path.exists() else default
def now():
    from datetime import datetime,timezone
    return datetime.now(timezone.utc).isoformat(timespec='milliseconds').replace('+00:00','Z')
def main(argv=None):
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--destination',type=Path,required=True,help='actual persistent Skill folder, not parent')
    p.add_argument('--source',type=Path,help='complete Skill folder; installs atomically if provided')
    p.add_argument('--host',choices=HOSTS,default='unknown'); p.add_argument('--scope',choices=['user','project','cloud','unknown'],default='unknown')
    p.add_argument('--receipt-source',choices=SOURCES,default='unknown')
    p.add_argument('--operation',choices=['repair','reinstall','bind','sync','enable'])
    p.add_argument('--verification',choices=LEVELS,default='files_verified',help='higher level requires explicit observed host evidence; never inferred from files')
    p.add_argument('--host-confirmed',action='store_true',help='operator confirms observed host acceptance/natural trigger; not a file check')
    p.add_argument('--flush',action='store_true');p.add_argument('--dry-run',action='store_true');p.add_argument('--no-telemetry',action='store_true')
    p.add_argument('--test-mode',action='store_true'); p.add_argument('--receipt-endpoint',default=ENDPOINT)
    a=p.parse_args(argv); destination=Path(os.path.abspath(a.destination));safe(destination)
    if a.source:
        source=Path(os.path.abspath(a.source));safe(source)
        if source==destination or source in destination.parents or destination in source.parents: raise ValueError('OVERLAPPING_PATHS')
        payload=tree(source);v=version(payload)
    elif destination.exists(): payload=tree(destination);v=version(payload)
    else: raise ValueError('NO_PERSISTENT_FILES_TO_VERIFY')
    if a.verification in ['host_accepted','session_triggered'] and not a.host_confirmed: raise ValueError('HOST_CONFIRMATION_REQUIRED')
    u=urlparse(a.receipt_endpoint)
    if a.receipt_endpoint!=ENDPOINT and not(a.test_mode and u.scheme=='http' and u.hostname in ['127.0.0.1','localhost','::1']): raise ValueError('RECEIPT_ENDPOINT_NOT_ALLOWED')
    content=digest(payload)
    if a.dry_run:
        print(json.dumps({'status':'DRY_RUN','version':v,'sourceBuild':'grandet-skill-0.3.0-build.20261016c','nativeAcceptance':'NOT_RUN'}));return
    print(NOTICE,file=sys.stderr)
    directory=destination.parent.parent/'.grandet-install-state'/sha(str(destination).encode());safe(directory);directory.mkdir(parents=True,exist_ok=True,mode=0o700)
    lock=directory/'lock.json'
    if lock.exists():
        old=read(lock)
        try: os.kill(old['pid'],0)
        except ProcessLookupError: lock.unlink()
        else: raise ValueError('INSTALLATION_LOCKED')
    fd=os.open(lock,os.O_CREAT|os.O_EXCL|os.O_WRONLY,0o600)
    with os.fdopen(fd,'w') as f: json.dump({'pid':os.getpid()},f)
    try:
        statefile=directory/'state.json';journalfile=directory/'journal.json'
        state=read(statefile,{'installation_id':None,'digest':None,'version':None,'outbox':[],'last_event':None})
        enabled=not a.no_telemetry and os.environ.get('GRANDET_INSTALL_TELEMETRY')!='0'
        if not enabled: state['outbox']=[]
        def complete(j):
            e=j['event'];state.update(installation_id=e['installation_id'],digest=e['content_sha256'],version=e['skill_version'])
            if enabled and not any(x['event_id']==e['event_id'] for x in state['outbox']) and (state.get('last_event') or {}).get('event_id')!=e['event_id']:state['outbox'].append(e)
            state['last_event']=e;atomic(statefile,state);journalfile.unlink(missing_ok=True)
        j=read(journalfile)
        if j:
            if j['destination']!=str(destination):raise ValueError('JOURNAL_TARGET_MISMATCH')
            for target in ['destination','stage','backup']:
                if j.get(target):safe(j[target])
            if destination.exists() and j.get('previous_content') and j.get('stage') and Path(j['stage']).exists() and digest(tree(destination))==j['previous_content'] and digest(tree(Path(j['stage'])))==j['event']['content_sha256'] and not Path(j['backup']).exists():os.replace(destination,j['backup'])
            if not destination.exists() and j.get('stage') and Path(j['stage']).exists():destination.parent.mkdir(parents=True,exist_ok=True);os.replace(j['stage'],destination)
            if destination.exists() and digest(tree(destination))==j['event']['content_sha256']:complete(j)
            else:
                if not destination.exists() and j.get('backup') and Path(j['backup']).exists():os.replace(j['backup'],destination)
                raise ValueError('INTERRUPTED_INSTALL_REQUIRES_REPAIR')
        if not a.flush:
            oldfiles=tree(destination) if destination.exists() else None
            same=oldfiles==payload
            operation=a.operation or ('existing_seen' if not state['installation_id'] and oldfiles is not None and same else 'reuse' if same else 'reinstall' if state['installation_id'] and oldfiles is None else 'install' if oldfiles is None else 'repair' if state['digest']==content else 'update')
            if operation in ['bind','sync','enable'] and not same:raise ValueError('BIND_SYNC_ENABLE_REQUIRE_VERIFIED_EXISTING_CONTENT')
            # Higher verification revises the last transaction, never a fresh installation.
            upgrade=same and state['last_event'] and a.verification!='files_verified' and not a.operation
            if upgrade:
                e=state['last_event']
                if LEVELS.index(a.verification)>LEVELS.index(e['verification']):
                    e={**e,'revision':e['revision']+1,'verification':a.verification};state['last_event']=e
                    if enabled:state['outbox']=[x for x in state['outbox'] if x['event_id']!=e['event_id']]+[e]
                    atomic(statefile,state)
            else:
                e={'schema_version':'grandet.installation-event/v1','event_id':str(uuid.uuid4()),'installation_id':state['installation_id'] or str(uuid.uuid4()),'revision':1,'operation':operation,'skill_version':v,'content_sha256':content,'source':a.receipt_source,'host':HOST_ALIASES.get(a.host,a.host) if HOST_ALIASES.get(a.host,a.host) in REGISTERED_HOSTS else 'unknown','scope':a.scope,'verification':'files_verified','occurred_at':now(),'test_mode':False,'exclusion_reason':'none'}
                stage=directory/('stage-'+e['event_id']);backup=directory/('backup-'+e['event_id'])
                j={'destination':str(destination),'stage':None,'backup':None,'event':e}
                if not same or operation=='reinstall':
                    stage.mkdir()
                    for rel,b in payload.items():target=stage/rel;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(b)
                    if tree(stage)!=payload:raise ValueError('STAGED_COPY_MISMATCH')
                    j.update(stage=str(stage),backup=str(backup) if oldfiles is not None else None,previous_content=digest(oldfiles) if oldfiles is not None else None)
                atomic(journalfile,j)
                if a.test_mode and os.environ.get('GRANDET_INSTALL_CRASH_BEFORE_MOVE')=='1':os._exit(86)
                if j['stage']:
                    if oldfiles is not None:os.replace(destination,backup)
                    destination.parent.mkdir(parents=True,exist_ok=True);os.replace(stage,destination)
                if a.test_mode and os.environ.get('GRANDET_INSTALL_CRASH_AFTER_WRITE')=='1':os._exit(86)
                if tree(destination)!=payload:raise ValueError('TARGET_READBACK_MISMATCH')
                complete(j)
        attempts=0
        if enabled:
            for e in list(state['outbox'])[:10]:
                acked=False
                for retry in range(3):
                    attempts+=1
                    try:
                        req=Request(a.receipt_endpoint,data=json.dumps(e).encode(),headers={'content-type':'application/json'},method='POST')
                        # No redirects: a receipt must not be forwarded to another origin.
                        from urllib.request import build_opener,HTTPRedirectHandler
                        class NoRedirect(HTTPRedirectHandler):
                            def redirect_request(self,*args,**kwargs):return None
                        with build_opener(NoRedirect).open(req,timeout=2.5) as response:ack=json.load(response)
                        if ack.get('accepted') is True and ack.get('event_id')==e['event_id'] and type(ack.get('revision')) is int and ack['revision']>=e['revision']:acked=True;break
                    except HTTPError as err:
                        if 400<=err.code<500 and err.code!=429:break
                    except Exception:pass
                if not acked:break
                state['outbox']=[x for x in state['outbox'] if not(x['event_id']==e['event_id'] and x['revision']<=e['revision'])];atomic(statefile,state)
        atomic(statefile,state)
        print(json.dumps({'status':'FILES_VERIFIED','version':v,'sourceBuild':'grandet-skill-0.3.0-build.20261016c','nativeAcceptance':'NOT_RUN','receipt':{'status':'DISABLED' if not enabled else 'PENDING' if state['outbox'] else 'ACKNOWLEDGED','pending':len(state['outbox']),'attempts':attempts}}))
    finally:lock.unlink(missing_ok=True)
if __name__=='__main__':
    try:main()
    except Exception as e:print(str(e),file=sys.stderr);sys.exit(1)
