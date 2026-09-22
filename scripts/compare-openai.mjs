import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { evaluate } from '../src/jev.mjs';
import { buildRequest } from '../src/gate.mjs';
import { complete, model, gateFormat, readerFormat, gateMessages, readerMessages, requestBody } from '../src/openai.mjs';
import { policiesFor, sweep, parseGate, parseReader, gradeAnswer, downstreamSummary, readerMode } from '../src/comparison.mjs';

const root = new URL('../', import.meta.url);
const hash = value => createHash('sha256').update(value).digest('hex');
const read = async path => JSON.parse(await readFile(new URL(path, root), 'utf8'));
const put = async (url, value) => writeFile(url, JSON.stringify(value, null, 2) + '\n');
const historical = await read('evidence/coverage-en-v1/report.json');
const probes = await read('fixtures/downstream-v1.json');
const cases = historical.results;
if (cases.length !== 100 || !historical.completed || cases.some(r => r.error)) throw new Error('invalid_historical_report');
if (probes.length !== 20 || new Set(probes.map(p => p.id)).size !== 20 || new Set(probes.map(p => p.caseId)).size !== 20 ||
    probes.some(p => !cases.some(r => r.id === p.caseId) || !p.options.includes(p.gold) || !p.options.includes('unknown') || new Set(p.options).size !== p.options.length)) throw new Error('invalid_probes');

const frozenPaths = ['evidence/comparison-openai-v1/PROTOCOL.md', 'fixtures/downstream-v1.json', 'evidence/coverage-en-v1/report.json',
  'src/gate.mjs', 'src/jev.mjs', 'src/openai.mjs', 'src/comparison.mjs', 'scripts/compare-openai.mjs'];
const hashes = Object.fromEntries(await Promise.all(frozenPaths.map(async path => [path, hash(await readFile(new URL(path, root)))])));
const pct = value => value === null ? '—' : `${(value * 100).toFixed(1)}%`;
function table(arms, sensitivity = false) {
  return ['| Policy | Matches | False saves | Missed saves | Defer | Save precision | Save recall |',
    '|---|---:|---:|---:|---:|---:|---:|', ...arms.map(a => {
      const s = sensitivity ? a.sensitivityWithoutDisputedDefer : a.summary;
      return `| ${a.id} | ${s.matched}/${s.evaluated} | ${s.falseSaves}/${s.nonSaves} | ${s.missedSaves}/${s.expectedSaves} | ${s.deferred} | ${pct(s.savePrecision)} | ${pct(s.saveRecall)} |`;
    })].join('\n');
}

if (process.argv.length === 2) {
  console.log(JSON.stringify({ model, cases: cases.length, probes: probes.length, maximumInferenceCalls: 260, newApiCalls: 0, hashes }, null, 2));
  process.exit(0);
}
if (process.argv.length !== 3 || process.argv[2] !== '--live') throw new Error('invalid_arguments');
if (!process.env.TYPESAFE_API_KEY || !process.env.OPENAI_API_KEY || [process.env.TYPESAFE_API_KEY, process.env.OPENAI_API_KEY].includes('replace_locally'))
  throw new Error('both_provider_keys_required_before_any_call');
const gitArgs = ['-c', `safe.directory=${fileURLToPath(root).replace(/\\/g, '/').replace(/\/$/, '')}`];
const git = args => execFileSync('git', [...gitArgs, ...args], { cwd: root, encoding: 'utf8' }).trim();
if (git(['status', '--porcelain', '--', ...frozenPaths]) || git(['ls-files', '--', ...frozenPaths]).split('\n').length !== frozenPaths.length)
  throw new Error('commit_protocol_and_sources_before_live_calls');
const dir = new URL(`runs/comparison-openai-${Date.now()}/`, root); await mkdir(dir, { recursive: true });
const report = { kind: 'paired-jev-luna-comparison-and-downstream-pilot', protocol: 'comparison-openai-v1', startedAt: new Date().toISOString(), sourceCommit: git(['rev-parse', 'HEAD']), hashes,
  gateModels: { jev: 'jev-1.13.0', llm: model }, readerModel: model,
  maximumCalls: { jev: 100, llmGate: 100, reader: 60 }, attemptedCalls: { jev: 0, llmGate: 0, reader: 0 },
  completed: false, calls: [], jevResults: [], llmResults: [], readerResults: [], downstream: [] };
const checkpoint = () => put(new URL('report.json', dir), report);
await checkpoint();
function safeError(error) {
  return /^(invalid_answers|network_or_timeout|invalid_provider_response|provider_http_\d{3}|openai_network_or_timeout|openai_http_\d{3}|invalid_openai_response|invalid_reader_answer)$/.test(error.message)
    ? error.message : 'invalid_evaluation_output';
}
async function call(kind, id, input, operation) {
  if (report.attemptedCalls[kind] >= report.maximumCalls[kind]) throw new Error('request_limit');
  report.attemptedCalls[kind]++;
  const record = { kind, id, request: input, inputSha256: hash(JSON.stringify(input)), startedAt: new Date().toISOString(), status: 'attempted' };
  report.calls.push(record); await checkpoint();
  try { const result = await operation(); record.status = 'completed'; record.latencyMs = result.latencyMs;
    console.log(`${kind} ${report.attemptedCalls[kind]}/${report.maximumCalls[kind]} ${id}`); return result;
  } catch (error) { record.status = 'failed'; record.error = safeError(error); throw new Error(record.error); }
  finally { await checkpoint(); }
}
try {
  // Same chronological input order across methods; first method alternates by case.
  for (const [i, item] of cases.entries()) {
    for (const kind of i % 2 ? ['llmGate', 'jev'] : ['jev', 'llmGate']) {
      const data = { id: item.id, group: item.group, source: item.source, candidate: item.candidate, expected: item.expected };
      if (kind === 'jev') {
        const result = await call(kind, item.id, buildRequest(item, 'jev-1.13.0'),
          () => evaluate(item, { apiKey: process.env.TYPESAFE_API_KEY, model: 'jev-1.13.0' }));
        report.jevResults.push({ ...data, ...result });
      } else {
        const messages = gateMessages(item);
        const result = await call(kind, item.id, requestBody(messages, gateFormat, 700), async () => {
          const { content, ...metadata } = await complete(messages, { apiKey: process.env.OPENAI_API_KEY });
          return { ...metadata, answers: parseGate(content) };
        });
        report.llmResults.push({ ...data, ...result });
      }
      await checkpoint();
    }
  }
  const arms = policiesFor(report.jevResults, report.llmResults);
  report.policies = arms;
  report.thresholdSweeps = { jev: sweep(report.jevResults), llm: sweep(report.llmResults) };
  const jobs = [];
  for (const probe of probes) {
    const item = cases.find(r => r.id === probe.caseId);
    for (const [mode, memories] of [['empty', []], ['candidate', [item.candidate]], ['source', [item.source]]])
      jobs.push({ probe, mode, messages: readerMessages(probe, memories) });
  }
  jobs.sort((a, b) => hash(`reader-v1:${a.probe.id}:${a.mode}`).localeCompare(hash(`reader-v1:${b.probe.id}:${b.mode}`)));
  for (const job of jobs) {
    const result = await call('reader', `${job.probe.id}:${job.mode}`, requestBody(job.messages, readerFormat(job.probe.options), 120), async () => {
      const { content, ...metadata } = await complete(job.messages, { apiKey: process.env.OPENAI_API_KEY, responseFormat: readerFormat(job.probe.options), maxTokens: 120 });
      return { ...metadata, answer: parseReader(content, job.probe.options) };
    });
    report.readerResults.push({ probeId: job.probe.id, mode: job.mode, requestSha256: hash(JSON.stringify(job.messages)), ...result });
    await checkpoint();
  }
  for (const probe of probes) for (const id of ['no-memory', 'source-reference', ...arms.map(a => a.id)]) {
    const arm = arms.find(a => a.id === id);
    const mode = readerMode(id, arm?.rows.find(r => r.id === probe.caseId)?.decision);
    const result = report.readerResults.find(r => r.probeId === probe.id && r.mode === mode);
    report.downstream.push({ probeId: probe.id, caseId: probe.caseId, arm: id, readerRequestSha256: result.requestSha256,
      answer: result.answer, gold: probe.gold, verdict: gradeAnswer(result.answer, probe) });
  }
  report.downstreamSummaries = Object.fromEntries(['no-memory', 'source-reference', ...arms.map(a => a.id)]
    .map(id => [id, downstreamSummary(report.downstream.filter(r => r.arm === id))]));
  report.completed = true;
} catch (error) {
  report.failure = safeError(error); process.exitCode = 1;
} finally {
  report.finishedAt = new Date().toISOString(); await checkpoint();
  if (report.completed) {
    const timeRows = ['jev', 'llmGate', 'reader'].map(kind => {
      const times = report.calls.filter(c => c.kind === kind && c.status === 'completed').map(c => c.latencyMs).sort((a, b) => a - b);
      const records = kind === 'jev' ? report.jevResults : kind === 'llmGate' ? report.llmResults : report.readerResults;
      const costs = records.map(r => kind === 'jev' || !Number.isFinite(r.usage?.input_tokens) || !Number.isFinite(r.usage?.output_tokens) ? null :
        ((r.usage.input_tokens - (r.usage.cached_input_tokens ?? 0)) * .20 + (r.usage.cached_input_tokens ?? 0) * .02 + r.usage.output_tokens * 1.20) / 1e6);
      const cost = costs.every(Number.isFinite) ? costs.reduce((a, b) => a + b, 0).toFixed(6) : 'unreported';
      return `| ${kind} | ${times.length} | ${Math.round(times.reduce((a, b) => a + b, 0) / times.length)} | ${times[Math.ceil(times.length / 2) - 1]} | ${times[Math.ceil(times.length * .95) - 1]} | ${cost} |`;
    });
    const readerRows = Object.entries(report.downstreamSummaries).map(([id, s]) =>
      `| ${id} | ${s.correctAnswers} | ${s.correctAbstentions} | ${s.missedAnswers} | ${s.wrongAnswers} | ${pct(s.accuracy)} |`);
    await writeFile(new URL('report.md', dir), `# Paired comparison and follow-up QA pilot\n\nCompleted: ${report.finishedAt}. Model: ${model}; Jev: jev-1.13.0. Synthetic, AI-authored labels; one run. This local report must be reviewed before publication.\n\n## Admission\n\n${table(report.policies)}\n\n## Sensitivity without disputed defer labels\n\n${table(report.policies, true)}\n\n## Live API measurements\n\n| Stage | Calls | Mean ms | Median ms | p95 ms | Estimated OpenAI USD |\n|---|---:|---:|---:|---:|---:|\n${timeRows.join('\n')}\n\nLatency includes network time, on this connection and run. OpenAI estimates use published standard token rates, including reported cached input; cache-write charges and other adjustments are not included. These are not billing receipts. Jev cost remains unreported. The same gate response serves both confidence thresholds.\n\n## Follow-up questions\n\n| Arm | Correct answers | Justified unknowns | Missed answers | Wrong answers | Exact accuracy |\n|---|---:|---:|---:|---:|---:|\n${readerRows.join('\n')}\n\nLLM arms use Luna with reasoning effort none. 20 questions per arm; shared reader prompts are evaluated once. These paired arm rows are not independent samples. Source-reference sees original source text; all other arms see only admitted candidates or no memory. Two questions have gold unknown. The experiment does not measure free-form conversation or a production memory system. See report.json for every input, response choice, usage field, hash and grade.\n`);
  }
  console.log(JSON.stringify({ completed: report.completed, attemptedCalls: report.attemptedCalls, failure: report.failure, report: fileURLToPath(dir) }));
}
