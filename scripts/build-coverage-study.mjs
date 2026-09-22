import { readFile, writeFile } from 'node:fs/promises';
import { summarize } from '../src/report.mjs';
import { decide } from '../src/gate.mjs';
const root = new URL('../', import.meta.url);
const report = JSON.parse(await readFile(new URL('evidence/coverage-en-v1/report.json',root)));
const valid=report.results.filter(r=>!r.error), latency=valid.map(r=>r.latencyMs).sort((a,b)=>a-b);
const median=latency.length%2?latency[(latency.length-1)/2]:(latency[latency.length/2-1]+latency[latency.length/2])/2;
const summarizePolicy=(results,p)=>summarize(results.map(r=>r.error?r:{...r,...decide(r.answers,p)}));
const matrix=(results,p)=>Object.fromEntries(['save','skip','defer'].map(expected=>[expected,Object.fromEntries(['save','skip','defer'].map(actual=>[actual,results.filter(r=>!r.error&&r.expected===expected&&decide(r.answers,p).decision===actual).length]))]));
const study={kind:'coverage-100',generatedFrom:['evidence/coverage-en-v1/report.json'],date:report.startedAt.slice(0,10),
 model:[...new Set(valid.map(r=>r.model))].join(', '),uniqueCases:new Set(report.results.map(r=>r.id)).size,
 planned:report.plannedCalls,attempted:report.attemptedCalls,completed:valid.length,errors:report.results.length-valid.length,
 groups:report.fixtures.map(({key,name})=>({key,name})),
 latency:{mean:Math.round(latency.reduce((a,b)=>a+b,0)/latency.length),median,p95:latency[Math.ceil(.95*latency.length)-1],min:latency[0],max:latency.at(-1),values:valid.map(r=>r.latencyMs)},
 policies:report.policies.map(p=>({...p,summary:summarizePolicy(report.results,p),groups:report.fixtures.map(g=>summarizePolicy(report.results.filter(r=>r.group===g.key),p)),confusion:matrix(report.results,p)}))};
await writeFile(new URL('web/study.json',root),JSON.stringify(study,null,2)+'\n');
const [b,p]=study.policies, s=p.summary;
const categories=study.groups.map((g,i)=>`| ${g.name} | ${b.groups[i].matched}/20 | ${p.groups[i].matched}/20 | ${p.groups[i].expectedSaves-p.groups[i].missedSaves}/10 | ${p.groups[i].falseSaves}/10 |`).join('\n');
const confusion=study.policies.map(pol=>`### ${pol.version}\n\n| Expected \\ observed | Save | Skip | Defer |\n|---|---:|---:|---:|\n`+['save','skip','defer'].map(e=>`| ${e} | ${pol.confusion[e].save} | ${pol.confusion[e].skip} | ${pol.confusion[e].defer} |`).join('\n')).join('\n\n');
const escape=s=>s.replaceAll('|','\\|').replaceAll('\n',' ');
const failures=valid.filter(r=>r.decisions[p.version].decision!==r.expected||r.decisions[b.version].decision!==r.expected).sort((a,b)=>a.id.localeCompare(b.id)).map(r=>`| ${r.id} | ${r.expected} | ${r.decisions[b.version].decision} | ${r.decisions[p.version].decision} | ${escape(r.candidate)} | ${escape(r.why)} |`).join('\n');
await writeFile(new URL('evidence/coverage-en-v1/README.md',root),`# 100-case English coverage study

[Home](../../README.md) · [Frozen protocol and labeling rubric](PROTOCOL.md) · [Exact responses](report.json) · [Dataset manifest](../../fixtures/coverage-en-v1/manifest.json) · [Earlier repeatability study](../repeat-en-v1/README.md)

**100 new distinct English cases, one call each.** Five categories with 20 cases each; 50 expected saves, 40 skips and 10 deferrals. These cases and their labels were authored by the project's AI assistant, without external or second-human annotation. They are synthetic coverage examples, not an independent benchmark or a sample of customer traffic.

The fixtures, protocol and runner were frozen in commit **${report.sourceCommit.slice(0,7)}** before calls. Questions, thresholds and labels were not tuned on these results. Both policies use the same response for each case. Actual model: ${study.model}. Completed ${valid.length}/${report.plannedCalls}, errors ${study.errors}; no retries.

## Paired comparison

| Metric | Baseline (0.75) | Preview (0.40) |
|---|---:|---:|
| Exact agreement | ${b.summary.matched}/100 | ${s.matched}/100 |
| Intended saves recovered | ${b.summary.expectedSaves-b.summary.missedSaves}/50 | ${s.expectedSaves-s.missedSaves}/50 |
| Missed saves | ${b.summary.missedSaves}/50 | ${s.missedSaves}/50 |
| False saves | ${b.summary.falseSaves}/50 non-save cases | ${s.falseSaves}/50 non-save cases |
| Save / skip / defer | ${b.summary.saved} / ${b.summary.skipped} / ${b.summary.deferred} | ${s.saved} / ${s.skipped} / ${s.deferred} |

The preview recovered 20 additional intended memories on identical responses, but still missed 12. It produced no observed false saves in this synthetic set. **It also skipped every one of the 10 cases labeled defer.** Baseline matched one of those ten. Non-admission is not the same as correct handling of uncertainty. No default policy is promoted by this result.

## Coverage by category

| Category | Baseline matches | Preview matches | Preview intended saves | Preview false saves |
|---|---:|---:|---:|---:|
${categories}

## Expected versus observed

${confusion}

## What needs work

- **Skip versus defer is a rubric boundary.** In missing-reference cases (for example c019 and c059), our rubric requests more context; the supplied candidate also makes a specific claim not established by the passage, so rejecting it can be a defensible alternative. This is evidence of a mismatch between our desired workflow and the judgments, not proof that every such model judgment is objectively wrong. Preserve these frozen labels and obtain independent label review before redesigning the boundary.
- **Durability loses ongoing context.** c066 (a migration estimate) and c069 (a debugging hypothesis) are skipped as temporary, while several ongoing proposals defer. Our rubric treats these as useful across sessions even though they are not permanent facts.
- **Support and commitment still misfire.** c065 faithfully summarizes a confidential-data rule but is judged unsupported; c002's recurring recipe-unit preference is judged overstated. c085's new checklist owner defers at durability confidence 0.39, just below the preview threshold.
- **This is not a longitudinal improvement over 44/60.** Those were three repeats of 20 other cases. The valid causal policy comparison here is ${b.summary.matched}/100 versus ${s.matched}/100 on these same responses. A larger authored suite can still be easier or biased.

## Every disagreement under either policy

The table includes baseline-only failures as well as preview failures; IDs resolve to the exact inputs, judgments and confidence in the JSON report. Expected labels were not changed after calls.

| Case | Expected | Baseline | Preview | Proposed memory | Pre-call labeling note |
|---|---|---|---|---|---|
${failures}

## Timing, usage and reproduction

Mean **${study.latency.mean} ms**, median **${median} ms**, nearest-rank p95 **${study.latency.p95} ms**, range ${study.latency.min}–${study.latency.max} ms. Client-observed full request/response times include network and first requests. No storage or browser time is measured; no throughput or production SLA is claimed.

Provider-reported usage: ${s.inputTokens} input and ${s.outputTokens} output tokens, counted once across shared responses. Billing was not independently checked. Earlier reports and ad-hoc calls are excluded.

<code>node scripts/coverage.mjs</code> validates the suite without calls. Add <code>--live</code> and load your own environment key to repeat this 100-call experiment; it stops on first error and writes a new report under ignored <code>runs/</code>. <code>node scripts/build-study.mjs</code> regenerates the public dashboard from published evidence without API usage. Hashes preserve fixture, manifest, protocol and question provenance. A new call may produce different output.

## Next experiment

Review the skip/defer boundary with independent human annotators first. Then change one factor (question wording, context completeness or durability definition) on development cases, and evaluate on a separately frozen unseen set. These 100 cases have now been inspected and must not be reused as unseen evidence for a tuned policy. External cases and advisory testing alongside a real memory workflow remain necessary.
`);
console.log(JSON.stringify({latency:study.latency.mean,median,p95:study.latency.p95,groups:study.policies.map(p=>p.groups.map(g=>g.matched))}));
