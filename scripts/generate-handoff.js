import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  generateRecommendation,
  rankUniverse,
  HORIZON_LABELS,
  BUFFER_LABELS,
  COMFORT_LABELS
} from '../shared/engine.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

function safeGitInfo() {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: ROOT_DIR, stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
    const commit = execSync('git rev-parse --short HEAD', { cwd: ROOT_DIR, stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
    return { branch, commit };
  } catch {
    return { branch: 'unknown', commit: 'uncommitted' };
  }
}

export function buildHandoffMarkdown() {
  const fundsData = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'data/funds.json'), 'utf8'));
  const modelState = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'data/model-state.json'), 'utf8'));
  const calHistory = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'data/calibration-history.json'), 'utf8'));
  const reqData = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'data/requirements.json'), 'utf8'));
  const git = safeGitInfo();

  const profile = modelState.activeInvestorProfile || {};
  const stateTimestamps = [
    modelState.lastCalibratedAt,
    fundsData.lastUpdated,
    reqData.lastUpdated
  ].filter(Boolean).sort();
  const latestStateTimestamp = stateTimestamps[stateTimestamps.length - 1] || '2026-11-21T08:00:00.000Z';
  const rec = generateRecommendation(profile, fundsData, modelState);
  const rankedAll = rankUniverse(fundsData.funds, modelState, false);
  const endProj = rec.projections[rec.projections.length - 1] || {};
  const recentRuns = [...(calHistory.runs || [])].reverse().slice(0, 5);

  const allocRows = rec.allocations
    .map(
      (a) =>
        `| **${a.name}** (\`${a.ticker}\`) | ${a.platform} (${a.currency}) | ${a.shariah ? 'Yes (-i/Halal)' : 'Conventional'} | **${a.weight}%** | RM ${a.initialMyr.toLocaleString()} | RM ${a.monthlyMyr.toLocaleString()}/mo | ${a.expenseRatio.toFixed(2)}% | ${a.sleeveRole} |`
    )
    .join('\n');

  const universeRows = rankedAll
    .map(
      (f) =>
        `| \`${f.ticker}\` | ${f.name} | ${f.platform} (${f.currency}) | ${f.shariah ? 'Yes' : 'No'} | ${f.expenseRatio.toFixed(2)}% | ${f.expectedReturn.toFixed(2)}% | ${f.maxDrawdown.toFixed(1)}% | **${f.modelScore}** |`
    )
    .join('\n');

  const calRows = recentRuns
    .map((r) => {
      const notes = (r.changesPlainEnglish || []).map((c) => `  - ${c}`).join('\n');
      return `- **Cycle #${r.cycle}** (${r.timestamp} · \`${r.trigger}\` · Source: \`${r.dataSource}\` · Regime: \`${r.marketRegime}\` · Score: **${r.portfolioEfficiencyScore}/100**)\n${notes}`;
    })
    .join('\n\n');

  const implementedReqs = (reqData.items || [])
    .filter((i) => i.status === 'implemented')
    .map((i) => `- [x] **${i.title}** _(${i.category})_ — ${i.notes}`)
    .join('\n');

  const openReqs = (reqData.items || [])
    .filter((i) => i.status !== 'implemented')
    .map((i) => `- [ ] **${i.title}** _(${i.category} · ${i.status})_ — ${i.notes}`)
    .join('\n');

  return `# FundPilot MY — Project Handoff & Living Reference (\`handoff.md\`)

> **Auto-Generated Living Source of Truth** — Updated automatically whenever the self-improving calibration engine runs, investor preferences or requirements change, or Git sync executes.
>
> - **Last State Sync (UTC):** \`${latestStateTimestamp}\`
> - **Active Git Branch:** \`${git.branch}\`
> - **Model Version:** \`v${modelState.version}\` (Calibration Cycle \`#${modelState.calibrationCycle}\`)
> - **Market Regime:** \`${modelState.marketRegime}\` · **Reference FX:** \`1 USD = RM ${Number(modelState.fxUsdMyr).toFixed(2)}\`

---

## 1. What This App Does (Layman Overview)

**FundPilot MY** is a beginner-friendly, self-improving fund manager dashboard tailored for Malaysian investors combining:
1. **Versa Malaysia Portfolios (MYR)** — Low-barrier, zero-sales-charge Ringgit funds (\`Versa Cash\`, \`Versa Cash-i\`, \`Versa Invest Moderate/Growth\`, \`Versa Growth-i\`, \`Versa Global-i\`, \`Versa Gold\`, \`Versa SGD\`, \`Versa REITs\`).
2. **Broad US Non-Individual Stock ETFs (USD)** — Diversified index baskets owning hundreds or thousands of companies (\`VOO\`, \`VTI\`, \`VT\`, \`QQQM\`, \`SCHD\`, \`SGOV\`, plus Shariah-compliant ETFs \`SPUS\`, \`HLAL\`, \`SPSK\`) so beginners **never gamble on picking individual stocks**.
3. **All Funds + Instant Shariah-Only (\`-i\` / Halal) Toggle** — One click switches the entire planner and fund explorer between all funds and 100% Shariah-screened funds.
4. **Market-Driven Self-Improving Calibration + Git Sync** — Evaluates fund risk/return efficiency, drawdowns, and layman comfort thresholds; updates adaptive scoring weights; writes plain-English lessons into \`data/calibration-history.json\` and \`handoff.md\`; and syncs to Git both from the dashboard UI and via scheduled GitHub Actions (\`.github/workflows/self-improve.yml\`).

---

## 2. Active Layman Profile & Proposed Recommendation Snapshot

### Current Saved Investor Inputs
- **Starting Lump Sum:** RM ${Number(profile.initialAmountMyr || 0).toLocaleString()}
- **Monthly Top-Up (DCA):** RM ${Number(profile.monthlyContributionMyr || 0).toLocaleString()} / month
- **Investment Timeline:** ${HORIZON_LABELS[profile.horizon] || profile.horizon}
- **Emergency Buffer Status:** ${BUFFER_LABELS[profile.emergencyBuffer] || profile.emergencyBuffer}
- **Temporary Dip Comfort:** ${COMFORT_LABELS[profile.dipComfort] || profile.dipComfort}
- **Shariah Filter:** ${profile.shariahOnly ? 'Shariah-Only (-i / Halal ETFs)' : 'All Funds (Conventional + Shariah)'}

### Proposed Plan: **${rec.planIdentity.title}**
- **Split:** ${rec.planIdentity.subtitle}
- **Expected Long-Term Average Return:** **${rec.metrics.expectedAnnualReturnPct}% p.a.** (net of fund fees)
- **Total Ongoing Fund Fee:** **${rec.metrics.weightedExpenseRatioPct}% p.a.** (~RM ${rec.metrics.annualFeePer1000Myr.toFixed(2)} per year per RM 1,000 invested)
- **Estimated Worst Rough-Year Dip:** **${rec.metrics.estimatedWorstDipPct}%** (RM 10,000 temporarily dipping to ~RM ${rec.metrics.sample10kRoughYearMyr.toLocaleString()} before recovery)
- **${profile.projectionYears}-Year Projected Value:**
  - Total Cash Contributed: **RM ${(endProj.contributedMyr || 0).toLocaleString()}**
  - Expected Path Value: **RM ${(endProj.expectedMyr || 0).toLocaleString()}**
  - Cautious Market Path: **RM ${(endProj.cautiousMyr || 0).toLocaleString()}**

### Recommended Fund Breakdown

| Fund | Platform | Compliance | Target % | Initial RM | Monthly RM | Annual Fee | Job in Your Plan |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :--- |
${allocRows}

### Plain-English Action Routine
${rec.laymanSummary.monthlyActionRoutine.map((step, idx) => `${idx + 1}. ${step}`).join('\n')}

---

## 3. Self-Improving Calibration Engine State

The engine evaluates market returns, volatility, drawdowns, and fee drag across all 18 funds and updates bounded scoring weights so recommendations adapt automatically without ever drifting into reckless concentration.

### Active Scoring Weights (Sum = 100%)
- **Low Fee Efficiency (\`feeEfficiency\`):** \`${Math.round(modelState.weights.feeEfficiency * 100)}%\`
- **Risk-Adjusted Return (\`riskAdjustedReturn\`):** \`${Math.round(modelState.weights.riskAdjustedReturn * 100)}%\`
- **Drawdown Protection (\`drawdownProtection\`):** \`${Math.round(modelState.weights.drawdownProtection * 100)}%\`
- **Broad Index Diversification (\`diversificationBreadth\`):** \`${Math.round(modelState.weights.diversificationBreadth * 100)}%\`
- **Cash / Income Carry (\`yieldCarry\`):** \`${Math.round(modelState.weights.yieldCarry * 100)}%\`

### Active Safety Tilts
- **MYR Safety Floor Boost:** \`${modelState.tiltAdjustments.myrSafetyFloorBoost}%\`
- **High-Growth Booster Cap (QQQM / HLAL):** \`${modelState.tiltAdjustments.highGrowthCapPct}%\`
- **Learned User Comfort Bias:** \`${modelState.tiltAdjustments.userComfortBias}\`

### Latest Calibration Changelog
${calRows}

---

## 4. Complete Fund Universe (Ranked by Current Model Score)

| Ticker | Fund Name | Platform | Shariah | Fee | Est. Return | Max Dip | Model Score |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: |
${universeRows}

---

## 5. Requirements & Iterative Roadmap

### Implemented in Current Version
${implementedReqs || '- None listed'}

### Planned / Open Requirements for Next Iterations
${openReqs || '- All listed items completed! Add new ideas anytime in the Handoff & Git Sync tab.'}

---

## 6. Architecture, Commands & Automated Git Sync

### Repository Structure
- \`shared/engine.js\` — Pure quantitative fund scorer, layman bucket allocator, and RM compounding simulator.
- \`data/funds.json\` — Curated + market-updatable catalog of 9 Versa funds & 9 broad US ETFs.
- \`data/model-state.json\` — Self-improving weights, market regime, FX rate, and saved investor profile.
- \`data/calibration-history.json\` — Audit trail of every market calibration & feedback adjustment.
- \`data/requirements.json\` — Interactive requirements backlog synced directly into this file.
- \`scripts/calibrate.js\` — Fetches latest US ETF & USD/MYR market data (with offline/sandbox fallback), recalibrates model weights, and updates \`handoff.md\`.
- \`scripts/generate-handoff.js\` — Regenerates \`handoff.md\` from live JSON state and Git metadata.
- \`scripts/setup-systemd.sh\` — One-command Debian/Ubuntu \`systemd\` installer so self-hosted servers (e.g. \`root@fubd\`) survive reboots automatically and auto-pull GitHub's weekday calibrations.
- \`scripts/server-sync.sh\` — Safe rebase + rebuild + service-restart helper run by \`/etc/cron.d/fundpilot-sync\`.
- \`server/index.js\` — Unified Express API + Vite/static server (\`0.0.0.0:3000\`) with calibration, profile persistence, requirements management, and Git pull/push endpoints.
- \`src/\` — React + Tailwind CSS v4 Layman Dashboard UI.
- \`.github/workflows/self-improve.yml\` — Scheduled weekday GitHub Action that runs \`npm run calibrate\` and commits updated market snapshots + \`handoff.md\` back to Git automatically.

### Quick Commands
\`\`\`bash
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
\`\`\`

---

## 7. Production Linux Server Setup (Reboot Survival via \`systemd\`)

For self-hosted Debian/Ubuntu boxes (such as \`root@fubd:~/fund-adviser\`):
- **Service Unit:** \`/etc/systemd/system/fundpilot.service\` runs \`NODE_ENV=production node server/index.js\` on port \`3000\`, starts automatically on boot (\`WantedBy=multi-user.target\`), and auto-restarts within 3 seconds if crashed (\`Restart=always\`).
- **Auto-Pull Cron:** \`/etc/cron.d/fundpilot-sync\` runs \`scripts/server-sync.sh\` every weekday at **9:15 AM MYT** (\`15 1 * * 1-5\` UTC)—15 minutes after GitHub Actions finishes its 9:00 AM MYT calibration—pulling fresh market data and rebuilding/restarting only when code changes.
- **Useful Server Commands:**
  - \`systemctl status fundpilot\` — Check live status
  - \`journalctl -u fundpilot -f\` — Tail live logs
  - \`systemctl restart fundpilot\` — Restart manually
`;
}

export function writeHandoffFile() {
  const md = buildHandoffMarkdown();
  const outPath = path.join(ROOT_DIR, 'handoff.md');
  fs.writeFileSync(outPath, md, 'utf8');
  return { path: outPath, content: md };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const res = writeHandoffFile();
  console.log(`Updated ${res.path} (${res.content.length} bytes)`);
}
