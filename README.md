# Cairn Jev Lab

**Test what your AI should remember.**

[![Offline checks](https://github.com/Cairn-ink/cairn-jev-lab/actions/workflows/test.yml/badge.svg)](https://github.com/Cairn-ink/cairn-jev-lab/actions/workflows/test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

[Quick start](#quick-start) · [Bring your own cases](#try-your-own-cases) · [Policy](docs/policy.md) · [Results](evidence/pilot-2026-09-22/notes.md) · [Contributing](CONTRIBUTING.md) · [繁體中文](docs/zh-TW/README.md)

Cairn Jev Lab is an experimental memory admission evaluator. Give it a source passage and a proposed memory. Jev evaluates the evidence; a small, inspectable policy recommends **save**, **skip**, or **defer**.

Use it to test a memory policy before letting it decide what an agent keeps. The lab includes editable cases, a reusable JavaScript entry point, and reports that retain both successful judgments and mistakes. Node.js 22+, no runtime dependencies.

> **Developer preview.** On 20 fresh English cases, the baseline matched 11 expected decisions; an experimental lower threshold matched 15, using the same model responses. It still missed 4 of 10 intended saves. This is a small, team-authored experiment, not a production quality claim.

## Why this exists

A memory can sound plausible while changing what someone actually said:

| Source | Proposed memory | Intended decision |
|---|---|---|
| “I prefer concise answers across conversations.” | “The user prefers concise answers.” | Save |
| “Use English for this reply.” | “The user always prefers English.” | Skip |
| “We might try PostgreSQL; nothing is decided.” | “The team adopted PostgreSQL.” | Skip |
| “Let's do what we discussed earlier.” | “The user approved the original plan.” | Defer |

These are policy examples, not observed model outputs.

This project makes three things inspectable:

- **The standard:** separate source support, future usefulness, and preservation of commitment or uncertainty.
- **The decision:** retain Jev's choices, probabilities and confidence alongside the deterministic policy reason.
- **The tradeoff:** count false saves, missed saves and deferrals against your own expected labels, with per-case latency and token usage.

You supply the source and candidate. The lab does not extract memories, rewrite text, store long-term memory, retrieve it, or delete it. A `save` result is a recommendation, not proof that a claim is true.

## Quick start

Want a visual walkthrough? After cloning, run `node src/server.mjs` and open **http://127.0.0.1:4175/**. Four recorded cases need no key and make no API calls. To evaluate your own text, start with `node --env-file=.env src/server.mjs` instead. The key stays on the local server. See the [playground guide](docs/playground.md).

```sh
git clone https://github.com/Cairn-ink/cairn-jev-lab.git
cd cairn-jev-lab
node --test
node src/cli.mjs
```

The preview validates and displays 20 English development cases. It needs no key, installs nothing, and makes no API calls. The npm equivalents are `npm test` and `npm run preview`.

To run Jev, copy `.env.example` to `.env` and set `TYPESAFE_API_KEY` locally. Then start with the four-case sample:

```sh
node --env-file=.env src/cli.mjs --live --input examples/my-cases.json
```

Run the full English development set:

```sh
node --env-file=.env src/cli.mjs --live --limit 20
```

An existing environment variable works too; omit `--env-file` in that case. To use a key file outside the repo, pass its path to `--env-file`. See [TypeSafe's quick start](https://docs.typesafe.ai/introduction/quickstart) for API access.

## Try your own cases

Create a JSON array like [examples/my-cases.json](examples/my-cases.json):

```json
[
  {
    "id": "language-preference",
    "source": "Please use English in future conversations.",
    "candidate": "The user prefers English replies.",
    "expected": "save"
  }
]
```

`expected` is optional. Include it to measure agreement with your policy; leave it out to inspect recommendations. Expected labels and optional `why` notes are never sent to Jev.

```sh
node src/cli.mjs --input examples/my-cases.json
node --env-file=.env src/cli.mjs --live --input examples/my-cases.json
```

Input files contain 1–20 cases. Every case is validated before any API request. See the [input and report guide](docs/testing.md) for limits and metrics. Use `node src/cli.mjs --help` for options.

## Use from JavaScript

From this checkout:

```js
import { judgeMemory } from './src/index.mjs';

const result = await judgeMemory({
  source: 'We are considering PostgreSQL, but have not decided.',
  candidate: 'The team has adopted PostgreSQL.'
}, { apiKey: process.env.TYPESAFE_API_KEY });

console.log(result.decision); // 'save', 'skip', or 'defer'; model-dependent
console.log(result.reason);   // deterministic policy reason, not generated prose
console.log(result.answers);  // each judgment with probabilities and confidence
```

This makes one real API call. The source and candidate are returned unchanged; no memory store is touched. This repo is not published as an npm package. The API is experimental.

## How decisions work

```mermaid
flowchart LR
  A[Source + candidate] --> B[Jev: three typed judgments]
  B --> C[Versioned admission policy]
  C --> D[Save / Skip / Defer]
  D --> E[Inspectable local report]
```

One request asks three independent Choice questions:

| Dimension | Question |
|---|---|
| Support | Does the source support the candidate without changing actor, scope, time or certainty? |
| Durability | Would this information likely help in a future session? |
| Commitment | Does the candidate preserve proposals, reports, conditions and uncertainty? |

The `admission-v1` policy uses a provisional confidence threshold of `0.75`. A confident negative judgment causes `skip`; remaining uncertain assessments cause `defer`; all three positive, sufficiently confident judgments produce `save`. Confidence is not a guarantee of accuracy. See [the exact rule and its limits](docs/policy.md).

## What we have measured

### Repeatability and response time

We subsequently repeated the same English set twice without changing labels, questions or policies: **20 unique cases, three passes, 60 evaluations**. Preview agreement was 15/20, 15/20 and 14/20; pooled agreement was 44/60 versus baseline 33/60. Preview saved 16/30 intended-save observations and missed 14/30. Two cases changed preview decisions across passes. Repeats are correlated observations, not new independent examples.

Mean client-observed response time was **289 ms**, median **271 ms**, and nearest-rank p95 **363 ms**, including all requests and network time. This is not a production speed guarantee. [Full repeatability evidence](evidence/repeat-en-v1/README.md).

The landing page presents these measured results, per-pass comparisons and response times above **Try it yourself**. `node scripts/build-study.mjs` regenerates the dashboard data and repeatability summary from published responses without API calls. Recorded examples work in a static copy of `web/`; new evaluations require the local server and your own key. See [the playground and distribution guide](docs/playground.md).

### Fresh English comparison

We replayed the original responses offline, selected a preview threshold of `0.40`, and froze the policy and 20 new English cases before calling Jev. Both policies then used the **same 20 responses**, with unchanged questions and `jev-1.13.0`.

| Metric | Baseline: 0.75 | Preview: 0.40 |
|---|---:|---:|
| Matches expected decision | 11 / 20 | 15 / 20 |
| Intended memories saved | 2 / 10 | 6 / 10 |
| False saves among 10 non-save cases | 0 | 0 |
| Deferred | 11 | 7 |

The preview recovered four useful memories, but still missed four. Zero false saves in ten examples is limited evidence. These fresh cases share authors and categories with development cases; they are not an independent benchmark. **Baseline remains the default.**

[Full comparison and failures](evidence/holdout-en-v1/README.md) · [Frozen protocol](evidence/holdout-en-v1/PROTOCOL.md) · [Exact responses](evidence/holdout-en-v1/report.json) · [Offline threshold replay](evidence/threshold-replay-v1/README.md)

To opt into the preview in the CLI, add `--policy admission-v2-preview`. In JavaScript, pass `policyId: 'admission-v2-preview'` in the options object. Run `node scripts/sweep.mjs` to reproduce the offline threshold analysis without API calls.

### Original development pilot

The [first live pilot](evidence/pilot-2026-09-22/notes.md) used 20 synthetic development cases, primarily in Traditional Chinese, on September 22, 2026. The provider returned `jev-1.13.0`.

| Metric | Observed |
|---|---:|
| Matches expected decision | 13 / 20 |
| Saved / skipped / deferred | 2 / 11 / 7 |
| False saves | 0 / 11 cases not expected to save |
| Missed saves | 7 / 9 cases expected to save |
| Mean request latency | 298 ms |

The policy was too conservative on this small set. These results are not a held-out benchmark, a comparison against Cairn or another model, or a production quality claim. The translated development examples in `fixtures/english.json` remain unmeasured. The separate fresh English evaluation uses `fixtures/holdout-en-v1.json`. Translation does not inherit original results.

[Run report](evidence/pilot-2026-09-22/report.md) · [Exact recorded data](evidence/pilot-2026-09-22/report.json)

## Data, cost and reproducibility

- Live runs send source and candidate text to **TypeSafe** and may incur API charges. Preview and offline tests make no network calls.
- A run makes at most 20 requests, sequentially, with a 30-second timeout per request and no automatic retries. It stops on the first error and retains the partial report. This is a request limit, not a billing cap.
- `runs/<timestamp>/` contains `report.json` and `report.md`: inputs, question and fixture hashes, requested and returned model versions, decisions, failures, timing and token usage.
- `.env`, `runs/`, and the suggested `local-cases/` directory are ignored by Git. Keep personal test data there. Only reviewed synthetic evidence belongs in `evidence/`.
- CLI/library requests default to `jev-latest`; the playground defaults to `jev-1.13.0`. Set `JEV_MODEL` to a provider-supported version for repeatable configuration. A repeated call may still produce different results.

## Project scope

This lab explores the decision **before a memory is admitted**. [Cairn Memory](https://github.com/Cairn-ink/cairn-memory) remains responsible for receipts, storage, namespaces, revisions, corrections and forgetting. No integration is active yet.

The memory-gate idea was inspired by [jev-memory](https://github.com/NicolasMontone/jev-memory). This is an independent implementation focused on source support, an explicit defer outcome, and published evaluation evidence. It calls the [TypeSafe API](https://docs.typesafe.ai/introduction/quickstart) directly.

Next experiments: collect independently authored cases, investigate the remaining actor-attribution and durability failures, and compare a durability-only policy with the current three-question policy before proposing a Cairn adapter. Contributions of difficult synthetic cases are welcome; see [CONTRIBUTING.md](CONTRIBUTING.md).

English is the primary documentation language. Translations live in [`docs/zh-TW/`](docs/zh-TW/README.md). Historical source text and recorded results retain their original language.

## License

[MIT](LICENSE). An experimental project by [Cairn](https://github.com/Cairn-ink).
