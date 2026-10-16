#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Deterministically build both self-contained 0.3.0 build archives; never overwrite outputs."""
import argparse,hashlib,json,zipfile
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--package',type=Path,required=True);p.add_argument('--out',type=Path,required=True);a=p.parse_args()
root=Path(__file__).resolve().parents[1];version='0.3.0';build='grandet-skill-0.3.0-build.20261016c';tag='skill-v0.3.0-build.20261016c'
package=json.loads((a.package/'package-manifest.json').read_text())
if package['version']!=version or package['sourceBuild']!=build or package['releasePackage'] is not True:raise ValueError('WRONG_PACKAGE_BUILD')
a.out.mkdir(parents=True,exist_ok=True)
def walk(folder):
    for f in sorted(folder.rglob('*')):
        if f.is_symlink():raise ValueError('SYMLINK_NOT_ALLOWED')
        if f.is_file():yield f.relative_to(folder).as_posix(),f.read_bytes()
entries=list(walk(a.package))
# Native import retains one Skill root. These tools execute only on explicit setup/verification.
native=list(walk(a.package/'skills/grandet-api-price-finder'))
for name in ['LICENSE','INSTALL.md','installation-receipts.md','installation-routes.json','installation-receipts-source-build.json','scripts/install-price-finder.mjs','scripts/installation-receipts.mjs','scripts/verify-installation.py']:
    native.append((name,(a.package/name).read_bytes()))
native.append(('package-manifest.json',(json.dumps({'schema':'grandet-price-finder-package/v1','name':package['name'],'version':version,'sourceBuild':build,'releasePackage':True,'nativeAcceptance':'NOT_RUN','files':{n:hashlib.sha256(b).hexdigest() for n,b in sorted(native)}},indent=2)+'\n').encode()))
records=[]
for ext,files in [('zip',entries),('skill',[('grandet-api-price-finder/'+n,b) for n,b in sorted(native)])]:
    output=a.out/f'grandet-api-price-finder-{version}.{ext}'
    with zipfile.ZipFile(output,'x',zipfile.ZIP_DEFLATED) as z:
        for arc,body in files:
            info=zipfile.ZipInfo(arc,date_time=(2026,10,15,0,0,0));info.create_system=0;info.external_attr=0o100644<<16;info.compress_type=zipfile.ZIP_DEFLATED;z.writestr(info,body)
    with zipfile.ZipFile(output) as z:
        if z.testzip():raise ValueError('BAD_ARCHIVE')
        for arc,body in files:
            if z.read(arc)!=body:raise ValueError('ARCHIVE_ROUNDTRIP_MISMATCH')
    records.append({'file':output.name,'bytes':output.stat().st_size,'sha256':hashlib.sha256(output.read_bytes()).hexdigest(),'files':len(files)})
paths=set(['scripts/package-price-finder.mjs','scripts/build-skill-archives.py','scripts/register-skill-release.py','scripts/installation-receipts-source-build.json'])
paths.update(str(f.relative_to(root)) for f in (root/'skills/grandet-api-price-finder').rglob('*') if f.is_file())
paths.update(['LICENSES/Apache-2.0.txt','docs/skills/QUICKSTART.md','docs/skills/INSTALL.md','docs/skills/installation-receipts.md','docs/skills/installation-routes.json','scripts/install-price-finder.mjs','scripts/installation-receipts.mjs','scripts/verify-installation.py','docs/skills/application-distribution.generated.json'])
paths.update(str(f.relative_to(root)) for f in (root/'docs/skills/chat-adapters').glob('*.md'))
paths.update(str(f.relative_to(root)) for f in (root/'plugins/grandet-api-price-finder').rglob('*') if f.is_file())
manifest={'schema':'grandet.skill-downloads/v1','version':version,'buildId':build,'status':'RELEASE_BUILD','repository':'https://github.com/hanzohanzhe/Grandet','installation':'../INSTALL.md','license':'Apache-2.0','plannedTag':tag,'receiptSupport':'INCLUDED','files':records,'sourceFiles':{n:hashlib.sha256((root/n).read_bytes()).hexdigest() for n in sorted(paths)},'verification':{'archiveRoundTrip':'PASS','packageHashes':'PASS','nativeArchiveIncludesLicense':True,'allHostsNativeAcceptance':'NOT_COMPLETE','nativeAcceptance':'NOT_RUN','historicalInstallationsBackfilled':False},'reproducibility':'sourceFiles pins exclude generated archives and this manifest; post-upload registry independently binds actual source commit and asset IDs'}
output=a.out/'manifest.json'
with output.open('x') as f:f.write(json.dumps(manifest,indent=2)+'\n')
print(json.dumps({'files':records,'manifestSha256':hashlib.sha256(output.read_bytes()).hexdigest()}))
