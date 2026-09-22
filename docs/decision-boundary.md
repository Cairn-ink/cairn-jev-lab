# Save, skip or defer: the boundary

[Home](../README.md) · [Executable policy](policy.md) · [Frozen 100-case study](../evidence/coverage-en-v1/README.md)

Status: post-result rubric review, September 22, 2026. This is the project assistant's analysis, not independent human adjudication or a new evaluation. It changes no frozen labels, prompts, policy thresholds, recorded responses or headline scores.

## Judge this candidate, not the entire conversation

The unit of admission is the proposed memory **exactly as written**, supported by the supplied source. Whether more context should be requested is a separate workflow question.

| Outcome | Meaning | Next action a host could take |
|---|---|---|
| Save | This candidate is supported, plausibly useful in a later session and faithful to qualifications, with sufficient assessment confidence. | Consider admitting it, subject to the host's authorization and storage rules. |
| Skip | There is sufficient evidence to reject this candidate as written: it adds unsupported details, contradicts or overstates the source, or is clearly transient. | Exclude this candidate. The host may still request context or propose a different candidate. |
| Defer | No sufficiently confident rejection applies, but at least one judgment is unresolved or below the threshold. | Hold the recommendation for more context or review. |

Neither skip nor defer stores anything here. Skip does not mean the conversation is worthless, the candidate is proven false in the real world, or clarification is forbidden. It only rejects this wording on the available evidence. Defer does not promise an automatic follow-up. The current lab implements no clarification queue, rewriting or database action.

## Missing evidence versus an unresolved assessment

**Missing context does not automatically imply defer.** If the source leaves a slot unknown and the candidate fills it with a specific value, that addition is unsupported. If the candidate itself retains an unresolved reference, judging its future usefulness or interpretation may require deferral. An explicitly uncertain but self-contained, useful statement can instead be saved as uncertain.

These are proposed annotation examples, not newly observed Jev outputs:

| Source | Candidate | Intended outcome and reason |
|---|---|---|
| “Use the usual time for future sessions.” | “Future sessions should be at 9 a.m.” | Skip: 9 a.m. was invented relative to the supplied evidence. |
| “Use the usual time for future sessions.” | “Use the usual time for future sessions.” | Defer: the wording is faithful, but the unresolved time makes its standalone future usefulness uncertain. |
| “Our usual time is 9 a.m. Use it for future sessions.” | “Future sessions should be at 9 a.m.” | Save: the reference is now resolved and the preference is continuing. |
| “We are considering monthly releases; nothing is approved.” | “Monthly releases are approved.” | Skip: increases commitment. |
| Same source | “Monthly releases are under consideration, not approved.” | Save, if useful to ongoing planning: uncertainty is preserved, not a reason by itself to reject memory. |
| “The document says Monday; the email says Tuesday. Neither is confirmed.” | “The official cutoff is Tuesday.” | Skip: claims official certainty the source withholds. |
| Same source | “The cutoff is unresolved: the document says Monday, the email Tuesday.” | Save, if useful to the ongoing project: retains the conflict without choosing a winner. |
| “Hold the elevator for thirty seconds.” | “The user wants the elevator held for thirty seconds.” | Skip: faithful but clearly immediate. |

These are product judgments about useful memory. Independent reviewers may disagree, especially about durability. The model may also return different assessments; an intended outcome is not a guaranteed runtime output.

## Audit of all ten original defer labels

The original rubric treated missing antecedents and unresolved conflicts as reasons to defer. It did not specify precedence when the candidate also added unsupported specificity. This conflicts with the existing model criterion: unsupported includes adding details or overstating certainty. The model's `unclear` criterion, “Insufficient context to decide,” also overlaps without an explicit tie-breaker.

| ID | Unsupported addition in the candidate | Review recommendation for this candidate |
|---|---|---|
| c019 | “that format” becomes “two-column” | Skip |
| c020 | “usual time” becomes “9 a.m.” | Skip |
| c039 | unresolved “they” becomes “the customer” | Skip |
| c040 | unidentified reviewer becomes “lead reviewer,” and a checklist request gains recurring scope | Skip |
| c059 | unspecified prior decision becomes approval of a budget | Skip |
| c060 | unspecified changes become removing the audit log | Skip |
| c079 | unspecified condition becomes traffic over 1,000 requests/minute | Skip |
| c080 | unknown team becomes the analytics team, with a preference assigned to it | Skip |
| c099 | conflicting unconfirmed dates become an official Tuesday cutoff | Skip |
| c100 | unspecified latest version becomes a compact layout | Skip |

On this review, **all ten skips are defensible under candidate-level source fidelity**. That is a defect in the original label design relative to the admission task, not evidence of ten clear semantic model failures. In c039 the model's support choice is still questionable: it chose supported at low confidence; the preview skipped on overstated commitment. Agreement on the final outcome does not validate every subjudgment.

The published 78/100 agreement and 0/10 defer matches remain exactly as originally measured. Do not relabel these cases and advertise an improved score. This post-hoc, same-author review cannot serve as independent validation. The set does not give clean evidence of whether Jev appropriately defers on genuinely unresolved candidate assessments. The 12 missed intended saves are a separate finding and are not repaired by this review.

## Precedence to make explicit in the next rubric

1. Identify the candidate's concrete claims: actor, value, scope, time, conditions and certainty.
2. If a concrete addition, contradiction or overstatement can be identified with sufficient confidence, skip this candidate even if more context could later support a revised evaluation.
3. If the candidate is faithful but clearly only useful for an immediate activity, skip as temporary.
4. Otherwise, if support, status or future usefulness cannot be confidently assessed, defer. Preserving an unresolved reference is one example; source uncertainty alone is not.
5. Save only when the supplied candidate is supported, useful and faithful, with sufficient assessment confidence.

This clarifies the intent of the existing negative-first code order. It does not prove that the provider's confidence is calibrated, or change how the frozen prompts execute. A future wording change must have a new question hash and be evaluated separately.

## Next validation

The [20-pair human review packet](../evidence/boundary-review-v1/README.md) is now prepared without expected labels or model calls. It is awaiting human review; it is not completed independent validation.

Use contrast sets like the examples above: same source with an invented detail versus a preserved unknown, then the same candidate with the missing context supplied. Include faithful uncertain statements, clearly temporary content and ambiguous durability. Freeze intended labels before new calls and have independent reviewers annotate them without seeing model output; record disagreements rather than forcing unanimous labels.

If product requirements call for clarification whenever a reference is absent, model that as a separate host action such as “request context,” which can coexist with rejecting the current wording. Do not overload `defer` to mean both “uncertain assessment” and “the user could provide more information.” This document proposes that separation; no new field or host integration is implemented.
