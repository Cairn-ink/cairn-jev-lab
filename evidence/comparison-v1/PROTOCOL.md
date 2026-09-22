# Comparative admission and downstream pilot v1

## Questions

1. On identical source/candidate pairs, how do save-all, a deterministic text rule, a small general-purpose LLM and Jev differ?
2. What tradeoff exists between false saves, missed saves and unresolved assessments?
3. With the reader held fixed, do different admitted memories change subsequent answers?

## Evidence separation

The offline stage reuses all 100 exact responses in `evidence/coverage-en-v1/report.json`. It makes no API calls, preserves all original labels, and cannot establish current cross-provider speed or cost advantages. Rule v1 is a transparent, deliberately limited lexical baseline authored after the original study; it is not an optimized system or an unseen-data evaluation.

The optional live stage reruns Jev and the LLM on all 100 identical pairs in deterministic interleaved order. Old metrics remain historical. The 10 originally labeled defer cases remain in the primary results; a separate 90-case sensitivity table excludes that entire class because its labels were questioned in the boundary audit. Exclusion is not correction, and the sensitivity table cannot evaluate appropriate deferral. No results are rescored to advertise an improvement.

## Frozen comparison

- Jev: `jev-1.13.0`, original three questions from `src/gate.mjs` unchanged.
- LLM gate and downstream reader: `qwen/qwen3-8b` through OpenRouter, temperature 0, JSON object output, `/no_think` requested. This is one small instruction-tuned LLM comparator, not representative of all LLMs. No automatic model fallback or alternate-model retry. Providers must allow the request with data collection denied; price routing ceilings are $1/M input and $2/M output tokens. These ceilings are routing filters, not a billing cap. A different model requires a new protocol/version.
- LLM judgments use the same criteria and deterministic gate at 0.75 and 0.40. Its confidence and probabilities are generated estimates, not measured token probabilities or demonstrated calibration, and are not assumed comparable to Jev confidence.
- Save-all always recommends save. `rules-v1` checks a fixed set of transient/scope markers, then literal normalized containment; other cases defer. The code reads only source and candidate.
- Thresholds: 0, .1, .2, .3, .4, .5, .6, .7, .75, .8, .9, 1. Sweeps are descriptive reuse of responses, not a newly selected or validated operating threshold. Report false saves/non-save labels, missed saves/save labels, save precision, save recall, defer share, and resolved coverage/error; zero denominators are null, not 100%.
- Original synthetic labels were AI-authored. No new independent human-labeling result is claimed.

## Downstream probe design

`fixtures/downstream-v1.json` contains 20 AI-authored multiple-choice follow-up probes: two expected-save and two expected-skip source cases in each of five categories. They were selected to illustrate mechanisms after original Jev results were public, not sampled as an independent benchmark. The follow-up keys are frozen before reader calls. They are not the independent human boundary-review packet.

Each probe is a separate session with one memory opportunity. Eight arms: no-memory, source-reference, save-all, rules, Jev .75/.40 and LLM .75/.40. Only saved candidates are presented. Skip and defer both withhold the candidate; there is no rewriting, recovery, retrieval, memory updating, interactive clarification or escalation. Source-reference supplies the original source as a privileged-context diagnostic control, not a feasible gate or guaranteed upper bound.

The same reader, question, option order and system prompt are used for all arms. Ordinary arms see only a candidate or an empty memory list, never the source, expected gate label, rationale, policy name or correct answer. Source-reference is the explicitly separate exception. Identical reader requests are cached once within a run and their results shared between arms; thus up to three calls per probe (empty, candidate, source), 60 total. Arm rows are paired observations, not 160 independent calls. Calls are ordered by a fixed SHA-256 seed. Temperature zero is not a determinism guarantee.

Scoring is exact option equality against the frozen key; no LLM judge. Report correct substantive answers, justified unknowns, missed answers (unknown when the source establishes an answer), and wrong substantive answers separately. Two probes intentionally have gold `unknown`; no-memory can therefore obtain nonzero accuracy. This is a constrained follow-up QA pilot, not proof of free-form conversational or production task improvement.

## Execution and recording

Default `node scripts/compare.mjs` is offline. `--live` requires both keys, permits at most 100 Jev + 100 LLM gate + 60 reader calls, and stops on the first transport, validation or output error without automatic retry. Jev timeout 30s; LLM timeout 60s; maximum output 700 tokens for gate calls and 120 for readers. Calls are sequential. Keys are never persisted, and HTTP errors never persist provider bodies. Reports preserve failures, request hashes, model/provider names, usage and client latency. Interrupted runs remain partial and must not be presented as complete or merged invisibly with a restart.

Before live calls, record the Git commit and hashes of this protocol, probes, historical report, criteria, prompts and runner source. Check that those files are committed. The script writes an initial ledger before calling either service, checkpoints after every attempt, and stores results under ignored `runs/`. Only reviewed synthetic results may be copied into evidence. LLM reported cost is retained when supplied; missing costs stay null. No Jev-vs-LLM speedup is inferred from an archived replay.

## Research context

This pilot draws on questions raised by [EGMW](https://ieeexplore.ieee.org/document/11605481/), [SAGE](https://arxiv.org/abs/2605.30711), [GovMem](https://arxiv.org/abs/2607.02579), [AdaMem](https://arxiv.org/abs/2606.21144), and [Aera's Jev recall experiment](https://aerabrowser.com/news/agent-memory-doesnt-need-a-generator-typesafes-jev-vs-llm-on-400-real-tasks). It does not reproduce their systems or claim comparable benchmark scores. OpenRouter [chat API](https://openrouter.ai/docs/api/api-reference/chat/create-a-chat-completion) and [model reference](https://openrouter.ai/qwen/qwen3-8b) informed the adapter.
