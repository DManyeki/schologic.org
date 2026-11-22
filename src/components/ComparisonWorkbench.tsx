import React, { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  X,
  ArrowUpRight,
  Layers,
  Columns2,
  Info,
  CheckCircle2,
  Minus,
} from 'lucide-react';
import {
  PUBLIC_RADAR_AXES,
  type PublicInstitution,
  type PublicRadarAxisKey,
  SERIES_PALETTE,
  formatCategoryLabel,
  formatTypeLabel,
  getPublicRadarScores,
} from '../types/institution';
import {
  DEFAULT_COMPARE_SLUGS,
  readComparedSlugs,
  subscribeCompareChanges,
  writeComparedSlugs,
} from '../lib/compareStore';

interface Props {
  institutions: PublicInstitution[];
}

const PRESETS: Array<{ label: string; slugs: string[] }> = [
  {
    label: 'Universities vs National Polytechnic',
    slugs: ['university-of-nairobi', 'strathmore-university', 'the-nairobi-national-polytechnic'],
  },
  {
    label: 'STEM & Engineering Leaders',
    slugs: ['jkuat-juja', 'dedan-kimathi-university-of-technology', 'technical-university-of-kenya'],
  },
  {
    label: 'Clinical & Health Network',
    slugs: ['kmtc-nairobi-main', 'aga-khan-university-kenya', 'mount-kenya-university'],
  },
  {
    label: 'Coastal & Lake Basin Regional',
    slugs: ['pwani-university', 'kenya-coast-national-polytechnic', 'maseno-university', 'kmtc-kisumu-campus'],
  },
];

export default function ComparisonWorkbench({ institutions }: Props) {
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>(DEFAULT_COMPARE_SLUGS);
  const [radarMode, setRadarMode] = useState<'overlay' | 'split'>('overlay');
  const [enrollmentScale, setEnrollmentScale] = useState<'linear' | 'log'>('linear');
  const [activeAxis, setActiveAxis] = useState<PublicRadarAxisKey>('curriculum_depth');
  const [addSlug, setAddSlug] = useState<string>('');

  useEffect(() => {
    const initial = readComparedSlugs();
    setSelectedSlugs(initial.length > 0 ? initial : DEFAULT_COMPARE_SLUGS);
    return subscribeCompareChanges((slugs) => {
      setSelectedSlugs(slugs);
    });
  }, []);

  const updateSlugs = (next: string[]) => {
    const cleaned = next.slice(0, 4);
    setSelectedSlugs(cleaned);
    writeComparedSlugs(cleaned);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (cleaned.length > 0) {
        url.searchParams.set('ids', cleaned.join(','));
      } else {
        url.searchParams.delete('ids');
      }
      window.history.replaceState({}, '', url.toString());
    }
  };

  const selectedInstitutions = useMemo(
    () =>
      selectedSlugs
        .map((s) => institutions.find((i) => i.slug === s))
        .filter((i): i is PublicInstitution => Boolean(i)),
    [selectedSlugs, institutions]
  );

  const availableToAdd = useMemo(
    () => institutions.filter((i) => !selectedSlugs.includes(i.slug)),
    [institutions, selectedSlugs]
  );

  const scoreMap = useMemo(() => {
    const map = new Map<string, Record<PublicRadarAxisKey, number>>();
    for (const inst of selectedInstitutions) {
      map.set(inst.slug, getPublicRadarScores(inst));
    }
    return map;
  }, [selectedInstitutions]);

  const activeAxisMeta =
    PUBLIC_RADAR_AXES.find((a) => a.key === activeAxis) ?? PUBLIC_RADAR_AXES[0];

  // Overlay SVG Radar math
  const svgSize = 380;
  const cx = svgSize / 2;
  const cy = svgSize / 2;
  const maxR = 132;
  const angleStep = (Math.PI * 2) / PUBLIC_RADAR_AXES.length;

  const pointAt = (axisIdx: number, val: number, rScale = maxR, center = { x: cx, y: cy }) => {
    const angle = -Math.PI / 2 + axisIdx * angleStep;
    const r = (val / 100) * rScale;
    return {
      x: center.x + r * Math.cos(angle),
      y: center.y + r * Math.sin(angle),
    };
  };

  const maxEnrollment = Math.max(
    1,
    ...selectedInstitutions.map((i) => i.estimated_student_count)
  );
  const maxLogEnrollment = Math.max(
    1,
    ...selectedInstitutions.map((i) => Math.log10(Math.max(10, i.estimated_student_count)))
  );

  return (
    <div className="space-y-8">
      {/* Selection & Preset Bar */}
      <section className="border border-hairline bg-limestone/45 p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest text-muted">
              Active Comparison Set ({selectedInstitutions.length} / 4)
            </p>
            <h2 className="font-serif text-xl font-semibold text-ink mt-0.5">
              Select Institutions to Benchmark
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="add-inst-select" className="sr-only">
              Add institution to comparison
            </label>
            <select
              id="add-inst-select"
              value={addSlug}
              disabled={selectedInstitutions.length >= 4 || availableToAdd.length === 0}
              onChange={(e) => {
                const val = e.target.value;
                if (val) {
                  updateSlugs([...selectedSlugs, val]);
                  setAddSlug('');
                }
              }}
              className="px-3 py-2 text-xs bg-paper border border-hairline text-ink focus:outline-none focus:border-forest disabled:opacity-50 max-w-xs"
            >
              <option value="">
                {selectedInstitutions.length >= 4
                  ? 'Maximum 4 institutions selected'
                  : '+ Add Kenyan institution...'}
              </option>
              {availableToAdd.map((inst) => (
                <option key={inst.slug} value={inst.slug}>
                  {inst.name} ({formatTypeLabel(inst.type)})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Chips */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {selectedInstitutions.map((inst, idx) => {
            const palette = SERIES_PALETTE[idx % SERIES_PALETTE.length];
            return (
              <div
                key={inst.slug}
                className="bg-paper border border-hairline p-3.5 flex items-start justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block w-3 h-3 shrink-0"
                      style={{ backgroundColor: palette.hex }}
                      aria-hidden="true"
                    />
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
                      {palette.name}
                    </span>
                  </div>
                  <a
                    href={`/institutions/${inst.slug}`}
                    className="block font-serif text-sm font-semibold text-ink hover:text-forest hover:underline mt-1 truncate"
                    title={inst.name}
                  >
                    {inst.name}
                  </a>
                  <p className="font-mono text-[11px] text-muted mt-0.5">
                    {formatTypeLabel(inst.type)} · {inst.county}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => updateSlugs(selectedSlugs.filter((s) => s !== inst.slug))}
                  aria-label={`Remove ${inst.name}`}
                  className="p-1 text-muted hover:text-terracotta cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}

          {selectedInstitutions.length < 4 && (
            <div className="border border-dashed border-hairline bg-paper/50 p-3.5 flex items-center justify-center text-xs text-muted">
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              <span>Add up to {4 - selectedInstitutions.length} more</span>
            </div>
          )}
        </div>

        {/* Presets */}
        <div className="pt-3 border-t border-hairline flex flex-wrap items-center gap-2 text-xs">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted mr-1">
            Presets:
          </span>
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => updateSlugs(preset.slugs)}
              className="px-2.5 py-1 bg-paper border border-hairline text-ink hover:border-forest hover:text-forest transition-colors cursor-pointer"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </section>

      {selectedInstitutions.length === 0 ? (
        <div className="border border-hairline bg-paper p-12 text-center space-y-3">
          <p className="font-serif text-xl text-ink">Select at least one institution to compare.</p>
          <p className="text-sm text-muted">
            Use the selector above or choose a preset cohort to render the 6-axis radar and
            multi-metric enrollment benchmarks.
          </p>
          <button
            type="button"
            onClick={() => updateSlugs(DEFAULT_COMPARE_SLUGS)}
            className="px-4 py-2 bg-ink text-paper text-xs font-semibold hover:bg-forest transition-colors cursor-pointer"
          >
            Load Default Cohort
          </button>
        </div>
      ) : (
        <>
          {/* Section 1: Side-by-Side & Overlaid Radar Studio */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 border border-hairline bg-paper p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-hairline">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-widest text-muted">
                    Comparative Geometry
                  </p>
                  <h3 className="font-serif text-xl font-semibold text-ink">
                    6-Axis Public Capability Radar
                  </h3>
                </div>

                <div className="flex border border-hairline bg-limestone/40 self-start">
                  <button
                    type="button"
                    onClick={() => setRadarMode('overlay')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold cursor-pointer transition-colors ${
                      radarMode === 'overlay' ? 'bg-ink text-paper' : 'text-muted hover:text-ink'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    Overlaid
                  </button>
                  <button
                    type="button"
                    onClick={() => setRadarMode('split')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold cursor-pointer transition-colors ${
                      radarMode === 'split' ? 'bg-ink text-paper' : 'text-muted hover:text-ink'
                    }`}
                  >
                    <Columns2 className="w-3.5 h-3.5" />
                    Side-by-Side
                  </button>
                </div>
              </div>

              {radarMode === 'overlay' ? (
                <div className="mt-5 flex flex-col items-center">
                  <svg
                    viewBox={`0 0 ${svgSize} ${svgSize}`}
                    className="w-full max-w-[380px] h-auto overflow-visible"
                    role="img"
                    aria-label="Overlaid 6-axis institutional capability radar chart"
                  >
                    {[20, 40, 60, 80, 100].map((ring) => {
                      const pts = PUBLIC_RADAR_AXES.map((_, idx) => {
                        const p = pointAt(idx, ring);
                        return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
                      }).join(' ');
                      return (
                        <g key={ring}>
                          <polygon
                            points={pts}
                            fill="none"
                            stroke="#E5E0D8"
                            strokeWidth="1"
                          />
                          <text
                            x={cx + 4}
                            y={cy - (ring / 100) * maxR + 3}
                            className="fill-muted text-[9px] font-mono"
                          >
                            {ring}
                          </text>
                        </g>
                      );
                    })}

                    {PUBLIC_RADAR_AXES.map((axis, idx) => {
                      const outer = pointAt(idx, 100);
                      const labelPt = pointAt(idx, 120);
                      const isActive = activeAxis === axis.key;
                      return (
                        <g
                          key={axis.key}
                          onClick={() => setActiveAxis(axis.key)}
                          className="cursor-pointer"
                        >
                          <line
                            x1={cx}
                            y1={cy}
                            x2={outer.x}
                            y2={outer.y}
                            stroke={isActive ? '#14532D' : '#E5E0D8'}
                            strokeWidth={isActive ? '1.5' : '1'}
                          />
                          <text
                            x={labelPt.x}
                            y={labelPt.y}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className={`text-[10px] font-mono uppercase ${
                              isActive ? 'fill-forest font-semibold' : 'fill-muted'
                            }`}
                          >
                            {axis.shortLabel}
                          </text>
                        </g>
                      );
                    })}

                    {selectedInstitutions.map((inst, sIdx) => {
                      const palette = SERIES_PALETTE[sIdx % SERIES_PALETTE.length];
                      const scores = scoreMap.get(inst.slug)!;
                      const pts = PUBLIC_RADAR_AXES.map((axis, aIdx) => {
                        const p = pointAt(aIdx, scores[axis.key]);
                        return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
                      }).join(' ');

                      return (
                        <g key={inst.slug}>
                          <polygon
                            points={pts}
                            fill={palette.fill}
                            stroke={palette.hex}
                            strokeWidth="2.2"
                            strokeDasharray={palette.dash}
                          />
                          {PUBLIC_RADAR_AXES.map((axis, aIdx) => {
                            const p = pointAt(aIdx, scores[axis.key]);
                            return (
                              <circle
                                key={axis.key}
                                cx={p.x}
                                cy={p.y}
                                r="3.5"
                                fill={palette.hex}
                                stroke="#FBF9F5"
                                strokeWidth="1.5"
                              />
                            );
                          })}
                        </g>
                      );
                    })}
                  </svg>
                  <p className="mt-2 text-xs text-muted">
                    Click any axis label on the radar to inspect scoring methodology and exact values.
                  </p>
                </div>
              ) : (
                /* Side-by-Side Small Multiples */
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedInstitutions.map((inst, sIdx) => {
                    const palette = SERIES_PALETTE[sIdx % SERIES_PALETTE.length];
                    const scores = scoreMap.get(inst.slug)!;
                    const mini = 200;
                    const mCenter = { x: mini / 2, y: mini / 2 };
                    const mR = 64;
                    const poly = PUBLIC_RADAR_AXES.map((axis, aIdx) => {
                      const p = pointAt(aIdx, scores[axis.key], mR, mCenter);
                      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
                    }).join(' ');

                    return (
                      <div
                        key={inst.slug}
                        className="border border-hairline bg-limestone/25 p-3 flex flex-col items-center"
                      >
                        <div className="w-full flex items-center justify-between gap-2 pb-2 border-b border-hairline/70">
                          <span className="font-serif text-sm font-semibold text-ink truncate">
                            {inst.aliases[0] ?? inst.name}
                          </span>
                          <span
                            className="w-2.5 h-2.5 shrink-0"
                            style={{ backgroundColor: palette.hex }}
                          />
                        </div>
                        <svg
                          viewBox={`0 0 ${mini} ${mini}`}
                          className="w-44 h-44 mt-2 overflow-visible"
                        >
                          {[33, 66, 100].map((ring) => {
                            const rPts = PUBLIC_RADAR_AXES.map((_, aIdx) => {
                              const p = pointAt(aIdx, ring, mR, mCenter);
                              return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
                            }).join(' ');
                            return (
                              <polygon
                                key={ring}
                                points={rPts}
                                fill="none"
                                stroke="#E5E0D8"
                                strokeWidth="1"
                              />
                            );
                          })}
                          {PUBLIC_RADAR_AXES.map((axis, aIdx) => {
                            const outer = pointAt(aIdx, 100, mR, mCenter);
                            const lbl = pointAt(aIdx, 123, mR, mCenter);
                            return (
                              <g key={axis.key}>
                                <line
                                  x1={mCenter.x}
                                  y1={mCenter.y}
                                  x2={outer.x}
                                  y2={outer.y}
                                  stroke="#E5E0D8"
                                  strokeWidth="1"
                                />
                                <text
                                  x={lbl.x}
                                  y={lbl.y}
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                  className="fill-muted text-[8px] font-mono uppercase"
                                >
                                  {axis.shortLabel}
                                </text>
                              </g>
                            );
                          })}
                          <polygon
                            points={poly}
                            fill={palette.fill}
                            stroke={palette.hex}
                            strokeWidth="2"
                          />
                        </svg>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right: Interactive Axis Inspector */}
            <div className="lg:col-span-5 border border-hairline bg-paper p-5 sm:p-6 space-y-5">
              <div className="pb-4 border-b border-hairline">
                <p className="font-mono text-[11px] uppercase tracking-widest text-muted">
                  Axis Breakdown Inspector
                </p>
                <h3 className="font-serif text-xl font-semibold text-ink mt-0.5">
                  {activeAxisMeta.label}
                </h3>
                <p className="text-xs text-muted mt-1.5 leading-relaxed flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-forest" />
                  <span>{activeAxisMeta.description}</span>
                </p>
              </div>

              {/* Axis Tabs */}
              <div className="grid grid-cols-3 gap-1.5">
                {PUBLIC_RADAR_AXES.map((axis) => (
                  <button
                    key={axis.key}
                    type="button"
                    onClick={() => setActiveAxis(axis.key)}
                    className={`px-2 py-1.5 text-[11px] font-mono uppercase border text-center cursor-pointer transition-colors ${
                      activeAxis === axis.key
                        ? 'bg-ink text-paper border-ink'
                        : 'bg-limestone/40 text-muted border-hairline hover:text-ink'
                    }`}
                  >
                    {axis.shortLabel}
                  </button>
                ))}
              </div>

              {/* Per-Institution Bars for Selected Axis */}
              <div className="space-y-3 pt-1">
                {selectedInstitutions.map((inst, idx) => {
                  const palette = SERIES_PALETTE[idx % SERIES_PALETTE.length];
                  const val = scoreMap.get(inst.slug)?.[activeAxis] ?? 0;
                  return (
                    <div key={inst.slug} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-ink truncate pr-2">
                          {inst.name}
                        </span>
                        <span className="font-mono font-semibold text-ink tabular-nums shrink-0">
                          {val} / 100
                        </span>
                      </div>
                      <div className="h-2.5 w-full bg-limestone overflow-hidden">
                        <div
                          className="h-full transition-all duration-300"
                          style={{ width: `${val}%`, backgroundColor: palette.hex }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Overall Composite Mean */}
              <div className="pt-4 border-t border-hairline">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-2">
                  All-Axis Summary Matrix
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-hairline text-muted font-mono">
                        <th className="py-1.5 text-left font-medium">Axis</th>
                        {selectedInstitutions.map((inst, idx) => (
                          <th key={inst.slug} className="py-1.5 text-right font-medium pl-2">
                            <span
                              className="inline-block w-2 h-2 mr-1"
                              style={{ backgroundColor: SERIES_PALETTE[idx % 4].hex }}
                            />
                            {inst.aliases[0] ?? inst.slug.slice(0, 6)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hairline/70">
                      {PUBLIC_RADAR_AXES.map((axis) => (
                        <tr key={axis.key}>
                          <td className="py-1.5 text-muted">{axis.shortLabel}</td>
                          {selectedInstitutions.map((inst) => (
                            <td
                              key={inst.slug}
                              className="py-1.5 text-right font-mono tabular-nums text-ink pl-2"
                            >
                              {scoreMap.get(inst.slug)?.[axis.key]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Multi-Metric Horizontal Benchmarks */}
          <section className="border border-hairline bg-paper p-5 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-hairline">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-widest text-muted">
                  Multi-Metric Benchmarks
                </p>
                <h3 className="font-serif text-xl font-semibold text-ink">
                  Scale, Catalog &amp; Infrastructure Comparison
                </h3>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="font-mono text-[11px] text-muted">Enrollment Scale:</span>
                <div className="flex border border-hairline bg-limestone/40">
                  <button
                    type="button"
                    onClick={() => setEnrollmentScale('linear')}
                    className={`px-2.5 py-1 font-mono text-xs cursor-pointer ${
                      enrollmentScale === 'linear' ? 'bg-ink text-paper' : 'text-muted hover:text-ink'
                    }`}
                  >
                    Linear
                  </button>
                  <button
                    type="button"
                    onClick={() => setEnrollmentScale('log')}
                    className={`px-2.5 py-1 font-mono text-xs cursor-pointer ${
                      enrollmentScale === 'log' ? 'bg-ink text-paper' : 'text-muted hover:text-ink'
                    }`}
                  >
                    Log10
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Enrollment Metric */}
              <div className="space-y-3">
                <h4 className="font-mono text-xs uppercase tracking-wider text-muted">
                  Estimated Student Enrollment ({enrollmentScale})
                </h4>
                {selectedInstitutions.map((inst, idx) => {
                  const palette = SERIES_PALETTE[idx % SERIES_PALETTE.length];
                  const pct =
                    enrollmentScale === 'linear'
                      ? (inst.estimated_student_count / maxEnrollment) * 100
                      : (Math.log10(Math.max(10, inst.estimated_student_count)) /
                          maxLogEnrollment) *
                        100;
                  return (
                    <div key={inst.slug} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-ink truncate pr-2">{inst.name}</span>
                        <span className="font-mono font-semibold tabular-nums text-ink">
                          {inst.estimated_student_count.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-3 bg-limestone overflow-hidden">
                        <div
                          className="h-full transition-all duration-300"
                          style={{ width: `${Math.max(6, pct)}%`, backgroundColor: palette.hex }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* E-Learning Programs Count */}
              <div className="space-y-3">
                <h4 className="font-mono text-xs uppercase tracking-wider text-muted">
                  Active E-Learning Programs
                </h4>
                {(() => {
                  const maxProg = Math.max(
                    1,
                    ...selectedInstitutions.map((i) => i.has_elearning?.[0]?.program_count ?? 0)
                  );
                  return selectedInstitutions.map((inst, idx) => {
                    const palette = SERIES_PALETTE[idx % SERIES_PALETTE.length];
                    const count = inst.has_elearning?.[0]?.program_count ?? 0;
                    const pct = (count / maxProg) * 100;
                    return (
                      <div key={inst.slug} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium text-ink truncate pr-2">{inst.name}</span>
                          <span className="font-mono font-semibold tabular-nums text-ink">
                            {count} programs
                          </span>
                        </div>
                        <div className="h-3 bg-limestone overflow-hidden">
                          <div
                            className="h-full transition-all duration-300"
                            style={{ width: `${count > 0 ? Math.max(6, pct) : 0}%`, backgroundColor: palette.hex }}
                          />
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Campuses & Accreditations */}
              <div className="space-y-3">
                <h4 className="font-mono text-xs uppercase tracking-wider text-muted">
                  Campuses &amp; Regional Centres
                </h4>
                {(() => {
                  const maxCamp = Math.max(
                    1,
                    ...selectedInstitutions.map((i) => i.campuses.length)
                  );
                  return selectedInstitutions.map((inst, idx) => {
                    const palette = SERIES_PALETTE[idx % SERIES_PALETTE.length];
                    const pct = (inst.campuses.length / maxCamp) * 100;
                    return (
                      <div key={inst.slug} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium text-ink truncate pr-2">{inst.name}</span>
                          <span className="font-mono font-semibold tabular-nums text-ink">
                            {inst.campuses.length} campuses
                          </span>
                        </div>
                        <div className="h-3 bg-limestone overflow-hidden">
                          <div
                            className="h-full transition-all duration-300"
                            style={{ width: `${pct}%`, backgroundColor: palette.hex }}
                          />
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Indexed Facilities & Labs */}
              <div className="space-y-3">
                <h4 className="font-mono text-xs uppercase tracking-wider text-muted">
                  Indexed Labs, Libraries &amp; Facilities
                </h4>
                {(() => {
                  const maxFac = Math.max(
                    1,
                    ...selectedInstitutions.map((i) => i.facilities.length)
                  );
                  return selectedInstitutions.map((inst, idx) => {
                    const palette = SERIES_PALETTE[idx % SERIES_PALETTE.length];
                    const pct = (inst.facilities.length / maxFac) * 100;
                    return (
                      <div key={inst.slug} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium text-ink truncate pr-2">{inst.name}</span>
                          <span className="font-mono font-semibold tabular-nums text-ink">
                            {inst.facilities.length} facilities
                          </span>
                        </div>
                        <div className="h-3 bg-limestone overflow-hidden">
                          <div
                            className="h-full transition-all duration-300"
                            style={{ width: `${pct}%`, backgroundColor: palette.hex }}
                          />
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </section>

          {/* Section 3: Side-by-Side Public Dossier Matrix */}
          <section className="border border-hairline bg-paper overflow-x-auto">
            <div className="p-5 border-b border-hairline">
              <p className="font-mono text-[11px] uppercase tracking-widest text-muted">
                Schema-Matched Public Record
              </p>
              <h3 className="font-serif text-xl font-semibold text-ink">
                Side-by-Side Institutional Matrix
              </h3>
            </div>

            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-hairline bg-limestone/50">
                  <th className="py-3.5 px-4 font-mono text-[11px] uppercase tracking-wider text-muted w-48">
                    Public Attribute
                  </th>
                  {selectedInstitutions.map((inst, idx) => (
                    <th key={inst.slug} className="py-3.5 px-4 min-w-[200px]">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 shrink-0"
                          style={{ backgroundColor: SERIES_PALETTE[idx % 4].hex }}
                        />
                        <a
                          href={`/institutions/${inst.slug}`}
                          className="font-serif font-semibold text-ink hover:text-forest hover:underline inline-flex items-center gap-1"
                        >
                          {inst.name}
                          <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                        </a>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                <tr>
                  <td className="py-3 px-4 font-medium text-muted">Classification</td>
                  {selectedInstitutions.map((inst) => (
                    <td key={inst.slug} className="py-3 px-4 text-ink">
                      {formatTypeLabel(inst.type)} · {formatCategoryLabel(inst.category)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-muted">Ownership</td>
                  {selectedInstitutions.map((inst) => (
                    <td key={inst.slug} className="py-3 px-4 capitalize text-ink">
                      {inst.ownership}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-muted">County &amp; Region</td>
                  {selectedInstitutions.map((inst) => (
                    <td key={inst.slug} className="py-3 px-4 text-ink">
                      {inst.county} ({inst.region})
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-muted">Registration No.</td>
                  {selectedInstitutions.map((inst) => (
                    <td key={inst.slug} className="py-3 px-4 font-mono text-xs text-ink">
                      {inst.registration_number ?? '—'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-muted">Founded / Charter</td>
                  {selectedInstitutions.map((inst) => (
                    <td key={inst.slug} className="py-3 px-4 font-mono tabular-nums text-ink">
                      {inst.founded_year ?? '—'}
                      {inst.charter_year ? ` / Chartered ${inst.charter_year}` : ''}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-muted">Faculty Ratio</td>
                  {selectedInstitutions.map((inst) => (
                    <td key={inst.slug} className="py-3 px-4 font-mono tabular-nums text-ink">
                      {inst.faculty_student_ratio ?? '—'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-muted">Campus Portal</td>
                  {selectedInstitutions.map((inst) => {
                    const host = inst.custom_portal_domain ?? inst.portal_subdomain;
                    return (
                      <td key={inst.slug} className="py-3 px-4 font-mono text-xs">
                        {host ? (
                          <a href="/login" className="text-lapis hover:underline">
                            {host}
                          </a>
                        ) : (
                          <span className="text-muted">Claimable (*.schologic.org)</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-muted">E-Learning / ODeL</td>
                  {selectedInstitutions.map((inst) => (
                    <td key={inst.slug} className="py-3 px-4 text-xs">
                      {inst.has_elearning?.[0]?.enabled ? (
                        <span className="inline-flex items-center gap-1 text-forest font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {inst.has_elearning[0].platform ?? 'Active'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-muted">
                          <Minus className="w-3.5 h-3.5" /> Not indexed
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-muted">Teaching Practicum</td>
                  {selectedInstitutions.map((inst) => (
                    <td key={inst.slug} className="py-3 px-4 text-xs">
                      {inst.has_teaching_courses?.[0]?.enabled ? (
                        <span className="inline-flex items-center gap-1 text-forest font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {inst.has_teaching_courses[0].program_count ?? 1}+ tracks
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-muted">
                          <Minus className="w-3.5 h-3.5" /> None
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-muted">Flagship Disciplines</td>
                  {selectedInstitutions.map((inst) => (
                    <td key={inst.slug} className="py-3 px-4 text-xs text-ink leading-relaxed">
                      {inst.flagship_disciplines.join(' · ')}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </section>
        </>
      )}
    </div>
  );
}
