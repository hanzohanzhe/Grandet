// SPDX-License-Identifier: AGPL-3.0-only
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {root} from './catalogue.mjs';

export const routes=new Map([
 ['/', ['index.html','text/html']],
 ['/app.mjs', ['app.mjs','text/javascript']],
 ['/style.css', ['style.css','text/css']],
 ['/catalogue-index.json', ['catalogue-index.json','application/json']],
 ['/data/RELEASE-v3.json', ['data/RELEASE-v3.json','application/json']],
 ['/data/free-tokens-v3.json', ['data/free-tokens-v3.json','application/json']],
 ['/CATALOGUE-v3.md', ['CATALOGUE-v3.md','text/plain']],
 ['/data/free-tokens.json', ['data/free-tokens.json','application/json']],
 ['/data/MANIFEST.json', ['data/MANIFEST.json','application/json']],
 ['/CATALOGUE.md', ['CATALOGUE.md','text/plain']]
]);

const headers=contentType=>({'Content-Type':`${contentType}; charset=utf-8`,'X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; object-src 'none'; base-uri 'none'"});
const requestPath=url=>typeof url==='string'&&url.startsWith('/')&&!url.includes('#')?url.split('?',1)[0]:undefined;

export async function handleRequest(req,res,{read=readFile,base=root}={}){
 try{
  if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);res.end();return;}
  const route=routes.get(requestPath(req.url));
  if(!route){res.writeHead(404);res.end('Not found');return;}
  const body=await read(path.join(base,route[0]));
  res.writeHead(200,headers(route[1]));res.end(req.method==='HEAD'?undefined:body);
 }catch{res.writeHead(500);res.end('Read failed');}
}

export function startServer(){
 return createServer((req,res)=>handleRequest(req,res)).listen(8787,'127.0.0.1',()=>console.log('Grandet catalogue: http://127.0.0.1:8787/ (Ctrl+C to stop)'));
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))startServer();
