# Fresh English follow-up

[Home](../../README.md) · [Frozen protocol](PROTOCOL.md) · [Full responses](report.json) · [Development replay](../threshold-replay-v1/README.md)

The protocol, cases and candidate policy were frozen in commit `5a355da` before any live calls. We made 20 calls to `jev-1.13.0` on September 22, 2026. Each response was evaluated with both thresholds; this is a paired policy comparison, not two independent model runs.

| Metric | Baseline: 0.75 | Preview: 0.40 |
|---|---:|---:|
| Matches expected decision | 11 / 20 | 15 / 20 |
| Intended saves recovered | 2 / 10 | 6 / 10 |
| Missed saves | 8 / 10 | 4 / 10 |
| False saves | 0 / 10 non-save cases | 0 / 10 non-save cases |
| Saved / skipped / deferred | 2 / 7 / 11 | 6 / 7 / 7 |

All 20 calls completed without retries. Mean request latency was 300 ms; provider-reported usage was 13,886 input and 2,454 output tokens. These totals are shared by both policies, not doubled. The actual returned model was `jev-1.13.0` throughout. Billing was not independently checked.

## Interpretation

Lowering the threshold recovered four intended saves: timezone, explanation format, decaf preference and a rejected architecture option. The preview passed the predeclared screening criterion for a larger evaluation: zero observed false saves, at least two additional intended saves, and no reduction in exact agreement.

This small synthetic sample does **not** justify replacing the default policy or permitting automatic production writes. We keep the default at `admission-v1`; `admission-v2-preview` is explicitly opt-in. The cases were authored by the same project, use familiar failure categories and are not an independent benchmark. Their English wording and explicit speaker labels differ from the earlier Chinese development cases. Do not compare 15/20 here with 13/20 there as a causal improvement; the valid paired comparison is **11/20 versus 15/20 on these same responses**.

## Remaining failures

| Case | Expected | Both policies | Observation |
|---|---|---|---|
| h04 | Save | Defer | Regression-test rule: low support confidence and a low-confidence `overstated` choice. |
| h07 | Save | Defer | Contributor office hours proposal: `temporary` at confidence 0.34. Our label treats ongoing proposals as useful context. |
| h09 | Save | Defer | Tentative release-note preference: durability confidence 0.13. |
| h10 | Save | Defer | Metric documentation convention: commitment confidence 0.28. |
| h11 | Skip | Defer | Actor mix-up: model choices were positive, but confidence prevented a false save. |

The actor case is important: even with explicit speakers, the model can favor an unsupported candidate. Confidence gating helped in this instance; neither confidence nor typed output proves correctness. We did not change the questions or thresholds after inspecting these results.

## Next evidence needed

Use independently contributed cases, especially attribution and tentative-but-useful memories. Agree on expected labels before calls. A separate future experiment can test speaker representation or simplify the overlapping support/commitment questions; this evaluation must no longer be treated as unseen data after such changes. Repeat runs are needed before claiming stability or calibration.

The local playground can replay selected cases without a key, compare both policies on the same response, or send your own case to Jev. Recorded examples are labeled separately from live responses.
