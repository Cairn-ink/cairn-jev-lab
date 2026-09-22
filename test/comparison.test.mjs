import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { metrics, policiesFor, sweep, gateMessages, readerMessages, parseGate, parseReader, gradeAnswer, downstreamSummary, readerMode, ruleDecision } from '../src/comparison.mjs';
import { complete } from '../src/llm.mjs';
const root = new URL('../', import.meta.url);
const read = async p => JSON.parse(await readFile(new URL(p, root), 'utf8'));

test('metrics preserve denominators, abstention errors and undefined precision', () => {
  const rows = [{ expected: 'skip', decision: 'save' }, { expected: 'save', decision: 'defer' },
    { expected: 'save', decision: 'save' }, { expected: 'defer', decision: 'skip' }, { expected: 'save', error: 'failed' }];
  const s = metrics(rows);
  assert.equal(s.evaluated, 4); assert.equal(s.errors, 1);
  assert.equal(s.falseSaveRate, 0.5); assert.equal(s.saveRecall, 0.5);
  assert.equal(s.resolvedErrorRate, 2 / 3); assert.equal(s.deferRate, 0.25);
  assert.equal(metrics([{ expected: 'save', decision: 'defer' }]).savePrecision, null);
  assert.equal(metrics([]).resolvedCoverage, null);
});

test('published replay reconstructs complete evidence and original case labels', async () => {
  const historical = await read('evidence/coverage-en-v1/report.json');
  const offline = await read('evidence/comparison-v1/offline-report.json');
  assert.equal(offline.newApiCalls, 0);
  assert.equal(offline.completed.liveLlmComparison, false);
  assert.equal(offline.completed.downstreamReaderEvaluation, false);
  assert.deepEqual(offline.policies, policiesFor(historical.results));
  assert.deepEqual(offline.thresholdSweep, sweep(historical.results));
  for (const [path, expected] of Object.entries(offline.hashes))
    assert.equal(createHash('sha256').update(await readFile(new URL(path, root))).digest('hex'), expected);
  const llm = policiesFor(historical.results, []);
  assert.equal(llm.find(a => a.id === 'llm-0.4').summary.errors, 100);
  assert.equal(llm.find(a => a.id === 'llm-0.4').rows[0].answers, undefined);
  const modelRows = historical.results.map(r => ({ ...r, model: 'comparison-model', latencyMs: 12345 }));
  const modelArm = policiesFor(historical.results, modelRows).find(a => a.id === 'llm-0.4');
  assert.equal(modelArm.rows[0].model, 'comparison-model');
  assert.equal(modelArm.rows[0].latencyMs, 12345);
});

test('probes have balanced groups; no label, source or policy leaks into ordinary reader input', async () => {
  const probes = await read('fixtures/downstream-v1.json'), cases = (await read('evidence/coverage-en-v1/report.json')).results;
  assert.equal(probes.length, 20);
  assert.equal(new Set(probes.map(p => p.caseId)).size, 20);
  const counts = {};
  for (const probe of probes) {
    const item = cases.find(r => r.id === probe.caseId);
    counts[`${item.group}:${item.expected}`] = (counts[`${item.group}:${item.expected}`] ?? 0) + 1;
    assert.ok(probe.options.includes(probe.gold));
    const payload = JSON.parse(readerMessages({ ...probe, trap: 'private_gold' }, [item.candidate])[1].content);
    assert.deepEqual(Object.keys(payload), ['question', 'options', 'memories']);
    assert.deepEqual(payload.memories, [item.candidate]);
    assert.equal(JSON.stringify(payload).includes('private_gold'), false);
    const gate = JSON.parse(gateMessages({ ...item, expected: 'private_gold', why: 'private_reason' })[1].content);
    assert.deepEqual(Object.keys(gate), ['source', 'candidate', 'questions']);
    assert.equal(JSON.stringify(gate).includes('private_gold'), false);
    assert.equal(ruleDecision(item).decision, ruleDecision({ source: item.source, candidate: item.candidate }).decision);
  }
  assert.deepEqual(Object.values(counts), Array(10).fill(2));
  assert.equal(probes.filter(p => p.gold === 'unknown').length, 2);
  assert.equal(readerMode('jev-0.4', 'defer'), 'empty');
  assert.equal(readerMode('jev-0.4', 'skip'), 'empty');
  assert.equal(readerMode('jev-0.4', 'save'), 'candidate');
  assert.equal(readerMode('source-reference'), 'source');
  assert.equal(readerMode('no-memory', 'save'), 'empty');
});

test('downstream scoring separates harm from abstention without an LLM judge', () => {
  const p = { options: ['A', 'B', 'unknown'], gold: 'A' };
  assert.equal(gradeAnswer('A', p), 'correct_answer');
  assert.equal(gradeAnswer('B', p), 'wrong_answer');
  assert.equal(gradeAnswer('unknown', p), 'missed_answer');
  assert.equal(gradeAnswer('unknown', { ...p, gold: 'unknown' }), 'correct_abstention');
  assert.throws(() => parseReader('{"answer":"C"}', p.options));
  assert.equal(downstreamSummary([{ verdict: 'correct_answer' }, { verdict: 'missed_answer' }, { error: 'failed' }]).accuracy, 0.5);
});

test('LLM adapter bounds transport, disallows redirects/fallback and preserves usage without leaking bodies', async () => {
  let calls = 0;
  const fetchImpl = async (url, request) => {
    calls++; assert.equal(url, 'https://openrouter.ai/api/v1/chat/completions');
    assert.equal(request.redirect, 'error'); const body = JSON.parse(request.body);
    assert.equal(body.max_tokens, 120); assert.equal(body.provider.allow_fallbacks, false);
    assert.equal(body.provider.data_collection, 'deny');
    return Response.json({ choices: [{ finish_reason: 'stop', message: { content: '{"answer":"unknown"}' } }],
      model: 'qwen/qwen3-8b', usage: { prompt_tokens: 20, completion_tokens: 5, cost: 0.0001 } });
  };
  const result = await complete(readerMessages({ question: 'Q?', options: ['unknown'] }, []), { apiKey: 'local-test-key', maxTokens: 120, fetchImpl });
  assert.equal(parseReader(result.content, ['unknown']), 'unknown'); assert.equal(calls, 1);
  assert.equal(result.usage.reportedCostUsd, 0.0001);
  await assert.rejects(() => complete([], { apiKey: 'local-test-key', fetchImpl: async () => new Response('SECRET_PROVIDER_BODY', { status: 429 }) }), /^Error: llm_http_429$/);
  await assert.rejects(() => complete([], { apiKey: 'local-test-key', fetchImpl: async () => Response.json({ choices: [{ finish_reason: 'length', message: { content: 'partial' } }] }) }), /invalid_llm_response/);
  assert.throws(() => parseGate('{"answers":{}}'), /invalid_answers/);
});
