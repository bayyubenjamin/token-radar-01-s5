// Token Radar S5 — entrypoint.
// Reads the sealed snapshot, fits the size curve on the 128 traded comps,
// builds the 198-row board, writes board.json, the dashboard data file,
// copies dashboard/ and screenshots/ into the output, and writes
// dossier.json with buildDossier from vendor/makefun-board.ts.
// Standard library only. Deterministic: two runs write identical bytes.
// The dashboard and screenshots directories resolve from this file's own
// directory, so the program runs from any working directory.
import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { BOARD_SLUGS, fitCurve, heldOutTest, computeRow } from "./lib/model.ts";
import type { Protocol } from "./lib/model.ts";
import { buildDossier } from "./vendor/makefun-board.ts";

const HERE = dirname(fileURLToPath(import.meta.url));

function argValue(flag: string, fallback: string): string {
  const i = process.argv.indexOf(flag);
  return i >= 0 && i + 1 < process.argv.length ? process.argv[i + 1] : fallback;
}

function round(n: number, digits: number): number {
  const f = Math.pow(10, digits);
  return Math.round(n * f) / f;
}

function main(): void {
  const inputPath = argValue("--input", "/input/snapshot.json");
  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  const snap = JSON.parse(readFileSync(inputPath, "utf8"));
  const asOf = new Date(snap.as_of + "T00:00:00Z");
  const protocols: Protocol[] = snap.protocols;
  const bySlug = new Map(protocols.map((p) => [p.slug, p]));

  const comps = protocols.filter((p) => p.mcap_usd !== null && p.mcap_usd > 0);
  if (comps.length !== 128) throw new Error(`expected 128 traded comps, got ${comps.length}`);
  const fit = fitCurve(comps);
  if (Math.abs(fit.a - 6.9646) > 0.001 || Math.abs(fit.b - 0.5223) > 0.001) {
    throw new Error(`fit out of band: a=${fit.a} b=${fit.b}`);
  }
  const holdout = heldOutTest(comps);

  const rows = BOARD_SLUGS.map((slug) => {
    const p = bySlug.get(slug);
    if (!p) throw new Error(`board slug missing from snapshot: ${slug}`);
    return computeRow(p, asOf, fit);
  });
  rows.sort((x, y) => y.implied_value_usd - x.implied_value_usd || (x.slug < y.slug ? -1 : 1));

  const counts = { FARM: 0, THIN: 0, SKIP: 0 };
  for (const r of rows) counts[r.verdict as "FARM" | "THIN" | "SKIP"]++;

  const boardRows = rows.map((r, i) => ({
    rank: i + 1,
    slug: r.slug,
    name: r.name,
    category: r.category,
    chain: r.chain,
    tvl_usd: r.tvl_usd,
    change_7d: r.change_7d,
    age_days: r.age_days,
    age_unreported: r.age_unreported,
    change_unreported: r.change_unreported,
    implied_value_usd: r.implied_value_usd,
    verdict: r.verdict,
    expected_airdrop_usd: round(r.expected_airdrop_usd, 2),
    ev_cost_ratio: round(r.ev_cost_ratio, 3),
    cost_usd: round(r.cost_usd, 2),
    deposit_usd: r.deposit_usd,
    gas_usd: r.gas_usd,
    farmers: Math.round(r.farmers),
    hold_days: r.hold_days,
    size_term: round(r.size_term, 2),
    growth_factor: round(r.growth, 4),
    maturity_factor: round(r.maturity, 4),
    odds: round(r.odds, 4),
    farm_steps: r.farm_steps,
  }));

  mkdirSync(outDir, { recursive: true });
  writeFileSync(
    join(outDir, "board.json"),
    JSON.stringify(
      {
        as_of: snap.as_of,
        model: {
          a: round(fit.a, 4),
          b: round(fit.b, 4),
          r2: round(fit.r2, 4),
          held_out_fitted_rmse: round(holdout.fittedMean, 3),
          held_out_flat_rmse: round(holdout.flatMean, 3),
          held_out_wins: holdout.wins,
          folds: holdout.folds.map((f) => ({ fitted: round(f.fitted, 3), flat: round(f.flat, 3) })),
        },
        counts,
        rows: boardRows,
      },
      null,
      2,
    ) + "\n",
    "utf8",
  );

  // Dashboard data file, generated at runtime beside the page.
  const live = protocols
    .filter((p) => p.mcap_usd !== null && p.mcap_usd > 0)
    .sort((x, y) => (y.mcap_usd as number) - (x.mcap_usd as number))
    .map((p) => [p.slug, p.name, p.tvl_usd, p.mcap_usd]);
  const compsPairs = comps.map((p) => [round(Math.log(p.tvl_usd), 4), round(Math.log(p.mcap_usd as number), 4)]);
  const dataRows = rows.map((r) => [
    r.slug, r.name, r.category, r.chain, r.tvl_usd, r.change_7d, r.age_days,
    r.age_unreported ? 1 : 0, r.change_unreported ? 1 : 0, r.implied_value_usd,
    r.verdict, round(r.expected_airdrop_usd, 2), round(r.cost_usd, 2), r.deposit_usd,
    r.gas_usd, r.hold_days, round(r.size_term, 2), round(r.growth, 4),
    round(r.maturity, 4), round(r.odds, 4), round(r.ev_cost_ratio, 3),
  ]);
  const dataJs =
    "window.RADAR = " +
    JSON.stringify({
      a: round(fit.a, 4),
      b: round(fit.b, 4),
      r2: round(fit.r2, 4),
      asOf: snap.as_of,
      rows: dataRows,
      live,
      comps: compsPairs,
    }) +
    ";\n";

  const dashOut = join(outDir, "dashboard");
  mkdirSync(dashOut, { recursive: true });
  cpSync(join(HERE, "dashboard"), dashOut, { recursive: true });
  writeFileSync(join(dashOut, "data.js"), dataJs, "utf8");

  const shotsDir = join(HERE, "screenshots");
  const shots = existsSync(shotsDir) ? readdirSync(shotsDir).filter((f) => /\.(png|jpe?g)$/i.test(f)) : [];
  if (shots.length > 0) cpSync(shotsDir, join(outDir, "screenshots"), { recursive: true });

  if (shots.length >= 3) {
    const dossier = buildDossier(outDir, { text_max_bytes: 65536 });
    writeFileSync(join(outDir, "dossier.json"), dossier);
    const again = buildDossier(outDir, { text_max_bytes: 65536 });
    const identical = Buffer.from(dossier).equals(Buffer.from(again));
    console.log(`dossier bytes=${dossier.length} identical_on_rebuild=${identical}`);
    if (!identical) throw new Error("dossier not byte-identical on rebuild");
  } else {
    console.log(`dossier skipped: only ${shots.length} screenshots present`);
  }

  console.log(`fit a=${fit.a.toFixed(4)} b=${fit.b.toFixed(4)} r2=${fit.r2.toFixed(4)}`);
  console.log(
    `held-out fitted=${holdout.fittedMean.toFixed(3)} flat=${holdout.flatMean.toFixed(3)} wins=${holdout.wins}/5 folds=${holdout.folds.map((f) => `${f.fitted.toFixed(3)}/${f.flat.toFixed(3)}`).join(" ")}`,
  );
  console.log(`board rows=${rows.length} FARM=${counts.FARM} THIN=${counts.THIN} SKIP=${counts.SKIP}`);
  console.log(`top10=${rows.slice(0, 10).map((r) => r.slug).join(",")}`);
  const stepLens = rows.flatMap((r) => r.farm_steps.map((s) => s.trim().length));
  console.log(`farm steps min=${Math.min(...stepLens)} max=${Math.max(...stepLens)}`);
}

main();
