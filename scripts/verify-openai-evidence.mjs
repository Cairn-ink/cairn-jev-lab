import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { buildRequest, validateAnswers } from '../src/gate.mjs';
import { model, gateMessages, readerMessages, gateFormat, readerFormat, requestBody } from '../src/openai.mjs';
import { policiesFor, sweep, readerMode, gradeAnswer, downstreamSummary } from '../src/comparison.mjs';

const root = new URL('../', import.meta.url);
const read = async p => JSON.parse(await readFile(new URL(p, root), 'utf8'));
const hash = value => createHash('sha256').update(value).digest('hex');
const r = await read('evidence/comparison-openai-v1/report.json');
const historical = (await read('evidence/coverage-en-v1/report.json')).results;
const probes = await read('fixtures/downstream-v1.json');
assert.equal(r.completed, true); assert.equal(r.failure, undefined);
assert.equal(r.readerModel, model); assert.equal(r.gateModels.llm, model);
assert.deepEqual(r.attemptedCalls, { jev: 100, llmGate: 100, reader: 60 });
assert.equal(r.calls.length, 260); assert.equal(r.downstream.length, 160);
assert.equal(new Set(r.calls.map(c => `${c.kind}:${c.id}`)).size, 260);
for (const [path, expected] of Object.entries(r.hashes)) assert.equal(hash(await readFile(new URL(path, root))), expected, path);
for (const [key, size] of [['jevResults', 100], ['llmResults', 100]]) {
  assert.equal(r[key].length, size); assert.equal(new Set(r[key].map(x => x.id)).size, size);
  for (const item of r[key]) {
    const original = historical.find(x => x.id === item.id);
    for (const f of ['source', 'candidate', 'expected', 'group']) assert.equal(item[f], original[f]);
    validateAnswers(item.answers);
  }
}
assert.equal(r.readerResults.length, 60);
assert.equal(new Set(r.readerResults.map(x => `${x.probeId}:${x.mode}`)).size, 60);
for (const call of r.calls) {
  assert.equal(call.status, 'completed'); assert.equal(call.inputSha256, hash(JSON.stringify(call.request)));
  assert.ok(Number.isInteger(call.latencyMs) && call.latencyMs >= 0);
  let expected, result;
  if (call.kind === 'reader') {
    const [id, mode] = call.id.split(':'); const probe = probes.find(p => p.id === id);
    const item = historical.find(x => x.id === probe.caseId);
    const memories = mode === 'source' ? [item.source] : mode === 'candidate' ? [item.candidate] : [];
    const messages = readerMessages(probe, memories);
    expected = requestBody(messages, readerFormat(probe.options), 120);
    result = r.readerResults.find(x => x.probeId === id && x.mode === mode);
    assert.ok(probe.options.includes(result.answer));
    assert.equal(result.requestSha256, hash(JSON.stringify(messages)));
  } else {
    const item = historical.find(x => x.id === call.id);
    expected = call.kind === 'jev' ? buildRequest(item, 'jev-1.13.0') : requestBody(gateMessages(item), gateFormat, 700);
    result = r[call.kind === 'jev' ? 'jevResults' : 'llmResults'].find(x => x.id === call.id);
  }
  assert.deepEqual(call.request, expected); assert.equal(call.latencyMs, result.latencyMs);
}
const arms = policiesFor(r.jevResults, r.llmResults);
assert.deepEqual(r.policies, arms);
assert.deepEqual(r.thresholdSweeps, { jev: sweep(r.jevResults), llm: sweep(r.llmResults) });
const downstream = [];
for (const probe of probes) for (const id of ['no-memory', 'source-reference', ...arms.map(a => a.id)]) {
  const arm = arms.find(a => a.id === id);
  const mode = readerMode(id, arm?.rows.find(x => x.id === probe.caseId)?.decision);
  const result = r.readerResults.find(x => x.probeId === probe.id && x.mode === mode);
  downstream.push({ probeId: probe.id, caseId: probe.caseId, arm: id, readerRequestSha256: result.requestSha256,
    answer: result.answer, gold: probe.gold, verdict: gradeAnswer(result.answer, probe) });
}
assert.deepEqual(r.downstream, downstream);
for (const [id, summary] of Object.entries(r.downstreamSummaries))
  assert.deepEqual(summary, downstreamSummary(downstream.filter(x => x.arm === id)));
console.log('Verified frozen hashes, 260 exact requests, 100 paired judgments and all 160 paired downstream scores.');
