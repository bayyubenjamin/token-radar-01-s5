// Token Radar S5 dashboard: board, filter, search, sort, detail view,
// live-token tab, and a live re-run of the curve fit and the 5-fold test.
// Row layout in window.RADAR.rows (by index):
// 0 slug, 1 name, 2 category, 3 chain, 4 tvl, 5 change7d, 6 age, 7 ageUnrep,
// 8 changeUnrep, 9 implied, 10 verdict, 11 expectedAirdrop, 12 cost,
// 13 deposit, 14 gas, 15 holdDays, 16 sizeTerm, 17 growth, 18 maturity,
// 19 odds, 20 ratio. window.RADAR.live is [slug, name, tvl, mcap].
// window.RADAR.comps is [ln tvl, ln mcap] pairs for the live re-run.
(function () {
  var R = window.RADAR;
  var rows = R.rows;
  var live = R.live;
  var comps = R.comps;
  var $ = function (id) { return document.getElementById(id); };
  var fmtInt = function (n) { return Math.round(n).toLocaleString("en-US"); };
  var fmtMoney = function (n) { return "$" + fmtInt(n); };
  var state = { filter: "ALL", query: "", sort: "implied-desc", selected: null };

  var ACTIONS = {
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
    "Uncategorized": "Use the protocol"
  };

  function buildSteps(r) {
    var name = r[1], category = r[2], chain = r[3];
    var deposit = r[13], gas = r[14], cost = r[12], hold = r[15];
    var action = ACTIONS[category] || ACTIONS["Uncategorized"];
    return [
      "Move $" + deposit + " in USDC to a wallet on " + chain + " for " + name + "; network gas is about $" + gas + ".",
      "Deposit $" + deposit + " into " + name + " (" + category + ") on " + chain + ", and confirm the position shows in the app.",
      "Hold the position for " + hold + " days; check it weekly, and add funds only if the pool TVL drops sharply.",
      action + " at least once a week so the activity counts toward any future distribution.",
      "If " + name + " records a token, claim inside the first claim window; unstake only after the snapshot, not before.",
      "Exit by withdrawing the deposit plus rewards (gas about $" + gas + "); the all-in plan cost is about $" + cost + " plus " + hold + " days of time."
    ];
  }

  function visibleRows() {
    var out = rows.filter(function (r) {
      if (state.filter !== "ALL" && r[10] !== state.filter) return false;
      if (state.query) {
        var q = state.query.toLowerCase();
        if (r[0].toLowerCase().indexOf(q) < 0 && r[1].toLowerCase().indexOf(q) < 0) return false;
      }
      return true;
    });
    out.sort(function (a, b) {
      return state.sort === "implied-asc" ? a[9] - b[9] : b[9] - a[9];
    });
    return out;
  }

  function renderBoard() {
    var vis = visibleRows();
    var body = $("boardBody");
    body.innerHTML = "";
    vis.forEach(function (r, i) {
      var tr = document.createElement("tr");
      tr.setAttribute("data-slug", r[0]);
      var age = r[6] + (r[7] ? " (unreported)" : "");
      var chg = r[5] === null ? "—" : (r[5] > 0 ? "+" : "") + r[5].toFixed(1) + "%";
      tr.innerHTML = "<td>" + (i + 1) + "</td><td>" + r[1] + "<br><small>" + r[0] + "</small></td><td>" + r[2] + "</td><td>" + r[3] + "</td><td>" + fmtMoney(r[4]) + "</td><td>" + chg + "</td><td>" + age + "</td><td>" + fmtMoney(r[9]) + "</td><td class=\"verdict-" + r[10] + "\">" + r[10] + "</td><td>" + r[20].toFixed(2) + "</td>";
      tr.addEventListener("click", function () { selectRow(r[0]); });
      body.appendChild(tr);
    });
    $("countLabel").textContent = "Showing " + vis.length + " of " + rows.length;
    var counts = { FARM: 0, THIN: 0, SKIP: 0 };
    rows.forEach(function (r) { counts[r[10]]++; });
    $("statusBar").textContent = "FARM " + counts.FARM + " · THIN " + counts.THIN + " · SKIP " + counts.SKIP;
  }

  function selectRow(slug) {
    var r = null;
    for (var i = 0; i < rows.length; i++) if (rows[i][0] === slug) { r = rows[i]; break; }
    if (!r) return;
    state.selected = slug;
    var rank = rows.indexOf(r) + 1;
    $("dName").textContent = "#" + rank + " — " + r[1] + " (" + r[0] + ") · " + r[2] + " · " + r[3] + " · " + r[10];
    $("dSize").textContent = "exp(" + R.a + " + " + R.b + " × ln TVL) = " + fmtMoney(r[16]);
    $("dGrowth").textContent = r[17].toFixed(4) + (r[8] ? " (change unreported)" : "");
    $("dMaturity").textContent = r[18].toFixed(4);
    $("dOdds").textContent = r[19].toFixed(4) + (r[7] || r[8] ? " (unreported input)" : "");
    $("dImplied").textContent = fmtMoney(r[9]);
    $("dEv").textContent = "$" + r[11].toFixed(2) + " (7% pool shared by " + fmtInt(Math.max(200, r[4] / 50000)) + " farmers)";
    $("dRatio").textContent = r[20].toFixed(2);
    $("dCost").textContent = "$" + r[12].toFixed(2) + " = deposit $" + r[13] + " + gas $" + r[14];
    $("dHold").textContent = r[15] + " days";
    var plan = $("dPlan");
    plan.innerHTML = "<h3>Farm plan</h3>";
    var ol = document.createElement("ol");
    buildSteps(r).forEach(function (s) {
      var li = document.createElement("li");
      li.textContent = s;
      ol.appendChild(li);
    });
    plan.appendChild(ol);
  }

  function renderLive() {
    var body = $("liveBody");
    body.innerHTML = "";
    live.forEach(function (p, i) {
      var tr = document.createElement("tr");
      tr.innerHTML = "<td>" + (i + 1) + "</td><td>" + p[1] + "<br><small>" + p[0] + "</small></td><td>" + fmtMoney(p[2]) + "</td><td>" + fmtMoney(p[3]) + "</td>";
      body.appendChild(tr);
    });
    $("liveCount").textContent = live.length + " protocols record a traded token, largest market cap first.";
  }

  function liveRefit() {
    var n = comps.length;
    var mx = 0, my = 0;
    comps.forEach(function (p) { mx += p[0]; my += p[1]; });
    mx /= n; my /= n;
    var sxy = 0, sxx = 0;
    comps.forEach(function (p) { sxy += (p[0] - mx) * (p[1] - my); sxx += (p[0] - mx) * (p[0] - mx); });
    var b = sxy / sxx, a = my - b * mx;
    var ssTot = 0, ssRes = 0;
    comps.forEach(function (p) { ssTot += (p[1] - my) * (p[1] - my); var pr = a + b * p[0]; ssRes += (p[1] - pr) * (p[1] - pr); });
    var r2 = 1 - ssRes / ssTot;
    var ratios = comps.map(function (p) { return Math.exp(p[1] - p[0]); }).sort(function (u, v) { return u - v; });
    var med = ratios.length % 2 === 1 ? ratios[(ratios.length - 1) / 2] : (ratios[ratios.length / 2 - 1] + ratios[ratios.length / 2]) / 2;
    var logMed = Math.log(med);
    var fitSum = 0, flatSum = 0, wins = 0;
    for (var fold = 0; fold < 5; fold++) {
      var train = comps.filter(function (_, i) { return i % 5 !== fold; });
      var test = comps.filter(function (_, i) { return i % 5 === fold; });
      var tmx = 0, tmy = 0;
      train.forEach(function (p) { tmx += p[0]; tmy += p[1]; });
      tmx /= train.length; tmy /= train.length;
      var tsxy = 0, tsxx = 0;
      train.forEach(function (p) { tsxy += (p[0] - tmx) * (p[1] - tmy); tsxx += (p[0] - tmx) * (p[0] - tmx); });
      var tb = tsxy / tsxx, ta = tmy - tb * tmx;
      var fe = 0, le = 0;
      test.forEach(function (p) { var e1 = p[1] - (ta + tb * p[0]); fe += e1 * e1; var e2 = p[1] - (logMed + p[0]); le += e2 * e2; });
      var fRmse = Math.sqrt(fe / test.length), lRmse = Math.sqrt(le / test.length);
      fitSum += fRmse; flatSum += lRmse;
      if (fRmse < lRmse) wins++;
    }
    $("liveFit").textContent = "Live refit: a = " + a.toFixed(2) + ", b = " + b.toFixed(2) + ", R² = " + r2.toFixed(2) + "; held-out " + (fitSum / 5).toFixed(2) + " vs " + (flatSum / 5).toFixed(2) + ", " + wins + "/5.";
  }

  function applyHash() {
    var h = window.location.hash || "";
    var m;
    if ((m = h.match(/filter=([A-Z]+)/))) {
      var f = m[1];
      if (f === "FARM" || f === "THIN" || f === "SKIP" || f === "ALL") {
        state.filter = f;
        document.querySelectorAll(".controls button").forEach(function (btn) {
          btn.classList.toggle("on", btn.getAttribute("data-filter") === f);
        });
        renderBoard();
      }
    }
    if ((m = h.match(/detail=([a-z0-9\-\.]+)/))) selectRow(m[1]);
    if (h.indexOf("live") >= 0) {
      var el = $("liveTab");
      if (el && el.scrollIntoView) el.scrollIntoView();
    }
  }

  document.querySelectorAll(".controls button").forEach(function (btn) {
    btn.addEventListener("click", function () {
      state.filter = btn.getAttribute("data-filter");
      document.querySelectorAll(".controls button").forEach(function (b) { b.classList.toggle("on", b === btn); });
      renderBoard();
    });
  });
  $("search").addEventListener("input", function (e) { state.query = e.target.value; renderBoard(); });
  $("sort").addEventListener("change", function (e) { state.sort = e.target.value; renderBoard(); });

  renderBoard();
  renderLive();
  liveRefit();
  applyHash();
window.addEventListener("hashchange", applyHash);
  if (state.selected) {
    var el = $("detail");
    if (el && el.scrollIntoView) el.scrollIntoView();
  }
})();
