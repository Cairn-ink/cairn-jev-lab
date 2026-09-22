# Jev memory admission pilot

Synthetic development cases; not a held-out benchmark, comparison with Cairn, or proof of production quality. No memory database was changed.

Started: 2026-09-22T06:32:11.511Z

Policy: admission-v1; confidence threshold: 0.75 (experimental, not calibrated on memory).

Matched 13/20 evaluated; false saves 0; missed saves 7; deferrals 7.

| Case | Expected | Observed | Match | ms |
|---|---|---|---|---|
| 01 | save | defer | no | 750 |
| 02 | skip | skip | yes | 255 |
| 03 | skip | skip | yes | 307 |
| 04 | save | save | yes | 269 |
| 05 | skip | skip | yes | 294 |
| 06 | save | defer | no | 290 |
| 07 | skip | skip | yes | 260 |
| 08 | save | defer | no | 283 |
| 09 | skip | skip | yes | 250 |
| 10 | save | save | yes | 234 |
| 11 | skip | skip | yes | 359 |
| 12 | skip | skip | yes | 279 |
| 13 | save | defer | no | 317 |
| 14 | defer | defer | yes | 272 |
| 15 | skip | skip | yes | 258 |
| 16 | save | skip | no | 220 |
| 17 | skip | skip | yes | 278 |
| 18 | skip | skip | yes | 313 |
| 19 | save | defer | no | 246 |
| 20 | save | defer | no | 228 |

See report.json for exact questions, sources, candidates, answers, probabilities, model version and token usage. All failed or ambiguous cases are retained.
