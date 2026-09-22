import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseCases } from '../src/cases.mjs';
import { summarize, renderReport } from '../src/report.mjs';
import { judgeMemory } from '../src/index.mjs';
import { questions, policy } from '../src/gate.mjs';

const sample = { id: 'example', source: 'I prefer tea.', candidate: 'The user prefers tea.' };
test('all distributed fixtures validate, including unlabeled cases', async () => {
  for (const file of ['fixtures/english.json', 'fixtures/cases.json', 'examples/my-cases.json']) {
    const text = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
    assert.ok(parseCases(text).length > 0);
  }
  assert.deepEqual(parseCases(JSON.stringify([sample])), [sample]);
});
test('input validation rejects partial, excessive, duplicate and unexpected data', () => {
  for (const values of [[], null, [null], [sample, sample],
    [{ ...sample, id: 'bad|id' }], [{ ...sample, source: '' }],
    [{ ...sample, source: 'x'.repeat(4001) }], [{ ...sample, candidate: 'x'.repeat(1001) }],
    [{ ...sample, expected: 'maybe' }], [{ ...sample, apiKey: 'do-not-persist' }],
    Array.from({ length: 21 }, (_, i) => ({ ...sample, id: `case-${i}` }))]) {
    assert.throws(() => parseCases(JSON.stringify(values)));
  }
  assert.throws(() => parseCases('{'), /invalid_json/);
  assert.throws(() => parseCases(' '.repeat(200001)), /input_too_large/);
});
test('unlabeled saves and failures never inflate or reduce labeled agreement', () => {
  const base = { latencyMs: 100, usage: { input_tokens: 10, output_tokens: 2 } };
  const results = [
    { ...base, id: 'a', expected: 'save', decision: 'defer', matchesExpected: false },
    { ...base, id: 'b', expected: 'skip', decision: 'skip', matchesExpected: true },
    { ...base, id: 'c', decision: 'save' },
    { id: 'd', expected: 'save', error: 'provider_http_401' }
  ];
  const summary = summarize(results);
  assert.equal(summary.evaluated, 3);
  assert.equal(summary.labeledEvaluated, 2);
  assert.equal(summary.matched, 1);
  assert.equal(summary.falseSaves, 0);
  assert.equal(summary.missedSaves, 1);
  assert.equal(summary.errors, 1);
  assert.equal(summary.inputTokens, 30);
  assert.equal(summarize([]).inputTokens, null);
  const report = renderReport({ summary, results, policy, startedAt: 'test' });
  assert.match(report, /matched 1\/2 labeled/);
  assert.match(report, /\| c \| unlabeled \| save \| — \|/);
});
test('public API preserves text and keeps expected labels outside the provider request', async () => {
  let calls = 0;
  const responseAnswers = Object.fromEntries(Object.entries(questions).map(([key, q]) => {
    const options = Object.keys(q.criteria);
    return [key, { type: 'choice', choice: options[0], confidence: 0.95,
      probabilities: Object.fromEntries(options.map((option, i) => [option, i === 0 ? 0.9 : 0.05])) }];
  }));
  const input = { ...sample, expected: 'skip', why: 'local-only labeling note' };
  const result = await judgeMemory(input, { apiKey: 'test-only', fetchImpl: async (url, options) => {
    calls++;
    const request = JSON.parse(options.body);
    assert.deepEqual(JSON.parse(request.state), { source: sample.source, candidate: sample.candidate });
    assert.equal(options.body.includes('local-only labeling note'), false);
    return new Response(JSON.stringify({ model: 'jev-test', answers: responseAnswers,
      usage: { input_tokens: 10, output_tokens: 0 } }));
  } });
  assert.equal(calls, 1);
  assert.equal(result.source, sample.source);
  assert.equal(result.candidate, sample.candidate);
  assert.equal(result.decision, 'save');
  assert.equal(result.policy.version, 'admission-v1');
});
