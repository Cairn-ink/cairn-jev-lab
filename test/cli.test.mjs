import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, cp, writeFile, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const invoke = (args, cwd = root, extra = {}) => spawnSync(process.execPath, args, {
  cwd, encoding: 'utf8', timeout: 15000,
  env: { ...process.env, TYPESAFE_API_KEY: '', NODE_OPTIONS: '', ...extra }
});

test('CLI previews English and custom input without credentials; invalid flags fail', () => {
  const preview = invoke(['src/cli.mjs', '--limit', '1']);
  assert.equal(preview.status, 0, preview.stderr);
  assert.match(preview.stdout, /en-01 expected=save/);
  const custom = invoke(['src/cli.mjs', '--input', 'examples/my-cases.json']);
  assert.equal(custom.status, 0, custom.stderr);
  assert.match(custom.stdout, /unlabeled-example expected=unlabeled/);
  for (const args of [['--limit', '21'], ['--input'], ['--unknown'], ['--live']]) {
    assert.equal(invoke(['src/cli.mjs', ...args]).status, 1);
  }
});

async function isolatedRun(t, failSecond) {
  const dir = await mkdtemp(join(tmpdir(), 'cairn-jev-test-'));
  t.after(async () => {
    // Delete only this test's generated directory, never a caller-supplied path.
    assert.equal(resolve(dir).startsWith(resolve(tmpdir()) + (process.platform === 'win32' ? '\\' : '/')), true);
    await rm(dir, { recursive: true, force: true });
  });
  await cp(join(root, 'src'), join(dir, 'src'), { recursive: true });
  await writeFile(join(dir, 'cases.json'), JSON.stringify([
    { id: 'labeled', source: 'I prefer tea.', candidate: 'The user prefers tea.', expected: 'save' },
    { id: 'unlabeled', source: 'I prefer tea.', candidate: 'The user prefers tea.' }
  ]));
  await writeFile(join(dir, 'mock.mjs'), `
import { questions } from './src/gate.mjs';
let calls = 0;
globalThis.fetch = async () => {
  calls++;
  if (${failSecond} && calls === 2) return new Response('do-not-log-this', { status: 429 });
  const answers = Object.fromEntries(Object.entries(questions).map(([key, q]) => {
    const keys = Object.keys(q.criteria);
    return [key, { type: 'choice', choice: keys[0], confidence: 0.9,
      probabilities: Object.fromEntries(keys.map((k, i) => [k, i === 0 ? 0.9 : 0.05])) }];
  }));
  return new Response(JSON.stringify({ model: 'jev-test', answers,
    usage: { input_tokens: 10, output_tokens: 0 } }));
};
`);
  const run = invoke(['--import', './mock.mjs', 'src/cli.mjs', '--live', '--input', 'cases.json'],
    dir, { TYPESAFE_API_KEY: 'test-only' });
  const folders = await readdir(join(dir, 'runs'));
  assert.equal(folders.length, 1);
  const report = JSON.parse(await readFile(join(dir, 'runs', folders[0], 'report.json'), 'utf8'));
  const markdown = await readFile(join(dir, 'runs', folders[0], 'report.md'), 'utf8');
  assert.equal(JSON.stringify(report).includes('test-only'), false);
  assert.equal((run.stdout + run.stderr).includes('do-not-log-this'), false);
  return { run, report, markdown };
}

test('CLI live pipeline with mocked transport writes correct labeled and unlabeled reports', async t => {
  const { run, report, markdown } = await isolatedRun(t, false);
  assert.equal(run.status, 0, run.stderr);
  assert.equal(report.completed, true);
  assert.equal(report.attemptedCalls, 2);
  assert.equal(report.summary.evaluated, 2);
  assert.equal(report.summary.labeledEvaluated, 1);
  assert.equal(report.summary.matched, 1);
  assert.equal(report.summary.falseSaves, 0);
  assert.match(markdown, /matched 1\/1 labeled/);
});

test('CLI preserves first result and records a later HTTP failure without retrying', async t => {
  const { run, report, markdown } = await isolatedRun(t, true);
  assert.equal(run.status, 1);
  assert.equal(report.completed, false);
  assert.equal(report.attemptedCalls, 2);
  assert.equal(report.summary.evaluated, 1);
  assert.equal(report.results[1].error, 'provider_http_429');
  assert.match(markdown, /provider_http_429/);
});
