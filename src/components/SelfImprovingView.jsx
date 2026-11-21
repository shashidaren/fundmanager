import React from 'react';
import {
  Cpu,
  RefreshCw,
  ShieldAlert,
  Sun,
  ThumbsUp,
  Activity,
  History,
  CheckCircle2,
  Sliders
} from 'lucide-react';

const WEIGHT_LABELS = {
  feeEfficiency: {
    label: 'Low Fee Efficiency',
    desc: 'Rewards ultra-low-cost ETFs (0.03%–0.45%) so less of your growth leaks to fund managers.'
  },
  riskAdjustedReturn: {
    label: 'Return per Unit of Risk',
    desc: 'Prioritizes baskets that earn strong long-term compounding relative to their ups and downs.'
  },
  drawdownProtection: {
    label: 'Crash & Dip Protection',
    desc: 'Penalizes deep historical drops—automatically boosted when market volatility spikes.'
  },
  diversificationBreadth: {
    label: 'Broad Index Breadth',
    desc: 'Rewards funds owning hundreds or thousands of companies rather than narrow concentration.'
  },
  yieldCarry: {
    label: 'Steady Cash & Sukuk Yield',
    desc: 'Credits reliable daily interest/profit on Versa Cash, SGOV T-Bills, and SPSK Sukuk.'
  }
};

export default function SelfImprovingView({
  modelState,
  calibrationHistory,
  onRunCalibration,
  isCalibrating
}) {
  const weights = modelState?.weights || {};
  const tilts = modelState?.tiltAdjustments || {};
  const runs = [...(calibrationHistory?.runs || [])].reverse();

  return (
    <div className="space-y-6">
      {/* Top Status & Market-Driven Trigger Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200">
              <Cpu className="w-3.5 h-3.5" />
              Cycle #{modelState?.calibrationCycle || 1} · Regime: {modelState?.marketRegime}
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Market-Driven Self-Improving Calibration Engine
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {modelState?.regimeSummary}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={isCalibrating}
              onClick={() => onRunCalibration({ trigger: 'dashboard-auto-calibrate', marketScenario: 'auto' })}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${isCalibrating ? 'animate-spin' : ''}`} />
              {isCalibrating ? 'Calibrating...' : 'Run Market Calibration Now'}
            </button>
          </div>
        </div>

        {/* Scenario Stress-Test Controls + Human Comfort Loop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-indigo-600" />
              Test Market Regime Adaptation
            </div>
            <p className="text-xs text-slate-600">
              Watch how the engine automatically shifts scoring weights and high-growth caps when markets get stormy vs calm:
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={isCalibrating}
                onClick={() =>
                  onRunCalibration({ trigger: 'stress-test:volatility-spike', marketScenario: 'volatility_spike' })
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 cursor-pointer"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                Simulate Market Storm
              </button>
              <button
                type="button"
                disabled={isCalibrating}
                onClick={() => onRunCalibration({ trigger: 'stress-test:calm-bull', marketScenario: 'calm_bull' })}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 cursor-pointer"
              >
                <Sun className="w-3.5 h-3.5" />
                Simulate Calm Bull Market
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <ThumbsUp className="w-3.5 h-3.5 text-teal-600" />
              Teach the Engine Your Personal Comfort
            </div>
            <p className="text-xs text-slate-600">
              Tell the planner how the proposed recommendation feels—it updates your comfort bias and logs it to <code className="font-mono text-teal-800">handoff.md</code>:
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={isCalibrating}
                onClick={() => onRunCalibration({ feedbackSignal: 'too_risky' })}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 cursor-pointer"
              >
                Feels a bit too risky
              </button>
              <button
                type="button"
                disabled={isCalibrating}
                onClick={() => onRunCalibration({ feedbackSignal: 'just_right' })}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-300 cursor-pointer"
              >
                Feels just right ✓
              </button>
              <button
                type="button"
                disabled={isCalibrating}
                onClick={() => onRunCalibration({ feedbackSignal: 'want_more_growth' })}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 cursor-pointer"
              >
                Want slightly more growth
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Active Scoring Weights & Guardrails */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-teal-600" />
              Active Self-Improving Scoring Weights (100% Total)
            </h3>
            <span className="text-xs text-slate-500 font-mono">Bounded Safe Learning</span>
          </div>

          <div className="space-y-3.5">
            {Object.entries(WEIGHT_LABELS).map(([key, meta]) => {
              const pct = Math.round((weights[key] || 0) * 100);
              return (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="font-semibold text-slate-800">{meta.label}</span>
                    <span className="font-bold text-teal-800 tabular-nums">{pct}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-teal-600 to-indigo-600 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, pct * 2.4)}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500">{meta.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900">Active Beginner Safety Guardrails</h3>
          <p className="text-xs text-slate-500">
            Even as the model learns from market returns, hard fiduciary rules prevent reckless concentration:
          </p>

          <div className="space-y-3 tabular-nums">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-800">High-Growth Booster Cap (QQQM / HLAL)</div>
                <div className="text-[11px] text-slate-500">Prevents tech-bubble overexposure</div>
              </div>
              <span className="text-base font-bold text-indigo-700">{tilts.highGrowthCapPct ?? 20}% max</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-800">Extra MYR Cash Safety Floor</div>
                <div className="text-[11px] text-slate-500">Added automatically in stormy regimes</div>
              </div>
              <span className="text-base font-bold text-teal-700">+{tilts.myrSafetyFloorBoost ?? 0}%</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-800">Learned Personal Comfort Bias</div>
                <div className="text-[11px] text-slate-500">From your feedback clicks (-15% to +15%)</div>
              </div>
              <span className="text-base font-bold text-slate-900">
                {(tilts.userComfortBias || 0) > 0 ? `+${tilts.userComfortBias}%` : `${tilts.userComfortBias || 0}%`}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-200/80 text-xs text-teal-950 space-y-1">
              <div className="font-bold">GitHub Actions Scheduled Automation</div>
              <p>
                Workflow <code className="font-mono">.github/workflows/self-improve.yml</code> runs weekdays at{' '}
                <strong>9:00 AM MYT</strong>, pulling fresh US ETF & USD/MYR data, running <code className="font-mono">npm run calibrate</code>, updating <code className="font-mono">handoff.md</code>, and committing back to Git.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Calibration Audit History */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-slate-700" />
          <h3 className="text-base font-bold text-slate-900">
            Self-Improvement Changelog ({runs.length} Logged Cycles)
          </h3>
        </div>

        <div className="space-y-3">
          {runs.map((run) => (
            <div key={run.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-slate-900 px-2 py-0.5 rounded bg-white border border-slate-200">
                    Cycle #{run.cycle}
                  </span>
                  <span className="font-semibold text-indigo-700">{run.marketRegime}</span>
                  <span className="text-slate-500">Trigger: {run.trigger}</span>
                  <span className="text-slate-400">· Source: {run.dataSource}</span>
                </div>
                <div className="text-slate-500 tabular-nums">
                  Efficiency: <strong className="text-teal-700">{run.portfolioEfficiencyScore}/100</strong> ·{' '}
                  {new Date(run.timestamp).toLocaleString()}
                </div>
              </div>

              <ul className="space-y-1">
                {(run.changesPlainEnglish || []).map((note, idx) => (
                  <li key={idx} className="text-xs sm:text-sm text-slate-700 flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-1" />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
