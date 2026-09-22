# 100-case English coverage study

[Home](../../README.md) · [Frozen protocol and labeling rubric](PROTOCOL.md) · [Exact responses](report.json) · [Dataset manifest](../../fixtures/coverage-en-v1/manifest.json) · [Earlier repeatability study](../repeat-en-v1/README.md)

**100 new distinct English cases, one call each.** Five categories with 20 cases each; 50 expected saves, 40 skips and 10 deferrals. These cases and their labels were authored by the project's AI assistant, without external or second-human annotation. They are synthetic coverage examples, not an independent benchmark or a sample of customer traffic.

The fixtures, protocol and runner were frozen in commit **55a5e2b** before calls. Questions, thresholds and labels were not tuned on these results. Both policies use the same response for each case. Actual model: jev-1.13.0. Completed 100/100, errors 0; no retries.

## Paired comparison

| Metric | Baseline (0.75) | Preview (0.40) |
|---|---:|---:|
| Exact agreement | 59/100 | 78/100 |
| Intended saves recovered | 18/50 | 38/50 |
| Missed saves | 32/50 | 12/50 |
| False saves | 0/50 non-save cases | 0/50 non-save cases |
| Save / skip / defer | 18 / 49 / 33 | 38 / 54 / 8 |

The preview recovered 20 additional intended memories on identical responses, but still missed 12. It produced no observed false saves in this synthetic set. **It also skipped every one of the 10 cases labeled defer.** Baseline matched one of those ten. Non-admission is not the same as correct handling of uncertainty. No default policy is promoted by this result.

## Coverage by category

| Category | Baseline matches | Preview matches | Preview intended saves | Preview false saves |
|---|---:|---:|---:|---:|
| Preference & scope | 11/20 | 15/20 | 7/10 | 0/10 |
| Speaker & attribution | 15/20 | 17/20 | 9/10 | 0/10 |
| Proposal & decision | 12/20 | 17/20 | 9/10 | 0/10 |
| Conditions & uncertainty | 11/20 | 13/20 | 5/10 | 0/10 |
| Updates & corrections | 10/20 | 16/20 | 8/10 | 0/10 |

## Expected versus observed

### admission-v1

| Expected \ observed | Save | Skip | Defer |
|---|---:|---:|---:|
| save | 18 | 0 | 32 |
| skip | 0 | 40 | 0 |
| defer | 0 | 9 | 1 |

### admission-v2-preview

| Expected \ observed | Save | Skip | Defer |
|---|---:|---:|---:|
| save | 38 | 4 | 8 |
| skip | 0 | 40 | 0 |
| defer | 0 | 10 | 0 |

## What needs work

- **Skip versus defer is a rubric boundary.** In missing-reference cases (for example c019 and c059), our rubric requests more context; the supplied candidate also makes a specific claim not established by the passage, so rejecting it can be a defensible alternative. This is evidence of a mismatch between our desired workflow and the judgments, not proof that every such model judgment is objectively wrong. Preserve these frozen labels and obtain independent label review before redesigning the boundary.
- **Durability loses ongoing context.** c066 (a migration estimate) and c069 (a debugging hypothesis) are skipped as temporary, while several ongoing proposals defer. Our rubric treats these as useful across sessions even though they are not permanent facts.
- **Support and commitment still misfire.** c065 faithfully summarizes a confidential-data rule but is judged unsupported; c002's recurring recipe-unit preference is judged overstated. c085's new checklist owner defers at durability confidence 0.39, just below the preview threshold.
- **This is not a longitudinal improvement over 44/60.** Those were three repeats of 20 other cases. The valid causal policy comparison here is 59/100 versus 78/100 on these same responses. A larger authored suite can still be easier or biased.

## Every disagreement under either policy

The table includes baseline-only failures as well as preview failures; IDs resolve to the exact inputs, judgments and confidence in the JSON report. Expected labels were not changed after calls.

| Case | Expected | Baseline | Preview | Proposed memory | Pre-call labeling note |
|---|---|---|---|---|---|
| c001 | save | defer | save | The user wants text descriptions alongside charts in future answers. | An explicit continuing accessibility preference. |
| c002 | save | defer | skip | The user prefers recipe quantities in grams. | A recurring domain-specific preference. |
| c003 | save | defer | save | The user normally works Tuesday through Saturday. | Stable scheduling context, with normality preserved. |
| c004 | save | defer | save | The user prefers Java examples by default for coding discussions. | Explicit default with an exception. |
| c006 | save | defer | save | Atlas commit subjects should stay under 60 characters. | A persistent project convention. |
| c007 | save | defer | defer | The user wants customer support drafts without emoji. | An enduring preference limited to one domain. |
| c010 | save | defer | defer | The user wants unfamiliar abbreviations defined on first use in tutorials. | An explicit durable explanation preference. |
| c019 | defer | skip | skip | The user prefers a two-column report format. | Referenced format is absent; cannot resolve it. |
| c020 | defer | skip | skip | The user wants future sessions at 9 a.m. | The usual time is not specified. |
| c024 | save | defer | save | The user prefers editable documents. | Explicit correction of speaker attribution. |
| c025 | save | defer | save | According to the onboarding guide, new contributors should pair with a maintainer on their first change. | Preserves the documentary source. |
| c028 | save | defer | save | Lumen requires SVG exports for design deliveries. | Client-specific requirement remains client-specific. |
| c029 | save | defer | defer | The workshop facilitator requested anonymous feedback in every session. | Preserves who requested the ongoing practice. |
| c039 | defer | defer | skip | The customer wants future updates on Fridays. | Identity of they is missing. |
| c040 | defer | skip | skip | The lead reviewer wants a checklist for future reviews. | The actor and recurring scope cannot be resolved. |
| c041 | save | defer | save | Project Birch will use SQLite for its local cache. | A confirmed and scoped technical decision. |
| c042 | save | defer | save | A monthly release train is under consideration, not approved. | A continuing proposal worth retaining with uncertainty. |
| c043 | save | defer | save | The team rejected a billing-service rewrite due to migration risk. | An explicit rejected option and rationale. |
| c045 | save | defer | save | The team plans a six-week pilot of asynchronous standups, with permanent adoption undecided. | Multi-session trial, not permanent adoption. |
| c046 | save | defer | defer | The office move is postponed pending lease review. | Durable project status with condition. |
| c048 | save | defer | save | Email reminders are approved; SMS reminders remain under discussion. | Preserves mixed decision states. |
| c059 | defer | skip | skip | The committee approved the proposed budget. | Neither the earlier decision nor its subject is supplied. |
| c060 | defer | skip | skip | The user approved removing the audit log. | The referenced changes are missing. |
| c062 | save | defer | defer | The user tentatively finds instrumental music helpful for work. | Useful tentative preference remains tentative. |
| c063 | save | defer | save | The vendor reports duplex scanning support; the team has not verified it. | Preserves source and verification status. |
| c064 | save | defer | save | The user generally prefers cheaper shipping, except for urgent deliveries. | Default and exception retained. |
| c065 | save | defer | skip | Confidential datasets must stay on the team servers. | A durable conditional data-handling rule. |
| c066 | save | defer | skip | The migration is estimated at two to four weeks, without a firm commitment. | Range and uncertainty retained. |
| c069 | save | defer | skip | The cache is a working hypothesis for the intermittent bug, not a confirmed cause. | Ongoing debugging context with hypothesis status. |
| c070 | save | defer | defer | The user is considering a compact keyboard and wants to try one first. | Tentative preference and next step preserved. |
| c079 | defer | skip | skip | Use the backup when traffic exceeds 1,000 requests per minute. | The condition is absent. |
| c080 | defer | skip | skip | The analytics team tentatively prefers this solution. | The team and referent are unresolved. |
| c081 | save | defer | save | The user now prefers contact by email. | Latest explicit preference supersedes the old one. |
| c082 | save | defer | save | The service is named Orbit. | Direct factual correction. |
| c083 | save | defer | save | The team now deploys on Wednesdays. | Current schedule replaces historical practice. |
| c084 | save | defer | save | The project deadline is now June 15. | Latest confirmed deadline. |
| c085 | save | defer | defer | Arun currently owns the release checklist. | Time-aware change of responsibility. |
| c086 | save | defer | save | The weekly newsletter is discontinued; the monthly digest continues. | Selective update preserves unchanged service. |
| c087 | save | defer | save | The user now prefers connected prose instead of bullet-only answers. | Explicit revocation plus replacement. |
| c088 | save | defer | defer | The installation guide clearance should be 20 millimeters. | Corrected unit without stale value. |
| c099 | defer | skip | skip | The official cutoff is Tuesday. | Unresolved conflicting sources require deferral. |
| c100 | defer | skip | skip | The new default is the compact layout. | Missing object and replacement value. |

## Timing, usage and reproduction

Mean **264 ms**, median **246 ms**, nearest-rank p95 **346 ms**, range 211–615 ms. Client-observed full request/response times include network and first requests. No storage or browser time is measured; no throughput or production SLA is claimed.

Provider-reported usage: 69229 input and 12263 output tokens, counted once across shared responses. Billing was not independently checked. Earlier reports and ad-hoc calls are excluded.

<code>node scripts/coverage.mjs</code> validates the suite without calls. Add <code>--live</code> and load your own environment key to repeat this 100-call experiment; it stops on first error and writes a new report under ignored <code>runs/</code>. <code>node scripts/build-study.mjs</code> regenerates the public dashboard from published evidence without API usage. Hashes preserve fixture, manifest, protocol and question provenance. A new call may produce different output.

## Next experiment

Review the skip/defer boundary with independent human annotators first. Then change one factor (question wording, context completeness or durability definition) on development cases, and evaluate on a separately frozen unseen set. These 100 cases have now been inspected and must not be reused as unseen evidence for a tuned policy. External cases and advisory testing alongside a real memory workflow remain necessary.
