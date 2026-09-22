import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { evaluate } from '../src/jev.mjs';
import { policy, previewPolicy, questions, decide } from '../src/gate.mjs';
import { parseCases } from '../src/cases.mjs';
import { summarize } from '../src/report.mjs';

if (process.argv.length !== 3 || process.argv[2] !== '--live') {
  console.log('Repeat the frozen English set twice (max 40 calls): node --env-file=.env scripts/repeat.mjs --live');
  process.exit(0);
}
if (!process.env.TYPESAFE_API_KEY) throw new Error('missing_api_key');
const root = new URL('../', import.meta.url);
const fixture = await readFile(new URL('fixtures/holdout-en-v1.json', root), 'utf8');
const protocol = await readFile(new URL('evidence/repeat-en-v1/PROTOCOL.md', root), 'utf8');
const cases = parseCases(fixture);
const hash = s => createHash('sha256').update(s).digest('hex');
const report = { kind: 'repeatability-check', startedAt: new Date().toISOString(),
  sourceCommit: execFileSync('git', ['-c', `safe.directory=${fileURLToPath(root).replace(/\\/g, '/').replace(/\/$/, '')}`, 'rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  fixtureSha256: hash(fixture), protocolSha256: hash(protocol), questionsSha256: hash(JSON.stringify(questions)),
  requestedModel: 'jev-1.13.0', policies: [policy, previewPolicy], questions,
  plannedCalls: cases.length * 2, attemptedCalls: 0, completed: false, results: [] };
const dir = new URL(`runs/repeat-${Date.now()}/`, root);
await mkdir(dir, { recursive: true });
const save = async () => {
  report.summaries = Object.fromEntries(report.policies.map(p => [p.version,
    summarize(report.results.map(r => r.error ? r : { ...r, ...r.decisions[p.version] }))]));
  await writeFile(new URL('report.json', dir), JSON.stringify(report, null, 2) + '\n');
};
await save();
outer: for (const pass of [2, 3]) for (const item of cases) {
  report.attemptedCalls++;
  try {
    const result = await evaluate(item, { apiKey: process.env.TYPESAFE_API_KEY, model: report.requestedModel });
    const decisions = Object.fromEntries(report.policies.map(p => [p.version, decide(result.answers, p)]));
    report.results.push({ ...item, pass, ...result, decisions });
    console.log(`Pass ${pass} / ${item.id}: ${decisions[policy.version].decision} -> ${decisions[previewPolicy.version].decision}`);
  } catch (error) {
    const code = /^(invalid_answers|network_or_timeout|invalid_provider_response|provider_http_\d{3})$/.test(error.message) ? error.message : 'evaluation_failed';
    report.results.push({ ...item, pass, error: code }); process.exitCode = 1;
  }
  await save();
  if (process.exitCode) break outer;
}
report.completed = report.results.length === report.plannedCalls && report.results.every(r => !r.error);
await save();
console.log(JSON.stringify(report.summaries));
console.log(fileURLToPath(dir));
