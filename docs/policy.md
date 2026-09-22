# Admission policy

[Home](../README.md) · [Testing guide](testing.md) · [Source](../src/gate.mjs)

The lab evaluates one source passage and one candidate memory. It does not decide whether the source is true or who is authorized to change a memory store.

## Three judgments

| Field | Options | Meaning |
|---|---|---|
| `support` | `supported`, `unsupported`, `unclear` | Does the source support the entire candidate, including actor, scope, time, negation and uncertainty? |
| `durability` | `durable`, `temporary`, `unclear` | Would this information, if represented faithfully, be useful in a future session? |
| `commitment` | `preserved`, `overstated`, `unclear` | Are proposals, reports, conditions and uncertainty kept in their original form? |

Each field is a TypeSafe Choice question. The provider returns a choice, a probability distribution and a confidence value. The adapter validates the shape, allowed choices, numeric bounds and approximate probability sum. It does not validate semantic correctness.

The candidate can preserve an unadopted proposal or an uncertain preference. "Not adopted" does not automatically mean "not worth remembering." An adopted decision cannot be inferred from a proposal.

## Deterministic decision rule

Policy version: **`admission-v1`**. Provisional minimum confidence: **`0.75`**.

Apply these rules in order:

1. Confident `unsupported` → `skip`, reason `unsupported_candidate`.
2. Confident `overstated` → `skip`, reason `overstated_candidate`.
3. Confident `temporary` → `skip`, reason `temporary_content`.
4. Any remaining low-confidence or `unclear` assessment → `defer`, reason `uncertain_assessment`.
5. Otherwise → `save`, reason `supported_durable_faithful`.

A confident negative is enough to skip a candidate even when another dimension is uncertain. Malformed provider output fails the request; it never becomes `save` or a fabricated model judgment.

The `reason` field is selected by code. It is not a model-generated explanation. The source, candidate and individual answers provide the material for inspection.

## What the threshold means

The threshold is an experimental product choice, not a measured 75% chance of correctness. Choice probability and the provider's separate confidence field are retained separately. No calibration study has been performed for this memory task.

The first pilot missed 7 of 9 intended saves. Changing the threshold after seeing those results may help development, but must be evaluated on fresh cases. Version changes to questions or policy and retain prior results.

## Integration boundary

- `save` recommends admission of the supplied candidate unchanged. It performs no database write.
- `skip` excludes this candidate; it does not delete the source conversation or any existing memory.
- `defer` requests a later or human judgment. It performs no automatic retry or escalation.
- Explicit user-directed saves, authorization, source receipts, namespaces, revision checks, corrections and forgetting belong to the host memory system.
- Source text is untrusted input. Prompt instructions attempt to preserve that boundary; they are not an injection-resistance guarantee.

Start with advisory evaluations alongside your current system. A future Cairn adapter needs its own integration checks and evidence before changing admission behavior.
