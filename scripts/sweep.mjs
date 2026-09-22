import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { decide } from '../src/gate.mjs';
import { summarize } from '../src/report.mjs';

const original = await readFile(new URL('../evidence/pilot-2026-09-22/report.json', import.meta.url), 'utf8');
const report = JSON.parse(original);
const thresholds = [0, 0.25, 0.4, 0.5, 0.6, 0.75, 0.9];
const results = thresholds.map(minConfidence => {
  const cases = report.results.filter(r => !r.error).map(r => ({ ...r,
    ...decide(r.answers, { minConfidence }) }));
  return { minConfidence, summary: summarize(cases),
    cases: cases.map(r => ({ id: r.id, expected: r.expected, decision: r.decision, reason: r.reason })) };
});
const misses = report.results.filter(r => r.expected === 'save' && r.decision !== 'save').map(r => ({
  id: r.id, candidate: r.candidate,
  cause: ['support', 'durability', 'commitment'].every(k =>
    r.answers[k].choice === { support: 'supported', durability: 'durable', commitment: 'preserved' }[k])
    ? 'positive_choices_below_threshold' : 'negative_or_unclear_model_choice',
  choices: Object.fromEntries(Object.entries(r.answers).map(([k, v]) => [k, { choice: v.choice, confidence: v.confidence }]))
}));
const output = { kind: 'offline-development-replay', apiCalls: 0,
  sourceReportSha256: createHash('sha256').update(original).digest('hex'), results, misses };
const directory = new URL('../evidence/threshold-replay-v1/', import.meta.url);
await mkdir(directory, { recursive: true });
await writeFile(new URL('report.json', directory), JSON.stringify(output, null, 2) + '\n');
const rows = results.map(r => `| ${r.minConfidence} | ${r.summary.matched}/20 | ${r.summary.falseSaves} | ${r.summary.missedSaves}/9 | ${r.summary.deferred} |`);
await writeFile(new URL('README.md', directory), `# Threshold replay\n\nOffline replay of the original 20 development cases. **Zero API calls.** The recorded Jev choices and confidences are unchanged; only the deterministic confidence threshold changes. This is tuning on known data, not new evaluation evidence.\n\n| Threshold | Matches | False saves | Missed saves | Deferred |\n|---|---|---|---|---|\n${rows.join('\n')}\n\nOf the seven original missed saves, ${misses.filter(r => r.cause === 'positive_choices_below_threshold').length} had three positive choices but insufficient confidence; ${misses.filter(r => r.cause !== 'positive_choices_below_threshold').length} had a negative or unclear choice. Lowering a threshold cannot fix a wrong choice and can turn uncertainty into rejection.\n\nSee report.json for every decision and per-case diagnosis. Run: node scripts/sweep.mjs. Original inputs and responses remain unchanged.\n`);
console.log(JSON.stringify(results.map(({ minConfidence, summary }) => ({ minConfidence, ...summary })), null, 2));
console.log(JSON.stringify(misses.map(({ id, cause }) => ({ id, cause }))));
