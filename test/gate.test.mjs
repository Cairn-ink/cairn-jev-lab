import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildRequest, decide, questions } from '../src/gate.mjs';
import { evaluate } from '../src/jev.mjs';

function answers(choices = {}, confidence = 0.95) {
  const defaults = { support: 'supported', durability: 'durable', commitment: 'preserved' };
  return Object.fromEntries(Object.entries(questions).map(([name, q]) => {
    const choice = choices[name] ?? defaults[name];
    return [name, { type: 'choice', choice, confidence,
      probabilities: Object.fromEntries(Object.keys(q.criteria).map(k => [k, k === choice ? 0.9 : 0.05])) }];
  }));
}
test('only supported, durable, faithful candidates pass; ambiguous candidates defer', () => {
  assert.equal(decide(answers()).decision, 'save');
  assert.equal(decide(answers({ support: 'unsupported' })).decision, 'skip');
  assert.equal(decide(answers({ commitment: 'overstated' })).decision, 'skip');
  assert.equal(decide(answers({ durability: 'temporary' })).decision, 'skip');
  assert.equal(decide(answers({ support: 'unclear' })).decision, 'defer');
  assert.equal(decide(answers({}, 0.5)).decision, 'defer');
});
test('malformed answers never admit a memory', () => {
  for (const value of [null, {}, { ...answers(), support: { choice: 'supported' } }])
    assert.throws(() => decide(value), /invalid_answers/);
  const bad = answers(); bad.support.probabilities.supported = 8;
  assert.throws(() => decide(bad), /invalid_answers/);
});
test('fixtures are bounded and labels never reach the provider', async () => {
  const cases = JSON.parse(await readFile(new URL('../fixtures/cases.json', import.meta.url), 'utf8'));
  assert.equal(cases.length, 20);
  assert.equal(new Set(cases.map(c => c.id)).size, 20);
  for (const c of cases) {
    const request = buildRequest(c);
    assert.deepEqual(JSON.parse(request.state), { source: c.source, candidate: c.candidate });
    assert.ok(['save', 'skip', 'defer'].includes(c.expected));
  }
});
test('adapter sends to fixed endpoint, forbids redirects and does not persist arbitrary provider data', async () => {
  const result = await evaluate({ source: 'I prefer tea.', candidate: 'The user prefers tea.' }, {
    apiKey: 'test-only', fetchImpl: async (url, options) => {
      assert.equal(url, 'https://api.typesafe.ai/v1/systemone');
      assert.equal(options.redirect, 'error');
      assert.equal(options.headers.Authorization, 'Bearer test-only');
      return new Response(JSON.stringify({ model: 'jev-test', answers: answers(),
        usage: { input_tokens: 10, output_tokens: 0 }, unexpected: 'private-provider-data' }));
    }
  });
  assert.equal(result.model, 'jev-test');
  assert.equal(JSON.stringify(result).includes('private-provider-data'), false);
});
test('HTTP errors do not echo provider error bodies or retry', async () => {
  let calls = 0;
  await assert.rejects(evaluate({ source: 'a', candidate: 'b' }, {
    apiKey: 'test-only', fetchImpl: async () => {
      calls++; return new Response('secret-body', { status: 401 });
    }
  }), /^Error: provider_http_401$/);
  assert.equal(calls, 1);
});
