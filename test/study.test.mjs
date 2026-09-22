import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { decide, questions } from '../src/gate.mjs';
import { summarize } from '../src/report.mjs';
const root = new URL('../', import.meta.url);
const read = async path => JSON.parse(await readFile(new URL(path, root)));
test('dashboard metrics and repeat protocol reproduce from published responses, with repeats not counted as unique cases', async () => {
  const study = await read('web/study.json');
  const repeat = await read('evidence/repeat-en-v1/report.json');
  const original = await read('evidence/holdout-en-v1/report.json');
  const hash = value => createHash('sha256').update(value).digest('hex');
  assert.equal(repeat.protocolSha256, hash(await readFile(new URL('evidence/repeat-en-v1/PROTOCOL.md', root))));
  assert.equal(repeat.fixtureSha256, original.fixtureSha256);
  assert.equal(repeat.questionsSha256, hash(JSON.stringify(questions)));
  assert.equal(repeat.completed, true);
  const all = [...original.results.map(r => ({ ...r, pass: 1 })), ...repeat.results];
  assert.equal(study.attempted, all.length);
  assert.equal(study.uniqueCases, new Set(all.map(r => r.id)).size);
  assert.equal(study.uniqueCases, 20);
  assert.equal(study.completed, 60);
  for (const p of study.policies) {
    const evaluated = all.map(r => ({ ...r, ...decide(r.answers, p) }));
    assert.deepEqual(p.summary, summarize(evaluated));
    for (const pass of [1, 2, 3]) assert.deepEqual(p.passes[pass - 1], summarize(evaluated.filter(r => r.pass === pass)));
    const varied = [...new Set(evaluated.map(r => r.id))].filter(id => new Set(evaluated.filter(r => r.id === id).map(r => r.decision)).size > 1);
    assert.deepEqual(p.variedCases, varied);
  }
  assert.deepEqual(study.latency.values, all.map(r => r.latencyMs));
  const timings = all.map(r => r.latencyMs).sort((a, b) => a - b);
  assert.equal(study.latency.mean, Math.round(timings.reduce((a, b) => a + b) / timings.length));
  assert.equal(study.latency.median, (timings[29] + timings[30]) / 2);
  assert.equal(study.latency.p95, timings[56]);
  assert.equal(study.latency.max, timings.at(-1));
  const examples = await read('web/examples.json');
  for (const item of examples) {
    const source = original.results.find(r => r.id === item.id);
    assert.deepEqual(item.answers, source.answers);
    assert.deepEqual(item.decisions, source.decisions);
    assert.equal(item.mode, 'recorded');
  }
});
