import React, { useState } from 'react';
import { Columns2, Layers, X, ArrowUpRight } from 'lucide-react';
import {
  formatTypeLabel,
  getRadarScores,
  InstitutionRecord,
  RADAR_AXES,
  RadarAxisKey,
  SERIES_PALETTE,
} from '../types/institution';

export type RadarLayoutMode = 'side-by-side' | 'overlaid';

interface RadarComparisonChartProps {
  institutions: InstitutionRecord[];
  allInstitutions: InstitutionRecord[];
  activeAxis: RadarAxisKey | null;
  onHoverAxis: (axis: RadarAxisKey | null) => void;
  onRemoveCompare: (id: string) => void;
  onAddCompare: (id: string) => void;
  onSelectProfile: (id: string) => void;
  onClearCompare: () => void;
}

const RINGS = [20, 40, 60, 80, 100];

function polarToCartesian(cx: number, cy: number, radius: number, angleRad: number) {
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad),
  };
}

function buildPolygonPoints(
  scores: Record<RadarAxisKey, number>,
  cx: number,
  cy: number,
  maxRadius: number
): string {
  return RADAR_AXES.map((axis, idx) => {
    const angle = -Math.PI / 2 + (idx * 2 * Math.PI) / RADAR_AXES.length;
    const value = Math.max(0, Math.min(100, scores[axis.key]));
    const pt = polarToCartesian(cx, cy, (value / 100) * maxRadius, angle);
    return `${pt.x.toFixed(2)},${pt.y.toFixed(2)}`;
  }).join(' ');
}

export const RadarComparisonChart: React.FC<RadarComparisonChartProps> = ({
  institutions,
  allInstitutions,
  activeAxis,
  onHoverAxis,
  onRemoveCompare,
  onAddCompare,
  onSelectProfile,
  onClearCompare,
}) => {
  const [layoutMode, setLayoutMode] = useState<RadarLayoutMode>('side-by-side');

  const unpinnedOptions = allInstitutions.filter(
    (inst) => !institutions.some((pinned) => pinned.id === inst.id)
  );

  const activeAxisMeta = RADAR_AXES.find((a) => a.key === activeAxis) ?? null;

  return (
    <div className="bg-white border border-[#E5E0D8] rounded-lg p-6 md:p-7 space-y-6">
      {/* Studio Controls Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#E5E0D8]">
        <div>
          <div className="text-xs font-medium text-[#57534E]">
            01 · Six-Axis Institutional Profile Radar
          </div>
          <h3 className="mt-1 font-serif text-2xl font-semibold text-[#1C1917] text-balance">
            Side-by-Side &amp; Overlaid Capability Comparison
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {institutions.length < 4 && unpinnedOptions.length > 0 && (
            <label className="inline-flex items-center gap-2 text-xs text-[#57534E]">
              <span className="sr-only">Add institution to comparison</span>
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) onAddCompare(e.target.value);
                }}
                className="px-3 py-2 text-xs font-medium text-[#1C1917] bg-[#FBF9F5] border border-[#E5E0D8] rounded-md focus:outline-none focus:border-[#14532D] max-w-[230px]"
              >
                <option value="">+ Add institution ({institutions.length}/4)...</option>
                {unpinnedOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.name} ({formatTypeLabel(opt.type)})
                  </option>
                ))}
              </select>
            </label>
          )}

          <div
            role="group"
            aria-label="Radar display mode"
            className="inline-flex items-center p-1 bg-[#F3EFE6] border border-[#E5E0D8] rounded-md"
          >
            <button
              type="button"
              onClick={() => setLayoutMode('side-by-side')}
              aria-pressed={layoutMode === 'side-by-side'}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                layoutMode === 'side-by-side'
                  ? 'bg-white text-[#1C1917] shadow-xs'
                  : 'text-[#57534E] hover:text-[#1C1917]'
              }`}
            >
              <Columns2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Side-by-Side</span>
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode('overlaid')}
              aria-pressed={layoutMode === 'overlaid'}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                layoutMode === 'overlaid'
                  ? 'bg-white text-[#1C1917] shadow-xs'
                  : 'text-[#57534E] hover:text-[#1C1917]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Overlaid</span>
            </button>
          </div>

          {institutions.length > 0 && (
            <button
              type="button"
              onClick={onClearCompare}
              className="px-3 py-2 text-xs font-medium text-[#57534E] hover:text-[#9A3412] border border-[#E5E0D8] rounded-md hover:border-[#9A3412]/40 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Empty State */}
      {institutions.length === 0 ? (
        <div className="py-14 text-center space-y-3 bg-[#FBF9F5] border border-dashed border-[#D6CEBE] rounded-lg">
          <p className="font-serif text-xl text-[#1C1917]">No institutions pinned for comparison</p>
          <p className="text-sm text-[#57534E] max-w-md mx-auto">
            Select up to four institutions from the directory below or use the selector above to generate side-by-side radar and multi-metric benchmarks.
          </p>
        </div>
      ) : (
        <>
          {/* Active Axis Readout Ribbon */}
          <div className="bg-[#FBF9F5] border border-[#E5E0D8] rounded-md px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
            <div className="text-[#57534E]">
              {activeAxisMeta ? (
                <span>
                  <strong className="text-[#1C1917] font-semibold">{activeAxisMeta.label}:</strong>{' '}
                  {activeAxisMeta.description}
                </span>
              ) : (
                <span>
                  Hover or select any radar axis label to inspect exact scores and methodology across pinned institutions.
                </span>
              )}
            </div>
            {activeAxis && (
              <div className="flex flex-wrap items-center gap-3 shrink-0 font-mono tabular-nums">
                {institutions.map((inst, idx) => {
                  const score = getRadarScores(inst)[activeAxis];
                  const color = SERIES_PALETTE[idx % SERIES_PALETTE.length];
                  return (
                    <span key={inst.id} className="inline-flex items-center gap-1.5 text-[#1C1917]">
                      <span
                        className="w-2.5 h-2.5 rounded-xs inline-block"
                        style={{ backgroundColor: color.hex }}
                        aria-hidden="true"
                      />
                      <span className="font-sans text-[#57534E] max-w-[110px] truncate">
                        {inst.aliases?.[0] ?? inst.name}
                      </span>
                      <span className="font-semibold">{score}</span>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Radar Viewport: Side-by-Side Mode */}
          {layoutMode === 'side-by-side' ? (
            <div
              className={`grid gap-5 ${
                institutions.length === 1
                  ? 'grid-cols-1 max-w-md mx-auto'
                  : institutions.length === 2
                  ? 'grid-cols-1 md:grid-cols-2'
                  : institutions.length === 3
                  ? 'grid-cols-1 md:grid-cols-3'
                  : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4'
              }`}
            >
              {institutions.map((inst, idx) => {
                const series = SERIES_PALETTE[idx % SERIES_PALETTE.length];
                const scores = getRadarScores(inst);
                const meanScore = Math.round(
                  RADAR_AXES.reduce((acc, a) => acc + scores[a.key], 0) / RADAR_AXES.length
                );
                const cx = 140;
                const cy = 135;
                const maxR = 86;

                return (
                  <div
                    key={inst.id}
                    className="border border-[#E5E0D8] rounded-lg p-4 bg-[#FBF9F5]/60 flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between gap-2 pb-3 border-b border-[#E5E0D8]">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-xs text-[#57534E]">
                          <span
                            className="w-2.5 h-2.5 rounded-xs shrink-0"
                            style={{ backgroundColor: series.hex }}
                            aria-hidden="true"
                          />
                          <span>{formatTypeLabel(inst.type)}</span>
                          {inst.category && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>{inst.category}</span>
                            </>
                          )}
                          <span aria-hidden="true">·</span>
                          <span className="truncate">{inst.county}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onSelectProfile(inst.id)}
                          className="mt-1 font-serif text-base font-semibold text-[#1C1917] hover:text-[#14532D] text-left inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span className="line-clamp-1">{inst.name}</span>
                          <ArrowUpRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => onRemoveCompare(inst.id)}
                        aria-label={`Remove ${inst.name} from comparison`}
                        className="p-1 text-[#78716C] hover:text-[#9A3412] rounded transition-colors cursor-pointer shrink-0"
                      >
                        <X className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>

                    {/* Individual SVG Radar */}
                    <div className="my-2 flex justify-center">
                      <svg
                        viewBox="0 0 280 270"
                        className="w-full max-w-[270px] h-auto overflow-visible"
                        role="img"
                        aria-label={`Radar profile for ${inst.name}`}
                      >
                        {RINGS.map((ring) => {
                          const r = (ring / 100) * maxR;
                          const pts = RADAR_AXES.map((_, axisIdx) => {
                            const angle = -Math.PI / 2 + (axisIdx * 2 * Math.PI) / RADAR_AXES.length;
                            const pt = polarToCartesian(cx, cy, r, angle);
                            return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
                          }).join(' ');
                          return (
                            <polygon
                              key={ring}
                              points={pts}
                              fill="none"
                              stroke={ring === 100 ? '#D6CEBE' : '#E5E0D8'}
                              strokeWidth={ring === 100 ? 1.2 : 0.8}
                            />
                          );
                        })}

                        {RADAR_AXES.map((axis, axisIdx) => {
                          const angle = -Math.PI / 2 + (axisIdx * 2 * Math.PI) / RADAR_AXES.length;
                          const end = polarToCartesian(cx, cy, maxR, angle);
                          const labelPt = polarToCartesian(cx, cy, maxR + 24, angle);
                          const isHovered = activeAxis === axis.key;
                          const val = scores[axis.key];
                          const dotPt = polarToCartesian(cx, cy, (val / 100) * maxR, angle);

                          return (
                            <g
                              key={axis.key}
                              onMouseEnter={() => onHoverAxis(axis.key)}
                              onMouseLeave={() => onHoverAxis(null)}
                              onClick={() =>
                                onHoverAxis(activeAxis === axis.key ? null : axis.key)
                              }
                              className="cursor-pointer"
                            >
                              <line
                                x1={cx}
                                y1={cy}
                                x2={end.x}
                                y2={end.y}
                                stroke={isHovered ? series.hex : '#E5E0D8'}
                                strokeWidth={isHovered ? 1.5 : 0.9}
                              />
                              <text
                                x={labelPt.x}
                                y={labelPt.y}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                className={`text-[10px] font-medium select-none ${
                                  isHovered ? 'fill-[#1C1917] font-semibold' : 'fill-[#57534E]'
                                }`}
                              >
                                {axis.shortLabel}
                              </text>
                              <text
                                x={labelPt.x}
                                y={labelPt.y + 11}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                className="text-[10px] font-mono tabular-nums fill-[#1C1917] font-semibold select-none"
                              >
                                {val}
                              </text>
                              <circle
                                cx={dotPt.x}
                                cy={dotPt.y}
                                r={isHovered ? 4.5 : 3}
                                fill={series.hex}
                                stroke="#FFFFFF"
                                strokeWidth={1.5}
                              />
                            </g>
                          );
                        })}

                        <polygon
                          points={buildPolygonPoints(scores, cx, cy, maxR)}
                          fill={series.fill}
                          stroke={series.hex}
                          strokeWidth={2}
                        />
                      </svg>
                    </div>

                    <div className="pt-2.5 border-t border-[#E5E0D8] flex items-center justify-between text-xs">
                      <span className="text-[#57534E]">Composite Mean</span>
                      <span className="font-mono tabular-nums font-semibold text-[#1C1917]">
                        {meanScore} / 100
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Radar Viewport: Overlaid Multi-Series Mode */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 flex justify-center">
                <svg
                  viewBox="0 0 440 370"
                  className="w-full max-w-[440px] h-auto overflow-visible"
                  role="img"
                  aria-label="Overlaid six-axis radar comparison chart"
                >
                  {RINGS.map((ring) => {
                    const cx = 220;
                    const cy = 185;
                    const maxR = 132;
                    const r = (ring / 100) * maxR;
                    const pts = RADAR_AXES.map((_, axisIdx) => {
                      const angle = -Math.PI / 2 + (axisIdx * 2 * Math.PI) / RADAR_AXES.length;
                      const pt = polarToCartesian(cx, cy, r, angle);
                      return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
                    }).join(' ');
                    return (
                      <g key={ring}>
                        <polygon
                          points={pts}
                          fill="none"
                          stroke={ring === 100 ? '#D6CEBE' : '#E5E0D8'}
                          strokeWidth={ring === 100 ? 1.25 : 0.85}
                        />
                        <text
                          x={cx + 5}
                          y={cy - r + 10}
                          className="text-[10px] font-mono tabular-nums fill-[#78716C]"
                        >
                          {ring}
                        </text>
                      </g>
                    );
                  })}

                  {RADAR_AXES.map((axis, axisIdx) => {
                    const cx = 220;
                    const cy = 185;
                    const maxR = 132;
                    const angle = -Math.PI / 2 + (axisIdx * 2 * Math.PI) / RADAR_AXES.length;
                    const end = polarToCartesian(cx, cy, maxR, angle);
                    const labelPt = polarToCartesian(cx, cy, maxR + 28, angle);
                    const isHovered = activeAxis === axis.key;

                    return (
                      <g
                        key={axis.key}
                        onMouseEnter={() => onHoverAxis(axis.key)}
                        onMouseLeave={() => onHoverAxis(null)}
                        onClick={() => onHoverAxis(activeAxis === axis.key ? null : axis.key)}
                        className="cursor-pointer"
                      >
                        <line
                          x1={cx}
                          y1={cy}
                          x2={end.x}
                          y2={end.y}
                          stroke={isHovered ? '#1C1917' : '#E5E0D8'}
                          strokeWidth={isHovered ? 1.6 : 1}
                        />
                        <text
                          x={labelPt.x}
                          y={labelPt.y}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className={`text-[11px] font-medium select-none ${
                            isHovered ? 'fill-[#1C1917] font-semibold' : 'fill-[#57534E]'
                          }`}
                        >
                          {axis.label}
                        </text>
                      </g>
                    );
                  })}

                  {institutions.map((inst, idx) => {
                    const series = SERIES_PALETTE[idx % SERIES_PALETTE.length];
                    const scores = getRadarScores(inst);
                    const cx = 220;
                    const cy = 185;
                    const maxR = 132;

                    return (
                      <g key={inst.id}>
                        <polygon
                          points={buildPolygonPoints(scores, cx, cy, maxR)}
                          fill={series.fill}
                          stroke={series.hex}
                          strokeWidth={2.2}
                          strokeDasharray={series.dash}
                        />
                        {RADAR_AXES.map((axis, axisIdx) => {
                          const angle = -Math.PI / 2 + (axisIdx * 2 * Math.PI) / RADAR_AXES.length;
                          const val = scores[axis.key];
                          const pt = polarToCartesian(cx, cy, (val / 100) * maxR, angle);
                          return (
                            <circle
                              key={axis.key}
                              cx={pt.x}
                              cy={pt.y}
                              r={activeAxis === axis.key ? 5 : 3.5}
                              fill={series.hex}
                              stroke="#FFFFFF"
                              strokeWidth={1.5}
                            />
                          );
                        })}
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Overlaid Series Legend & Quick Cards */}
              <div className="lg:col-span-5 space-y-3">
                {institutions.map((inst, idx) => {
                  const series = SERIES_PALETTE[idx % SERIES_PALETTE.length];
                  const scores = getRadarScores(inst);
                  const meanScore = Math.round(
                    RADAR_AXES.reduce((acc, a) => acc + scores[a.key], 0) / RADAR_AXES.length
                  );
                  return (
                    <div
                      key={inst.id}
                      className="p-3.5 border border-[#E5E0D8] rounded-md bg-[#FBF9F5] flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-xs shrink-0"
                            style={{ backgroundColor: series.hex }}
                            aria-hidden="true"
                          />
                          <button
                            type="button"
                            onClick={() => onSelectProfile(inst.id)}
                            className="font-serif font-semibold text-sm text-[#1C1917] hover:text-[#14532D] text-left truncate cursor-pointer"
                          >
                            {inst.name}
                          </button>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-[#57534E] font-mono tabular-nums">
                          <span>{formatTypeLabel(inst.type)}</span>
                          <span aria-hidden="true">·</span>
                          <span>Health {inst.health_score}</span>
                          <span aria-hidden="true">·</span>
                          <span>Research {inst.research_score}</span>
                          <span aria-hidden="true">·</span>
                          <span>Mean {meanScore}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemoveCompare(inst.id)}
                        aria-label={`Remove ${inst.name}`}
                        className="p-1 text-[#78716C] hover:text-[#9A3412] rounded transition-colors cursor-pointer shrink-0"
                      >
                        <X className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
