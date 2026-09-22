import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { evaluate } from '../src/jev.mjs';
import { complete } from '../src/llm.mjs';
import { policiesFor, sweep, gateMessages, readerMessages, parseGate, parseReader, gradeAnswer, downstreamSummary, readerMode } from '../src/comparison.mjs';

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

const frozenPaths = ['evidence/comparison-v1/PROTOCOL.md', 'fixtures/downstream-v1.json', 'evidence/coverage-en-v1/report.json',
  'src/gate.mjs', 'src/jev.mjs', 'src/llm.mjs', 'src/comparison.mjs', 'scripts/compare.mjs'];
const hashes = Object.fromEntries(await Promise.all(frozenPaths.map(async path => [path, hash(await readFile(new URL(path, root)))])));
const pct = value => value === null ? '—' : `${(value * 100).toFixed(1)}%`;
function table(arms, sensitivity = false) {
  return ['| Policy | Matches | False saves | Missed saves | Defer | Save precision | Save recall |',
    '|---|---:|---:|---:|---:|---:|---:|', ...arms.map(a => {
      const s = sensitivity ? a.sensitivityWithoutDisputedDefer : a.summary;
      return `| ${a.id} | ${s.matched}/${s.evaluated} | ${s.falseSaves}/${s.nonSaves} | ${s.missedSaves}/${s.expectedSaves} | ${s.deferred} | ${pct(s.savePrecision)} | ${pct(s.saveRecall)} |`;
    })].join('\n');
}

const output = new URL('evidence/comparison-v1/', root);
await mkdir(output, { recursive: true });
if (process.argv.length === 2) {
  const arms = policiesFor(cases);
  const report = { kind: 'archived-100-case-baseline-comparison', evidence: 'archived Jev responses; no new inference',
    historicalStartedAt: historical.startedAt, hashes,
    completed: { deterministicBaselines: true, archivedJevTradeoffs: true, liveLlmComparison: false, downstreamReaderEvaluation: false },
    policies: arms, thresholdSweep: sweep(cases), newApiCalls: 0 };
  await put(new URL('offline-report.json', output), report);
  const curve = report.thresholdSweep.map(s => `| ${s.threshold.toFixed(2)} | ${s.saved} | ${s.falseSaves} | ${s.missedSaves} | ${s.deferred} | ${pct(s.resolvedCoverage)} |`).join('\n');
  await writeFile(new URL('README.md', output), `# Comparative memory admission: first results\n\nThe next phase compares admission policies, measures their tradeoffs, and prepares a controlled follow-up QA experiment. **The tables below are completed offline analyses of the original 100-case run. The general-purpose LLM comparison and downstream reader results have not been measured yet.**\n\n[Protocol](PROTOCOL.md) · [Exact comparison data](offline-report.json) · [20 follow-up probes](../../fixtures/downstream-v1.json)\n\n## Same 100 candidates, four policies\n\n![Archived admission tradeoffs](tradeoffs.png)\n\n${table(arms)}\n\nFalse saves use the 50 non-save labels as denominator; missed saves use the 50 save labels. A zero observed false-save count on this synthetic set is not a zero-risk guarantee. Rules-v1 is a basic lexical control, not an optimized competitor. Jev rows replay the same published responses; local rule execution is not an API-latency comparison. All labels remain as authored, including disputed defer labels.\n\n## Sensitivity: exclude the 10 disputed defer labels\n\n${table(arms, true)}\n\nThis diagnostic excludes the entire original defer class without changing any label. It cannot establish whether a model defers appropriately. See the [boundary audit](../../docs/decision-boundary.md).\n\n## Threshold tradeoff, unchanged Jev responses\n\n| Threshold | Saved | False saves | Missed saves | Defer | Resolved coverage |\n|---|---:|---:|---:|---:|---:|\n${curve}\n\nResolved coverage is the proportion receiving save or skip. It is distinct from save recall. Full confusion matrices and resolved error rates are retained in the JSON. Sweeps are descriptive; no new default threshold is selected.\n\n## Downstream experiment\n\nTwenty frozen multiple-choice follow-ups ask the same reader to answer with only the memories admitted by each policy. Controls include no memory and original-source context. We distinguish correct answers, justified unknowns, missed answers and wrong answers. Identical reader requests are shared between policies, so arm rows do not become extra independent samples. The design uses one candidate per isolated session and does not test a full memory store or free-form tasks. **No downstream improvement claim is supported until the reader run completes.**\n\n## Reproduce\n\nRun \`node scripts/compare.mjs\` for the tables without credentials or API use. Live comparison requires \`TYPESAFE_API_KEY\` and \`OPENROUTER_API_KEY\` in a local environment file:\n\n\`node --env-file=.env scripts/compare.mjs --live\`\n\nThe live command reruns 100 Jev evaluations, performs 100 Qwen3-8B gate calls, and up to 60 Qwen3-8B reader calls. It stops on the first error, does not retry automatically, and checkpoints into ignored \`runs/\`. The model is frozen in the protocol. Both providers may charge for live calls. No production memories are written. Do not upload your environment file.\n\nThe [research notes](../../docs/research-directions.md) explain how this experiment relates to earlier work.\n`);
  console.log(JSON.stringify({ newApiCalls: 0, policies: arms.map(a => ({ id: a.id, ...a.summary })), report: fileURLToPath(output) }, null, 2));
  process.exit(0);
}
if (process.argv.length !== 3 || process.argv[2] !== '--live') throw new Error('invalid_arguments');
if (!process.env.TYPESAFE_API_KEY || !process.env.OPENROUTER_API_KEY || [process.env.TYPESAFE_API_KEY, process.env.OPENROUTER_API_KEY].includes('replace_locally'))
  throw new Error('both_provider_keys_required_before_any_call');
const gitArgs = ['-c', `safe.directory=${fileURLToPath(root).replace(/\\/g, '/').replace(/\/$/, '')}`];
const git = args => execFileSync('git', [...gitArgs, ...args], { cwd: root, encoding: 'utf8' }).trim();
if (git(['status', '--porcelain', '--', ...frozenPaths]) || git(['ls-files', '--', ...frozenPaths]).split('\n').length !== frozenPaths.length)
  throw new Error('commit_protocol_and_sources_before_live_calls');
const model = 'qwen/qwen3-8b';
const dir = new URL(`runs/comparison-${Date.now()}/`, root); await mkdir(dir, { recursive: true });
const report = { kind: 'paired-live-comparison-and-downstream-pilot', startedAt: new Date().toISOString(), sourceCommit: git(['rev-parse', 'HEAD']), hashes,
  gateModels: { jev: 'jev-1.13.0', llm: model }, readerModel: model,
  maximumCalls: { jev: 100, llmGate: 100, reader: 60 }, attemptedCalls: { jev: 0, llmGate: 0, reader: 0 },
  completed: false, calls: [], jevResults: [], llmResults: [], readerResults: [], downstream: [] };
const checkpoint = () => put(new URL('report.json', dir), report);
await checkpoint();
function safeError(error) {
  return /^(invalid_answers|network_or_timeout|invalid_provider_response|provider_http_\d{3}|llm_network_or_timeout|llm_http_\d{3}|invalid_llm_response|invalid_reader_answer)$/.test(error.message)
    ? error.message : 'invalid_evaluation_output';
}
async function call(kind, id, input, operation) {
  if (report.attemptedCalls[kind] >= report.maximumCalls[kind]) throw new Error('request_limit');
  report.attemptedCalls[kind]++;
  const record = { kind, id, inputSha256: hash(JSON.stringify(input)), startedAt: new Date().toISOString(), status: 'attempted' };
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
        const result = await call(kind, item.id, { source: item.source, candidate: item.candidate },
          () => evaluate(item, { apiKey: process.env.TYPESAFE_API_KEY, model: 'jev-1.13.0' }));
        report.jevResults.push({ ...data, ...result });
      } else {
        const messages = gateMessages(item);
        const result = await call(kind, item.id, messages, async () => {
          const { content, ...metadata } = await complete(messages, { apiKey: process.env.OPENROUTER_API_KEY, model });
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
    const result = await call('reader', `${job.probe.id}:${job.mode}`, job.messages, async () => {
      const { content, ...metadata } = await complete(job.messages, { apiKey: process.env.OPENROUTER_API_KEY, model, maxTokens: 120 });
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
      const costs = records.map(r => r.usage?.reportedCostUsd);
      const cost = costs.every(Number.isFinite) ? costs.reduce((a, b) => a + b, 0).toFixed(6) : 'unreported';
      return `| ${kind} | ${times.length} | ${Math.round(times.reduce((a, b) => a + b, 0) / times.length)} | ${times[Math.ceil(times.length / 2) - 1]} | ${times[Math.ceil(times.length * .95) - 1]} | ${cost} |`;
    });
    const readerRows = Object.entries(report.downstreamSummaries).map(([id, s]) =>
      `| ${id} | ${s.correctAnswers} | ${s.correctAbstentions} | ${s.missedAnswers} | ${s.wrongAnswers} | ${pct(s.accuracy)} |`);
    await writeFile(new URL('report.md', dir), `# Paired comparison and follow-up QA pilot\n\nCompleted: ${report.finishedAt}. Model: ${model}; Jev: jev-1.13.0. Synthetic, AI-authored labels; one run. This local report must be reviewed before publication.\n\n## Admission\n\n${table(report.policies)}\n\n## Sensitivity without disputed defer labels\n\n${table(report.policies, true)}\n\n## Live API measurements\n\n| Stage | Calls | Mean ms | Median ms | p95 ms | Reported USD |\n|---|---:|---:|---:|---:|---:|\n${timeRows.join('\n')}\n\nLatency includes network time, on this connection and run. Price filters are not billed amounts; unreported cost stays unknown. The same gate response serves both confidence thresholds.\n\n## Follow-up questions\n\n| Arm | Correct answers | Justified unknowns | Missed answers | Wrong answers | Exact accuracy |\n|---|---:|---:|---:|---:|---:|\n${readerRows.join('\n')}\n\n20 questions per arm; shared reader prompts are evaluated once. These paired arm rows are not independent samples. Source-reference sees original source text; all other arms see only admitted candidates or no memory. Two questions have gold unknown. The experiment does not measure free-form conversation or a production memory system. See report.json for every input, response choice, usage field, hash and grade.\n`);
  }
  console.log(JSON.stringify({ completed: report.completed, attemptedCalls: report.attemptedCalls, failure: report.failure, report: fileURLToPath(dir) }));
}
