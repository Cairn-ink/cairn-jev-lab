import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import { createLabServer } from '../src/server.mjs';

const report = JSON.parse(await readFile(new URL('../evidence/holdout-en-v1/report.json', import.meta.url)));
const sample = report.results[0];
async function setup(t, options = {}) {
  const server = await createLabServer(options);
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  t.after(() => { server.closeAllConnections(); return new Promise(resolve => server.close(resolve)); });
  const base = `http://127.0.0.1:${server.address().port}`;
  const status = await (await fetch(base + '/api/status')).json();
  const post = (body, headers = {}) => fetch(base + '/api/evaluate', { method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: base, 'X-Lab-Token': status.token, ...headers }, body: JSON.stringify(body) });
  return { base, status, post };
}
test('recorded playground works without a key and never exposes credentials or arbitrary files', async t => {
  const { base, status, post } = await setup(t, { apiKey: '' });
  assert.equal(status.configured, false);
  const examples = await (await fetch(base + '/api/examples')).json();
  assert.equal(examples.length, 4);
  assert.equal(examples[0].mode, 'recorded');
  assert.equal(examples[0].decisions['admission-v2-preview'].decision, 'save');
  assert.equal((await post({ source: 'a', candidate: 'b' })).status, 503);
  assert.equal((await fetch(base + '/.env')).status, 404);
  const page = await fetch(base + '/');
  assert.match(page.headers.get('content-security-policy'), /frame-ancestors 'none'/);
  assert.match(await page.text(), /id="try-yourself"/);
  assert.equal((await fetch(base + '/study.json')).status, 200);
  assert.equal((await fetch(base + '/examples.json')).status, 200);
  assert.equal((await fetch(base + '/i18n.js')).status, 200);
  assert.equal((await fetch(base + '/?lang=zh-TW')).status, 200);
  assert.equal((await fetch(base + '/.env?lang=zh-TW')).status, 404);
});
test('live API validates origins, token and inputs before spending; caps calls and compares both policies', async t => {
  let calls = 0;
  const { base, post } = await setup(t, { apiKey: 'test-only-secret', maxCalls: 1, evaluator: async (input, options) => {
    calls++; assert.equal(options.apiKey, 'test-only-secret');
    assert.deepEqual(Object.keys(input).sort(), ['candidate', 'source']);
    return { answers: sample.answers, model: sample.model, usage: sample.usage, latencyMs: 1 };
  } });
  const input = { source: sample.source, candidate: sample.candidate };
  assert.equal((await post(input, { Origin: 'https://other.example' })).status, 403);
  assert.equal((await post(input, { 'X-Lab-Token': 'wrong' })).status, 403);
  assert.equal((await post({ ...input, apiKey: 'unexpected' })).status, 400);
  assert.equal((await post({ source: '', candidate: 'x' })).status, 400);
  assert.equal(calls, 0);
  const response = await post(input);
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.mode, 'live');
  assert.equal(data.decisions['admission-v1'].decision, 'defer');
  assert.equal(data.decisions['admission-v2-preview'].decision, 'save');
  assert.equal(JSON.stringify(data).includes('test-only-secret'), false);
  assert.equal((await post(input)).status, 429);
  assert.equal(calls, 1);
  assert.equal((await (await fetch(base + '/api/status')).json()).remaining, 0);
});
test('concurrent live requests cannot bypass the single-call guard; errors do not leak provider text', async t => {
  let started, release;
  const ready = new Promise(resolve => { started = resolve; });
  const waiting = new Promise(resolve => { release = resolve; });
  const { post } = await setup(t, { apiKey: 'test-only-secret', evaluator: async () => {
    started(); await waiting; throw new Error('private provider details');
  } });
  const pending = post({ source: 'a', candidate: 'b' });
  await ready;
  const parallel = await post({ source: 'a', candidate: 'b' });
  assert.equal(parallel.status, 409);
  release();
  const failed = await pending;
  assert.equal(failed.status, 502);
  assert.deepEqual(await failed.json(), { error: 'evaluation_failed', remaining: 19 });
});
