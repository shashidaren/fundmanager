# FundPilot MY — Project Handoff & Living Reference (`handoff.md`)

> **Auto-Generated Living Source of Truth** — Updated automatically whenever the self-improving calibration engine runs, investor preferences or requirements change, or Git sync executes.
>
> - **Last State Sync (UTC):** `2026-11-22T16:43:41.262Z`
> - **Active Git Branch:** `main`
> - **Model Version:** `v1.1.0` (Calibration Cycle `#4`)
> - **Market Regime:** `BALANCED_NORMAL` · **Reference FX:** `1 USD = RM 4.11`

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
- **Starting Lump Sum:** RM 3,000
- **Monthly Top-Up (DCA):** RM 500 / month
- **Investment Timeline:** 1 to 3 years (Near-term goal)
- **Emergency Buffer Status:** Not yet — help me build a safety net too
- **Temporary Dip Comfort:** Keep it very steady (Max ~2–4% temporary dip)
- **Shariah Filter:** All Funds (Conventional + Shariah)

### Proposed Plan: **Calm Steady-Builder Plan**
- **Split:** 85% Versa (MYR) · 15% US Broad ETFs (USD)
- **Expected Long-Term Average Return:** **3.71% p.a.** (net of fund fees)
- **Total Ongoing Fund Fee:** **0.27% p.a.** (~RM 2.69 per year per RM 1,000 invested)
- **Estimated Worst Rough-Year Dip:** **-0.1%** (RM 10,000 temporarily dipping to ~RM 9,990 before recovery)
- **10-Year Projected Value:**
  - Total Cash Contributed: **RM 63,000**
  - Expected Path Value: **RM 76,855**
  - Cautious Market Path: **RM 71,976**

### Recommended Fund Breakdown

| Fund | Platform | Compliance | Target % | Initial RM | Monthly RM | Annual Fee | Job in Your Plan |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **Versa Cash** (`VERSA-CASH`) | Versa (MYR) | Conventional | **85%** | RM 2,550 | RM 425/mo | 0.30% | Safe MYR Base |
| **iShares 0-3 Month Treasury Bond ETF** (`SGOV`) | US ETF (USD) | Conventional | **15%** | RM 450 | RM 75/mo | 0.09% | Foreign Currency Safety |

### Plain-English Action Routine
1. Payday Step 1 (Versa MYR): Auto-transfer RM 425/month into your Versa fund(s)—takes 2 minutes via FPX/DuitNow with zero sales fee.
2. Payday Step 2 (Smart FX Tip): Since your US ETF slice is RM 75/month, park it in Versa Cash monthly and buy your US ETF(s) once every 2–3 months to minimize broker currency conversion fees.
3. Every 6 Months: Check this dashboard once every 6 months—if any fund drifted more than 5% off target, top up the lagging slice. Ignore daily market noise!

---

## 3. Self-Improving Calibration Engine State

The engine evaluates market returns, volatility, drawdowns, and fee drag across all 18 funds and updates bounded scoring weights so recommendations adapt automatically without ever drifting into reckless concentration.

### Active Scoring Weights (Sum = 100%)
- **Low Fee Efficiency (`feeEfficiency`):** `31%`
- **Risk-Adjusted Return (`riskAdjustedReturn`):** `27%`
- **Drawdown Protection (`drawdownProtection`):** `22%`
- **Broad Index Diversification (`diversificationBreadth`):** `14%`
- **Cash / Income Carry (`yieldCarry`):** `6%`

### Active Safety Tilts
- **MYR Safety Floor Boost:** `0%`
- **High-Growth Booster Cap (QQQM / HLAL):** `20%`
- **Learned User Comfort Bias:** `0`

### Latest Calibration Changelog
- **Cycle #4** (2026-11-22T16:43:41.262Z · `dashboard-auto-calibrate` · Source: `live-yahoo-finance (9 ETFs)` · Regime: `BALANCED_NORMAL` · Score: **87.7/100**)
  - Fee spread check (Versa equity avg 1.12% vs US ETFs avg 0.21%): reinforced Fee Efficiency weight so multi-year plans minimize fee drag.
  - Post-calibration audit: 100% layman comfort compliance across all 4 investor archetypes (Portfolio Efficiency Score: 87.7/100).

- **Cycle #3** (2026-11-21T13:28:53.038Z · `dashboard-auto-calibrate` · Source: `live-yahoo-finance (9 ETFs)` · Regime: `BALANCED_NORMAL` · Score: **89.1/100**)
  - Fee spread check (Versa equity avg 1.12% vs US ETFs avg 0.21%): reinforced Fee Efficiency weight so multi-year plans minimize fee drag.
  - Post-calibration audit: 100% layman comfort compliance across all 4 investor archetypes (Portfolio Efficiency Score: 89.1/100).

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
| `SGOV` | iShares 0-3 Month Treasury Bond ETF | US ETF (USD) | No | 0.09% | 4.02% | -0.1% | **93.7** |
| `VERSA-CASH` | Versa Cash | Versa (MYR) | No | 0.30% | 3.65% | -0.1% | **87.3** |
| `VERSA-CASH-I` | Versa Cash-i | Versa (MYR) | Yes | 0.30% | 3.55% | -0.1% | **86.3** |
| `SCHD` | Schwab U.S. Dividend Equity ETF | US ETF (USD) | No | 0.06% | 12.13% | -18.5% | **78.2** |
| `VERSA-SGD` | Versa SGD | Versa (MYR) | No | 0.45% | 4.10% | -4.2% | **78** |
| `VOO` | Vanguard S&P 500 ETF | US ETF (USD) | No | 0.03% | 8.13% | -24.5% | **71.4** |
| `VTI` | Vanguard Total Stock Market ETF | US ETF (USD) | No | 0.03% | 8.00% | -25.4% | **71.4** |
| `VT` | Vanguard Total World Stock ETF | US ETF (USD) | No | 0.06% | 7.23% | -25.1% | **70.6** |
| `VERSA-MOD` | Versa Invest Moderate | Versa (MYR) | No | 1.05% | 5.90% | -11.5% | **66.8** |
| `SPSK` | SP Funds Dow Jones Global Sukuk ETF | US ETF (USD) | Yes | 0.55% | 2.69% | -9.8% | **66.4** |
| `VERSA-GOLD` | Versa Gold | Versa (MYR) | Yes | 0.65% | 7.40% | -16.5% | **63** |
| `SPUS` | SP Funds S&P 500 Sharia Industry Exclusions ETF | US ETF (USD) | Yes | 0.45% | 8.23% | -26.2% | **60.4** |
| `QQQM` | Invesco NASDAQ 100 ETF | US ETF (USD) | No | 0.15% | 8.66% | -32.6% | **60** |
| `HLAL` | Wahed FTSE USA Shariah ETF | US ETF (USD) | Yes | 0.50% | 7.93% | -25.0% | **59.6** |
| `VERSA-GROWTH` | Versa Invest Growth | Versa (MYR) | No | 1.20% | 8.30% | -19.8% | **57.4** |
| `VERSA-GLOBAL-I` | Versa Global-i | Versa (MYR) | Yes | 1.20% | 8.50% | -19.2% | **55.7** |
| `VERSA-GROWTH-I` | Versa Growth-i | Versa (MYR) | Yes | 1.25% | 8.10% | -20.4% | **53.9** |
| `VERSA-REITS` | Versa REITs | Versa (MYR) | No | 1.35% | 5.70% | -22.0% | **49.1** |

---

## 5. Requirements & Iterative Roadmap

### Implemented in Current Version
- [x] **Guided Layman Recommendation Engine (MYR + USD Auto-Split)** _(Core Recommendation)_ — Plain-English planner translating RM budget, timeline, emergency savings, and dip comfort into exact Versa (MYR) + US ETF (USD) allocations.
- [x] **Non-Individual Stock Universe (Versa Portfolios + Broad US ETFs)** _(Fund Universe)_ — Includes 9 Versa funds and 9 broad US ETFs (VOO, VTI, VT, QQQM, SCHD, SGOV, SPUS, HLAL, SPSK) with zero single-stock picking risk.
- [x] **Market-Driven Self-Improving Calibration + GitHub Actions** _(Self-Improving & Git)_ — Scheduled GitHub Action (.github/workflows/self-improve.yml) and in-app calibration engine evaluate market returns/drawdowns, adjust scoring weights safely, update handoff.md, and commit to Git.
- [x] **Automatic handoff.md Reference & Continuous Git Sync** _(Documentation & Sync)_ — All architecture, active plan summaries, fund metrics, calibration logs, and open requirements stay updated in handoff.md and synced to Git.
- [x] **Linux Box Reboot Survival (systemd) & Weekday Auto-Pull Sync** _(Infrastructure & Ops)_ — One-command scripts/setup-systemd.sh installs /etc/systemd/system/fundpilot.service (starts on boot, auto-restarts on crash) plus /etc/cron.d/fundpilot-sync.

### Planned / Open Requirements for Next Iterations
- [ ] **All Funds + Instant Shariah-Only (-i / Halal) Toggle** _(Filter & Compliance · planned)_ — Global one-click toggle switches recommendations and explorer seamlessly between full universe and 100% Shariah-compliant options.
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
- `scripts/setup-systemd.sh` — One-command Debian/Ubuntu `systemd` installer so self-hosted servers (e.g. `root@fubd`) survive reboots automatically and auto-pull GitHub's weekday calibrations.
- `scripts/server-sync.sh` — Safe rebase + rebuild + service-restart helper run by `/etc/cron.d/fundpilot-sync`.
- `server/index.js` — Unified Express API + Vite/static server (`0.0.0.0:3000`) with calibration, profile persistence, requirements management, and Git pull/push endpoints.
- `src/` — React + Tailwind CSS v4 Layman Dashboard UI.
- `.github/workflows/self-improve.yml` — Scheduled weekday GitHub Action that runs `npm run calibrate` and commits updated market snapshots + `handoff.md` back to Git automatically.

### Quick Commands
```bash
# Start full-stack dashboard (Express API + Vite UI on port 3000)
npm run dev

# Make a Debian/Ubuntu box survive reboots (builds dist/, installs systemd service + auto-sync cron)
npm run setup-server

# Run market-driven self-improvement calibration + update handoff.md
npm run calibrate

# Regenerate handoff.md only
npm run handoff

# Run automated engine & API test suite
npm test
```

---

## 7. Production Linux Server Setup (Reboot Survival via `systemd`)

For self-hosted Debian/Ubuntu boxes (such as `root@fubd:~/fund-adviser`):
- **Service Unit:** `/etc/systemd/system/fundpilot.service` runs `NODE_ENV=production node server/index.js` on port `3000`, starts automatically on boot (`WantedBy=multi-user.target`), and auto-restarts within 3 seconds if crashed (`Restart=always`).
- **Auto-Pull Cron:** `/etc/cron.d/fundpilot-sync` runs `scripts/server-sync.sh` every weekday at **9:15 AM MYT** (`15 1 * * 1-5` UTC)—15 minutes after GitHub Actions finishes its 9:00 AM MYT calibration—pulling fresh market data and rebuilding/restarting only when code changes.
- **Useful Server Commands:**
  - `systemctl status fundpilot` — Check live status
  - `journalctl -u fundpilot -f` — Tail live logs
  - `systemctl restart fundpilot` — Restart manually
