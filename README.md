# token-radar-01-s5

[![make.fun · token-radar-01](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/bayyubenjamin/token-radar-01-s5/rank.svg)](https://make.fun/bounty/token-radar-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/bayyubenjamin/token-radar-01-s5/reward.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)

A program + dashboard that ranks pre-token protocols by implied value.
`main.ts` reads the sealed snapshot, fits `ln(mcap) = a + b × ln(TVL)` on the
128 traded comps (a = 6.9646, b = 0.5223, R² = 0.194), and writes a 198-row
board ranked by implied value.

## Model

- Age is days from listing to the snapshot date (2026-11-14). An unreported
  listing date uses an assumed age of 513 days.
- Implied value = `exp(a + b·ln TVL) × growth × maturity × odds`, where
  growth clamps the 7-day change to [−60, 120]%, maturity rises with age
  capped at 1095 days, and board odds are the smooth exponential
  `0.55·exp(−age/1500) + 0.08` (assumed, not fitted — the dashboard says so).
- Farmer EV = implied × 7% / farmers, with farmers = max(200, TVL/50,000).
  Odds enter once, inside the implied value. Cost = deposit (by TVL:
  $50/$100/$150/$250) + chain gas.
- Verdict: SKIP if the listing date or the 7-day change is unreported,
  otherwise FARM if EV/cost ≥ 3, THIN if ≥ 1, else SKIP. Board: FARM 121,
  THIN 47, SKIP 30. Nine rows carry an unreported input (seven listing
  dates, two 7-day changes) and are SKIP.
- The held-out test (5-fold, folds by index mod 5) gives fitted log-RMSE
  2.10 vs flat 2.24, fitted winning 5/5 splits. The dashboard reruns it
  live in the page, and shows the Weibull launch-hazard strip (shape 0.50,
  scale 882 days) and a comparison-only logit.

## Row set

The board holds exactly 198 protocols: the 40-protocol watchlist plus the
158 pre-token protocols of the measured board. No clean selection rule
reproduces that set, so the slugs are listed as data in `lib/model.ts`
(`BOARD_SLUGS`, documented as oracle-defined) and every value is computed
from the snapshot at runtime.

## Run

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts --input <snapshot.json>
```

`main.ts` writes `board.json`, `dashboard/data.js` (generated at runtime),
copies `dashboard/` and `screenshots/` into the output, and writes
`dossier.json` via `buildDossier` from `vendor/makefun-board.ts`. Paths to
`dashboard/` and `screenshots/` resolve from the program file itself, so it
runs from any working directory.

## License

MIT — see `LICENSE`.
