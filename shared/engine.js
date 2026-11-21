/**
 * Shared Quantitative Scoring, Layman Portfolio Planner & Projection Engine
 * Pure ES module shared between Express backend, calibration CLI, tests, and React UI.
 */

export const HORIZON_LABELS = {
  short: 'Under 1 year (Need cash soon)',
  near: '1 to 3 years (Near-term goal)',
  medium_long: '3 to 7 years (Medium-term wealth)',
  long: '7+ years (Long-term wealth freedom)'
};

export const BUFFER_LABELS = {
  none: 'Not yet — help me build a safety net too',
  partial: 'Partly covered (1–2 months saved)',
  full: 'Fully covered (3–6+ months safe cash)'
};

export const COMFORT_LABELS = {
  ultra_calm: 'Keep it very steady (Max ~2–4% temporary dip)',
  gentle: 'Small ups & downs okay (~8–10% temporary dip)',
  moderate: 'Balanced mindset (~14–18% temporary dip for solid growth)',
  growth: 'Long-term builder (~20–25% temporary dip for higher wealth)'
};

/**
 * Compute adaptive 0-100 score for a fund given current self-improving model weights.
 */
export function scoreFund(fund, modelState) {
  const weights = modelState?.weights || {
    feeEfficiency: 0.28,
    riskAdjustedReturn: 0.27,
    drawdownProtection: 0.22,
    diversificationBreadth: 0.14,
    yieldCarry: 0.09
  };

  // 1. Fee efficiency (0.03% -> ~98.4, 1.35% -> ~25.8)
  const feeScore = clamp(100 - fund.expenseRatio * 55, 15, 100);

  // 2. Risk-adjusted return efficiency (stabilized denominator for money market funds)
  const effVol = Math.max(fund.volatility, 2.2);
  const rawEfficiency = (fund.expectedReturn - 2.0) / effVol;
  const riskAdjScore = clamp(35 + rawEfficiency * 72, 20, 98);

  // 3. Drawdown protection (0% drawdown -> 100, -32% drawdown -> ~16.8)
  const drawdownScore = clamp(100 - Math.abs(fund.maxDrawdown) * 2.6, 10, 100);

  // 4. Broad non-individual stock diversification breadth
  let breadthScore = 72;
  const hc = String(fund.holdingsCount || '');
  if (hc.includes('9,500') || hc.includes('3,600') || hc.includes('2,500')) breadthScore = 98;
  else if (hc.includes('1,500') || hc.includes('500')) breadthScore = 94;
  else if (hc.includes('300') || hc.includes('230') || hc.includes('200')) breadthScore = 88;
  else if (hc.includes('100')) breadthScore = 82;

  // 5. Cash / Dividend Carry score
  const yieldScore = clamp(30 + (fund.dividendYield || 0) * 16, 30, 96);

  const composite =
    feeScore * weights.feeEfficiency +
    riskAdjScore * weights.riskAdjustedReturn +
    drawdownScore * weights.drawdownProtection +
    breadthScore * weights.diversificationBreadth +
    yieldScore * weights.yieldCarry;

  return {
    total: round1(composite),
    breakdown: {
      feeScore: round1(feeScore),
      riskAdjScore: round1(riskAdjScore),
      drawdownScore: round1(drawdownScore),
      breadthScore: round1(breadthScore),
      yieldScore: round1(yieldScore)
    }
  };
}

/**
 * Score all funds and attach quantitative scores.
 */
export function rankUniverse(funds, modelState, shariahOnly = false) {
  return funds
    .filter((f) => (!shariahOnly ? true : f.shariah === true))
    .map((fund) => {
      const score = scoreFund(fund, modelState);
      return {
        ...fund,
        modelScore: score.total,
        scoreBreakdown: score.breakdown
      };
    })
    .sort((a, b) => b.modelScore - a.modelScore);
}

/**
 * Determine role bucket targets based on layman profile + self-improving model adjustments.
 */
export function computeBucketTargets(profile, modelState) {
  const horizon = profile.horizon || 'medium_long';
  const buffer = profile.emergencyBuffer || 'partial';
  const comfort = profile.dipComfort || 'moderate';
  const tilts = modelState?.tiltAdjustments || {
    myrSafetyFloorBoost: 0,
    highGrowthCapPct: 20,
    userComfortBias: 0
  };

  // Base equity appetite (0 to 85)
  const horizonBase = {
    short: 0,
    near: 30,
    medium_long: 60,
    long: 78
  }[horizon] ?? 60;

  const comfortMod = {
    ultra_calm: -35,
    gentle: -18,
    moderate: 0,
    growth: 12
  }[comfort] ?? 0;

  const bufferMod = {
    none: -22,
    partial: -8,
    full: 5
  }[buffer] ?? -8;

  // Calibration & user feedback bias (-15 to +15)
  const learnedBias = clamp((tilts.userComfortBias || 0) - (tilts.myrSafetyFloorBoost || 0), -15, 15);

  let growthTotal = clamp(horizonBase + comfortMod + bufferMod + learnedBias, 0, 85);
  if (horizon === 'short') {
    growthTotal = 0; // Fiduciary rule: never put <1yr cash into volatile equities
  } else if (comfort === 'ultra_calm') {
    growthTotal = Math.min(growthTotal, 15);
  }

  // Minimum safe MYR cash floor
  let minCash = 15;
  if (horizon === 'short') minCash = 80;
  else if (buffer === 'none') minCash = Math.max(35, 100 - growthTotal - 15);
  else if (buffer === 'partial') minCash = Math.max(20, 50 - Math.round(growthTotal * 0.4));
  else minCash = Math.max(10, 35 - Math.round(growthTotal * 0.3));

  minCash = clamp(minCash + (tilts.myrSafetyFloorBoost || 0), 10, 90);

  if (minCash + growthTotal > 100) {
    growthTotal = Math.max(0, 100 - minCash);
  }

  const stabilizer = Math.max(0, 100 - minCash - growthTotal);

  // Split growthTotal into core_growth vs high_growth booster
  let highGrowth = 0;
  if (growthTotal >= 45 && (comfort === 'moderate' || comfort === 'growth') && (horizon === 'medium_long' || horizon === 'long')) {
    const rawBooster = comfort === 'growth' ? Math.round(growthTotal * 0.26) : Math.round(growthTotal * 0.18);
    highGrowth = Math.min(rawBooster, tilts.highGrowthCapPct ?? 20);
  }
  const coreGrowth = growthTotal - highGrowth;

  return {
    cash: minCash,
    stabilizer,
    core_growth: coreGrowth,
    high_growth: highGrowth
  };
}

/**
 * Build a complete layman-friendly recommendation with exact fund allocations, RM amounts,
 * scenario projections, and plain-English guidance.
 */
export function generateRecommendation(rawProfile, fundsData, modelState) {
  const profile = {
    initialAmountMyr: Math.max(0, Number(rawProfile?.initialAmountMyr ?? 5000)),
    monthlyContributionMyr: Math.max(0, Number(rawProfile?.monthlyContributionMyr ?? 800)),
    horizon: rawProfile?.horizon || 'medium_long',
    emergencyBuffer: rawProfile?.emergencyBuffer || 'partial',
    dipComfort: rawProfile?.dipComfort || 'moderate',
    shariahOnly: Boolean(rawProfile?.shariahOnly),
    projectionYears: clamp(Number(rawProfile?.projectionYears ?? 10), 1, 25)
  };

  const allFunds = fundsData?.funds || [];
  const ranked = rankUniverse(allFunds, modelState, profile.shariahOnly);
  const buckets = computeBucketTargets(profile, modelState);
  const smallMonthlyBudget = profile.monthlyContributionMyr > 0 && profile.monthlyContributionMyr < 300;

  const byId = Object.fromEntries(ranked.map((f) => [f.id, f]));
  const rawSleeves = [];

  // 1. Safe MYR Cash Base (Versa Cash / Versa Cash-i)
  if (buckets.cash > 0) {
    const cashFund = profile.shariahOnly ? byId['versa-cash-i'] : byId['versa-cash'];
    if (cashFund) {
      rawSleeves.push({
        fund: cashFund,
        weight: buckets.cash,
        sleeveRole: 'Safe MYR Base',
        laymanJob:
          profile.emergencyBuffer === 'none'
            ? 'Builds your Ringgit emergency cushion first while earning daily cash returns (~3.6% p.a.) with zero lock-in.'
            : 'Keeps ready-to-use Ringgit earning steady daily returns and acts as dry powder during market sales.'
      });
    }
  }

  // 2. Stabilizer / Cushion Sleeve
  if (buckets.stabilizer > 0) {
    if (profile.shariahOnly) {
      // Split or pick between SPSK (USD Sukuk) and Versa Gold depending on size
      const spsk = byId['etf-spsk'];
      const gold = byId['versa-gold'];
      if (buckets.stabilizer >= 20 && spsk && gold && !smallMonthlyBudget) {
        const goldW = Math.min(10, Math.round(buckets.stabilizer * 0.35));
        const spskW = buckets.stabilizer - goldW;
        rawSleeves.push({
          fund: spsk,
          weight: spskW,
          sleeveRole: 'USD Halal Cushion',
          laymanJob: 'Holds global investment-grade USD Sukuk to steady your portfolio when stock markets swing.'
        });
        rawSleeves.push({
          fund: gold,
          weight: goldW,
          sleeveRole: 'Inflation Shield',
          laymanJob: 'Physical-backed Shariah gold inside Versa to protect against inflation and global crises.'
        });
      } else {
        const chosen = smallMonthlyBudget ? (gold || spsk) : (spsk || gold);
        if (chosen) {
          rawSleeves.push({
            fund: chosen,
            weight: buckets.stabilizer,
            sleeveRole: 'Portfolio Cushion',
            laymanJob: 'Smooths out stock market bumps while diversifying beyond pure Ringgit cash.'
          });
        }
      }
    } else {
      // Conventional stabilizer selection guided by horizon & model scores
      if (profile.horizon === 'short' || profile.dipComfort === 'ultra_calm') {
        const sgov = byId['etf-sgov'];
        const vsaSgd = byId['versa-sgd'];
        const chosen = smallMonthlyBudget ? vsaSgd : (sgov || vsaSgd);
        if (chosen) {
          rawSleeves.push({
            fund: chosen,
            weight: buckets.stabilizer,
            sleeveRole: 'Foreign Currency Safety',
            laymanJob: 'Earns steady yield in strong currency (USD/SGD) with minimal price swings.'
          });
        }
      } else {
        const versaMod = byId['versa-moderate'];
        const schd = byId['etf-schd'];
        const sgov = byId['etf-sgov'];
        if (smallMonthlyBudget && versaMod) {
          rawSleeves.push({
            fund: versaMod,
            weight: buckets.stabilizer,
            sleeveRole: 'Balanced MYR Cushion',
            laymanJob: 'Auto-balanced 50/50 global bonds & shares in MYR—avoids small-ticket broker FX fees.'
          });
        } else if (buckets.stabilizer >= 18 && schd && sgov) {
          const sgovW = Math.round(buckets.stabilizer * 0.45);
          const schdW = buckets.stabilizer - sgovW;
          rawSleeves.push({
            fund: sgov,
            weight: sgovW,
            sleeveRole: 'USD T-Bill Cushion',
            laymanJob: 'Ultra-safe US Government T-Bills (~4.3% yield) keeping part of your savings in US Dollars.'
          });
          rawSleeves.push({
            fund: schd,
            weight: schdW,
            sleeveRole: 'Quality Cash-Flow Equities',
            laymanJob: '100 profitable, cash-rich US companies that typically fall less than tech stocks in downturns.'
          });
        } else {
          const bestStab = [versaMod, schd, sgov].filter(Boolean).sort((a, b) => b.modelScore - a.modelScore)[0];
          if (bestStab) {
            rawSleeves.push({
              fund: bestStab,
              weight: buckets.stabilizer,
              sleeveRole: 'Portfolio Stabilizer',
              laymanJob: 'Acts as a shock absorber between safe Ringgit cash and pure stock growth.'
            });
          }
        }
      }
    }
  }

  // 3. Core Broad-Market Growth Engine (Versa Invest + US Non-Individual Stock ETF blend)
  if (buckets.core_growth > 0) {
    if (profile.shariahOnly) {
      const spus = byId['etf-spus'];
      const versaGlobalI = byId['versa-global-i'] || byId['versa-growth-i'];
      if (smallMonthlyBudget && versaGlobalI) {
        // Favor MYR Versa Global-i for small RM monthly amounts, with optional SPUS sleeve
        const versaW = Math.round(buckets.core_growth * 0.65);
        const spusW = buckets.core_growth - versaW;
        rawSleeves.push({
          fund: versaGlobalI,
          weight: versaW,
          sleeveRole: 'MYR Halal Global Core',
          laymanJob: 'Hands-off global Shariah stocks directly in Ringgit—easy RM100 monthly auto-debit.'
        });
        if (spusW >= 10 && spus) {
          rawSleeves.push({
            fund: spus,
            weight: spusW,
            sleeveRole: 'US Halal S&P 500 Core',
            laymanJob: '200+ top debt-light US companies (SPUS) with much lower annual fees (0.45%) for long-term compounding.'
          });
        } else {
          rawSleeves[rawSleeves.length - 1].weight += spusW;
        }
      } else if (spus && versaGlobalI) {
        const spusW = Math.round(buckets.core_growth * 0.72);
        const versaW = buckets.core_growth - spusW;
        rawSleeves.push({
          fund: spus,
          weight: spusW,
          sleeveRole: 'US Halal S&P 500 Core',
          laymanJob: 'Your main wealth engine: 200+ leading halal US companies in one diversified ETF—zero single-stock gamble.'
        });
        if (versaW >= 8) {
          rawSleeves.push({
            fund: versaGlobalI,
            weight: versaW,
            sleeveRole: 'MYR Halal Global Sleeve',
            laymanJob: 'Adds European/Asian halal leaders effortlessly in Ringgit via Versa.'
          });
        } else {
          rawSleeves[rawSleeves.length - 1].weight += versaW;
        }
      }
    } else {
      // Conventional Core Growth: Blend highest-scoring US broad index (VOO/VTI) + Global/Versa sleeve
      const usCoreCandidates = [byId['etf-voo'], byId['etf-vti']].filter(Boolean).sort((a, b) => b.modelScore - a.modelScore);
      const primaryUsCore = usCoreCandidates[0];
      const worldCore = byId['etf-vt'];
      const versaGrowth = byId['versa-growth'];

      if (smallMonthlyBudget && versaGrowth && primaryUsCore) {
        const versaW = Math.round(buckets.core_growth * 0.55);
        const usW = buckets.core_growth - versaW;
        rawSleeves.push({
          fund: versaGrowth,
          weight: versaW,
          sleeveRole: 'Hands-Off MYR Global Growth',
          laymanJob: 'Global stock portfolio inside Versa in Ringgit—zero currency conversion fees on smaller monthly top-ups.'
        });
        rawSleeves.push({
          fund: primaryUsCore,
          weight: usW,
          sleeveRole: 'Ultra-Low-Fee US Index Core',
          laymanJob: `Owns ${primaryUsCore.holdingsCount} at just 0.03% annual fee so compound growth stays in your pocket.`
        });
      } else if (primaryUsCore) {
        // Larger budget: emphasize ultra-low-cost US ETF + Versa Growth or VT diversifier
        const usW = Math.round(buckets.core_growth * 0.72);
        const remW = buckets.core_growth - usW;
        rawSleeves.push({
          fund: primaryUsCore,
          weight: usW,
          sleeveRole: 'Core US Market Engine',
          laymanJob: `Your main wealth builder: owns ${primaryUsCore.holdingsCount} automatically at a tiny 0.03% fee.`
        });
        const secondary = versaGrowth && remW <= 16 ? versaGrowth : (worldCore || versaGrowth);
        if (remW >= 8 && secondary) {
          rawSleeves.push({
            fund: secondary,
            weight: remW,
            sleeveRole: secondary.platform === 'Versa' ? 'Automated MYR Equity Sleeve' : 'Global All-World Diversifier',
            laymanJob:
              secondary.platform === 'Versa'
                ? 'Effortless Ringgit global stock sleeve inside Versa so all spare RM gets invested smoothly.'
                : 'Spreads risk across 45+ countries outside the US so you never rely on one economy alone.'
          });
        } else {
          rawSleeves[rawSleeves.length - 1].weight += remW;
        }
      }
    }
  }

  // 4. High-Growth / Satellite Booster
  if (buckets.high_growth > 0) {
    const booster = profile.shariahOnly ? byId['etf-hlal'] : byId['etf-qqqm'];
    if (booster) {
      rawSleeves.push({
        fund: booster,
        weight: buckets.high_growth,
        sleeveRole: 'Long-Term Growth Booster',
        laymanJob: profile.shariahOnly
          ? 'Adds 230+ US halal large & mid-cap growth leaders (HLAL) for extra multi-year upside.'
          : 'Adds 100 top Nasdaq innovation leaders (QQQM at 0.15% fee) for higher 7+ year compounding without picking single tech stocks.'
      });
    }
  }

  // Merge any duplicate funds if selected twice & normalize integer weights to exact 100%
  const mergedMap = new Map();
  for (const item of rawSleeves) {
    if (!item.fund || item.weight <= 0) continue;
    if (mergedMap.has(item.fund.id)) {
      mergedMap.get(item.fund.id).weight += item.weight;
    } else {
      mergedMap.set(item.fund.id, { ...item });
    }
  }

  const allocations = normalizeAllocations(Array.from(mergedMap.values()), profile);

  // Portfolio-level metrics (including realistic imperfect correlation dampening across cash/bonds/gold/equities)
  let weightedReturn = 0;
  let weightedFee = 0;
  let weightedLinearVol = 0;
  let weightedMaxDrawdown = 0;
  let versaSharePct = 0;
  let usEtfSharePct = 0;

  for (const item of allocations) {
    const w = item.weight / 100;
    weightedReturn += item.fund.expectedReturn * w;
    weightedFee += item.fund.expenseRatio * w;
    weightedLinearVol += item.fund.volatility * w;
    weightedMaxDrawdown += item.fund.maxDrawdown * w;
    if (item.fund.platform === 'Versa') versaSharePct += item.weight;
    else usEtfSharePct += item.weight;
  }

  // Diversification benefit across MYR cash + stabilizers + global/US stocks (~12% vol dampening when balanced)
  const diversificationFactor = versaSharePct >= 15 && usEtfSharePct >= 15 ? 0.88 : 0.94;
  const portfolioVolatility = round2(weightedLinearVol * diversificationFactor);
  const estimatedWorstDipPct = round1(weightedMaxDrawdown * diversificationFactor);
  const netExpectedReturn = round2(weightedReturn); // fund expectedReturn values are already net of fund expense ratio
  const annualFeePer1000Myr = round2(weightedFee * 10);

  // Projections year-by-year
  const projections = buildProjections(
    profile.initialAmountMyr,
    profile.monthlyContributionMyr,
    netExpectedReturn,
    portfolioVolatility,
    profile.projectionYears
  );

  const planIdentity = describePlanIdentity(profile, versaSharePct, usEtfSharePct, netExpectedReturn, estimatedWorstDipPct);

  return {
    generatedAt: new Date().toISOString(),
    profile,
    buckets,
    planIdentity,
    metrics: {
      expectedAnnualReturnPct: netExpectedReturn,
      weightedExpenseRatioPct: round2(weightedFee),
      annualFeePer1000Myr,
      portfolioVolatilityPct: portfolioVolatility,
      estimatedWorstDipPct,
      versaSharePct,
      usEtfSharePct,
      sample10kNormalYearMyr: Math.round(10000 * (1 + netExpectedReturn / 100)),
      sample10kRoughYearMyr: Math.round(10000 * (1 + estimatedWorstDipPct / 100))
    },
    allocations,
    projections,
    laymanSummary: buildLaymanNarrative(profile, allocations, {
      netExpectedReturn,
      estimatedWorstDipPct,
      annualFeePer1000Myr,
      versaSharePct,
      usEtfSharePct
    }, modelState)
  };
}

function normalizeAllocations(items, profile) {
  if (items.length === 0) return [];
  const sum = items.reduce((acc, i) => acc + i.weight, 0);
  let running = 0;
  const normalized = items.map((item, idx) => {
    const w = idx === items.length - 1 ? 100 - running : Math.round((item.weight / sum) * 100);
    running += w;
    return {
      fundId: item.fund.id,
      ticker: item.fund.ticker,
      name: item.fund.name,
      platform: item.fund.platform,
      currency: item.fund.currency,
      shariah: item.fund.shariah,
      category: item.fund.category,
      holdingsCount: item.fund.holdingsCount,
      expenseRatio: item.fund.expenseRatio,
      expectedReturn: item.fund.expectedReturn,
      maxDrawdown: item.fund.maxDrawdown,
      modelScore: item.fund.modelScore,
      sleeveRole: item.sleeveRole,
      laymanJob: item.laymanJob,
      laymanOneLiner: item.fund.laymanOneLiner,
      malaysiaTip: item.fund.malaysiaTip,
      weight: w,
      initialMyr: Math.round((profile.initialAmountMyr * w) / 100),
      monthlyMyr: Math.round((profile.monthlyContributionMyr * w) / 100),
      fund: item.fund
    };
  });

  // Ensure rounding sums match exact initialAmountMyr and monthlyContributionMyr
  if (normalized.length > 0) {
    const initDiff = profile.initialAmountMyr - normalized.reduce((s, x) => s + x.initialMyr, 0);
    const monDiff = profile.monthlyContributionMyr - normalized.reduce((s, x) => s + x.monthlyMyr, 0);
    normalized[0].initialMyr += initDiff;
    normalized[0].monthlyMyr += monDiff;
  }

  return normalized.sort((a, b) => b.weight - a.weight);
}

export function buildProjections(initialMyr, monthlyMyr, annualReturnPct, volatilityPct, years) {
  const points = [];
  const rExpected = annualReturnPct / 100 / 12;
  const cautiousAnnual = Math.max(2.2, annualReturnPct - Math.max(1.2, volatilityPct * 0.28));
  const strongAnnual = annualReturnPct + Math.max(1.0, volatilityPct * 0.22);
  const rCautious = cautiousAnnual / 100 / 12;
  const rStrong = strongAnnual / 100 / 12;

  let expBal = initialMyr;
  let cauBal = initialMyr;
  let strBal = initialMyr;
  let contrib = initialMyr;

  points.push({
    year: 0,
    contributedMyr: Math.round(contrib),
    expectedMyr: Math.round(expBal),
    cautiousMyr: Math.round(cauBal),
    strongMyr: Math.round(strBal)
  });

  for (let y = 1; y <= years; y++) {
    for (let m = 0; m < 12; m++) {
      expBal = expBal * (1 + rExpected) + monthlyMyr;
      cauBal = cauBal * (1 + rCautious) + monthlyMyr;
      strBal = strBal * (1 + rStrong) + monthlyMyr;
      contrib += monthlyMyr;
    }
    points.push({
      year: y,
      contributedMyr: Math.round(contrib),
      expectedMyr: Math.round(expBal),
      cautiousMyr: Math.round(cauBal),
      strongMyr: Math.round(strBal)
    });
  }

  return points;
}

function describePlanIdentity(profile, versaSharePct, usEtfSharePct, netReturn, worstDip) {
  const prefix = profile.shariahOnly ? 'Shariah ' : '';
  let archetype = 'Balanced Core-Growth Plan';
  if (usEtfSharePct + (100 - versaSharePct) <= 20 || profile.horizon === 'short') {
    archetype = 'Capital Shield & Steady Cash Plan';
  } else if (Math.abs(worstDip) <= 10) {
    archetype = 'Calm Steady-Builder Plan';
  } else if (Math.abs(worstDip) >= 18) {
    archetype = 'Long-Term Wealth Multiplier Plan';
  }

  return {
    title: `${prefix}${archetype}`,
    subtitle: `${versaSharePct}% Versa (MYR) · ${usEtfSharePct}% US Broad ETFs (USD)`,
    badge: profile.shariahOnly ? '100% Shariah-Compliant (-i & Halal ETFs)' : 'Zero Individual Stock Risk · Index + Cash Blend',
    targetSummary: `Targets ~${netReturn}%/yr long-term average with an estimated rough-year cushion around ${worstDip}%.`
  };
}

function buildLaymanNarrative(profile, allocations, stats, modelState) {
  const reasons = [];

  if (profile.horizon === 'short') {
    reasons.push(
      'Because you may need this money within 1 year, the engine intentionally avoids volatile stock funds so a sudden market dip never delays your plans.'
    );
  } else if (profile.emergencyBuffer === 'none') {
    reasons.push(
      'Since you are still building an emergency fund, a larger Versa Cash Ringgit base is locked in first—so unexpected life bills never force you to sell US ETFs at a bad time.'
    );
  } else {
    reasons.push(
      `Combines Versa in Ringgit (${stats.versaSharePct}%) for instant Malaysian liquidity with ultra-low-fee US index ETFs (${stats.usEtfSharePct}%) that own hundreds of top businesses automatically.`
    );
  }

  reasons.push(
    `Zero single-stock guesswork: instead of betting on 1 or 2 hype companies, your money is spread across ${allocations.length} diversified baskets at an average fee of just RM ${stats.annualFeePer1000Myr.toFixed(2)} per year for every RM 1,000 invested.`
  );

  reasons.push(
    `Calibrated under the "${modelState?.marketRegime || 'BALANCED_NORMAL'}" market regime (Cycle #${modelState?.calibrationCycle || 1}), matching your stated "${COMFORT_LABELS[profile.dipComfort] || profile.dipComfort}" comfort level.`
  );

  const versaMonthly = allocations.filter((a) => a.platform === 'Versa').reduce((s, a) => s + a.monthlyMyr, 0);
  const etfMonthly = allocations.filter((a) => a.platform === 'US ETF').reduce((s, a) => s + a.monthlyMyr, 0);

  const routine = [
    versaMonthly > 0
      ? `Payday Step 1 (Versa MYR): Auto-transfer RM ${versaMonthly.toLocaleString()}/month into your Versa fund(s)—takes 2 minutes via FPX/DuitNow with zero sales fee.`
      : 'Payday Step 1: Keep 3–6 months of living expenses untouched in Versa Cash / Cash-i.',
    etfMonthly > 0
      ? etfMonthly < 250
        ? `Payday Step 2 (Smart FX Tip): Since your US ETF slice is RM ${etfMonthly.toLocaleString()}/month, park it in Versa Cash monthly and buy your US ETF(s) once every 2–3 months to minimize broker currency conversion fees.`
        : `Payday Step 2 (US ETFs): Invest RM ${etfMonthly.toLocaleString()}/month (~USD ${Math.round(etfMonthly / (modelState?.fxUsdMyr || 4.42))}) into your broad US ETF basket regardless of market headlines.`
      : 'Payday Step 2: Once your short-term goal or emergency buffer is complete, shift horizon to 3–7+ years to unlock US index ETF growth.',
    'Every 6 Months: Check this dashboard once every 6 months—if any fund drifted more than 5% off target, top up the lagging slice. Ignore daily market noise!'
  ];

  return {
    whyThisFitsYou: reasons,
    roughYearReality: `On every RM 10,000 invested, a normal year averages around RM ${Math.round(10000 * (1 + stats.netExpectedReturn / 100)).toLocaleString()}, while a rough global downturn year could temporarily show ~RM ${Math.round(10000 * (1 + stats.estimatedWorstDipPct / 100)).toLocaleString()} before recovering. Staying invested through those dips is where index wealth comes from.`,
    monthlyActionRoutine: routine
  };
}

function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}

function round1(val) {
  return Math.round(val * 10) / 10;
}

function round2(val) {
  return Math.round(val * 100) / 100;
}
