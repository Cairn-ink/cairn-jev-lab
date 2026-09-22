# Frozen 100-case coverage protocol

## Purpose and provenance

Evaluate 100 newly authored English source/candidate pairs once each under the existing `admission-v1` (0.75) and `admission-v2-preview` (0.40) policies. This extends scenario coverage, not repeated-call stability. Do not pool these cases with the earlier 20-case English study, its repeats, or the Chinese development pilot.

These are agent-authored synthetic cases and labels prepared for this project, informed by the earlier failure categories. No external contributor or second human annotator has reviewed them. They are fresh inputs relative to prior runs, but not an independently authored or blinded benchmark. Some share related patterns; 100 distinct passages do not imply 100 independent real-world samples.

The manifest in `fixtures/coverage-en-v1/manifest.json` specifies five groups of 20: preference/scope, speaker/attribution, proposal/decision, conditions/uncertainty, updates/corrections. Each group has 10 intended saves, 8 skips and 2 deferrals: 50/40/10 overall. Files, labels, rubric, questions and this protocol are committed before any calls. No post-result changes to expected labels or policy for this report.

## Label rubric

- Save: supported information with plausible use in later sessions. Keep scope, actor, uncertainty, time and conditions. An ongoing proposal, rejected option, attributed report, or working hypothesis may be useful without being an adopted or verified fact.
- Skip: an explicit contradiction, wrong actor, unjustified expansion of certainty/scope, or clearly immediate one-off content. A faithful sentence can still be temporary.
- Defer: essential reference/context is absent, or competing sources cannot be resolved from the passage. Our expected label treats missing antecedents as uncertainty rather than a definitive contradiction. This boundary is an authored product preference, not objective ground truth.
- Explicit corrections supersede earlier values; reported claims must retain attribution. Fictional and quoted text does not become a personal user fact. All names, codes, projects and details are fictional.

## Execution

Pin `jev-1.13.0`, record actual returned model, and leave the three existing questions unchanged. One sequential API call per case, at most 100; no retries, stop on first error and preserve partial results. Only source and candidate enter model state, never expected labels, notes or category. Order cases by SHA-256 of `coverage-en-v1:` plus case ID to interleave categories deterministically.

Record pre-call Git commit, all fixture/manifest/protocol/question SHA-256 hashes, every attempted input/response, timing, token usage and errors. Apply both policy versions to each identical response. Costs belong to 100 calls, not 200. The dedicated runner is bounded to this manifest; the ordinary CLI remains limited to 20 cases per run.

## Analysis and publication

Primary: false saves out of the 50 expected non-saves and recovered saves out of 50 expected saves. Secondary: exact agreement, skips, deferrals, confusion matrices and results per category. Include every disagreement, not only attractive examples. Distinguish failed/unevaluated cases from semantic mistakes.

Report client-observed mean, median, nearest-rank p95, range and token totals; include first/slow requests. These include network latency, not storage, browser interaction or production throughput. A single pass does not establish repeatability or confidence calibration.

Publish even if the preview worsens or false saves appear. Do not change the default policy. Once results are inspected, these cases are development evidence for future changes; further tuning must be evaluated on new unseen cases. Independent human labeling, outside contributions and real-world advisory evaluation remain future work.
