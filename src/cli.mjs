import { readFile, mkdir, writeFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';
import { resolve, join } from 'node:path';
import { policy, questions } from './gate.mjs';
import { judgeMemory } from './index.mjs';
import { parseCases } from './cases.mjs';
import { summarize, renderReport } from './report.mjs';

const help = `Usage: node src/cli.mjs [--live] [--input path.json] [--limit 1..20]

Default: preview 20 English development cases without network calls.
  --input  JSON array of 1–20 cases; id, source, candidate, optional expected/why.
  --limit  Maximum cases to evaluate; default 20. One request per case, no retries.
  --live   Send cases to TypeSafe using TYPESAFE_API_KEY; API charges may apply.
  --help   Show this help.

Reports are written to runs/<timestamp>/. Personal cases belong in local-cases/.`;
let options;
try {
  options = parseArgs({ options: {
    live: { type: 'boolean', default: false }, help: { type: 'boolean', default: false },
    input: { type: 'string' }, limit: { type: 'string', default: '20' }
  }, allowPositionals: false }).values;
} catch { console.error(help); process.exit(1); }
if (options.help) { console.log(help); process.exit(0); }
const limit = Number(options.limit);
if (!Number.isSafeInteger(limit) || limit < 1 || limit > 20) {
  console.error(help); process.exit(1);
}
const root = fileURLToPath(new URL('../', import.meta.url));
const inputPath = options.input ? resolve(options.input) : join(root, 'fixtures/english.json');
let fixtures, cases;
try {
  if ((await stat(inputPath)).size > 200000) throw new Error('input_too_large');
  fixtures = await readFile(inputPath, 'utf8');
  cases = parseCases(fixtures).slice(0, limit);
} catch (error) {
  const code = /^(invalid_json|input_too_large|invalid_case_count|invalid_case|invalid_expected|invalid_why)$/.test(error.message)
    ? error.message : 'input_unreadable';
  console.error(`${code}: see docs/testing.md for the input format.`); process.exit(1);
}
const model = process.env.JEV_MODEL || 'jev-latest';
if (!options.live) {
  console.log('PREVIEW ONLY — no API calls. Expected labels are human-authored, not Jev results.');
  for (const item of cases) console.log(`${item.id} expected=${item.expected ?? 'unlabeled'} | ${item.candidate}`);
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
  kind: options.input ? 'user-supplied-development-evaluation' : 'synthetic-english-development-pilot',
  startedAt: new Date().toISOString(), requestedModel: model,
  policy, fixtureSha256: hash(fixtures), questionsSha256: hash(JSON.stringify(questions)),
  questions, plannedCalls: cases.length, attemptedCalls: 0, completed: false, results: []
};
const save = async () => {
  report.summary = summarize(report.results);
  await writeFile(join(dir, 'report.json'), JSON.stringify(report, null, 2));
  await writeFile(join(dir, 'report.md'), renderReport(report));
};
await save();
for (const item of cases) {
  report.attemptedCalls++;
  try {
    const result = await judgeMemory(item, { apiKey: process.env.TYPESAFE_API_KEY, model });
    report.results.push({ ...item, ...result,
      ...(item.expected === undefined ? {} : { matchesExpected: result.decision === item.expected }) });
    console.log(`${item.id} ${result.decision} / expected ${item.expected ?? 'unlabeled'} / ${result.latencyMs}ms`);
  } catch (error) {
    const code = /^(missing_api_key|invalid_case|invalid_answers|network_or_timeout|invalid_provider_response|provider_http_\d{3})$/.test(error.message)
      ? error.message : 'evaluation_failed';
    report.results.push({ ...item, error: code });
    console.error(`${item.id} ${code}; stopped, no automatic retries.`);
    process.exitCode = 1;
  }
  await save();
  if (process.exitCode) break;
}
report.completed = report.results.filter(r => !r.error).length === cases.length;
await save();
console.log(JSON.stringify(report.summary));
console.log(`Report: ${dir}`);
