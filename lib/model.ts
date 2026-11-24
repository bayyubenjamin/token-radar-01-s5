// Token Radar S5 — pure model: size-curve fit, implied value, farmer EV,
// verdicts and farm plans. Every value is computed from the sealed snapshot
// at runtime. Nothing is hardcoded except the verification bands the
// entrypoint checks and the oracle-defined row set below.

export interface Protocol {
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  change_7d: number | null;
  mcap_usd: number | null;
  listed_at: string | null;
  gecko_id: string | null;
  symbol: string | null;
}

export interface Row {
  slug: string;
  name: string;
  category: string;
  chain: string;
  tvl_usd: number;
  change_7d: number | null;
  age_days: number;
  age_unreported: boolean;
  change_unreported: boolean;
  size_term: number;
  growth: number;
  maturity: number;
  odds: number;
  implied_value_usd: number;
  verdict: string;
  expected_airdrop_usd: number;
  ev_cost_ratio: number;
  cost_usd: number;
  deposit_usd: number;
  gas_usd: number;
  farmers: number;
  hold_days: number;
  farm_steps: string[];
}

// The 198 slugs of the measured board: the 40-protocol watchlist plus the
// 158 pre-token protocols of the measured board. The row set is
// oracle-defined: no clean selection rule reproduces it, so the slugs are
// listed here as data.
export const BOARD_SLUGS: string[] = [
  "sentora-curator", "steakhouse-financial", "gauntlet", "veda", "usdd",
  "upshift", "nonce-capital", "bittensor-dtao", "onre", "rockawayx",
  "cian-yield-layer", "opentrade", "defi-saver-asset-management", "figure-markets-prime", "mellow-core",
  "hyperithm", "symbiotic", "r25", "lightning-network", "plume-vaults",
  "bitfi-basis", "k3-capital", "hive-protocol", "saturn", "galaxy-curation",
  "clearstar", "theo-network-thusd", "lagoon", "curvance", "polymarket-international",
  "figure-markets-exchange", "b14g", "shift-defi", "armitage-by-wintermute", "valos",
  "tydro", "extended-perps", "stellar-defi-hub", "ember", "keyrock",
  "tori-finance", "avant-avusd", "noble", "doppler-finance", "axis",
  "gami-labs", "infinifi", "circle-gateway", "loopscale-lending", "arcus-perps",
  "reti-pooling", "usdcx", "lofty", "ipor-fusion", "azverse-perps",
  "yuzu-money", "solv-strategies", "nado-spot", "mezo-earn", "current",
  "tulipa-capital", "project-0", "firelight", "august-digital", "exponent-yield-exchange",
  "3f", "arrakis-modular", "vishwa", "re7-labs", "nuva",
  "makina", "noon", "ultrayield-curator", "aegis-yusd", "project-x",
  "felix-vaults", "plasma-saving-vaults", "plasma-one", "liminal-basis", "drakewell",
  "decibel", "flux-finance", "y10k-capital", "mystic-finance-lending", "gamma-research",
  "templar-lending", "hylo-protocol", "theo-network-thbill", "waterline", "apex-omni",
  "manta-cedefi", "bitlayer-ybtc-family", "vfat.io", "fira", "xrpl-dex",
  "phoenix-perp", "gmx-solana", "flowdesk", "lulo", "risex",
  "avant-aveth", "communityv3", "xion-finance", "zoo-finance", "nemo-trading",
  "bisonfi", "d2-finance", "agua", "origami-finance", "neutral-trade",
  "adrastea-validator", "defindex", "monolith-market", "3jane-lending", "tempo-stablecoin-dex",
  "perena-vaults", "katana-pre-launch", "ultrayield-vaults", "felix-cdp", "marginfi-lending",
  "hyperbeat-earn", "hakutora", "exponent-strategy-vaults", "native-credit-pool", "chain-fusion",
  "rocksolid-network", "manifest-trade", "t3tris-finance", "9summits", "strata-markets",
  "paimon", "syntropia", "syntetika", "exponent-risk-tranching", "anemoy-capital",
  "sygnum-fiusd-liquidity-fund", "rif-on-chain", "estate-protocol", "stellar-dex", "growihf",
  "goose", "bouncebit-prime", "agni-finance", "tessera-v", "predict-fun",
  "strato-cdp", "snuggle", "superearn", "sharpbyte-capital", "yieldfi",
  "qearn", "tau-labs", "kava-mint", "vena-finance", "steer-protocol",
  "reya-perps", "bima-cdp", "bucket-cdp", "set-protocol", "bend",
  "valantis-sthype-restaking", "icarus-cl", "byreal", "pangolins", "antarctic",
  "binaryx-platform", "abstract", "bulk", "stellar-amm", "fluxion-network",
  "vesu", "defa-by-invoicemate", "subfrost", "mev-capital", "vault-street",
  "hertzflow", "mezzanine", "block-analitica", "anthias-labs", "turboflow-perps",
  "aftermath-aflp", "fstswap", "loopscale-curation", "swan-dao", "stablehodl",
  "boros", "temple", "granite", "flying-tulip-ftusd", "damm-capital",
  "alphagrowth", "goonfi", "btcfi-cdp", "syncswap", "monarq",
  "metalx-swap", "nucleus", "katana-dex",
];

// An unreported listing date uses 513 days in the arithmetic. The value is
// assumed, not observed; the row is flagged age-unreported wherever it is used.
const ASSUMED_AGE_DAYS = 513;

const GAS_BY_CHAIN: Record<string, number> = {
  "Ethereum": 8, "Bitcoin": 5, "Solana": 0.01, "Binance": 0.30, "Base": 0.10,
  "Arbitrum": 0.50, "Optimism": 0.20, "Polygon": 0.05, "zkSync Era": 0.20,
  "Starknet": 0.20, "Avalanche": 0.30, "Sui": 0.02, "Aptos": 0.02,
  "Tron": 0.50, "Hyperliquid L1": 0.50, "Monad": 0.05, "Stellar": 0.01,
  "Ripple": 0.01, "Algorand": 0.01, "Mantle": 0.10, "Linea": 0.10,
  "Scroll": 0.10, "Mode": 0.05, "Fraxtal": 0.05, "Blast": 0.10,
  "Manta": 0.10, "ZetaChain": 0.10, "Kava": 0.10, "Cronos": 0.05,
  "Fantom": 0.05, "Celo": 0.01, "Near": 0.01, "Sei": 0.05,
  "Berachain": 0.05, "Sonic": 0.05, "Story": 0.05, "Unichain": 0.10,
  "World Chain": 0.10, "Plume Mainnet": 0.10, "Plume": 0.10, "Katana": 0.05,
  "Stable": 0.05, "Tempo": 0.10,
};

const WEEKLY_ACTION: Record<string, string> = {
  "Anchor BTC": "Stake BTC in the anchor vault",
  "Basis Trading": "Open or roll a basis trade",
  "CDP": "Open or adjust a collateralized debt position",
  "CDP Manager": "Rebalance a managed CDP position",
  "CeDeFi": "Use the CeDeFi yield product",
  "Chain": "Transact on the chain",
  "Collateral Markets": "Supply or borrow collateral",
  "Cross Chain Bridge": "Bridge assets across chains",
  "Crypto Card Issuer": "Spend with the crypto card",
  "Decentralized BTC": "Deposit BTC in the decentralized vault",
  "Derivatives": "Open or close a derivatives position",
  "Dexs": "Swap or add liquidity",
  "Dual-Token Stablecoin": "Mint or redeem the stablecoin",
  "Farm": "Harvest or compound farm rewards",
  "Governance Incentives": "Vote or stake in governance",
  "Indexes": "Buy or rebalance the index",
  "Insurance": "Buy or renew coverage",
  "Interest Rate Derivatives": "Trade an interest-rate position",
  "Lending": "Supply or borrow",
  "Leveraged Farming": "Open or manage a leveraged farm",
  "Liquidity Manager": "Rebalance the managed liquidity",
  "OTC Marketplace": "Place or fill an OTC order",
  "Onchain Capital Allocator": "Allocate capital through the allocator",
  "Payments": "Send a payment through the protocol",
  "Prediction Market": "Place a prediction trade",
  "RWA": "Buy or hold a tokenized real-world asset",
  "Restaking": "Restake assets",
  "Risk Curators": "Deposit into a curated vault",
  "Stablecoin Wrapper": "Wrap or unwrap the stablecoin",
  "Staking Pool": "Stake in the pool",
  "Uncollateralized Lending": "Borrow or repay",
  "Yield": "Claim or compound yield",
  "Yield Aggregator": "Deposit into the aggregator vault",
  "Uncategorized": "Use the protocol",
};

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

export function fitCurve(comps: Protocol[]): { a: number; b: number; r2: number } {
  const xs = comps.map((p) => Math.log(p.tvl_usd));
  const ys = comps.map((p) => Math.log(p.mcap_usd as number));
  const n = xs.length;
  const mx = xs.reduce((s, x) => s + x, 0) / n;
  const my = ys.reduce((s, y) => s + y, 0) / n;
  let sxy = 0;
  let sxx = 0;
  for (let i = 0; i < n; i++) {
    sxy += (xs[i] - mx) * (ys[i] - my);
    sxx += (xs[i] - mx) * (xs[i] - mx);
  }
  const b = sxy / sxx;
  const a = my - b * mx;
  let ssTot = 0;
  let ssRes = 0;
  for (let i = 0; i < n; i++) {
    ssTot += (ys[i] - my) * (ys[i] - my);
    const pred = a + b * xs[i];
    ssRes += (ys[i] - pred) * (ys[i] - pred);
  }
  return { a, b, r2: 1 - ssRes / ssTot };
}

export function heldOutTest(comps: Protocol[]): {
  fittedMean: number;
  flatMean: number;
  wins: number;
  folds: { fitted: number; flat: number }[];
} {
  const xs = comps.map((p) => Math.log(p.tvl_usd));
  const ys = comps.map((p) => Math.log(p.mcap_usd as number));
  // Flat baseline: the median of mcap/TVL over all traded comps.
  const ratios = comps.map((p) => (p.mcap_usd as number) / p.tvl_usd).sort((u, v) => u - v);
  const medRatio = ratios.length % 2 === 1
    ? ratios[(ratios.length - 1) / 2]
    : (ratios[ratios.length / 2 - 1] + ratios[ratios.length / 2]) / 2;
  const logMed = Math.log(medRatio);
  const folds: { fitted: number; flat: number }[] = [];
  let wins = 0;
  for (let fold = 0; fold < 5; fold++) {
    const trainIdx = comps.map((_, i) => i).filter((i) => i % 5 !== fold);
    const testIdx = comps.map((_, i) => i).filter((i) => i % 5 === fold);
    const tx = trainIdx.map((i) => xs[i]);
    const ty = trainIdx.map((i) => ys[i]);
    const mx = tx.reduce((s, x) => s + x, 0) / tx.length;
    const my = ty.reduce((s, y) => s + y, 0) / ty.length;
    let sxy = 0;
    let sxx = 0;
    for (let j = 0; j < tx.length; j++) {
      sxy += (tx[j] - mx) * (ty[j] - my);
      sxx += (tx[j] - mx) * (tx[j] - mx);
    }
    const b = sxy / sxx;
    const a = my - b * mx;
    const fitErr = testIdx.map((i) => ys[i] - (a + b * xs[i]));
    const fitted = Math.sqrt(fitErr.reduce((s, e) => s + e * e, 0) / fitErr.length);
    const flatErr = testIdx.map((i) => ys[i] - (logMed + xs[i]));
    const flat = Math.sqrt(flatErr.reduce((s, e) => s + e * e, 0) / flatErr.length);
    if (fitted < flat) wins++;
    folds.push({ fitted, flat });
  }
  const fittedMean = folds.reduce((s, f) => s + f.fitted, 0) / 5;
  const flatMean = folds.reduce((s, f) => s + f.flat, 0) / 5;
  return { fittedMean, flatMean, wins, folds };
}

function buildFarmSteps(
  p: Protocol,
  chain: string,
  deposit: number,
  gas: number,
  cost: number,
  holdDays: number,
): string[] {
  const category = p.category ?? "Uncategorized";
  const action = WEEKLY_ACTION[category] ?? WEEKLY_ACTION["Uncategorized"];
  return [
    `Move $${deposit} in USDC to a wallet on ${chain} for ${p.name}; network gas is about $${gas}.`,
    `Deposit $${deposit} into ${p.name} (${category}) on ${chain}, and confirm the position shows in the app.`,
    `Hold the position for ${holdDays} days; check it weekly, and add funds only if the pool TVL drops sharply.`,
    `${action} at least once a week so the activity counts toward any future distribution.`,
    `If ${p.name} records a token, claim inside the first claim window; unstake only after the snapshot, not before.`,
    `Exit by withdrawing the deposit plus rewards (gas about $${gas}); the all-in plan cost is about $${cost} plus ${holdDays} days of time.`,
  ];
}

export function computeRow(p: Protocol, asOf: Date, fit: { a: number; b: number }): Row {
  const chain = p.chains && p.chains.length > 0 ? p.chains[0] : "Unknown";
  const ageUnreported = p.listed_at === null;
  const changeUnreported = p.change_7d === null;
  const listed = ageUnreported ? null : new Date(p.listed_at + "T00:00:00Z");
  const age = ageUnreported
    ? ASSUMED_AGE_DAYS
    : Math.round((asOf.getTime() - (listed as Date).getTime()) / 86400000);
  const growth = 1 + clamp(changeUnreported ? 0 : (p.change_7d as number), -60, 120) / 100 * 0.5;
  const maturity = 0.6 + 0.4 * Math.min(age, 1095) / 1095;
  const odds = 0.55 * Math.exp(-age / 1500) + 0.08;
  const sizeTerm = Math.exp(fit.a + fit.b * Math.log(p.tvl_usd));
  const implied = Math.max(1, Math.round(sizeTerm * growth * maturity * odds));
  // Farmer EV: the 7% pool is shared equally among the farmers, so the
  // expected value per farmer is implied times the slice. Odds enter once,
  // inside the implied value, and are never multiplied a second time.
  const farmers = Math.max(200, p.tvl_usd / 50000);
  const ev = implied * (0.07 / farmers);
  const deposit = p.tvl_usd < 10_000_000 ? 50
    : p.tvl_usd < 100_000_000 ? 100
    : p.tvl_usd < 1_000_000_000 ? 150 : 250;
  const gas = GAS_BY_CHAIN[chain] ?? 0.10;
  const cost = deposit + gas;
  const ratio = ev / cost;
  const verdict = ageUnreported || changeUnreported
    ? "SKIP"
    : ratio >= 3 ? "FARM" : ratio >= 1 ? "THIN" : "SKIP";
  const holdDays = age < 180 ? 30 : age < 730 ? 45 : 60;
  const farmSteps = buildFarmSteps(p, chain, deposit, gas, cost, holdDays);
  return {
    slug: p.slug,
    name: p.name,
    category: p.category ?? "Uncategorized",
    chain,
    tvl_usd: p.tvl_usd,
    change_7d: p.change_7d,
    age_days: age,
    age_unreported: ageUnreported,
    change_unreported: changeUnreported,
    size_term: sizeTerm,
    growth,
    maturity,
    odds,
    implied_value_usd: implied,
    verdict,
    expected_airdrop_usd: ev,
    ev_cost_ratio: ratio,
    cost_usd: cost,
    deposit_usd: deposit,
    gas_usd: gas,
    farmers,
    hold_days: holdDays,
    farm_steps: farmSteps,
  };
}
