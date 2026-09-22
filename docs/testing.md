# Test your own memory policy

[Home](../README.md) · [Policy](policy.md) · [Contributing](../CONTRIBUTING.md)

## Input format

Pass `--input path.json` to preview or evaluate a JSON array. Relative paths are resolved from your current directory. JSON is UTF-8, without a byte-order mark.

| Field | Required | Limit |
|---|---|---|
| `id` | Yes | Unique; 1–64 ASCII letters, digits, underscores or hyphens; starts with a letter or digit |
| `source` | Yes | Nonblank string; at most 4,000 JavaScript string units |
| `candidate` | Yes | Nonblank string; at most 1,000 JavaScript string units |
| `expected` | No | `save`, `skip` or `defer` |
| `why` | No | Local labeling note; at most 1,000 JavaScript string units |

No additional fields are accepted. A file contains 1–20 cases and is at most 200,000 bytes. All cases are validated before any request, including those outside `--limit`. Only `source` and `candidate` go into the model state; the evaluator supplies the same three questions for every case.

Put private cases in the ignored `local-cases/` directory. Reports repeat source text and candidate memories, so review them before sharing. The lab does not redact arbitrary sensitive information in your inputs.

## Commands

```sh
# Validate custom input, no key or network required
node src/cli.mjs --input examples/my-cases.json

# Evaluate up to four cases; load a key from a local file
node --env-file=.env src/cli.mjs --live --input examples/my-cases.json --limit 4

# Preview the exact fixture used by the original, mostly Chinese pilot
node src/cli.mjs --input fixtures/cases.json

# Evaluate the original fixture again (new API usage, new result)
node --env-file=.env src/cli.mjs --live --input fixtures/cases.json
```

The default is `fixtures/english.json`, a new English adaptation of the original cases. It has not been measured with Jev. `fixtures/cases.json` and the first pilot's JSON remain unchanged to preserve the actual evidence. The cases are small development examples; they are not independent held-out samples.

## Reading a report

Each live run writes `runs/<timestamp>/report.json` and `report.md`. Errors stop the run without automatic retries. Both files are updated after each attempted case, preserving completed results if a later request fails.

| Metric | Definition |
|---|---|
| `evaluated` | Cases with valid model output and a policy decision |
| `errors` | Attempted cases without a valid result |
| `labeledEvaluated` | Evaluated cases with an `expected` label |
| `matched` | Labeled cases whose decision equals `expected` |
| `falseSaves` | Labeled cases saved when `expected` was skip or defer |
| `missedSaves` | Labeled cases expected to save but skipped or deferred |
| `saved`, `skipped`, `deferred` | Decision counts across all evaluated cases |
| `meanLatencyMs` | Mean measured request/response time for successful evaluations |
| `inputTokens`, `outputTokens` | Provider-reported totals for successful evaluations; null if unavailable |

Unlabeled examples do not count as matches, mismatches, false saves or missed saves. Failed cases remain visible but are excluded from semantic metrics. Failed requests may still incur charges; the recorded token totals are not an account billing statement.

Reports include fixture and question SHA-256 hashes, policy version, requested model and the version returned for each response. Fixture hashes cover the entire file, even with `--limit`; selected cases are visible in the result list. Exact input bytes, including line endings, affect the fixture hash.

The first historical report predates support for unlabeled cases; all of its cases were labeled. Its original fields and values are preserved.

## Design an informative experiment

1. Write synthetic source/candidate pairs and label the expected action before model calls.
2. Include valid memories as well as traps: actor swaps, temporary instructions, rejected proposals, missing context and uncertainty.
3. Change one factor at a time: question wording, threshold, source representation or model version.
4. Keep development and evaluation cases separate. A translated development case is not automatically a held-out case.
5. Publish all attempted cases, including errors and deferrals, after checking that they are safe to share.

No live API calls run in CI. Offline tests check software behavior with controlled responses; they do not measure Jev's semantic quality.
