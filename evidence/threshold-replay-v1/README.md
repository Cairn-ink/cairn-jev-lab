# Threshold replay

Offline replay of the original 20 development cases. **Zero API calls.** The recorded Jev choices and confidences are unchanged; only the deterministic confidence threshold changes. This is tuning on known data, not new evaluation evidence.

| Threshold | Matches | False saves | Missed saves | Deferred |
|---|---|---|---|---|
| 0 | 16/20 | 0 | 3/9 | 1 |
| 0.25 | 16/20 | 0 | 3/9 | 1 |
| 0.4 | 16/20 | 0 | 4/9 | 3 |
| 0.5 | 15/20 | 0 | 5/9 | 4 |
| 0.6 | 13/20 | 0 | 7/9 | 7 |
| 0.75 | 13/20 | 0 | 7/9 | 7 |
| 0.9 | 12/20 | 0 | 7/9 | 9 |

Of the seven original missed saves, 4 had three positive choices but insufficient confidence; 3 had a negative or unclear choice. Lowering a threshold cannot fix a wrong choice and can turn uncertainty into rejection.

See report.json for every decision and per-case diagnosis. Run: node scripts/sweep.mjs. Original inputs and responses remain unchanged.
