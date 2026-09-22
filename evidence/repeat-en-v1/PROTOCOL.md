# Repeatability check: frozen protocol

Repeat the existing 20 English cases twice, in fixture order, using the same questions, labels, model (`jev-1.13.0`) and two policies. This adds at most 40 calls. Commit this protocol and runner before calling the provider. Stop on the first error; do not retry or select favorable runs.

This is a repeatability check of previously observed cases, not new held-out evidence. Combine the original English run with these two passes only for clearly labeled descriptive summaries: 20 unique cases, up to 60 evaluations. Keep the original fresh-case results separately visible. Do not tune questions or policies.

Publish every attempt, hashes of the fixture/questions/protocol, the pre-call commit, returned model, latency and usage. Report agreement and false/missed saves per pass and pooled. Report the number of cases whose final decision varies across all three runs for each policy. Pooled observations are correlated, not independent samples.

Latency measures the client's full provider request and response, including network, not memory storage or total browser interaction. Use arithmetic mean, median and nearest-rank p95; do not remove the first request or slow outliers. No throughput or production SLA claim is supported.
