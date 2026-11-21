import React, { useState } from 'react';
import {
  ShieldCheck,
  TrendingUp,
  Wallet,
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Save,
  ChevronDown,
  ChevronUp,
  Layers,
  ArrowRight
} from 'lucide-react';
import {
  HORIZON_LABELS,
  BUFFER_LABELS,
  COMFORT_LABELS
} from '../../shared/engine.js';
import { AllocationDonutChart, WealthProjectionChart } from './Charts.jsx';

const PRESETS = [
  {
    label: 'Starter (RM 200/mo)',
    profile: { initialAmountMyr: 1000, monthlyContributionMyr: 200, horizon: 'medium_long', emergencyBuffer: 'partial', dipComfort: 'gentle' }
  },
  {
    label: 'Safety Net First',
    profile: { initialAmountMyr: 3000, monthlyContributionMyr: 500, horizon: 'near', emergencyBuffer: 'none', dipComfort: 'ultra_calm' }
  },
  {
    label: 'Balanced Salary Plan',
    profile: { initialAmountMyr: 5000, monthlyContributionMyr: 800, horizon: 'medium_long', emergencyBuffer: 'partial', dipComfort: 'moderate' }
  },
  {
    label: '10-Yr Wealth Builder',
    profile: { initialAmountMyr: 10000, monthlyContributionMyr: 1500, horizon: 'long', emergencyBuffer: 'full', dipComfort: 'growth' }
  }
];

export default function PlannerView({
  draftProfile,
  onChangeDraft,
  onSaveProfile,
  isDirty,
  isSaving,
  recommendation,
  fxUsdMyr
}) {
  const [expandedTips, setExpandedTips] = useState({});

  const toggleTip = (fundId) => {
    setExpandedTips((prev) => ({ ...prev, [fundId]: !prev[fundId] }));
  };

  const { planIdentity, metrics, allocations, projections, laymanSummary } = recommendation;
  const endProjection = projections[projections.length - 1] || {};
  const netGainExpected = (endProjection.expectedMyr || 0) - (endProjection.contributedMyr || 0);

  return (
    <div className="space-y-6">
      {/* Quick Starter Personas */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2 text-sm text-slate-700">
          <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
          <span className="font-semibold">Quick Layman Presets:</span>
          <span className="text-slate-500 hidden sm:inline">Pick one closest to you, then fine-tune below</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => onChangeDraft({ ...draftProfile, ...p.profile })}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50 hover:bg-teal-50 hover:border-teal-300 hover:text-teal-900 text-slate-700 transition-colors cursor-pointer"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Plain-English Guided Inputs */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900">1. Tell Us About Your Situation</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Plain-English inputs—no finance jargon required. Updates your Ringgit & USD split live.
            </p>
          </div>

          {/* Starting Lump Sum */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-teal-600" />
                Starting Amount Today (RM)
              </label>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
                <span className="text-xs font-semibold text-slate-400 mr-1">RM</span>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={draftProfile.initialAmountMyr}
                  onChange={(e) => onChangeDraft({ ...draftProfile, initialAmountMyr: Math.max(0, Number(e.target.value)) })}
                  className="w-24 text-right text-sm font-bold text-slate-900 bg-transparent focus:outline-none tabular-nums"
                />
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="50000"
              step="500"
              value={Math.min(50000, draftProfile.initialAmountMyr)}
              onChange={(e) => onChangeDraft({ ...draftProfile, initialAmountMyr: Number(e.target.value) })}
              className="w-full accent-teal-600 cursor-pointer"
            />
          </div>

          {/* Monthly Contribution */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-600" />
                Monthly Top-Up / Payday DCA (RM)
              </label>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
                <span className="text-xs font-semibold text-slate-400 mr-1">RM</span>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={draftProfile.monthlyContributionMyr}
                  onChange={(e) =>
                    onChangeDraft({ ...draftProfile, monthlyContributionMyr: Math.max(0, Number(e.target.value)) })
                  }
                  className="w-24 text-right text-sm font-bold text-slate-900 bg-transparent focus:outline-none tabular-nums"
                />
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="5000"
              step="50"
              value={Math.min(5000, draftProfile.monthlyContributionMyr)}
              onChange={(e) => onChangeDraft({ ...draftProfile, monthlyContributionMyr: Number(e.target.value) })}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500">
              Approx. USD {Math.round(draftProfile.monthlyContributionMyr / (fxUsdMyr || 4.42))}/mo at 1 USD = RM{' '}
              {Number(fxUsdMyr || 4.42).toFixed(2)}
            </p>
          </div>

          {/* Horizon */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-800 block">
              When might you need to spend this money?
            </label>
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(HORIZON_LABELS).map(([key, label]) => {
                const active = draftProfile.horizon === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onChangeDraft({ ...draftProfile, horizon: key })}
                    className={`text-left px-3.5 py-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer flex items-center justify-between ${
                      active
                        ? 'bg-teal-50/80 border-teal-600 text-teal-950 ring-1 ring-teal-600/20'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{label}</span>
                    {active && <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Emergency Buffer */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-800 block">
              Do you already have 3–6 months of emergency cash set aside?
            </label>
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(BUFFER_LABELS).map(([key, label]) => {
                const active = draftProfile.emergencyBuffer === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onChangeDraft({ ...draftProfile, emergencyBuffer: key })}
                    className={`text-left px-3.5 py-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer flex items-center justify-between ${
                      active
                        ? 'bg-teal-50/80 border-teal-600 text-teal-950 ring-1 ring-teal-600/20'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{label}</span>
                    {active && <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Temporary Dip Comfort */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-800 block">
              How do you feel about temporary bad-year market drops?
            </label>
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(COMFORT_LABELS).map(([key, label]) => {
                const active = draftProfile.dipComfort === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onChangeDraft({ ...draftProfile, dipComfort: key })}
                    className={`text-left px-3.5 py-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer flex items-center justify-between ${
                      active
                        ? 'bg-indigo-50/80 border-indigo-600 text-indigo-950 ring-1 ring-indigo-600/20'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{label}</span>
                    {active && <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Save & Update handoff.md */}
          <div className="pt-2">
            <button
              type="button"
              disabled={isSaving}
              onClick={onSaveProfile}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                isDirty
                  ? 'bg-teal-700 hover:bg-teal-800 text-white shadow-sm'
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              <Save className="w-4 h-4" />
              {isSaving
                ? 'Saving & Updating handoff.md...'
                : isDirty
                  ? 'Save My Plan & Update handoff.md'
                  : 'Plan Saved in handoff.md'}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Proposed Recommendation, Plain-English Summary & Projection */}
        <div className="lg:col-span-7 space-y-6">
          {/* Executive Hero Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200 mb-2">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {planIdentity.badge}
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">{planIdentity.title}</h2>
                <p className="text-sm font-medium text-slate-600 mt-0.5">{planIdentity.subtitle}</p>
              </div>
              <div className="text-left sm:text-right bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200/80">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {draftProfile.projectionYears}-Yr Expected Wealth
                </div>
                <div className="text-xl font-bold text-teal-700 tabular-nums">
                  RM {(endProjection.expectedMyr || 0).toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-500 tabular-nums">
                  +RM {Math.max(0, netGainExpected).toLocaleString()} est. growth
                </div>
              </div>
            </div>

            {/* 4 Key Layman KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 tabular-nums">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <div className="text-[11px] font-medium text-slate-500">Est. Annual Return</div>
                <div className="text-lg font-bold text-slate-900 mt-0.5">{metrics.expectedAnnualReturnPct}% / yr</div>
                <div className="text-[11px] text-teal-700">Net of fund fees</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <div className="text-[11px] font-medium text-slate-500">Ongoing Fund Fee</div>
                <div className="text-lg font-bold text-slate-900 mt-0.5">{metrics.weightedExpenseRatioPct}% / yr</div>
                <div className="text-[11px] text-slate-600">RM {metrics.annualFeePer1000Myr.toFixed(2)} per RM 1k</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <div className="text-[11px] font-medium text-slate-500">Rough-Year Dip</div>
                <div className="text-lg font-bold text-amber-700 mt-0.5">{metrics.estimatedWorstDipPct}%</div>
                <div className="text-[11px] text-slate-600">
                  RM 10k → ~RM {metrics.sample10kRoughYearMyr.toLocaleString()}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <div className="text-[11px] font-medium text-slate-500">MYR / USD Split</div>
                <div className="text-lg font-bold text-indigo-900 mt-0.5">
                  {metrics.versaSharePct}% / {metrics.usEtfSharePct}%
                </div>
                <div className="text-[11px] text-slate-600">Versa vs US ETFs</div>
              </div>
            </div>

            {/* Donut + Sleeve Overview */}
            <div className="pt-2 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 mb-3">
                2. Proposed Portfolio Allocation (Zero Individual Stock Picking)
              </h3>
              <AllocationDonutChart
                allocations={allocations}
                monthlyMyr={draftProfile.monthlyContributionMyr}
              />
            </div>
          </div>

          {/* Plain-English Layman Summary Card */}
          <div className="bg-gradient-to-br from-teal-950 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-teal-300">
                Plain-English Advisor Summary
              </span>
              <h3 className="text-lg font-bold mt-0.5">Why This Plan Fits You & What To Expect</h3>
            </div>

            <div className="space-y-2.5">
              {laymanSummary.whyThisFitsYou.map((reason, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-sm text-slate-200 leading-relaxed">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-1" />
                  <span>{reason}</span>
                </div>
              ))}
            </div>

            <div className="bg-white/10 border border-white/15 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-slate-100 leading-relaxed">
                <strong className="text-amber-200 block mb-0.5">Rough-Year Reality Check (No Surprises):</strong>
                {laymanSummary.roughYearReality}
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <div className="text-xs font-semibold uppercase tracking-wider text-teal-300">
                Your Simple 3-Step Payday Routine
              </div>
              <div className="grid grid-cols-1 gap-2">
                {laymanSummary.monthlyActionRoutine.map((step, i) => (
                  <div
                    key={i}
                    className="bg-white/5 border border-white/10 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 flex items-start gap-2.5"
                  >
                    <ArrowRight className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Detailed Fund Cards */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  3. Exact Fund Breakdown & Ringgit Amounts
                </h3>
                <p className="text-xs text-slate-500">
                  Every basket owns dozens to thousands of assets—protecting you from single-company collapse.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {allocations.map((item) => {
                const open = Boolean(expandedTips[item.fundId]);
                return (
                  <div
                    key={item.fundId}
                    className="rounded-xl border border-slate-200 p-4 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1 max-w-xl">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-base font-bold text-slate-900">{item.name}</span>
                          <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {item.ticker}
                          </span>
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded ${
                              item.platform === 'Versa'
                                ? 'bg-teal-50 text-teal-800 border border-teal-200'
                                : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                            }`}
                          >
                            {item.platform} ({item.currency})
                          </span>
                          {item.shariah && (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                              Shariah / Halal
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-medium text-teal-800">{item.sleeveRole}</p>
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{item.laymanJob}</p>
                      </div>

                      <div className="text-left sm:text-right bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200/80 shrink-0 tabular-nums">
                        <div className="text-lg font-bold text-slate-900">{item.weight}%</div>
                        <div className="text-xs text-slate-700 font-semibold">
                          Today: RM {item.initialMyr.toLocaleString()}
                        </div>
                        <div className="text-xs text-indigo-700 font-semibold">
                          Monthly: RM {item.monthlyMyr.toLocaleString()}/mo
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                          <Layers className="w-3.5 h-3.5 text-slate-400" />
                          Inside: {item.holdingsCount}
                        </span>
                        <span>Fee: {item.expenseRatio.toFixed(2)}%/yr</span>
                        <span>Model Score: {item.modelScore}/100</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleTip(item.fundId)}
                        className="inline-flex items-center gap-1 text-teal-700 hover:text-teal-900 font-semibold cursor-pointer"
                      >
                        {open ? 'Hide MY Tip' : 'Malaysian Tip'}
                        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {open && (
                      <div className="mt-2.5 p-3 rounded-lg bg-amber-50/70 border border-amber-200/80 text-xs text-amber-950 space-y-1">
                        <div>
                          <strong>What it is:</strong> {item.laymanOneLiner}
                        </div>
                        <div>
                          <strong>Malaysian Investor Note:</strong> {item.malaysiaTip}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Wealth Compounding Simulator */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-teal-600" />
                  4. Long-Term Ringgit Compounding Projection
                </h3>
                <p className="text-xs text-slate-500">
                  Hover over the chart to compare total cash contributed vs expected & cautious market paths.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-slate-700">Projection Years:</span>
                {[5, 10, 15, 20].map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => onChangeDraft({ ...draftProfile, projectionYears: yr })}
                    className={`px-2.5 py-1 rounded-lg font-semibold border cursor-pointer ${
                      draftProfile.projectionYears === yr
                        ? 'bg-teal-700 text-white border-teal-700'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {yr}Y
                  </button>
                ))}
              </div>
            </div>

            <WealthProjectionChart projections={projections} />
          </div>
        </div>
      </div>
    </div>
  );
}
