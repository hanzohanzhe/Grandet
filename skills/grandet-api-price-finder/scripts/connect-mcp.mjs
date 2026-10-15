#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
// Local stdio MCP server exposing the Grandet connect executor. The key is never
// an argument: the user stores it with `node connect.mjs key` in their own terminal.
import { createInterface } from 'node:readline';
import { plan, publicPlan, apply, verify, restore, VERSION, APPS } from './connect.mjs';

const connection = {
  app: { type: 'string', enum: Object.keys(APPS), description: 'Target app that will use the supplier API' },
  site: { type: 'string', description: 'The offer row sourceId, for example apijing.com' },
  baseUrl: { type: 'string', description: 'integration.baseUrl from the offer; https on the site domain' },
  protocol: { type: 'string', enum: ['openai', 'openai-response', 'anthropic', 'gemini'] },
  model: { type: 'string', description: 'Exact modelName from the offer' },
  group: { type: 'string', description: 'integration.tokenGroup, shown in the steps' },
  confirmedOtherDomain: { type: 'boolean', description: 'Only after the user confirmed an address on another domain' },
  home: { type: 'string', description: 'Absolute test root; omit for the real user' },
};
const pick = (keys) => Object.fromEntries(keys.map((k) => [k, connection[k]]));
const TOOLS = [
  { name: 'grandet_connect_preview', description: 'Show the exact configuration change for connecting the chosen offer to an app. Writes nothing.', inputSchema: { type: 'object', additionalProperties: false, required: ['app', 'site', 'model'], properties: connection } },
  { name: 'grandet_connect_apply', description: 'Back up and write the previewed change. Call only after the user agreed to the preview; pass confirmed=true and the preview planHash.', inputSchema: { type: 'object', additionalProperties: false, required: ['app', 'site', 'model', 'confirmed'], properties: { ...connection, confirmed: { type: 'boolean' }, planHash: { type: 'string' } } } },
  { name: 'grandet_connect_verify', description: 'Free check: list the models the stored key can use on the site, without spending credit. The key must already be stored by the user.', inputSchema: { type: 'object', additionalProperties: false, required: ['app', 'site', 'model'], properties: pick(['app', 'site', 'baseUrl', 'protocol', 'model', 'confirmedOtherDomain', 'home']) } },
  { name: 'grandet_connect_restore', description: 'Undo the latest Grandet connection (or a given change id) from its backups.', inputSchema: { type: 'object', additionalProperties: false, properties: { id: { type: 'string' }, app: connection.app, site: connection.site, force: { type: 'boolean' }, deleteKey: { type: 'boolean' }, home: connection.home } } },
];
async function call(name, args = {}) {
  if (args.home !== undefined && (typeof args.home !== 'string' || !args.home.startsWith('/') && !/^[A-Za-z]:[\\/]/.test(args.home))) throw Object.assign(new Error('home must be absolute'), { code: 'HOME_MUST_BE_ABSOLUTE' });
  switch (name) {
    case 'grandet_connect_preview': return publicPlan(await plan(args));
    case 'grandet_connect_apply': return apply({ ...args, yes: args.confirmed === true, via: 'mcp' });
    case 'grandet_connect_verify': return verify(args);
    case 'grandet_connect_restore': return restore(args);
    default: throw Object.assign(new Error(`Unknown tool ${name}`), { code: 'UNKNOWN_TOOL' });
  }
}
const send = (message) => process.stdout.write(`${JSON.stringify(message)}\n`);
const rl = createInterface({ input: process.stdin });
rl.on('line', async (line) => {
  if (!line.trim()) return;
  let msg;
  try { msg = JSON.parse(line); } catch { send({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }); return; }
  const { id, method, params } = msg;
  if (id === undefined) return; // notifications
  try {
    if (method === 'initialize') send({ jsonrpc: '2.0', id, result: { protocolVersion: params?.protocolVersion || '2025-06-18', capabilities: { tools: {} }, serverInfo: { name: 'grandet-connect', version: VERSION } } });
    else if (method === 'tools/list') send({ jsonrpc: '2.0', id, result: { tools: TOOLS } });
    else if (method === 'tools/call') {
      try {
        // A failed free check is reported as data (ok=false), not as a tool error.
        const result = await call(params?.name, params?.arguments);
        send({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }], structuredContent: result, isError: false } });
      } catch (error) {
        send({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: `${error.code || 'ERROR'}: ${error.message}` }], isError: true } });
      }
    } else if (method === 'ping') send({ jsonrpc: '2.0', id, result: {} });
    else send({ jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${method}` } });
  } catch (error) { send({ jsonrpc: '2.0', id, error: { code: -32603, message: error.message } }); }
});
