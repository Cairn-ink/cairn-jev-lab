# Boundary annotation study: pre-call protocol

Status: prepared for human review; **no labels finalized and no model calls made**. This is not a completed benchmark and does not change headline dashboard results.

## Dataset and purpose

Twenty new source/candidate pairs in `fixtures/boundary-review-v1.json`. Four three-item contrast families vary unsupported specificity, faithful unresolved references and context completion. Two pairs contrast preserved uncertainty with overstated certainty. Four controls explore explicit recurring preference, clearly transient content and ambiguous durability/scope. Contrast members share source or candidate text intentionally; count 20 pairs, not 20 independent scenarios. Order is deterministically interleaved by SHA-256 of suite name plus case ID.

The AI assistant authored the cases. They contain no expected labels, and must not be presented as externally authored. Prior cases and observed model responses informed the design. This is development of the annotation standard, not a blind test of the author's hypothesis.

## Human phase before model phase

Prefer two humans independently assigning save/skip/defer, a short rationale and a separate rubric-ambiguity flag. They receive the same guide and source/candidate pairs without model outputs or an answer key. Preserve each initial submission unchanged. Record whether they saw other labels or model outputs; pseudonyms are sufficient. Self-declaration documents provenance but is not an identity-verification mechanism.

If only one human participates, clearly call the result single-reviewer annotation; do not calculate or claim inter-rater agreement. If no human participates, remain at prepared/unreviewed status. Do not substitute another AI judgment and describe it as independent human review.

With two submissions, report raw agreement and class-by-class disagreements before discussion. Any adjudication must be explicitly human-confirmed, recorded with a reason, and completed before Jev calls. If an item remains disputed, keep it marked disputed and exclude it from a consensus headline while reporting its model behavior separately. Do not silently discard it. Changes to the rubric require a new rubric version and renewed annotation before evaluation.

Freeze the original fixture, guide, individual label artifacts, any adjudicated labels and this protocol with hashes and a Git commit before model evaluation. Human private submissions remain local/ignored unless publication is explicitly authorized. Publish only authorized, de-identified summaries; do not commit reviewer names or private comments by assumption.

## Future model phase

After the human phase is complete, use the unchanged three questions and both existing policies with `jev-1.13.0`: one shared response per case, at most 20 sequential calls, no retries, stop on first error and retain partial results. Only source and candidate go to the provider. A separate runner/report will record all frozen provenance; do not run the unlabeled fixture now and show predictions to annotators.

Primary outcome: agreement with reviewed labels on skip versus defer, broken down by contrast family; also publish saves, false saves, missed saves and all disagreements. Human ambiguity and disagreement are outcomes, not noise to erase. Report model subjudgments separately where they conflict with the final decision. Timing is descriptive only. Keep this study separate from the frozen 100-case results; no retroactive score changes or default-policy promotion.
