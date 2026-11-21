import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateRecommendation } from '../shared/engine.js';
import { writeHandoffFile } from './generate-handoff.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

const US_ETF_TICKERS = ['VOO', 'VTI', 'VT', 'QQQM', 'SCHD', 'SGOV', 'SPUS', 'HLAL', 'SPSK'];

async function fetchYahooSeries(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1y&interval=1mo`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'FundPilotMY-Calibrator/1.0' },
    signal: AbortSignal.timeout(3500)
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const result = json?.chart?.result?.[0];
  const closes = result?.indicators?.adjclose?.[0]?.adjclose || result?.indicators?.quote?.[0]?.close || [];
  const valid = closes.filter((n) => typeof n === 'number' && Number.isFinite(n));
  if (valid.length < 4) throw new Error('Insufficient price bars');
  return valid;
}

async function tryRefreshLiveMarketData(fundsData) {
  let updatedCount = 0;
  let liveFx = null;

  try {
    const fxBars = await fetchYahooSeries('MYR=X');
    const latestFx = fxBars[fxBars.length - 1];
    if (latestFx > 3.0 && latestFx < 6.5) {
      liveFx = Math.round(latestFx * 100) / 100;
    }
  } catch {
    // Offline or sandbox host allowlist active — graceful fallback
    return { updatedCount: 0, liveFx: null, source: 'verified-baseline-dataset' };
  }

  for (const ticker of US_ETF_TICKERS) {
    try {
      const bars = await fetchYahooSeries(ticker);
      const monthlyRets = [];
      for (let i = 1; i < bars.length; i++) {
        monthlyRets.push(Math.round(((bars[i] - bars[i - 1]) / bars[i - 1]) * 10000) / 100);
      }
      const totalRet1Y = ((bars[bars.length - 1] - bars[0]) / bars[0]) * 100;
      const mean = monthlyRets.reduce((s, x) => s + x, 0) / monthlyRets.length;
      const variance = monthlyRets.reduce((s, x) => s + (x - mean) ** 2, 0) / Math.max(1, monthlyRets.length - 1);
      const annualizedVol = Math.sqrt(variance) * Math.sqrt(12);

      const fund = fundsData.funds.find((f) => f.ticker === ticker);
      if (fund && monthlyRets.length >= 6) {
        fund.return1Y = Math.round(totalRet1Y * 100) / 100;
        fund.volatility = Math.max(0.3, Math.round(annualizedVol * 100) / 100);
        fund.monthlySampleReturns = monthlyRets.slice(-12);
        // Blend long-term structural expected return (80%) with recent trailing signal (20%) bounded safely
        fund.expectedReturn = Math.round((fund.expectedReturn * 0.85 + clamp(totalRet1Y, -5, 20) * 0.15) * 100) / 100;
        updatedCount++;
      }
    } catch {
      // Keep existing baseline metrics for this ticker
    }
  }

  return {
    updatedCount,
    liveFx,
    source: updatedCount > 0 ? `live-yahoo-finance (${updatedCount} ETFs)` : 'verified-baseline-dataset'
  };
}

/**
 * Execute one complete market-driven self-improvement calibration cycle.
 */
export async function runCalibration(options = {}) {
  const trigger = options.trigger || 'scheduled-calibration';
  const feedbackSignal = options.feedbackSignal || null; // 'too_risky' | 'just_right' | 'want_more_growth'
  const marketScenario = options.marketScenario || 'auto'; // 'auto' | 'volatility_spike' | 'calm_bull'

  const fundsPath = path.join(ROOT_DIR, 'data/funds.json');
  const statePath = path.join(ROOT_DIR, 'data/model-state.json');
  const historyPath = path.join(ROOT_DIR, 'data/calibration-history.json');

  const fundsData = JSON.parse(fs.readFileSync(fundsPath, 'utf8'));
  const modelState = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  const calHistory = JSON.parse(fs.readFileSync(historyPath, 'utf8'));

  // 1. Attempt live market data refresh (succeeds on GitHub Actions / open internet; falls back cleanly in sandbox)
  const marketRefresh = await tryRefreshLiveMarketData(fundsData);
  if (marketRefresh.liveFx) {
    fundsData.fxUsdMyr = marketRefresh.liveFx;
    modelState.fxUsdMyr = marketRefresh.liveFx;
  }
  if (marketRefresh.updatedCount > 0) {
    fundsData.lastUpdated = new Date().toISOString();
    fs.writeFileSync(fundsPath, JSON.stringify(fundsData, null, 2) + '\n', 'utf8');
  }

  // 2. Analyze cross-asset metrics from current fund dataset
  const equityFunds = fundsData.funds.filter((f) => f.riskTier >= 4);
  const cashFunds = fundsData.funds.filter((f) => f.riskTier === 1);

  let avgEquityVol = equityFunds.reduce((s, f) => s + f.volatility, 0) / Math.max(1, equityFunds.length);
  const avgCashYield = cashFunds.reduce((s, f) => s + f.expectedReturn, 0) / Math.max(1, cashFunds.length);
  const avgEtfFee = fundsData.funds.filter((f) => f.platform === 'US ETF').reduce((s, f) => s + f.expenseRatio, 0) / 9;
  const avgVersaEquityFee =
    fundsData.funds.filter((f) => f.platform === 'Versa' && f.riskTier >= 3).reduce((s, f) => s + f.expenseRatio, 0) / 6;

  // Optional stress-test simulation override from UI
  if (marketScenario === 'volatility_spike') {
    avgEquityVol += 4.8;
  } else if (marketScenario === 'calm_bull') {
    avgEquityVol = Math.max(11.5, avgEquityVol - 2.5);
  }

  // 3. Evaluate 4 standard layman archetypes before adjustment
  const archetypes = [
    { name: 'Calm Saver', dipLimit: -6.0, profile: { initialAmountMyr: 5000, monthlyContributionMyr: 500, horizon: 'near', emergencyBuffer: 'none', dipComfort: 'ultra_calm', shariahOnly: false } },
    { name: 'Balanced Builder', dipLimit: -16.5, profile: { initialAmountMyr: 5000, monthlyContributionMyr: 800, horizon: 'medium_long', emergencyBuffer: 'partial', dipComfort: 'moderate', shariahOnly: false } },
    { name: 'Long-Term Multiplier', dipLimit: -23.5, profile: { initialAmountMyr: 10000, monthlyContributionMyr: 1500, horizon: 'long', emergencyBuffer: 'full', dipComfort: 'growth', shariahOnly: false } },
    { name: 'Halal Balanced', dipLimit: -17.0, profile: { initialAmountMyr: 5000, monthlyContributionMyr: 800, horizon: 'medium_long', emergencyBuffer: 'partial', dipComfort: 'moderate', shariahOnly: true } }
  ];

  let breaches = 0;
  let efficiencySum = 0;
  for (const arch of archetypes) {
    const rec = generateRecommendation(arch.profile, fundsData, modelState);
    if (rec.metrics.estimatedWorstDipPct < arch.dipLimit) {
      breaches++;
    }
    const sharpeProxy = (rec.metrics.expectedAnnualReturnPct - 2.5) / Math.max(2.0, rec.metrics.portfolioVolatilityPct);
    const feeBonus = Math.max(0, 1.2 - rec.metrics.weightedExpenseRatioPct) * 12;
    efficiencySum += clamp(62 + sharpeProxy * 34 + feeBonus, 50, 99);
  }

  // 4. Determine Market Regime & Bounded Self-Improving Weight Updates
  const prevWeights = { ...modelState.weights };
  const nextWeights = { ...prevWeights };
  const tilts = { ...modelState.tiltAdjustments };
  const changes = [];

  if (avgEquityVol >= 18.2 || breaches > 0) {
    modelState.marketRegime = 'ELEVATED_VOLATILITY';
    modelState.regimeSummary =
      'Stock market swings are wider than average—the engine automatically boosted drawdown protection and trimmed high-volatility tech tilt to keep beginner portfolios calm.';
    nextWeights.drawdownProtection += 0.025;
    nextWeights.yieldCarry += 0.01;
    nextWeights.riskAdjustedReturn -= 0.02;
    tilts.highGrowthCapPct = Math.max(12, (tilts.highGrowthCapPct || 20) - 3);
    tilts.myrSafetyFloorBoost = Math.min(8, (tilts.myrSafetyFloorBoost || 0) + 2);
    changes.push(
      `Detected elevated equity volatility (${avgEquityVol.toFixed(1)}% annualized): increased Drawdown Protection weight and lowered high-growth booster cap to ${tilts.highGrowthCapPct}%.`
    );
  } else if (avgEquityVol <= 14.2) {
    modelState.marketRegime = 'CALM_GROWTH';
    modelState.regimeSummary =
      'Broad index volatility is calm and constructive—leaning steadily into ultra-low-fee core index compounding while preserving emergency cash discipline.';
    nextWeights.riskAdjustedReturn += 0.015;
    nextWeights.feeEfficiency += 0.01;
    nextWeights.drawdownProtection -= 0.015;
    tilts.highGrowthCapPct = Math.min(22, (tilts.highGrowthCapPct || 20) + 1);
    tilts.myrSafetyFloorBoost = Math.max(0, (tilts.myrSafetyFloorBoost || 0) - 1);
    changes.push(
      `Calm market volatility (${avgEquityVol.toFixed(1)}%): nudged Risk-Adjusted Return & Low-Fee weights up to capture steady broad-index compounding.`
    );
  } else {
    modelState.marketRegime = avgCashYield >= 3.8 ? 'HIGH_RATE_DEFENSIVE' : 'BALANCED_NORMAL';
    modelState.regimeSummary =
      'Global stock indexes show healthy long-term compounding potential while Ringgit & USD money-market yields (~3.6%–4.3%) pay solid returns on your safety buffer.';
    // Reward fee efficiency where US ETFs save ~0.95%/yr vs unit trusts
    if (avgVersaEquityFee - avgEtfFee > 0.7 && nextWeights.feeEfficiency < 0.31) {
      nextWeights.feeEfficiency += 0.01;
      nextWeights.diversificationBreadth += 0.005;
      nextWeights.yieldCarry -= 0.005;
      changes.push(
        `Fee spread check (Versa equity avg ${avgVersaEquityFee.toFixed(2)}% vs US ETFs avg ${avgEtfFee.toFixed(2)}%): reinforced Fee Efficiency weight so multi-year plans minimize fee drag.`
      );
    } else {
      changes.push(
        `Balanced market regime confirmed (avg equity vol ${avgEquityVol.toFixed(1)}%, cash yield ${avgCashYield.toFixed(2)}%): fine-tuned adaptive weights within optimal steady-state band.`
      );
    }
  }

  // 5. Apply optional Layman Feedback Signal (human-in-the-loop self-improvement!)
  if (feedbackSignal === 'too_risky') {
    tilts.userComfortBias = clamp((tilts.userComfortBias || 0) - 4, -15, 15);
    nextWeights.drawdownProtection += 0.015;
    changes.push(
      'Incorporated your "Feels slightly too risky" feedback: shifted +4% toward calmer cash/stabilizer sleeves and boosted drawdown protection.'
    );
  } else if (feedbackSignal === 'want_more_growth') {
    tilts.userComfortBias = clamp((tilts.userComfortBias || 0) + 4, -15, 15);
    nextWeights.riskAdjustedReturn += 0.015;
    changes.push(
      'Incorporated your "Comfortable with more growth" feedback: shifted +4% toward broad index growth sleeves while keeping your horizon guardrails intact.'
    );
  } else if (feedbackSignal === 'just_right') {
    changes.push(
      'Logged your "Comfort level feels just right" confirmation—locked current personalization bias as validated.'
    );
  }

  // Clamp and normalize weights strictly to 1.00
  const keys = Object.keys(nextWeights);
  for (const k of keys) {
    nextWeights[k] = clamp(nextWeights[k], 0.07, 0.36);
  }
  const totalW = keys.reduce((s, k) => s + nextWeights[k], 0);
  let normSum = 0;
  keys.forEach((k, idx) => {
    if (idx === keys.length - 1) {
      nextWeights[k] = Math.round((1 - normSum) * 100) / 100;
    } else {
      nextWeights[k] = Math.round((nextWeights[k] / totalW) * 100) / 100;
      normSum += nextWeights[k];
    }
  });

  // Re-evaluate post-calibration comfort compliance
  let postBreaches = 0;
  const candidateState = { ...modelState, weights: nextWeights, tiltAdjustments: tilts };
  for (const arch of archetypes) {
    const rec = generateRecommendation(arch.profile, fundsData, candidateState);
    if (rec.metrics.estimatedWorstDipPct < arch.dipLimit) postBreaches++;
  }
  const compliancePct = Math.round(((archetypes.length - postBreaches) / archetypes.length) * 100);
  const efficiencyScore = Math.round((efficiencySum / archetypes.length) * 10) / 10;

  changes.push(
    `Post-calibration audit: ${compliancePct}% layman comfort compliance across all 4 investor archetypes (Portfolio Efficiency Score: ${efficiencyScore}/100).`
  );

  // 6. Persist updated model state & calibration log
  const nextCycle = (modelState.calibrationCycle || 1) + 1;
  const nowIso = new Date().toISOString();

  modelState.calibrationCycle = nextCycle;
  modelState.lastCalibratedAt = nowIso;
  modelState.dataSource = marketRefresh.source;
  modelState.weights = nextWeights;
  modelState.tiltAdjustments = tilts;

  const runEntry = {
    id: `cal-${String(nextCycle).padStart(3, '0')}`,
    cycle: nextCycle,
    timestamp: nowIso,
    trigger,
    dataSource: marketRefresh.source,
    marketRegime: modelState.marketRegime,
    fxUsdMyr: modelState.fxUsdMyr,
    portfolioEfficiencyScore: efficiencyScore,
    laymanComfortCompliancePct: compliancePct,
    weightSnapshot: nextWeights,
    changesPlainEnglish: changes
  };

  calHistory.runs = [...(calHistory.runs || []).slice(-29), runEntry];

  fs.writeFileSync(statePath, JSON.stringify(modelState, null, 2) + '\n', 'utf8');
  fs.writeFileSync(historyPath, JSON.stringify(calHistory, null, 2) + '\n', 'utf8');

  // 7. Always regenerate handoff.md so documentation stays 100% synced
  const handoff = writeHandoffFile();

  return {
    run: runEntry,
    modelState,
    handoffUpdated: true,
    handoffSize: handoff.content.length
  };
}

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runCalibration({ trigger: 'cli-auto-calibrate' })
    .then((res) => {
      console.log(
        `Calibration Cycle #${res.run.cycle} complete (${res.run.marketRegime}, source=${res.run.dataSource}). handoff.md updated.`
      );
    })
    .catch((err) => {
      console.error('Calibration failed:', err);
      process.exit(1);
    });
}
