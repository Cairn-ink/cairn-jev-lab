import { readFile, writeFile } from 'node:fs/promises';
import { summarize } from '../src/report.mjs';
import { decide, policy, previewPolicy } from '../src/gate.mjs';
const root = new URL('../', import.meta.url);
const original = JSON.parse(await readFile(new URL('evidence/holdout-en-v1/report.json', root)));
const repeat = JSON.parse(await readFile(new URL('evidence/repeat-en-v1/report.json', root)));
const results = [...original.results.map(r => ({ ...r, pass: 1 })), ...repeat.results];
const valid = results.filter(r => !r.error);
const latency = valid.map(r => r.latencyMs).sort((a, b) => a - b);
const median = latency.length % 2 ? latency[(latency.length - 1) / 2] : (latency[latency.length / 2 - 1] + latency[latency.length / 2]) / 2;
const study = { generatedFrom: ['evidence/holdout-en-v1/report.json', 'evidence/repeat-en-v1/report.json'],
  date: repeat.startedAt.slice(0, 10), model: [...new Set(valid.map(r => r.model))].join(', '),
  uniqueCases: new Set(results.map(r => r.id)).size, passes: 3, planned: 60, attempted: results.length,
  completed: valid.length, errors: results.length - valid.length,
  latency: { mean: Math.round(latency.reduce((a, b) => a + b, 0) / latency.length), median,
    p95: latency[Math.ceil(.95 * latency.length) - 1], min: latency[0], max: latency.at(-1), values: valid.map(r => r.latencyMs) },
  policies: [policy, previewPolicy].map(p => ({ ...p,
    summary: summarize(results.map(r => r.error ? r : { ...r, ...decide(r.answers, p) })),
    passes: [1, 2, 3].map(pass => summarize(results.filter(r => r.pass === pass).map(r => r.error ? r : { ...r, ...decide(r.answers, p) }))),
    variedCases: [...new Set(results.map(r => r.id))].filter(id => new Set(valid.filter(r => r.id === id).map(r => decide(r.answers, p).decision)).size > 1)
  })) };
await writeFile(new URL('evidence/repeat-en-v1/study.json', root), JSON.stringify(study, null, 2) + '\n');
const examples = [['h01', 'Lasting preference'], ['h13', 'Proposal vs. decision'], ['h19', 'Missing context'], ['h11', 'An attribution failure']].map(([id, label]) => {
  const item = original.results.find(r => r.id === id);
  return { label, ...item, policies: [policy, previewPolicy], mode: 'recorded', recordedAt: original.startedAt };
});
await writeFile(new URL('web/examples.json', root), JSON.stringify(examples, null, 2) + '\n');
const p = study.policies;
const rows = [0, 1, 2].map(i => `| ${i + 1} | ${p[0].passes[i].matched}/20 | ${p[1].passes[i].matched}/20 | ${p[1].passes[i].saved}/10 | ${p[1].passes[i].falseSaves}/10 |`).join('\n');
await writeFile(new URL('evidence/repeat-en-v1/README.md', root), `# English repeatability check\n\n[Home](../../README.md) · [Frozen protocol](PROTOCOL.md) · [Raw repeat responses](report.json) · [Original English run](../holdout-en-v1/README.md)\n\nTwo additional passes of the same 20 English cases, frozen in commit ${repeat.sourceCommit.slice(0, 7)} before calling Jev. No questions, policies or expected labels changed. All ${repeat.attemptedCalls} additional calls completed without retries.\n\n## Three passes, twenty unique cases\n\n| Pass | Baseline agreement | Preview agreement | Preview intended saves | Preview false saves |\n|---|---:|---:|---:|---:|\n${rows}\n\nAcross the three passes: baseline ${p[0].summary.matched}/60 matches, preview ${p[1].summary.matched}/60. Preview saved ${p[1].summary.saved}/30 intended memories, missed ${p[1].summary.missedSaves}/30, and made ${p[1].summary.falseSaves}/30 false saves on non-save observations. These are repeated observations of the same cases, not 60 independent examples. Baseline remains the default.\n\nPreview decisions varied across passes for ${p[1].variedCases.join(', ') || 'no cases'} (${p[1].variedCases.length}/20 cases); baseline varied for ${p[0].variedCases.length}/20. In particular, the explanation-format preference h02 saved on the original pass but deferred on repeats; the actor-attribution case h11 skipped on pass 2 but deferred on passes 1 and 3. Aggregate scores can hide different individual decisions.\n\n## Timing and usage\n\nAll 60 successful English requests: mean **${study.latency.mean} ms**, median **${median} ms**, nearest-rank p95 **${study.latency.p95} ms**, range ${study.latency.min}–${study.latency.max} ms. These are client-observed network request/response times with model ${study.model}; not pure model compute, database writes, browser interaction time or a production SLA. Every timing is retained, including first requests.\n\nTotal usage across these 60 requests: ${p[0].summary.inputTokens} input and ${p[0].summary.outputTokens} output tokens, counted once for the shared responses. Billing was not independently checked. The original Chinese development pilot and ad-hoc UI checks are excluded.\n\n## Limits\n\nThe same team authored and labeled these synthetic cases. Repeating them tests observed consistency, not broader coverage or generalization. Zero false saves on these repeated non-save cases is not a safety guarantee. The strongest next evidence would be independently authored cases with labels agreed before model calls. The archived repeatability summary is generated from the two exact JSON reports with \`node scripts/build-study.mjs\`; original evidence remains unchanged.\n`);
await import('./build-coverage-study.mjs');
