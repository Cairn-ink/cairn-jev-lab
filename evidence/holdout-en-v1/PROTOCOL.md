# Frozen English follow-up protocol

This protocol and the dataset are committed before the first live call. No results have been seen when selecting the candidate policy.

## Development and selection

Development data: the original 20-case, primarily Traditional Chinese pilot. An offline replay compares thresholds 0, 0.25, 0.40, 0.50, 0.60, 0.75 and 0.90 with exactly the same stored model answers. Candidate `admission-v2-preview` uses **0.40**, the highest tested threshold tied for the best development agreement (16/20) with no false saves. This is development tuning, not confirmation.

Questions, choices, API request structure and decision ordering remain unchanged. Only the confidence threshold differs. The public default stays `admission-v1` (0.75).

## Fresh evaluation

- Dataset: `fixtures/holdout-en-v1.json`, 20 newly authored English cases, not translations of the development set. Ten expected saves, eight skips and two deferrals. The cases reuse failure categories; they are not an independently authored benchmark.
- Source passages explicitly label speakers; both policy arms receive the same inputs.
- Model: request `jev-1.13.0`; record the actual returned model. Do not silently fall back if unavailable.
- One Jev call per case, at most 20 calls, no automatic retries. Expected labels and explanatory notes never reach the provider.
- Apply both policy versions to each identical response. This paired replay isolates the threshold effect without differences from model sampling. It is not two independently sampled model runs.
- Freeze fixture, questions and protocol hashes and record the pre-call Git commit. Retain failures and partial results. Stop on the first request failure.

## Metrics and interpretation

Primary: false-save count and recall of the ten expected saves. Secondary: exact decision agreement, deferrals, latency and provider-reported token usage. Missing/failed results must be visible, not silently removed from denominators.

The candidate merits a larger evaluation if all 20 cases complete, it has zero observed false saves, it recovers at least two more intended saves than baseline, and its exact agreement is no worse. This is a screening criterion on a tiny synthetic set, not permission for autonomous production writes. Any observed false save must be described individually.

Do not tune on this evaluation and continue calling it held out. Do not compare its raw accuracy with the earlier Chinese pilot as evidence of a language advantage or a model improvement. One pass cannot establish calibration or stability. Publish all results regardless of outcome.
