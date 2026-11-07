// SPDX-License-Identifier: Apache-2.0
// Runs live answer-quality cases (evals/answer-quality.json) with the local Codex CLI and checks each final answer.
//
//   node scripts/run-answer-evals.mjs --skill <Skill folder, .skill or .zip> --out <new folder> [--cases E1,E3] [--codex <path>] [--model <name>]
//
// Each case runs in its own folder with an empty HOME and the Skill installed in the folder's .agents/skills, so no
// real app configuration is read or changed. Codex uses its own login (CODEX_HOME) and its model quota; no supplier
// key is used and nothing is paid. The case folders are fixed (~/.cache/grandet-answer-evals/<case>) and emptied
// before each run, because Codex records every folder it runs in as a project in its own config.
//
// Deterministic cases with a pinned `fixture` are intentionally excluded; run them through check-answer.mjs or the
// unit tests. After the last live turn, the checks read the first complete board response the agent printed, which is the data its
// answer used. When the transcript has none, the first board request the agent made is replayed once (a public GET
// without the statistics parameters). Results: <out>/results.json and <out>/summary.md.
// Exit code 0 = every run check passed, 1 = a check failed or a run did not finish, 2 = usage error.
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cases, checkAnswer } from './check-answer.mjs';

const BOARD = 'https://grandet.ai/api/v1/board';
const STATISTICS = new Set(['host', 'skillVersion', 'skillBuild']);
const DEFAULT_CODEX = '/usr/lib/chatgpt/resources/codex';

function options(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 2) {
    if (!argv[i].startsWith('--') || argv[i + 1] === undefined) throw new Error(`bad argument ${argv[i]}`);
    out[argv[i].slice(2)] = argv[i + 1];
  }
  return out;
}

/** The Skill folder to install: a folder as is, or a .skill/.zip extracted into the case folder. */
function installSkill(skill, workspace) {
  const target = join(workspace, '.agents', 'skills');
  mkdirSync(target, { recursive: true });
  if (existsSync(join(skill, 'SKILL.md'))) {
    cpSync(skill, join(target, 'grandet-api-price-finder'), { recursive: true });
  } else if (/\.(skill|zip)$/.test(skill)) {
    const unpack = join(workspace, '.skill-unpack');
    const done = spawnSync('python3', ['-m', 'zipfile', '-e', skill, unpack], { encoding: 'utf8' });
    if (done.status !== 0) throw new Error(`could not extract ${skill}: ${done.stderr}`);
    const root = [join(unpack, 'grandet-api-price-finder'), join(unpack, 'skills', 'grandet-api-price-finder')].find((p) => existsSync(join(p, 'SKILL.md')));
    if (!root) throw new Error(`no grandet-api-price-finder/SKILL.md in ${skill}`);
    cpSync(root, join(target, 'grandet-api-price-finder'), { recursive: true });
    rmSync(unpack, { recursive: true, force: true });
  } else {
    throw new Error(`--skill must be a Skill folder, .skill or .zip: ${skill}`);
  }
  const build = readFileSync(join(target, 'grandet-api-price-finder', 'SKILL.md'), 'utf8').match(/Installation build: `([^`]+)`/);
  return build ? build[1] : null;
}

/** Commands the agent ran, from a Codex transcript: the lines after `exec` up to `succeeded in` / `exited`, plus the first output line; and MCP tool call lines. */
function commandsRun(log) {
  const lines = log.split('\n'), commands = [];
  for (let i = 0; i < lines.length; i++) {
    const tool = lines[i].match(/^tool\s+\S*grandet_find_cheapest_api\((\{.*\})\)/);
    if (tool) { commands.push({ mcp: tool[1] }); continue; }
    if (lines[i].trim() !== 'exec') continue;
    const block = [];
    for (i++; i < lines.length && !/^\s*(succeeded|exited|failed)\b.*\bin \d+ms/.test(lines[i]); i++) block.push(lines[i]);
    commands.push({ text: block.join('\n'), output: lines[i + 1] ?? '' });
  }
  return commands;
}

/** The first complete board response a command the agent ran printed (the data its answer used), or null. */
export function boardResponse(log) {
  for (const c of commandsRun(log)) {
    if (!c.output?.includes('grandet.board/v1')) continue;
    try { const board = JSON.parse(c.output); if (board?.schema === 'grandet.board/v1' && Array.isArray(board.boards)) return board; } catch { /* not complete */ }
  }
  return null;
}

const SCRIPT_KEYS = 'model|name|mix|host|targetApp|targetProfile|lang|limit|view|currency|channel|plans|endpointType|os|client';
/**
 * The first board request the agent actually made: a command it ran, read as curl --data-urlencode pairs, a board
 * URL, or the parameter literals of a script that builds the board URL; or an MCP tool call line. Text the agent only
 * read, such as the Skill's own examples, is ignored.
 */
export function boardRequest(log) {
  const commands = commandsRun(log);
  for (const c of commands) {
    if (c.mcp) {
      try {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(JSON.parse(c.mcp))) params.append(key, String(value));
        return { params, from: 'MCP_ARGUMENTS' };
      } catch { continue; }
    }
    if (!c.text.includes('api/v1/board')) continue;
    const pairs = [...c.text.matchAll(/--data-urlencode\s+(?:\\?['"])([^'"\\]+)(?:\\?['"])/g)].map((m) => m[1]);
    const url = c.text.match(/https:\/\/grandet\.ai\/api\/v1\/board\?[^\s'"\\)]+/);
    if (pairs.length) {
      // curl -G appends the --data-urlencode pairs to any query the URL already has, as the Skill's own command does.
      const params = new URLSearchParams(url ? new URL(url[0]).search : '');
      for (const pair of pairs) { const i = pair.indexOf('='); if (i > 0) params.append(pair.slice(0, i), pair.slice(i + 1)); }
      if (params.has('model') || params.has('name')) return { params, from: 'CURL_COMMAND' };
    }
    if (url) return { params: new URL(url[0]).searchParams, from: 'URL' };
    const literals = [...c.text.matchAll(new RegExp(`(['"])(${SCRIPT_KEYS})\\1\\s*:\\s*(?:(['"])(.*?)\\3|(\\d+))`, 'g'))];
    if (literals.some((m) => m[2] === 'model' || m[2] === 'name')) {
      return { params: new URLSearchParams(literals.map((m) => [m[2], m[4] ?? m[5]])), from: 'SCRIPT_PARAMS' };
    }
  }
  return null;
}

async function replayBoard(request) {
  const params = new URLSearchParams([...request.params].filter(([key]) => !STATISTICS.has(key)));
  const response = await fetch(`${BOARD}?${params}`, { headers: { 'User-Agent': 'grandet-answer-evals/1.0', Accept: 'application/json' } });
  if (!response.ok) throw new Error(`board replay HTTP ${response.status}`);
  return { url: `${BOARD}?${params}`, board: await response.json() };
}

function runTurn(codex, args, { cwd, home, log, timeoutSeconds }) {
  const env = { ...process.env, HOME: home, CODEX_HOME: process.env.CODEX_HOME || join(homedir(), '.codex') };
  const done = spawnSync(codex, args, { cwd, env, encoding: 'utf8', timeout: timeoutSeconds * 1000, maxBuffer: 256 * 1024 * 1024, input: '' });
  writeFileSync(log, `${done.stdout ?? ''}\n${done.stderr ?? ''}\nexit ${done.status}${done.error ? ` ${done.error.code}` : ''}\n`, { flag: 'a' });
  return done;
}

async function main() {
  const opt = options(process.argv.slice(2));
  if (!opt.skill || !opt.out) {
    console.error('Usage: node scripts/run-answer-evals.mjs --skill <folder|.skill|.zip> --out <new folder> [--cases E1,E3] [--codex <path>] [--model <name>]');
    process.exit(2);
  }
  const out = resolve(opt.out);
  if (existsSync(out)) { console.error(`--out already exists: ${out}`); process.exit(2); }
  const codex = opt.codex || process.env.CODEX_BIN || DEFAULT_CODEX;
  const wanted = opt.cases ? new Set(opt.cases.split(',')) : null;
  const fixtureCases = cases.cases.filter((c) => c.fixture);
  const mixed = fixtureCases.filter((c) => c.automation?.turns?.length);
  if (mixed.length) throw new Error(`fixture cases cannot have live automation turns: ${mixed.map((c) => c.id).join(', ')}`);
  const unknown = wanted ? [...wanted].filter((id) => !cases.cases.some((c) => c.id === id)) : [];
  if (unknown.length) throw new Error(`unknown cases: ${unknown.join(', ')}`);
  const pinned = wanted ? fixtureCases.filter((c) => wanted.has(c.id)) : [];
  if (pinned.length) throw new Error(`pinned simulated fixture cases do not run through live Codex: ${pinned.map((c) => c.id).join(', ')}; use check-answer.mjs or node --test tests/answer-check.test.mjs`);
  mkdirSync(out, { recursive: true });
  const baseFlags = ['-c', 'sandbox_workspace_write.network_access=true', ...(opt.model ? ['-m', opt.model] : [])];
  const results = [];
  for (const c of cases.cases.filter((x) => (!wanted || wanted.has(x.id)) && x.automation?.turns?.length)) {
    const base = join(homedir(), '.cache', 'grandet-answer-evals', c.id);
    rmSync(base, { recursive: true, force: true });
    const workspace = join(base, 'workspace'), home = join(base, 'home');
    mkdirSync(workspace, { recursive: true }); mkdirSync(home, { recursive: true });
    spawnSync('git', ['init', '-q', workspace]);
    const build = installSkill(resolve(opt.skill), workspace);
    const caseOut = join(out, c.id); mkdirSync(caseOut);
    const log = join(caseOut, 'codex.log'), answerFile = join(caseOut, 'answer.txt');
    // The empty test HOME is writable too, so the connect executor can write the app's config there.
    const flags = ['-s', 'workspace-write', ...baseFlags, '-c', `sandbox_workspace_write.writable_roots=${JSON.stringify([home])}`];
    let session = null, finished = true;
    for (const [index, prompt] of c.automation.turns.entries()) {
      const args = index === 0
        ? ['exec', ...flags, '-o', answerFile, prompt]
        : ['exec', 'resume', '-c', 'sandbox_mode="workspace-write"', ...flags.filter((f) => f !== '-s' && f !== 'workspace-write'),
          '-o', answerFile, session, prompt];
      const done = runTurn(codex, args, { cwd: workspace, home, log, timeoutSeconds: Number(opt.timeout || 1500) });
      if (index === 0) session = (`${done.stdout}\n${done.stderr}`.match(/session id:\s*([0-9a-f-]{36})/) || [])[1] || null;
      if (done.status !== 0 || (index === 0 && !session)) { finished = false; break; }
    }
    const answer = existsSync(answerFile) ? readFileSync(answerFile, 'utf8') : '';
    let board = boardResponse(readFileSync(log, 'utf8')), replay = board ? { url: null, used: 'COMMAND_OUTPUT' } : null;
    const request = boardRequest(readFileSync(log, 'utf8'));
    if (board) writeFileSync(join(caseOut, 'board.json'), `${JSON.stringify(board)}\n`);
    else if (request) {
      try { replay = await replayBoard(request); board = replay.board; writeFileSync(join(caseOut, 'board.json'), `${JSON.stringify(board)}\n`); }
      catch (error) { replay = { error: String(error.message || error) }; }
    }
    const check = answer ? checkAnswer(c.id, answer, board) : null;
    results.push({ case: c.id, covers: c.covers, skillBuild: build, simulated: c.automation.simulated ?? null, finished,
      session, boardRequest: request ? { from: request.from, url: replay?.url ?? null, error: replay?.error ?? null } : null,
      boardSource: board ? (replay?.used ?? 'REPLAY') : null,
      status: !finished || !check ? 'NOT_FINISHED' : check.status, results: check?.results ?? [] });
    console.log(`${c.id}: ${results.at(-1).status}`);
  }
  const summary = { schema: 'grandet.skill-answer-eval-run/v1', ranAt: new Date().toISOString(), skill: basename(resolve(opt.skill)),
    codex: spawnSync(codex, ['--version'], { encoding: 'utf8' }).stdout.trim(), cases: results };
  writeFileSync(join(out, 'results.json'), `${JSON.stringify(summary, null, 1)}\n`);
  const lines = [`# Answer evals ${summary.ranAt}`, '', `Skill: ${summary.skill} · ${summary.codex}`, ''];
  for (const r of results) {
    lines.push(`## ${r.case} (${r.covers.join(', ')}): ${r.status}`, '', `Build ${r.skillBuild ?? 'unknown'}${r.simulated ? ` · simulated: ${r.simulated}` : ''}`, '');
    for (const x of r.results) lines.push(`- ${x.status} ${x.id}: ${x.detail}`);
    lines.push('');
  }
  writeFileSync(join(out, 'summary.md'), `${lines.join('\n')}\n`);
  process.exit(results.every((r) => r.status === 'PASS' || r.status === 'PARTIAL') && results.length ? 0 : 1);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => { console.error(error.message || error); process.exit(2); });
}
