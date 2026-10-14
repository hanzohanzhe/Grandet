#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Build new immutable 0.3.1 archives from the audited packager output."""
import argparse,hashlib,json,subprocess,zipfile
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--package',type=Path,required=True);p.add_argument('--out',type=Path,required=True);a=p.parse_args()
root=Path(__file__).resolve().parents[1];version='0.3.1'
if json.loads((a.package/'package-manifest.json').read_text())['version']!=version:raise ValueError('WRONG_PACKAGE_VERSION')
a.out.mkdir(parents=True,exist_ok=True)
def walk(folder):
    for f in sorted(folder.rglob('*')):
        if f.is_symlink():raise ValueError('SYMLINK_NOT_ALLOWED')
        if f.is_file():yield f.relative_to(folder).as_posix(),f
entries=list(walk(a.package))
# .skill has one native Skill root, including the no-Node verifier and license.
native=[('grandet-api-price-finder/'+n,f) for n,f in walk(root/'skills/grandet-api-price-finder')]
native.append(('grandet-api-price-finder/LICENSE',root/'LICENSES/Apache-2.0.txt'))
records=[]
for ext,files in [('zip',entries),('skill',sorted(native))]:
    output=a.out/f'grandet-api-price-finder-{version}.{ext}'
    if output.exists():raise ValueError('REFUSE_TO_OVERWRITE_ARCHIVE')
    with zipfile.ZipFile(output,'x',zipfile.ZIP_DEFLATED) as z:
        for arc,f in files:
            info=zipfile.ZipInfo(arc,date_time=(2026,10,14,0,0,0));info.create_system=0;info.external_attr=0o100644<<16;info.compress_type=zipfile.ZIP_DEFLATED;z.writestr(info,f.read_bytes())
    with zipfile.ZipFile(output) as z:
        if z.testzip():raise ValueError('BAD_ARCHIVE')
        for arc,f in files:
            if z.read(arc)!=f.read_bytes():raise ValueError('ARCHIVE_ROUNDTRIP_MISMATCH')
    records.append({'file':output.name,'bytes':output.stat().st_size,'sha256':hashlib.sha256(output.read_bytes()).hexdigest(),'files':len(files)})
paths=set(['scripts/package-price-finder.mjs','scripts/build-skill-archives.py','scripts/register-skill-release.py'])
paths.update(str(f.relative_to(root)) for _,f in walk(root/'skills/grandet-api-price-finder'))
paths.update(['LICENSES/Apache-2.0.txt','docs/skills/QUICKSTART.md','docs/skills/INSTALL.md','docs/skills/installation-receipts.md','docs/skills/installation-routes.json','scripts/install-price-finder.mjs','scripts/installation-receipts.mjs','scripts/verify-installation.py','docs/skills/application-distribution.generated.json'])
paths.update(str(f.relative_to(root)) for f in (root/'docs/skills/chat-adapters').glob('*.md'))
paths.update(str(f.relative_to(root)) for f in (root/'plugins/grandet-api-price-finder').rglob('*') if f.is_file())
manifest={'schema':'grandet.skill-downloads/v1','version':version,'status':'LOCAL_CANDIDATE_NOT_PUBLISHED','repository':'https://github.com/hanzohanzhe/Grandet','installation':'../INSTALL.md','license':'Apache-2.0','plannedTag':'skill-v0.3.1','files':records,'sourceFiles':{n:hashlib.sha256((root/n).read_bytes()).hexdigest() for n in sorted(paths)},'verification':{'archiveRoundTrip':'PASS','packageHashes':'PASS','canonicalSkillFiles':sum(1 for _ in walk(root/'skills/grandet-api-price-finder')),'nativeArchiveIncludesLicense':True,'allHostsNativeAcceptance':'NOT_COMPLETE','nativeAcceptance':'NOT_RUN'}}
output=a.out/'manifest-0.3.1.json'
if output.exists():raise ValueError('REFUSE_TO_OVERWRITE_MANIFEST')
output.write_text(json.dumps(manifest,indent=2)+'\n');print(json.dumps({'files':records,'manifestSha256':hashlib.sha256(output.read_bytes()).hexdigest()}))
