// SPDX-License-Identifier: Apache-2.0
// Installation-only receipt delivery. Never pass installer stdout to the network.
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile, open, rename, unlink, lstat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
export const endpoint = 'https://grandet.ai/api/community/v1/installation-events';
export const notice = 'Grandet installation receipts send random installation/event IDs, operation, version, content SHA-256, source/host/scope categories, verification and UTC time. Used for installation statistics; retained 24 months. No paths, usernames, chats, keys or fingerprints. Installation-stage only. Disable with --no-telemetry or GRANDET_INSTALL_TELEMETRY=0; offline installation still works.';
export const sha = bytes => createHash('sha256').update(bytes).digest('hex');
export const digest = files => sha([...files].sort(([a],[b]) => a < b ? -1 : a > b ? 1 : 0).map(([p,b]) => `${p}\0${sha(b)}\n`).join(''));
export const sources = ['release_zip','release_skill','source','checkout','raw','cache','local','unknown'];
const levels=['agent_reported','files_verified','host_accepted','session_triggered'];
const operations=['install','update','repair','reinstall','reuse','existing_seen','bind','sync','enable','failure'];
async function json(path, fallback=null) { try { return JSON.parse(await readFile(path,'utf8')); } catch(e) { if(e.code==='ENOENT') return fallback; throw e; } }
async function exists(path) {try {await lstat(path); return true;} catch(e){if(e.code==='ENOENT')return false;throw e;}}
async function safe(path) { for(let p=resolve(path);;p=dirname(p)){try{if((await lstat(p)).isSymbolicLink())throw Error('STATE_SYMLINK_NOT_ALLOWED');}catch(e){if(e.code!=='ENOENT')throw e;}if(dirname(p)===p)break;} }
// Write and fsync through one writable handle: Windows rejects fsync on a read-only handle (EPERM).
async function atomic(path, data) { await safe(path); const tmp=`${path}.${randomUUID()}.tmp`;const handle=await open(tmp,'wx',0o600);try{await handle.writeFile(JSON.stringify(data,null,2)+'\n');await handle.sync();}finally{await handle.close();}await rename(tmp,path); }
export async function openReceipt(destination, {disabled=false,test=false,url=endpoint}={}) {
  if(url!==endpoint && !(test && /^http:\/\/(127\.0\.0\.1|localhost|\[::1\])(?::\d+)?\//.test(url))) throw Error('RECEIPT_ENDPOINT_NOT_ALLOWED');
  const dir=join(dirname(dirname(destination)),'.grandet-install-state',sha(resolve(destination)));
  await safe(dir);await mkdir(dir,{recursive:true,mode:0o700});
  const lock=join(dir,'lock.json');
  try {await writeFile(lock,JSON.stringify({pid:process.pid}),{flag:'wx',mode:0o600});}
  catch(e){if(e.code!=='EEXIST')throw e; const old=await json(lock);try{process.kill(old.pid,0);throw Error('INSTALLATION_LOCKED');}catch(k){if(k.code!=='ESRCH')throw k;}await unlink(lock);await writeFile(lock,JSON.stringify({pid:process.pid}),{flag:'wx',mode:0o600});}
  const stateFile=join(dir,'state.json'), journalFile=join(dir,'journal.json');
  let state=await json(stateFile,{installation_id:null,digest:null,version:null,outbox:[],last_event:null});
  const save=()=>atomic(stateFile,state);
  // Every installation counts, test installations included; `test` only allows a loopback receiver.
  const enabled=!disabled && process.env.GRANDET_INSTALL_TELEMETRY!=='0';
  if(!enabled && state.outbox.length){state.outbox=[];await save();}
  return {
    dir, state,
    async close(){await unlink(lock).catch(e=>{if(e.code!=='ENOENT')throw e;});},
    async recover(readTree) {
      const j=await json(journalFile);if(!j)return false;if(j.destination!==destination)throw Error('JOURNAL_TARGET_MISMATCH');await safe(j.destination);if(j.stage)await safe(j.stage);if(j.backup)await safe(j.backup);
      if(await exists(j.destination) && j.previous_content && j.stage && await exists(j.stage) && digest(await readTree(j.destination))===j.previous_content && digest(await readTree(j.stage))===j.event.content_sha256 && !await exists(j.backup)) {await rename(j.destination,j.backup);}
      if(!await exists(j.destination) && j.stage && await exists(j.stage)){await mkdir(dirname(j.destination),{recursive:true});await rename(j.stage,j.destination);}
      if(await exists(j.destination) && digest(await readTree(j.destination))===j.event.content_sha256) {await this.complete(j);return true;}
      if(!await exists(j.destination) && j.backup && await exists(j.backup))await rename(j.backup,j.destination);
      throw Error('INTERRUPTED_INSTALL_REQUIRES_REPAIR');
    },
    async prepare({destination,stage=null,backup=null,previous_content=null,operation,content,version,source='unknown',host='unknown',scope='user'}) {
      if(!operations.includes(operation)||!sources.includes(source))throw Error('INVALID_RECEIPT_CATEGORY');
      const event={schema_version:'grandet.installation-event/v1',event_id:randomUUID(),installation_id:state.installation_id??randomUUID(),revision:1,operation,skill_version:version,content_sha256:content,source,host,scope,verification:'files_verified',occurred_at:new Date().toISOString(),test_mode:false,exclusion_reason:'none'};
      const j={destination,stage,backup,previous_content,event};await atomic(journalFile,j);return j;
    },
    async complete(j) {
      // Caller must read target bytes back before committing this journal.
      state.installation_id=j.event.installation_id;state.digest=j.event.content_sha256;state.version=j.event.skill_version;
      if(!state.outbox.some(e=>e.event_id===j.event.event_id) && state.last_event?.event_id!==j.event.event_id && enabled)state.outbox.push(j.event);
      state.last_event=j.event;await save();await unlink(journalFile).catch(e=>{if(e.code!=='ENOENT')throw e;});return j.event;
    },
    async failure({content,version,source='unknown',host='unknown',scope='user'}) {
      // Do not overwrite a recoverable write transaction. Failed delivery is not installation failure.
      if(await exists(journalFile))return;
      const j=await this.prepare({destination,operation:'failure',content,version,source,host,scope});
      if(enabled)state.outbox.push(j.event);await save();await unlink(journalFile);await this.flush();
    },
    async verifyUpgrade(level) {
      if(!levels.includes(level))throw Error('INVALID_VERIFICATION');
      const old=state.last_event;if(!old)throw Error('NO_INSTALL_EVENT');
      if(levels.indexOf(level)<=levels.indexOf(old.verification))return old;
      const event={...old,revision:old.revision+1,verification:level};state.last_event=event;
      if(enabled)state.outbox=state.outbox.filter(e=>e.event_id!==event.event_id).concat([event]);await save();return event;
    },
    async flush() {
      if(!enabled)return {status:'DISABLED',pending:0};
      let attempts=0;
      for(const event of [...state.outbox].slice(0,10)) {
        let accepted=false;
        for(let retry=0;retry<3;retry++) {
          attempts++;
          try {
            const response=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(event),signal:AbortSignal.timeout(2500),redirect:'error'});
            const ack=await response.json();
            if(response.ok && ack.accepted===true && ack.event_id===event.event_id && Number.isInteger(ack.revision) && ack.revision>=event.revision){accepted=true;break;}
            if(response.status>=400 && response.status<500 && response.status!==429)break;
          }catch{}
        }
        if(!accepted)break;
        state.outbox=state.outbox.filter(e=>!(e.event_id===event.event_id && e.revision<=event.revision));await save();
      }
      return {status:state.outbox.length?'PENDING':'ACKNOWLEDGED',pending:state.outbox.length,attempts};
    },
  };
}
