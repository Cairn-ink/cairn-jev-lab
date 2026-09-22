import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve, join } from 'node:path';
import { buildRequest, decide, policy, questions } from './gate.mjs';
import { evaluate } from './jev.mjs';

const args = process.argv.slice(2);
const live = args.includes('--live');
const limitFlag = args.indexOf('--limit');
const limit = limitFlag < 0 ? 20 : Number(args[limitFlag + 1]);
const known = new Set(['--live', '--limit', ...(limitFlag >= 0 ? [args[limitFlag + 1]] : [])]);
if (args.some(arg => !known.has(arg)) || !Number.isSafeInteger(limit) || limit < 1 || limit > 20) {
  console.error('Usage: node src/cli.mjs [--live] [--limit 1..20]'); process.exit(1);
}
const root = fileURLToPath(new URL('../', import.meta.url));
const fixtures = await readFile(join(root, 'fixtures/cases.json'), 'utf8');
const cases = JSON.parse(fixtures).slice(0, limit);
const model = process.env.JEV_MODEL || 'jev-latest';
if (!live) {
  console.log('PREVIEW ONLY — no API calls. Expected labels are human-authored, not Jev results.');
  for (const item of cases) {
    buildRequest(item, model);
    console.log(`${item.id} expected=${item.expected} | ${item.candidate}`);
  }
  process.exit(0);
}
if (!process.env.TYPESAFE_API_KEY || process.env.TYPESAFE_API_KEY === 'replace_locally') {
  console.error('missing_api_key: load TYPESAFE_API_KEY from a local env file.'); process.exit(1);
}
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const dir = resolve(root, 'runs', stamp);
await mkdir(dir, { recursive: true });
const hash = text => createHash('sha256').update(text).digest('hex');
const report = {
  kind: 'synthetic-development-pilot', startedAt: new Date().toISOString(), requestedModel: model,
  policy, fixtureSha256: hash(fixtures), questionsSha256: hash(JSON.stringify(questions)),
  questions, plannedCalls: cases.length, attemptedCalls: 0, completed: false, results: []
};
await writeFile(join(dir, 'report.json'), JSON.stringify(report, null, 2));
for (const item of cases) {
  report.attemptedCalls++;
  try {
    const result = await evaluate(item, { apiKey: process.env.TYPESAFE_API_KEY, model });
    const verdict = decide(result.answers);
    report.results.push({ ...item, ...result, ...verdict, matchesExpected: verdict.decision === item.expected });
    console.log(`${item.id} ${verdict.decision} / expected ${item.expected} / ${result.latencyMs}ms`);
  } catch (error) {
    const code = /^(missing_api_key|invalid_case|invalid_answers|network_or_timeout|invalid_provider_response|provider_http_\d{3})$/.test(error.message)
      ? error.message : 'evaluation_failed';
    report.results.push({ ...item, error: code });
    console.error(`${item.id} ${code}; stopped, no automatic retries.`);
    process.exitCode = 1;
  }
  await writeFile(join(dir, 'report.json'), JSON.stringify(report, null, 2));
  if (process.exitCode) break;
}
const valid = report.results.filter(r => !r.error);
report.completed = valid.length === cases.length;
report.summary = {
  evaluated: valid.length, matched: valid.filter(r => r.matchesExpected).length,
  falseSaves: valid.filter(r => r.decision === 'save' && r.expected !== 'save').length,
  missedSaves: valid.filter(r => r.decision !== 'save' && r.expected === 'save').length,
  deferred: valid.filter(r => r.decision === 'defer').length,
  meanLatencyMs: valid.length ? Math.round(valid.reduce((n, r) => n + r.latencyMs, 0) / valid.length) : null,
  inputTokens: valid.every(r => r.usage.input_tokens !== null) ? valid.reduce((n, r) => n + r.usage.input_tokens, 0) : null,
  outputTokens: valid.every(r => r.usage.output_tokens !== null) ? valid.reduce((n, r) => n + r.usage.output_tokens, 0) : null
};
await writeFile(join(dir, 'report.json'), JSON.stringify(report, null, 2));
const rows = report.results.map(r => `| ${r.id} | ${r.expected} | ${r.decision ?? r.error} | ${r.matchesExpected === undefined ? '—' : r.matchesExpected ? 'yes' : 'no'} | ${r.latencyMs ?? '—'} |`);
await writeFile(join(dir, 'report.md'), `# Jev memory admission pilot\n\nSynthetic development cases; not a held-out benchmark, comparison with Cairn, or proof of production quality. No memory database was changed.\n\nStarted: ${report.startedAt}\n\nPolicy: ${policy.version}; confidence threshold: ${policy.minConfidence} (experimental, not calibrated on memory).\n\nMatched ${report.summary.matched}/${valid.length} evaluated; false saves ${report.summary.falseSaves}; missed saves ${report.summary.missedSaves}; deferrals ${report.summary.deferred}.\n\n| Case | Expected | Observed | Match | ms |\n|---|---|---|---|---|\n${rows.join('\n')}\n\nSee report.json for exact questions, sources, candidates, answers, probabilities, model version and token usage. All failed or ambiguous cases are retained.\n`);
console.log(JSON.stringify(report.summary));
console.log(`Report: ${dir}`);
