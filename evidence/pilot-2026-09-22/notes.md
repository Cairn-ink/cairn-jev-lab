# First live pilot: results and interpretation

[Home](../../README.md) · [Recorded report](report.md) · [Exact data](report.json) · [繁體中文](../../docs/zh-TW/pilot-2026-09-22.md)

On September 22, 2026, we made 20 requests to the official TypeSafe API, requesting `jev-latest` and receiving `jev-1.13.0`. There were no retries. Expected labels were written before the calls and were not sent to Jev. These are synthetic development cases, primarily in Traditional Chinese, not a held-out evaluation set.

| Metric | Result |
|---|---:|
| Matches expected decision | 13 / 20 |
| Saved / skipped / deferred | 2 / 11 / 7 |
| Expected to save but not saved | 7 / 9 |
| Not expected to save but saved | 0 / 11 |
| Mean request latency | 298 ms |
| Input tokens | 13,947 |
| Output tokens reported by the provider | 2,455 |

Each case made one HTTP request with three Choice questions. Latency includes connection and network time: the first case took 750 ms; the others took 220–359 ms. This is not a production load test or a model comparison. Token counts are recorded; the billed amount has not been verified.

## What we learned

- The policy rejected the tested examples of overstated adoption, actor confusion, and temporary exceptions presented as permanent rules.
- Preferences for Traditional Chinese, TypeScript and dark mode were deferred. Their choices were `supported` / `durable` / `preserved`, but one or more confidence values were below 0.75. Thresholds, question wording or absent speaker structure may contribute; this run cannot isolate the cause.
- The project preference for pnpm was incorrectly judged `overstated` with confidence 0.87 and skipped. High confidence can still accompany an incorrect choice.
- Whether ongoing project evaluation or uncertain preferences should be saved depends on the product. The expected labels express this experiment's policy, not universal ground truth.

## What to try next

Keep `admission-v1` and every result from this run. Do not rewrite expected labels to improve the score. A subsequent experiment could identify speakers explicitly or compare durability-only decisions with the current three-question policy. Change one factor at a time and evaluate fresh cases for both false and missed saves.

For now, use the lab alongside an existing system to inspect recommendations. It should not directly control Cairn's production memory writes. This repo is not integrated with Cairn and this run used no user memory data.

## Language and provenance

This interpretation has been translated into English. The [original fixture](../../fixtures/cases.json) and `report.json` retain the exact original inputs and outputs. The new [English development cases](../../fixtures/english.json) are an adaptation and have not been evaluated with Jev. The results above must not be attributed to them.
