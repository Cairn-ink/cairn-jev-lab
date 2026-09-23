import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { questions } from '../src/gate.mjs';
const root = new URL('../', import.meta.url);
const text = path => readFile(new URL(path, root), 'utf8');

// Runs web/i18n.js against a page with no tagged elements, as a browser would before first paint.
async function loadStrings() {
  const window = {};
  const document = { title: 'Cairn Jev Lab', documentElement: {}, querySelector: () => null, querySelectorAll: () => [],
    getElementById: () => null, addEventListener() {}, dispatchEvent() {} };
  vm.runInNewContext(await text('web/i18n.js'), { window, document, location: { search: '', href: 'https://lab.cairn.ink/' },
    navigator: { languages: ['en-US'] }, localStorage: { getItem: () => null, setItem() {} }, URL, URLSearchParams, history: {}, CustomEvent: class {} });
  return window.labI18n.strings;
}
const placeholders = value => [...value.matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort();

test('every translatable page element and script string has Traditional Chinese copy', async () => {
  const { en, zh } = await loadStrings();
  const html = await text('web/index.html');
  const pageKeys = [...html.matchAll(/data-i18n="([^"]+)"/g)].map(m => m[1])
    .concat([...html.matchAll(/data-i18n-attr="([^"]+)"/g)].flatMap(m => m[1].split(',').map(pair => pair.split(':')[1])));
  assert.ok(pageKeys.length > 60);
  for (const key of pageKeys) assert.ok(zh[key], `zh-TW is missing page key ${key}`);

  const scripts = (await text('web/app.js')) + (await text('web/dashboard.js'));
  const scriptKeys = [...scripts.matchAll(/\bt\('([^']+)'/g)].map(m => m[1]);
  const dynamic = [...['save', 'skip', 'defer'].flatMap(v => [`verdict.${v}`, `expected.${v}`]),
    ...[...(await text('src/gate.mjs')).matchAll(/reason: '(\w+)'/g)].map(m => `reason.${m[1]}`),
    ...Object.keys(questions).map(key => `judgment.${key}`), 'mode.recorded', 'mode.live', 'study.policy.baseline', 'study.policy.preview'];
  for (const key of [...scriptKeys, ...dynamic]) {
    assert.ok(en[key], `English is missing script key ${key}`);
    assert.ok(zh[key], `zh-TW is missing script key ${key}`);
  }
  for (const [key, value] of Object.entries(en)) {
    assert.ok(zh[key], `zh-TW is missing ${key}`);
    assert.deepEqual(placeholders(zh[key]), placeholders(value), `placeholders differ for ${key}`);
  }

  // Values that come from data rather than code: model choices, study groups and example labels.
  for (const q of Object.values(questions)) for (const choice of Object.keys(q.criteria)) assert.ok(zh[`choice.${choice}`], `zh-TW is missing choice.${choice}`);
  for (const group of JSON.parse(await text('web/study.json')).groups) assert.ok(zh[`group.${group.key}`], `zh-TW is missing group.${group.key}`);
  for (const example of JSON.parse(await text('web/examples.json'))) assert.ok(zh[`example.${example.id}`], `zh-TW is missing example.${example.id}`);
});

test('the language file loads before the scripts that use it', async () => {
  const html = await text('web/index.html');
  const order = ['i18n.js', 'app.js', 'dashboard.js'].map(file => html.indexOf(`src="./${file}"`));
  assert.ok(order.every(i => i > 0));
  assert.deepEqual([...order].sort((a, b) => a - b), order);
});
