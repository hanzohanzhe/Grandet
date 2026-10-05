// SPDX-License-Identifier: AGPL-3.0-only
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {root} from './catalogue.mjs';
const files=new Map([['/',['index.html','text/html']],['/app.mjs',['app.mjs','text/javascript']],['/style.css',['style.css','text/css']],['/data/free-tokens.json',['data/free-tokens.json','application/json']],['/data/MANIFEST.json',['data/MANIFEST.json','application/json']],['/CATALOGUE.md',['CATALOGUE.md','text/plain']]]);
createServer(async(req,res)=>{try{if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);res.end();return;}const f=files.get(new URL(req.url,'http://localhost').pathname);if(!f){res.writeHead(404);res.end('Not found');return;}const b=await readFile(path.join(root,f[0]));res.writeHead(200,{'Content-Type':f[1]+'; charset=utf-8','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; object-src 'none'; base-uri 'none'"});res.end(req.method==='HEAD'?undefined:b);}catch{res.writeHead(500);res.end('Read failed');}}).listen(8787,'127.0.0.1',()=>console.log('Grandet catalogue: http://127.0.0.1:8787/ (Ctrl+C to stop)'));
