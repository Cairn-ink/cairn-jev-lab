import test from 'node:test';
import assert from 'node:assert/strict';
import { complete, model, gateFormat, readerFormat, gateMessages, readerMessages, requestBody } from '../src/openai.mjs';
import { questions } from '../src/gate.mjs';

test('Luna uses the original criteria and strict bounded outputs without gold labels', () => {
  const messages = gateMessages({ source: 'S', candidate: 'C', expected: 'SECRET_GOLD', why: 'SECRET_REASON' });
  const body = requestBody(messages, gateFormat, 700);
  assert.equal(body.model, 'gpt-5.6-luna'); assert.equal(body.reasoning_effort, 'none');
  assert.equal(body.store, false); assert.equal(body.max_completion_tokens, 700);
  assert.equal(JSON.stringify(body).includes('SECRET_'), false);
  assert.equal(JSON.stringify(body).includes('/no_think'), false);
  assert.deepEqual(JSON.parse(messages[1].content), { source: 'S', candidate: 'C', questions });
  const schema = body.response_format.json_schema;
  assert.equal(schema.strict, true); assert.equal(schema.schema.additionalProperties, false);
  for (const [key, q] of Object.entries(questions)) {
    const entry = schema.schema.properties.answers.properties[key];
    assert.deepEqual(entry.properties.choice.enum, Object.keys(q.criteria));
    assert.deepEqual(entry.properties.probabilities.required, Object.keys(q.criteria));
  }
  assert.throws(() => requestBody(messages, gateFormat, 701), /invalid_openai_config/);
});

test('OpenAI adapter never routes credentials to another provider and rejects incomplete outputs', async () => {
  let calls = 0;
  const format = readerFormat(['A', 'unknown']);
  const messages = readerMessages({ question: 'Q', options: ['A', 'unknown'], gold: 'SECRET_GOLD' }, []);
  const result = await complete(messages, { apiKey: 'test-key', responseFormat: format, maxTokens: 120,
    fetchImpl: async (url, request) => {
      calls++; assert.equal(url, 'https://api.openai.com/v1/chat/completions');
      assert.equal(request.redirect, 'error');
      const body = JSON.parse(request.body); assert.equal(body.max_completion_tokens, 120);
      assert.equal(body.provider, undefined); assert.equal(body.store, false);
      assert.equal(JSON.stringify(body).includes('SECRET_GOLD'), false);
      return Response.json({ model, choices: [{ finish_reason: 'stop', message: { content: '{"answer":"A"}' } }],
        usage: { prompt_tokens: 50, completion_tokens: 10, prompt_tokens_details: { cached_tokens: 20 }, completion_tokens_details: { reasoning_tokens: 0 } } });
    } });
  assert.equal(calls, 1); assert.equal(result.provider, 'OpenAI'); assert.equal(result.usage.cached_input_tokens, 20);
  assert.equal(result.usage.reportedCostUsd, null);
  for (const response of [
    { choices: [{ finish_reason: 'length', message: { content: '{}' } }] },
    { choices: [{ finish_reason: 'stop', message: { content: '{}', refusal: 'not available' } }] }
  ]) await assert.rejects(() => complete(messages, { apiKey: 'test-key', fetchImpl: async () => Response.json(response) }), /invalid_openai_response/);
  await assert.rejects(() => complete(messages, { apiKey: 'test-key', fetchImpl: async () => new Response('SECRET_ERROR_BODY', { status: 401 }) }), /^Error: openai_http_401$/);
  await assert.rejects(() => complete(messages, { apiKey: 'test-key', fetchImpl: async () => { throw new Error('SECRET_KEY'); } }), /^Error: openai_network_or_timeout$/);
});
