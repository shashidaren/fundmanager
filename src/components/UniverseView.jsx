import React, { useState, useMemo } from 'react';
import {
  Search,
  Scale,
  Layers,
  Edit3,
  Check,
  X,
  Info,
  ShieldCheck
} from 'lucide-react';

const ROLE_LABELS = {
  all: 'All Categories',
  cash: 'Safe Cash / Savings',
  stabilizer: 'Stabilizers & Income',
  core_growth: 'Core Market Indexes',
  high_growth: 'Growth Boosters',
  hedge: 'Gold / Inflation Hedge'
};

export default function UniverseView({
  rankedFunds = [],
  shariahOnly = false,
  fxUsdMyr = 4.42,
  onUpdateFundMetric
}) {
  const [platformFilter, setPlatformFilter] = useState('all'); // 'all' | 'Versa' | 'US ETF'
  const [roleFilter, setRoleFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [compareIds, setCompareIds] = useState(['versa-cash', 'versa-growth', 'etf-voo']);
  const [editingFundId, setEditingFundId] = useState(null);
  const [editReturn, setEditReturn] = useState('');
  const [editFee, setEditFee] = useState('');

  const filtered = useMemo(() => {
    return rankedFunds.filter((f) => {
      if (shariahOnly && !f.shariah) return false;
      if (platformFilter !== 'all' && f.platform !== platformFilter) return false;
      if (roleFilter !== 'all' && f.role !== roleFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          f.name.toLowerCase().includes(q) ||
          f.ticker.toLowerCase().includes(q) ||
          f.category.toLowerCase().includes(q) ||
          f.laymanOneLiner.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [rankedFunds, shariahOnly, platformFilter, roleFilter, search]);

  const comparedFunds = useMemo(() => {
    return compareIds
      .map((id) => rankedFunds.find((f) => f.id === id))
      .filter((f) => f && (!shariahOnly || f.shariah));
  }, [compareIds, rankedFunds, shariahOnly]);

  const toggleCompare = (id) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return [...prev.slice(1), id];
      return [...prev, id];
    });
  };

  const startEdit = (fund) => {
    setEditingFundId(fund.id);
    setEditReturn(String(fund.expectedReturn));
    setEditFee(String(fund.expenseRatio));
  };

  const saveEdit = async (fundId) => {
    await onUpdateFundMetric({
      fundId,
      expectedReturn: Number(editReturn),
      expenseRatio: Number(editFee)
    });
    setEditingFundId(null);
  };

  return (
    <div className="space-y-6">
      {/* Layman Education Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200/80 space-y-1">
          <div className="text-xs font-bold uppercase tracking-wider text-teal-800">
            Versa Malaysia Portfolios (MYR)
          </div>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            Best for <strong>emergency Ringgit savings</strong>, zero currency conversion hassle, and small RM10–RM100 automated top-ups. Higher annual fees on stock funds (~1.05%–1.25%), but super convenient in RM.
          </p>
        </div>
        <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200/80 space-y-1">
          <div className="text-xs font-bold uppercase tracking-wider text-indigo-800">
            Broad US Index ETFs — Non-Individual Stocks (USD)
          </div>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            Instead of gambling on single US stocks that can crash 80%, <strong>broad index ETFs</strong> own 100 to 9,500 top companies in one basket at tiny annual fees (<strong>0.03%–0.50%</strong>)—keeping decades of compounding in your pocket.
          </p>
        </div>
      </div>

      {/* Side-by-Side Comparison Tray */}
      {comparedFunds.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Side-by-Side Layman Comparison ({comparedFunds.length}/3 selected)
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setCompareIds([])}
              className="text-xs text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
            >
              Clear comparison
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2.5 pr-4 font-semibold w-36">Feature</th>
                  {comparedFunds.map((f) => (
                    <th key={f.id} className="py-2.5 px-3 font-bold text-slate-900 min-w-[200px]">
                      <div className="flex items-center justify-between gap-2">
                        <span>
                          {f.name} ({f.ticker})
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleCompare(f.id)}
                          className="text-slate-400 hover:text-slate-700 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 tabular-nums">
                <tr>
                  <td className="py-2.5 pr-4 font-medium text-slate-500">Platform & Currency</td>
                  {comparedFunds.map((f) => (
                    <td key={f.id} className="py-2.5 px-3 font-semibold text-slate-800">
                      {f.platform} ({f.currency}) {f.shariah ? '· Shariah' : ''}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2.5 pr-4 font-medium text-slate-500">What's Inside</td>
                  {comparedFunds.map((f) => (
                    <td key={f.id} className="py-2.5 px-3 text-slate-700">
                      {f.holdingsCount}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2.5 pr-4 font-medium text-slate-500">Annual Fee (per RM 1k)</td>
                  {comparedFunds.map((f) => (
                    <td key={f.id} className="py-2.5 px-3 font-semibold text-slate-900">
                      {f.expenseRatio.toFixed(2)}% (RM {(f.expenseRatio * 10).toFixed(2)}/yr)
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2.5 pr-4 font-medium text-slate-500">Expected Long-Term Return</td>
                  {comparedFunds.map((f) => (
                    <td key={f.id} className="py-2.5 px-3 font-bold text-teal-700">
                      ~{f.expectedReturn.toFixed(2)}% / yr
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2.5 pr-4 font-medium text-slate-500">Worst Historical Drop</td>
                  {comparedFunds.map((f) => (
                    <td key={f.id} className="py-2.5 px-3 font-semibold text-amber-700">
                      {f.maxDrawdown.toFixed(1)}%
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2.5 pr-4 font-medium text-slate-500">Adaptive Model Score</td>
                  {comparedFunds.map((f) => (
                    <td key={f.id} className="py-2.5 px-3 font-bold text-indigo-700">
                      {f.modelScore} / 100
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Filter Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'all', label: 'All Platforms' },
            { id: 'Versa', label: 'Versa (MYR)' },
            { id: 'US ETF', label: 'US Broad ETFs (USD)' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setPlatformFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-colors ${
                platformFilter === tab.id
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none"
          >
            {Object.entries(ROLE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search VOO, Versa Cash, Sukuk..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-teal-600"
          />
        </div>
      </div>

      {/* Fund Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((fund) => {
          const isCompared = compareIds.includes(fund.id);
          const isEditing = editingFundId === fund.id;

          return (
            <div
              key={fund.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition-colors"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h3 className="text-base font-bold text-slate-900">{fund.name}</h3>
                      <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {fund.ticker}
                      </span>
                      {fund.shariah && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <ShieldCheck className="w-3 h-3" />
                          Shariah
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {fund.provider} · {fund.category}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-900 text-white text-xs font-bold tabular-nums">
                      Score {fund.modelScore}
                    </div>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">{fund.laymanOneLiner}</p>

                <div className="grid grid-cols-3 gap-2 pt-1 tabular-nums">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="text-[10px] uppercase text-slate-500 font-semibold">Est. Return</div>
                    <div className="text-sm font-bold text-teal-700">{fund.expectedReturn.toFixed(2)}%/yr</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="text-[10px] uppercase text-slate-500 font-semibold">Annual Fee</div>
                    <div className="text-sm font-bold text-slate-900">{fund.expenseRatio.toFixed(2)}%</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="text-[10px] uppercase text-slate-500 font-semibold">Worst Dip</div>
                    <div className="text-sm font-bold text-amber-700">{fund.maxDrawdown.toFixed(1)}%</div>
                  </div>
                </div>

                {isEditing && (
                  <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 space-y-2">
                    <div className="text-xs font-bold text-teal-900">
                      Update Reference Rate / Fee (syncs to handoff.md)
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="text-[11px] font-medium text-slate-700">
                        Est. Return (%/yr)
                        <input
                          type="number"
                          step="0.05"
                          value={editReturn}
                          onChange={(e) => setEditReturn(e.target.value)}
                          className="mt-1 w-full px-2 py-1 rounded border border-slate-300 bg-white text-xs font-bold"
                        />
                      </label>
                      <label className="text-[11px] font-medium text-slate-700">
                        Expense Ratio (%)
                        <input
                          type="number"
                          step="0.01"
                          value={editFee}
                          onChange={(e) => setEditFee(e.target.value)}
                          className="mt-1 w-full px-2 py-1 rounded border border-slate-300 bg-white text-xs font-bold"
                        />
                      </label>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingFundId(null)}
                        className="px-2.5 py-1 text-xs rounded border border-slate-300 bg-white text-slate-700 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => saveEdit(fund.id)}
                        className="px-2.5 py-1 text-xs rounded bg-teal-700 text-white font-semibold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Save
                      </button>
                    </div>
                  </div>
                )}

                <div className="text-xs text-slate-600 space-y-1 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                  <div>
                    <strong className="text-slate-800">Diversification:</strong> {fund.holdingsCount}
                  </div>
                  <div>
                    <strong className="text-slate-800">Watch out for:</strong> {fund.laymanWatchOut}
                  </div>
                  <div className="text-teal-900">
                    <Info className="w-3.5 h-3.5 inline mr-1 text-teal-600 -mt-0.5" />
                    <strong>MY Tip:</strong> {fund.malaysiaTip}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                <span className="text-slate-500">
                  Min ~RM {fund.minInvestmentMyr} · {fund.liquidity.split('·')[0]}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(fund)}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    Edit Rate
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleCompare(fund.id)}
                    className={`px-2.5 py-1 rounded-lg font-semibold border cursor-pointer transition-colors ${
                      isCompared
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50'
                    }`}
                  >
                    {isCompared ? 'Comparing ✓' : '+ Compare'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
