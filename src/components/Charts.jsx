import React, { useState } from 'react';

const PALETTE = [
  '#0d9488', // teal-600
  '#4338ca', // indigo-700
  '#0f766e', // teal-700
  '#6366f1', // indigo-500
  '#d97706', // amber-600
  '#0284c7'  // sky-600
];

export function AllocationDonutChart({ allocations = [], monthlyMyr = 0 }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const radius = 68;
  const stroke = 20;
  const circumference = 2 * Math.PI * radius;

  let cumulativePct = 0;
  const segments = allocations.map((item, idx) => {
    const pct = item.weight;
    const dash = (pct / 100) * circumference;
    const offset = circumference - (cumulativePct / 100) * circumference;
    cumulativePct += pct;
    return {
      ...item,
      color: PALETTE[idx % PALETTE.length],
      dash,
      offset
    };
  });

  const active = hoveredIdx !== null ? segments[hoveredIdx] : null;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
        <svg viewBox="0 0 180 180" className="w-full h-full -rotate-90">
          <circle cx="90" cy="90" r={radius} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
          {segments.map((seg, idx) => (
            <circle
              key={seg.fundId}
              cx="90"
              cy="90"
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={hoveredIdx === idx ? stroke + 4 : stroke}
              strokeDasharray={`${Math.max(0, seg.dash - 1.5)} ${circumference}`}
              strokeDashoffset={seg.offset}
              className="transition-all duration-200 cursor-pointer"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 pointer-events-none">
          {active ? (
            <>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 truncate max-w-[110px]">
                {active.ticker}
              </span>
              <span className="text-xl font-bold text-slate-900 tabular-nums">{active.weight}%</span>
              <span className="text-[11px] text-slate-600 tabular-nums">RM {active.monthlyMyr.toLocaleString()}/mo</span>
            </>
          ) : (
            <>
              <span className="text-[11px] font-medium text-slate-500">Monthly Plan</span>
              <span className="text-lg font-bold text-slate-900 tabular-nums">
                RM {Number(monthlyMyr || 0).toLocaleString()}
              </span>
              <span className="text-[11px] text-teal-700 font-medium">{allocations.length} Baskets</span>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 w-full space-y-2.5">
        {segments.map((seg, idx) => (
          <div
            key={seg.fundId}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
            className={`flex items-center justify-between p-2.5 rounded-lg border transition-colors cursor-default ${
              hoveredIdx === idx ? 'bg-slate-50 border-slate-300' : 'bg-white border-slate-100'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-slate-900 truncate">{seg.name}</span>
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                      seg.platform === 'Versa'
                        ? 'bg-teal-50 text-teal-800 border border-teal-200'
                        : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                    }`}
                  >
                    {seg.platform}
                  </span>
                </div>
                <p className="text-xs text-slate-500 truncate">{seg.sleeveRole}</p>
              </div>
            </div>
            <div className="text-right shrink-0 pl-3 tabular-nums">
              <div className="text-sm font-bold text-slate-900">{seg.weight}%</div>
              <div className="text-xs text-slate-500">RM {seg.monthlyMyr.toLocaleString()}/mo</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function WealthProjectionChart({ projections = [] }) {
  const [hoverIndex, setHoverIndex] = useState(null);

  if (!projections || projections.length < 2) return null;

  const width = 680;
  const height = 250;
  const pad = { top: 20, right: 20, bottom: 32, left: 68 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const maxY = Math.max(...projections.map((p) => p.strongMyr || p.expectedMyr), 1000) * 1.05;

  const xPos = (idx) => pad.left + (idx / (projections.length - 1)) * plotW;
  const yPos = (val) => pad.top + plotH - (val / maxY) * plotH;

  const makePath = (key) =>
    projections
      .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${xPos(i).toFixed(1)} ${yPos(pt[key]).toFixed(1)}`)
      .join(' ');

  const expectedLine = makePath('expectedMyr');
  const cautiousLine = makePath('cautiousMyr');
  const contribLine = makePath('contributedMyr');

  const expectedArea = `${expectedLine} L ${xPos(projections.length - 1).toFixed(1)} ${(pad.top + plotH).toFixed(
    1
  )} L ${pad.left} ${(pad.top + plotH).toFixed(1)} Z`;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round((maxY * t) / 1000) * 1000);
  const activePt = hoverIndex !== null ? projections[hoverIndex] : projections[projections.length - 1];

  const formatShortMyr = (v) => {
    if (v >= 1000000) return `RM ${(v / 1000000).toFixed(2)}M`;
    if (v >= 1000) return `RM ${Math.round(v / 1000)}k`;
    return `RM ${v}`;
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 px-3.5 py-2.5 rounded-lg border border-slate-200/80 text-xs tabular-nums">
        <div className="font-semibold text-slate-700">
          Year {activePt.year} Snapshot {hoverIndex === null ? '(End of Horizon)' : ''}
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
            Cash Put In: <strong className="text-slate-900">RM {activePt.contributedMyr.toLocaleString()}</strong>
          </span>
          <span className="flex items-center gap-1.5 text-amber-700">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            Cautious Market: <strong>RM {activePt.cautiousMyr.toLocaleString()}</strong>
          </span>
          <span className="flex items-center gap-1.5 text-teal-800">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />
            Expected Value: <strong>RM {activePt.expectedMyr.toLocaleString()}</strong>
          </span>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id="expectedFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0d9488" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#0d9488" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {yTicks.map((tick, idx) => (
            <g key={idx}>
              <line
                x1={pad.left}
                x2={width - pad.right}
                y1={yPos(tick)}
                y2={yPos(tick)}
                stroke="#e2e8f0"
                strokeDasharray="3 3"
              />
              <text
                x={pad.left - 8}
                y={yPos(tick) + 4}
                textAnchor="end"
                className="fill-slate-400 text-[10px] tabular-nums"
              >
                {formatShortMyr(tick)}
              </text>
            </g>
          ))}

          <path d={expectedArea} fill="url(#expectedFill)" />
          <path d={contribLine} fill="none" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 4" />
          <path d={cautiousLine} fill="none" stroke="#f59e0b" strokeWidth="2" />
          <path d={expectedLine} fill="none" stroke="#0d9488" strokeWidth="3" />

          {projections.map((pt, idx) => {
            const showLabel =
              projections.length <= 12 || idx === 0 || idx === projections.length - 1 || idx % 2 === 0;
            return (
              <g key={pt.year}>
                {showLabel && (
                  <text
                    x={xPos(idx)}
                    y={height - 10}
                    textAnchor="middle"
                    className="fill-slate-500 text-[10px] tabular-nums"
                  >
                    Yr {pt.year}
                  </text>
                )}
                {hoverIndex === idx && (
                  <>
                    <line
                      x1={xPos(idx)}
                      x2={xPos(idx)}
                      y1={pad.top}
                      y2={pad.top + plotH}
                      stroke="#0f172a"
                      strokeOpacity="0.2"
                    />
                    <circle cx={xPos(idx)} cy={yPos(pt.expectedMyr)} r="4.5" fill="#0d9488" stroke="#fff" strokeWidth="2" />
                    <circle cx={xPos(idx)} cy={yPos(pt.cautiousMyr)} r="3.5" fill="#f59e0b" stroke="#fff" strokeWidth="1.5" />
                  </>
                )}
                <rect
                  x={xPos(idx) - plotW / projections.length / 2}
                  y={pad.top}
                  width={plotW / projections.length}
                  height={plotH}
                  fill="transparent"
                  className="cursor-crosshair"
                  onMouseEnter={() => setHoverIndex(idx)}
                />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
