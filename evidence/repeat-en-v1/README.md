# English repeatability check

[Home](../../README.md) · [Frozen protocol](PROTOCOL.md) · [Raw repeat responses](report.json) · [Original English run](../holdout-en-v1/README.md)

Two additional passes of the same 20 English cases, frozen in commit 330b11e before calling Jev. No questions, policies or expected labels changed. All 40 additional calls completed without retries.

## Three passes, twenty unique cases

| Pass | Baseline agreement | Preview agreement | Preview intended saves | Preview false saves |
|---|---:|---:|---:|---:|
| 1 | 11/20 | 15/20 | 6/10 | 0/10 |
| 2 | 11/20 | 15/20 | 5/10 | 0/10 |
| 3 | 11/20 | 14/20 | 5/10 | 0/10 |

Across the three passes: baseline 33/60 matches, preview 44/60. Preview saved 16/30 intended memories, missed 14/30, and made 0/30 false saves on non-save observations. These are repeated observations of the same cases, not 60 independent examples. Baseline remains the default.

Preview decisions varied across passes for h02, h11 (2/20 cases); baseline varied for 0/20. In particular, the explanation-format preference h02 saved on the original pass but deferred on repeats; the actor-attribution case h11 skipped on pass 2 but deferred on passes 1 and 3. Aggregate scores can hide different individual decisions.

## Timing and usage

All 60 successful English requests: mean **289 ms**, median **271 ms**, nearest-rank p95 **363 ms**, range 212–706 ms. These are client-observed network request/response times with model jev-1.13.0; not pure model compute, database writes, browser interaction time or a production SLA. Every timing is retained, including first requests.

Total usage across these 60 requests: 41658 input and 7362 output tokens, counted once for the shared responses. Billing was not independently checked. The original Chinese development pilot and ad-hoc UI checks are excluded.

## Limits

The same team authored and labeled these synthetic cases. Repeating them tests observed consistency, not broader coverage or generalization. Zero false saves on these repeated non-save cases is not a safety guarantee. The strongest next evidence would be independently authored cases with labels agreed before model calls. The landing dashboard is generated from the two exact JSON reports with `node scripts/build-study.mjs`; original evidence remains unchanged.
