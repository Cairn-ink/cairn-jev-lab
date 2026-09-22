# Research direction: memory admission before storage

Our immediate research question is whether a typed decision model can reduce the latency and cost of source-grounded memory admission without unacceptable false saves or missed useful memories. The [comparison study](../evidence/comparison-v1/README.md) separates offline findings, planned live baselines and downstream QA.

## Related work

| Work | Relevant question | How this lab differs |
|---|---|---|
| [MemoryBank (2023)](https://arxiv.org/abs/2305.10250) | How should memories strengthen or decay over time? | We currently evaluate individual write recommendations, not temporal retention. |
| [Mem0 (2025)](https://arxiv.org/abs/2504.19413) | How can extraction, consolidation and retrieval improve persistent conversational memory? | We isolate admission; we do not reproduce a complete memory system. |
| [EGMW (2026)](https://ieeexplore.ieee.org/document/11605481/) | Can utility, consistency and evidence sufficiency govern writes? | This is close prior art. Our current gate tests support, durability and preserved commitment; it does not compare against an existing memory store. |
| [SAGE (2026)](https://arxiv.org/abs/2605.30711) | Can novelty and redundancy route easy writes before expensive LLM merging? | A useful direction for cascade baselines, not an implemented feature here. |
| [GovMem (2026)](https://arxiv.org/abs/2607.02579) | Should correlated agent observations be promoted, rejected or reviewed? | Its provenance and counterevidence analysis goes beyond our single-source cases. Its external difficulties motivate explicit failure reporting. |
| [AdaMem (2026)](https://arxiv.org/abs/2606.21144) | Should memory-writing policy adapt to user context and feedback? | We use a fixed policy, so personalization remains an open question. |
| [jev-memory](https://github.com/NicolasMontone/jev-memory) | How can Jev select writes, retrieved memories and evictions without rewriting text? | This engineering implementation inspired the gate; our focus is evaluation evidence. |
| [Aera's Jev recall study (September 2026)](https://aerabrowser.com/news/agent-memory-doesnt-need-a-generator-typesafes-jev-vs-llm-on-400-real-tasks) | Can Jev replace an LLM selecting memories from a candidate pool? | It evaluates read-time selection; our comparative pilot targets write-time admission. Its reported measurements are not our results. |

TypeSafe [announced Jev on September 15, 2026](https://typesafe.ai/blog/introducing-system-one-models-and-jev). Memory admission has earlier research precedents; using Jev does not make the concept itself novel. The contribution we aim to build is a reproducible comparison with explicit labels, thresholds, failure modes and downstream consequences.

## What the next experiment can establish

1. **Within-suite policy tradeoffs:** same candidates, same expected labels, different admission rules. Historical replay already supports this narrow comparison.
2. **A measured model comparison:** a live paired Jev/LLM run is needed before comparing their errors, response time or token usage. One small LLM is a baseline, not the entire model market. Generated confidence is not automatically calibrated.
3. **A downstream mechanism check:** a fixed reader answers follow-up probes from the memories each policy admits. The initial exact-match multiple-choice pilot tests whether bad admissions propagate and missed admissions remove needed information. It does not establish general conversational benefit.

The original ten defer labels remain disputed. Main results preserve them; sensitivity analysis excludes that class transparently rather than assigning convenient new labels. A larger independent evaluation would need independently authored cases, label adjudication, distinct development and test sets, confidence intervals, repeated calls, richer multi-memory sessions and downstream tasks with meaningful utility costs.
