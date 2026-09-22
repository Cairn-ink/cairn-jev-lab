# Jev / Luna admission and downstream pilot v1

This protocol supersedes only the unexecuted live portion of [comparison-v1](../comparison-v1/PROTOCOL.md). The project owner selected OpenAI Luna before any comparison inference. The original offline evidence and Qwen/OpenRouter protocol remain archived unchanged. No Qwen or GPT-4.1 comparison was run.

## Fixed questions and evidence

Compare save-all, rules-v1, Jev and Luna on the same original 100 source/candidate pairs, then measure their consequences for the same 20 follow-up probes. All original AI-authored labels stay unchanged. Primary admission results retain 50 save / 40 skip / 10 defer labels. A separate 90-case sensitivity analysis excludes the entire disputed defer class; it is not relabeling and cannot establish appropriate deferral.

The fixed questions, deterministic gate and rule baseline come from `src/gate.mjs` and `src/comparison.mjs`. Both models receive the same source/candidate and three criteria: support, durability and commitment. They do not receive expected labels or rationales. Report false saves / non-save labels, missed saves / save labels, deferred cases, save precision/recall and resolved coverage/error. Missed saves include deferred save cases. Undefined ratios remain null.

## Model and request settings

- Jev: `jev-1.13.0`, unchanged TypeSafe endpoint, questions and validation; 30-second timeout.
- LLM gate and reader: `gpt-5.6-luna` via OpenAI's Chat Completions endpoint, `reasoning_effort: none`, temperature 0, strict JSON Schema, `store: false`, no tools, no streaming. Limit 700 output tokens per gate and 120 per reader; timeout 60 seconds. The schema constrains structure, not judgment correctness. The Qwen-specific `/no_think` marker is removed; criteria and other prompt content are unchanged.
- Luna is an explicitly selected low-latency configuration, not a claim about its best attainable quality. The documented model ID has no dated snapshot listed at preparation time; record the returned model name and run dates. Temperature 0 does not ensure repeatability. `store: false` does not imply a zero-retention account policy.
- Use the same deterministic thresholds .75 and .40 for both models. Generated LLM confidence/probabilities are self-reported estimates, not token probabilities or validated calibration. Equal numeric thresholds do not imply equal uncertainty. Sweeps at 0, .1, .2, .3, .4, .5, .6, .7, .75, .8, .9 and 1 are descriptive; do not promote a new default from this data.
- No automatic retries, fallback model or provider switching. Stop on the first transport or validation failure. Preserve partial runs separately; do not invisibly combine them with restarts.

## Paired execution

Rerun 100 Jev and 100 Luna gate calls in case order, alternating which model goes first. All calls are sequential. Report mean, median and p95 end-to-end client latency, plus input/output and cached/reasoning token counts where available. Tokenization and response mechanisms differ, so these are workload measurements, not architecture-only speed or compute comparisons. Each response is reused at both thresholds.

Maximum: 100 Jev + 100 Luna gate + 60 Luna reader calls. Before any inference, commit this protocol, runner, prompts, adapter, scoring logic, original evidence and probes. The runner hashes those files and records the Git commit. It writes an initial ledger and checkpoints every attempt into ignored `runs/`. It records the exact credential-free request body and its hash. Secrets, headers and provider error bodies are never persisted. A preliminary read-only model-access request is outside inference counts and has no generated output.

OpenAI cost is an estimate from usage, not a billing receipt: standard short-context list rates checked on 2026-09-22 are $0.20/M input, $0.02/M cached input and $1.20/M output. Cache-write pricing, service-specific adjustments and taxes can differ. Actual billed cost stays unknown unless supplied by the provider. Jev billing is not inferred from OpenAI rates.

## Downstream design and scoring

Reuse exactly `fixtures/downstream-v1.json`: 20 AI-authored multiple-choice questions, two expected-save and two expected-skip candidates per category. They were selected after historical Jev results were visible, so this is a mechanism pilot, not an independent benchmark. Two answer keys are `unknown`.

Each session has one memory opportunity. Eight arms: no-memory, original-source reference, save-all, rules, Jev .75/.40 and Luna .75/.40. Ordinary readers receive only saved candidates or an empty memory list. Skip and defer both withhold a candidate. Only the source-reference control sees the original source; it is a privileged diagnostic, not a guaranteed upper bound or deployable admission policy. No rewriting, retrieval, memory update, clarification or escalation is evaluated.

Hold reader model, prompt, question and options fixed across arms. Execute empty/candidate/source once per question, in deterministic SHA-256 order, then share identical reader results between arms: 60 actual calls and 160 paired arm rows, not 160 independent samples. Exact option matching distinguishes correct substantive answers, justified unknowns, missed answers and wrong substantive answers. No model judge is used. Missing outputs remain errors. This does not establish free-form or production memory quality.

## Reproduce

`node scripts/compare-openai.mjs` checks preparation without API calls.

`node --env-file=.env scripts/compare-openai.mjs --live` requires `TYPESAFE_API_KEY` and `OPENAI_API_KEY`. Keys stay local. Review completed synthetic reports before copying them into public evidence.

Official references: [Luna model](https://developers.openai.com/api/docs/models/gpt-5.6-luna), [Chat Completions API](https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create), [structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs). Related work remains in [research directions](../../docs/research-directions.md).
