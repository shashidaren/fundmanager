# FundPilot MY — Project Handoff & Living Reference (`handoff.md`)

> **Auto-Generated Living Source of Truth** — Updated automatically whenever the self-improving calibration engine runs, investor preferences or requirements change, or Git sync executes.
>
> - **Last Synced (UTC):** `2026-11-21T07:54:45.089Z`
> - **Active Git Branch:** `arena/6c730325-fundmanager` (Base/Latest Commit: `528c1ff`)
> - **Model Version:** `v1.1.0` (Calibration Cycle `#2`)
> - **Market Regime:** `HIGH_RATE_DEFENSIVE` · **Reference FX:** `1 USD = RM 4.42`

---

## 1. What This App Does (Layman Overview)

**FundPilot MY** is a beginner-friendly, self-improving fund manager dashboard tailored for Malaysian investors combining:
1. **Versa Malaysia Portfolios (MYR)** — Low-barrier, zero-sales-charge Ringgit funds (`Versa Cash`, `Versa Cash-i`, `Versa Invest Moderate/Growth`, `Versa Growth-i`, `Versa Global-i`, `Versa Gold`, `Versa SGD`, `Versa REITs`).
2. **Broad US Non-Individual Stock ETFs (USD)** — Diversified index baskets owning hundreds or thousands of companies (`VOO`, `VTI`, `VT`, `QQQM`, `SCHD`, `SGOV`, plus Shariah-compliant ETFs `SPUS`, `HLAL`, `SPSK`) so beginners **never gamble on picking individual stocks**.
3. **All Funds + Instant Shariah-Only (`-i` / Halal) Toggle** — One click switches the entire planner and fund explorer between all funds and 100% Shariah-screened funds.
4. **Market-Driven Self-Improving Calibration + Git Sync** — Evaluates fund risk/return efficiency, drawdowns, and layman comfort thresholds; updates adaptive scoring weights; writes plain-English lessons into `data/calibration-history.json` and `handoff.md`; and syncs to Git both from the dashboard UI and via scheduled GitHub Actions (`.github/workflows/self-improve.yml`).

---

## 2. Active Layman Profile & Proposed Recommendation Snapshot

### Current Saved Investor Inputs
- **Starting Lump Sum:** RM 5,000
- **Monthly Top-Up (DCA):** RM 800 / month
- **Investment Timeline:** 3 to 7 years (Medium-term wealth)
- **Emergency Buffer Status:** Partly covered (1–2 months saved)
- **Temporary Dip Comfort:** Balanced mindset (~14–18% temporary dip for solid growth)
- **Shariah Filter:** All Funds (Conventional + Shariah)

### Proposed Plan: **Balanced Core-Growth Plan**
- **Split:** 41% Versa (MYR) · 59% US Broad ETFs (USD)
- **Expected Long-Term Average Return:** **7.66% p.a.** (net of fund fees)
- **Total Ongoing Fund Fee:** **0.27% p.a.** (~RM 2.68 per year per RM 1,000 invested)
- **Estimated Worst Rough-Year Dip:** **-13%** (RM 10,000 temporarily dipping to ~RM 8,700 before recovery)
- **10-Year Projected Value:**
  - Total Cash Contributed: **RM 101,000**
  - Expected Path Value: **RM 154,343**
  - Cautious Market Path: **RM 134,572**

### Recommended Fund Breakdown

| Fund | Platform | Compliance | Target % | Initial RM | Monthly RM | Annual Fee | Job in Your Plan |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **Vanguard S&P 500 ETF** (`VOO`) | US ETF (USD) | Conventional | **31%** | RM 1,550 | RM 248/mo | 0.03% | Core US Market Engine |
| **Versa Cash** (`VERSA-CASH`) | Versa (MYR) | Conventional | **29%** | RM 1,450 | RM 232/mo | 0.30% | Safe MYR Base |
| **Versa Invest Growth** (`VERSA-GROWTH`) | Versa (MYR) | Conventional | **12%** | RM 600 | RM 96/mo | 1.20% | Automated MYR Equity Sleeve |
| **Schwab U.S. Dividend Equity ETF** (`SCHD`) | US ETF (USD) | Conventional | **10%** | RM 500 | RM 80/mo | 0.06% | Quality Cash-Flow Equities |
| **iShares 0-3 Month Treasury Bond ETF** (`SGOV`) | US ETF (USD) | Conventional | **9%** | RM 450 | RM 72/mo | 0.09% | USD T-Bill Cushion |
| **Invesco NASDAQ 100 ETF** (`QQQM`) | US ETF (USD) | Conventional | **9%** | RM 450 | RM 72/mo | 0.15% | Long-Term Growth Booster |

### Plain-English Action Routine
1. Payday Step 1 (Versa MYR): Auto-transfer RM 328/month into your Versa fund(s)—takes 2 minutes via FPX/DuitNow with zero sales fee.
2. Payday Step 2 (US ETFs): Invest RM 472/month (~USD 107) into your broad US ETF basket regardless of market headlines.
3. Every 6 Months: Check this dashboard once every 6 months—if any fund drifted more than 5% off target, top up the lagging slice. Ignore daily market noise!

---

## 3. Self-Improving Calibration Engine State

The engine evaluates market returns, volatility, drawdowns, and fee drag across all 18 funds and updates bounded scoring weights so recommendations adapt automatically without ever drifting into reckless concentration.

### Active Scoring Weights (Sum = 100%)
- **Low Fee Efficiency (`feeEfficiency`):** `29%`
- **Risk-Adjusted Return (`riskAdjustedReturn`):** `27%`
- **Drawdown Protection (`drawdownProtection`):** `22%`
- **Broad Index Diversification (`diversificationBreadth`):** `14%`
- **Cash / Income Carry (`yieldCarry`):** `8%`

### Active Safety Tilts
- **MYR Safety Floor Boost:** `0%`
- **High-Growth Booster Cap (QQQM / HLAL):** `20%`
- **Learned User Comfort Bias:** `0`

### Latest Calibration Changelog
- **Cycle #2** (2026-11-21T07:54:26.294Z · `cli-auto-calibrate` · Source: `verified-baseline-dataset` · Regime: `HIGH_RATE_DEFENSIVE` · Score: **92.8/100**)
  - Fee spread check (Versa equity avg 1.12% vs US ETFs avg 0.21%): reinforced Fee Efficiency weight so multi-year plans minimize fee drag.
  - Post-calibration audit: 100% layman comfort compliance across all 4 investor archetypes (Portfolio Efficiency Score: 92.8/100).

- **Cycle #1** (2026-11-21T08:00:00.000Z · `initial-baseline` · Source: `verified-baseline-dataset` · Regime: `BALANCED_NORMAL` · Score: **88.4/100**)
  - Initialized scoring weights balancing low ETF fees (28%), risk-adjusted return efficiency (27%), and temporary drop protection (22%).
  - Set high-growth tilt ceiling (QQQM / HLAL) to 20% so layman portfolios avoid excessive tech-concentration swings.
  - Verified 100% of recommended Versa + US ETF sleeves stay within each layman profile's stated temporary dip comfort threshold.

---

## 4. Complete Fund Universe (Ranked by Current Model Score)

| Ticker | Fund Name | Platform | Shariah | Fee | Est. Return | Max Dip | Model Score |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| `SGOV` | iShares 0-3 Month Treasury Bond ETF | US ETF (USD) | No | 0.09% | 4.30% | -0.1% | **93.7** |
| `VERSA-CASH` | Versa Cash | Versa (MYR) | No | 0.30% | 3.65% | -0.1% | **87.4** |
| `VERSA-CASH-I` | Versa Cash-i | Versa (MYR) | Yes | 0.30% | 3.55% | -0.1% | **86.4** |
| `VERSA-SGD` | Versa SGD | Versa (MYR) | No | 0.45% | 4.10% | -4.2% | **78.1** |
| `SCHD` | Schwab U.S. Dividend Equity ETF | US ETF (USD) | No | 0.06% | 9.10% | -18.5% | **76.9** |
| `VOO` | Vanguard S&P 500 ETF | US ETF (USD) | No | 0.03% | 10.40% | -24.5% | **73.8** |
| `VTI` | Vanguard Total Stock Market ETF | US ETF (USD) | No | 0.03% | 10.20% | -25.4% | **73.3** |
| `SPSK` | SP Funds Dow Jones Global Sukuk ETF | US ETF (USD) | Yes | 0.55% | 4.40% | -9.8% | **73.3** |
| `VT` | Vanguard Total World Stock ETF | US ETF (USD) | No | 0.06% | 9.40% | -25.1% | **73.2** |
| `VERSA-MOD` | Versa Invest Moderate | Versa (MYR) | No | 1.05% | 5.90% | -11.5% | **67.4** |
| `SPUS` | SP Funds S&P 500 Sharia Industry Exclusions ETF | US ETF (USD) | Yes | 0.45% | 10.80% | -26.2% | **64.2** |
| `HLAL` | Wahed FTSE USA Shariah ETF | US ETF (USD) | Yes | 0.50% | 10.30% | -25.0% | **63.8** |
| `QQQM` | Invesco NASDAQ 100 ETF | US ETF (USD) | No | 0.15% | 12.10% | -32.6% | **63.5** |
| `VERSA-GOLD` | Versa Gold | Versa (MYR) | Yes | 0.65% | 7.40% | -16.5% | **62.3** |
| `VERSA-GROWTH` | Versa Invest Growth | Versa (MYR) | No | 1.20% | 8.30% | -19.8% | **57.8** |
| `VERSA-GLOBAL-I` | Versa Global-i | Versa (MYR) | Yes | 1.20% | 8.50% | -19.2% | **56** |
| `VERSA-GROWTH-I` | Versa Growth-i | Versa (MYR) | Yes | 1.25% | 8.10% | -20.4% | **54.2** |
| `VERSA-REITS` | Versa REITs | Versa (MYR) | No | 1.35% | 5.70% | -22.0% | **50.5** |

---

## 5. Requirements & Iterative Roadmap

### Implemented in Current Version
- [x] **Guided Layman Recommendation Engine (MYR + USD Auto-Split)** _(Core Recommendation)_ — Plain-English planner translating RM budget, timeline, emergency savings, and dip comfort into exact Versa (MYR) + US ETF (USD) allocations.
- [x] **Non-Individual Stock Universe (Versa Portfolios + Broad US ETFs)** _(Fund Universe)_ — Includes 9 Versa funds and 9 broad US ETFs (VOO, VTI, VT, QQQM, SCHD, SGOV, SPUS, HLAL, SPSK) with zero single-stock picking risk.
- [x] **All Funds + Instant Shariah-Only (-i / Halal) Toggle** _(Filter & Compliance)_ — Global one-click toggle switches recommendations and explorer seamlessly between full universe and 100% Shariah-compliant options.
- [x] **Market-Driven Self-Improving Calibration + GitHub Actions** _(Self-Improving & Git)_ — Scheduled GitHub Action (.github/workflows/self-improve.yml) and in-app calibration engine evaluate market returns/drawdowns, adjust scoring weights safely, update handoff.md, and commit to Git.
- [x] **Automatic handoff.md Reference & Continuous Git Sync** _(Documentation & Sync)_ — All architecture, active plan summaries, fund metrics, calibration logs, and open requirements stay updated in handoff.md and synced to Git.

### Planned / Open Requirements for Next Iterations
- [ ] **Actual Holdings Tracker & Monthly Rebalancing Alert** _(Future Iteration · planned)_ — Allow logging actual units/RM invested each month in Versa & US broker to show drift vs target % and suggest exact next payday top-up.
- [ ] **Broker & FX Cost Comparison Helper (IBKR / Moomoo MY / Rakuten / FSMOne)** _(Future Iteration · planned)_ — Help beginners pick the cheapest MY-regulated or international broker based on monthly DCA size (e.g. RM300/mo vs RM2,000/mo).
- [ ] **EPF / ASB / PRS Integration Toggle** _(Future Iteration · planned)_ — Account for existing EPF or ASB balances as part of the investor's safe Ringgit base so US ETF / Versa Growth weights adjust holistically.

---

## 6. Architecture, Commands & Automated Git Sync

### Repository Structure
- `shared/engine.js` — Pure quantitative fund scorer, layman bucket allocator, and RM compounding simulator.
- `data/funds.json` — Curated + market-updatable catalog of 9 Versa funds & 9 broad US ETFs.
- `data/model-state.json` — Self-improving weights, market regime, FX rate, and saved investor profile.
- `data/calibration-history.json` — Audit trail of every market calibration & feedback adjustment.
- `data/requirements.json` — Interactive requirements backlog synced directly into this file.
- `scripts/calibrate.js` — Fetches latest US ETF & USD/MYR market data (with offline/sandbox fallback), recalibrates model weights, and updates `handoff.md`.
- `scripts/generate-handoff.js` — Regenerates `handoff.md` from live JSON state and Git metadata.
- `server/index.js` — Unified Express API + Vite server (`0.0.0.0:3000`) with calibration, profile persistence, requirements management, and one-click Git commit/push endpoints.
- `src/` — React + Tailwind CSS v4 Layman Dashboard UI.
- `.github/workflows/self-improve.yml` — Scheduled weekday GitHub Action that runs `npm run calibrate` and commits updated market snapshots + `handoff.md` back to Git automatically.

### Quick Commands
```bash
# Start full-stack dashboard (Express API + Vite UI on port 3000)
npm run dev

# Run market-driven self-improvement calibration + update handoff.md
npm run calibrate

# Regenerate handoff.md only
npm run handoff

# Run automated engine & API test suite
npm test
```
