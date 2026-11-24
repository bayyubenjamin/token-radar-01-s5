# Adversarial review — token-radar-01 S5 build

**Reviewer:** independent adversarial reviewer (did not write the spec, the delta, or the code).
**Date:** 24 Nov 2026, ~06:10 WIB.
**Verdict: GO (narrow).**

The build does what it claims. Every number below was recomputed by me from the sealed
snapshot — none of it is taken from the builder's report. The verdict is narrow because
of one residual risk (authorship, §5) that I cannot clear from here; the pre-submit
gate's authorship simulation is the arbiter for it.

## 1. Independent re-derivation (Python, from the sealed snapshot)

- Comps (mcap_usd > 0): **128**. (The naive truthy count is 129 only because
  `autofinance` has mcap_usd = -1; the spec's condition excludes it.)
- Fit: **a = 6.9646, b = 0.5223, R² = 0.1939** — inside the ±0.001 band.
- Held-out (5-fold, index % 5): **fitted 2.105 vs flat 2.245, wins 5/5**.
  Folds: 2.754/2.771, 2.376/2.535, 2.040/2.107, 1.628/1.913, 1.726/1.898.
  (Note: the spec says flat ≈ 2.244; the true value is 2.245 — my recompute and the
  builder agree. The spec's 2.244 is a rounding artifact, not a build defect.)
- BOARD_SLUGS: **198, unique, set identical to the oracle** (no missing, no extra).
- Board vs oracle: **implied mismatches 0/198, verdict mismatches 0/198**.
- Counts: **FARM 121 / THIN 47 / SKIP 30**. Top-10 exact:
  sentora-curator, steakhouse-financial, gauntlet, veda, usdd, upshift,
  nonce-capital, bittensor-dtao, onre, rockawayx.
- Null-input rows: 7 unreported listing dates (abstract, defi-saver-asset-management,
  kava-mint, lightning-network, noble, plasma-one, set-protocol) and 2 unreported
  7-day changes (estate-protocol, swan-dao) — 9 union, all SKIP. The spec's §3.4
  lists only 8 (it omits defi-saver-asset-management); the build correctly uses 9.

## 2. Fresh board.json (my own runs of main.ts) vs oracle and vs my derivation

- board.json: 198 rows, counts 121/47/30, model a=6.9646 b=0.5223 R²=0.1939,
  held-out 2.105 vs 2.245, wins 5/5.
- board.json vs oracle: **implied 0 mismatches, verdict 0 mismatches**.
- board.json vs my Python-derived board: **implied 0 mismatches, verdict 0 mismatches**.
- Farm steps: **0 violations** (6 per row, every step 20–600 chars; min 73, max 129).

## 3. The cwd fix — the single most important check (what killed S4)

Read the code directly: `main.ts` defines
`const HERE = dirname(fileURLToPath(import.meta.url))` and uses
`cpSync(join(HERE, "dashboard"), ...)` and `join(HERE, "screenshots")`.
No bare relative path to either directory remains.

Reproduced myself, same snapshot, only the cwd differs:
- From the repo dir: **exit 0**, dossier bytes=463,355, identical_on_rebuild=true.
- From `/tmp`: **exit 0**, dossier bytes=463,355, identical_on_rebuild=true.
  (S4 exited 1 from /tmp with `ENOENT: lstat 'dashboard'`.)
- `diff -r` between the two runs: **byte-identical** (board.json, dossier.json,
  dashboard/*, screenshots/*).
- Dossier 463,355 bytes and board.json 272,208 bytes match the builder's claimed
  bytes exactly — the source has not changed since the builder's runs.

## 4. Word counts (OUTPUT dashboard, my grep — the spec's method)

- index.html: **fitted 14, assumed 7**. app.js: 0/0. data.js: 0/0.
- **Total: fitted 14, assumed 7** — exactly the spec §5.1 requirement.
  (My first by-eye count gave 13 for "fitted"; grep is authoritative and says 14.
  The 14th is in the hero line "Fitted log-RMSE … fitted wins 5/5" — two occurrences
  on one line, which the eye undercounts.)

## 5. Authorship — the one flag I cannot clear (why the verdict is narrow)

`main.ts` is near-verbatim S4 `main.ts` except for the HERE fix and the header
comment (S4→S5). Identical non-spec-determined text includes the comment
"// Dashboard data file, generated at runtime beside the page." and the exact
`console.log` format strings (`dossier bytes=… identical_on_rebuild=…`,
`fit a=… b=… r2=…`, `held-out fitted=…`, `board rows=…`, `top10=…`,
`farm steps min=… max=…`). The S4 spec does not dictate those comments or log
strings, so their verbatim reproduction is not explained by "wrote fresh from
the spec" alone. The same applies to the farm-step template sentences, which
match the spec's structure but whose exact wording is shared with S4's.

I cannot prove copying — I did not read S4's source, and the spec is detailed
enough that the logic would converge. But the transcript gate is the arbiter:
the kit `check --transcripts` authorship simulation will count which lines the
S5 session's own transcripts show as written. If the builder typed these lines
fresh in the recorded session, authorship holds; if any line first appeared in
a tool result in that session, it counts as read. **The pre-submit gate MUST
run the authorship simulation and the result must be ≥50% (entrypoint authored)
before submit. If it comes back low, this review's GO does not stand.**

## 6. README, dossier, sizes, screenshots

- README.md: all three live badges present
  (badge/token-radar-01.svg, badge/token-radar-01/bayyubenjamin/token-radar-01-s5/rank.svg,
  .../reward.svg), 3 links to https://make.fun/bounty/token-radar-01, **no shields.io**.
- No `http://` or `https://` in any output dashboard file.
- Dashboard output total: 54,701 bytes (cap 65,536). Dossier: 463,355 bytes
  (cap 1.5 MiB), schema `makefun/dossier/v1`, 3 images, text field 54,993 chars
  (the builder's "55,036 bytes" is the UTF-8 byte length of the same text —
  the dossier.json totals match exactly, so this is a measurement difference,
  not a discrepancy). board.json 272,208 bytes (cap 8 MiB).
- Screenshots read back as images — all three are real renders of this build:
  - 01-board.jpg: "Showing 198 of 198", rows 1–11, top-10 order correct, all SKIP,
    implied values match board.json (Sentora $34,111,493; Steakhouse $32,944,698).
  - 02-detail.jpg: #1 Sentora Curator, fitted curve exp(6.9646 + 0.5223 × ln TVL) =
    $90,185,322, growth 1.0118, maturity 0.7487, odds 0.4993, implied $34,111,493,
    expected airdrop $43.30 (7% pool shared by 55,152 farmers), EV/cost 0.17,
    cost $258.00 = deposit $250 + gas $8, hold 45 days, 6-step farm plan.
    I recomputed each of these from the snapshot by hand: all check out.
    (The Live token section below it shows 128 protocols, #1 Rain — correct.)
  - 03-filtered.jpg: FARM filter active, **"Showing 121 of 198"**, all 12 visible
    rows FARM (green), every EV/cost ≥ 3.01. Filter is consistent with the verdicts.
    (The +4448.5% 7d change on Shift DeFi is the raw value; the formula clamps
    it to 120% — display only, not a defect.)

## 7. Seal and kit anchor

- Last source-dir write: 03-filtered.jpg, 06:01:02. My fresh runs at 06:04
  reproduce the builder's exact output bytes, so no source file changed after
  the builder's final runs. (I cannot verify the builder's run clock-times from
  mtimes alone — the run logs went to /tmp — but the byte-identical reproduction
  is the stronger evidence and it holds.)
- Kit init anchor exists: `.makefun/freshness.json` (round 34232048,
  wallet GWsj94L26qVucUnmRrX4E4Frj8SfydPmzyxgSng2oibk) and the matching
  `.git` object `ba/5896360f88…`. Anchor `ba5896360f88ba17d9bc5b29af3c6c93b7e91e09`
  confirmed.

## 8. Defects found (all of them, including minor)

1. **Authorship flag (§5)** — the main residual risk. Mitigation: gate must run
   the authorship simulation; GO is conditional on it passing.
2. **Kit check not run** (spec §10 check 7, deferred by the builder — it needs the
   repo + bundle, which do not exist yet). The pre-submit gate must run it; this
   review does not substitute for it.
3. **Cosmetic:** `window.addEventListener("hashchange", applyHash);` in app.js is
   dedented to column 0 inside the IIFE. Valid JS, no functional effect.
4. **Cosmetic:** in a filtered view the board's `#` column restarts at 1 (visible
   position) while the detail view's `#` is the global rank. The count label is
   correct; only the `#` meaning shifts. Not a spec violation.
5. **Spec errata (not build defects):** spec §3.2 says flat ≈ 2.244 (true 2.245);
   spec §3.1 calls 513 "the median reported age" (true median is 677 — the build
   correctly uses 513 and labels it assumed, never calling it the median);
   spec §3.4 lists 8 null-input rows (true count is 9 — the build uses 9).

## 9. Honest expectation

Unchanged from the S5 verdict: **expected score below the 96.21% top-10 cutoff**,
expected prize ~$0. S5 is a learning experiment. What it proves is real: the cwd
fix works (the one thing that killed S4), the pipeline reproduces the oracle
exactly, and the gate now has a cwd-independence test to run. It does not add
any score above S1. Do not expect a paid place.

## 10. What the gate must still check before submit

- Kit `check` (spec §10 check 7) — not run yet.
- Authorship simulation (see §5) — must be ≥50% with the entrypoint authored.
- The cwd test is already verified here; the gate should re-run it as part of
  its determinism check rather than trusting this review.
