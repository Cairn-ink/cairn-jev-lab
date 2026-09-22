import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { summarize } from '../src/report.mjs';
import { decide, getPolicy, policy, previewPolicy } from '../src/gate.mjs';
import { parseCases } from '../src/cases.mjs';

test('baseline reproduces every original decision; preview only changes the threshold', async () => {
  const original = JSON.parse(await readFile(new URL('../evidence/pilot-2026-09-22/report.json', import.meta.url)));
  for (const r of original.results) assert.equal(decide(r.answers).decision, r.decision);
  assert.equal(getPolicy(), policy);
  assert.equal(getPolicy('admission-v2-preview'), previewPolicy);
  const example = original.results.find(r => r.id === '01');
  assert.equal(decide(example.answers, previewPolicy).decision, 'save');
  for (const p of [{ minConfidence: -1 }, { minConfidence: NaN }, { minConfidence: 2 }])
    assert.throws(() => decide(example.answers, p), /invalid_policy/);
  assert.throws(() => getPolicy('unknown'), /invalid_policy/);
});
test('follow-up is distinct from development, with frozen expected-class counts', async () => {
  const holdout = parseCases(await readFile(new URL('../fixtures/holdout-en-v1.json', import.meta.url), 'utf8'));
  const development = parseCases(await readFile(new URL('../fixtures/english.json', import.meta.url), 'utf8'));
  assert.equal(holdout.length, 20);
  assert.equal(holdout.filter(r => r.expected === 'save').length, 10);
  assert.equal(holdout.filter(r => r.expected === 'skip').length, 8);
  assert.equal(holdout.filter(r => r.expected === 'defer').length, 2);
  for (const r of holdout) assert.equal(development.some(d => d.source === r.source), false);
});

test('published follow-up hashes and paired metrics reproduce from exact recorded responses', async () => {
  const report = JSON.parse(await readFile(new URL('../evidence/holdout-en-v1/report.json', import.meta.url)));
  for (const [file, hashField] of [['fixtures/holdout-en-v1.json', 'fixtureSha256'], ['evidence/holdout-en-v1/PROTOCOL.md', 'protocolSha256']]) {
    const bytes = await readFile(new URL('../' + file, import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), report[hashField]);
  }
  assert.equal(report.completed, true);
  for (const p of report.policies) {
    const results = report.results.map(r => ({ ...r, ...decide(r.answers, p) }));
    assert.deepEqual(summarize(results), report.summaries[p.version]);
  }
});
