#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Register actual GitHub metadata AFTER upload; never edits/rebuilds package contents."""
import argparse,json,re,hashlib
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--release-json',type=Path,required=True);p.add_argument('--commit',required=True);p.add_argument('--included-at',required=True);p.add_argument('--out',type=Path,required=True);a=p.parse_args()
root=Path(__file__).resolve().parents[1];manifest_bytes=(root/'downloads/manifest.json').read_bytes()
m=json.loads(manifest_bytes);r=json.loads(a.release_json.read_text())
if not re.fullmatch(r'[a-f0-9]{40}',a.commit):raise ValueError('FIXED_SOURCE_COMMIT_REQUIRED')
if m.get('version')!='0.3.0' or m.get('buildId')!='grandet-skill-0.3.0-build.20261017b':raise ValueError('WRONG_BUILD')
if r.get('draft') is not False:raise ValueError('PUBLIC_BUILD_RELEASE_REQUIRED')
if r.get('tag_name')!='skill-v0.3.0-build.20261017b' or type(r.get('id')) is not int:raise ValueError('RELEASE_IDENTITY_MISMATCH')
if not re.fullmatch(r'\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z',a.included_at):raise ValueError('UTC_INCLUSION_TIME_REQUIRED')
assets=[]
for file in m['files']:
    matches=[x for x in r.get('assets',[]) if x.get('name')==file['file']]
    if len(matches)!=1:raise ValueError('MISSING_OR_DUPLICATE_RELEASE_ASSET')
    x=matches[0];url=x.get('browser_download_url','')
    if type(x.get('id')) is not int or x.get('size')!=file['bytes'] or url!='https://github.com/hanzohanzhe/Grandet/releases/download/skill-v0.3.0-build.20261017b/'+file['file']:raise ValueError('ASSET_METADATA_MISMATCH')
    if x.get('digest') not in [None,'sha256:'+file['sha256']]:raise ValueError('GITHUB_DIGEST_MISMATCH')
    if type(x.get('download_count')) is not int or x['download_count']<0:raise ValueError('BASELINE_COUNT_REQUIRED')
    b=(root/'downloads'/file['file']).read_bytes()
    if hashlib.sha256(b).hexdigest()!=file['sha256']:raise ValueError('LOCAL_ASSET_CHANGED')
    assets.append({'repository':'hanzohanzhe/Grandet','commit':a.commit,'release_id':r['id'],'tag':r['tag_name'],'asset_id':x['id'],'version':'0.3.0','format':file['file'].split('.')[-1],'name':file['file'],'size':file['bytes'],'sha256':file['sha256'],'browser_download_url':url,'included_at':a.included_at,'baseline_count':x['download_count'],'disabled':False})
if a.out.exists():raise ValueError('OUTPUT_EXISTS')
a.out.write_text(json.dumps({'schema':'grandet.release-registry/v1','assets':assets},indent=2)+'\n')
