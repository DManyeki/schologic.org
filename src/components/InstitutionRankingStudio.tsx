import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Check,
  ExternalLink,
  GitCompare,
  SlidersHorizontal,
  RotateCcw,
} from 'lucide-react';
import {
  type InstitutionType,
  type OwnershipType,
  type PublicInstitutionSummary,
  type TvetCategory,
  formatCategoryLabel,
  formatTypeLabel,
} from '../types/institution';
import {
  readComparedSlugs,
  subscribeCompareChanges,
  toggleComparedSlug,
} from '../lib/compareStore';
import { useInstitutionsIndex } from '../lib/institutionClientIndex';
import InstitutionLogo from './InstitutionLogo';

interface Props {
  initialInstitutions: PublicInstitutionSummary[];
}

type CriterionKey =
  | 'registry_standing'
  | 'curriculum_depth'
  | 'digital_readiness'
  | 'facilities_footprint'
  | 'practicum_alignment';

interface CriterionMeta {
  key: CriterionKey;
  label: string;
  shortLabel: string;
  color: string;
  description: string;
}

const CRITERIA: CriterionMeta[] = [
  {
    key: 'registry_standing',
    label: 'Registry & Verification',
    shortLabel: 'Registry',
    color: '#14532D',
    description: 'CUE / TVETA / MoH verification standing, accreditations, and profile completeness.',
  },
  {
    key: 'curriculum_depth',
    label: 'Curriculum & Courses',
    shortLabel: 'Curriculum',
    color: '#1E3A8A',
    description: 'Volume of accredited courses and breadth across degree, diploma, and artisan tiers.',
  },
  {
    key: 'digital_readiness',
    label: 'Digital & ODeL / LMS',
    shortLabel: 'Digital',
    color: '#0F766E',
    description: 'Verified e-learning, distance/ODeL programmes, official web portal, and Schologic LMS.',
  },
  {
    key: 'facilities_footprint',
    label: 'Facilities & Campuses',
    shortLabel: 'Facilities',
    color: '#92400E',
    description: 'Indexed libraries, engineering workshops, laboratories, and multi-campus footprint.',
  },
  {
    key: 'practicum_alignment',
    label: 'Practicum & Clinical',
    shortLabel: 'Practicum',
    color: '#9A3412',
    description: 'Teaching practice, KMTC clinical rotations, and CBET/NITA industrial attachments.',
  },
];

interface PresetDef {
  id: string;
  label: string;
  weights: Record<CriterionKey, number>;
}

const PRESETS: PresetDef[] = [
  {
    id: 'composite',
    label: 'Balanced Composite',
    weights: {
      registry_standing: 24,
      curriculum_depth: 24,
      digital_readiness: 20,
      facilities_footprint: 16,
      practicum_alignment: 16,
    },
  },
  {
    id: 'digital',
    label: 'Digital & ODeL Readiness',
    weights: {
      registry_standing: 15,
      curriculum_depth: 15,
      digital_readiness: 48,
      facilities_footprint: 12,
      practicum_alignment: 10,
    },
  },
  {
    id: 'curriculum',
    label: 'Curriculum Depth',
    weights: {
      registry_standing: 20,
      curriculum_depth: 50,
      digital_readiness: 10,
      facilities_footprint: 12,
      practicum_alignment: 8,
    },
  },
  {
    id: 'practicum',
    label: 'Practicum & Technical',
    weights: {
      registry_standing: 18,
      curriculum_depth: 18,
      digital_readiness: 10,
      facilities_footprint: 16,
      practicum_alignment: 38,
    },
  },
  {
    id: 'registry',
    label: 'Verification & Standing',
    weights: {
      registry_standing: 48,
      curriculum_depth: 20,
      digital_readiness: 12,
      facilities_footprint: 12,
      practicum_alignment: 8,
    },
  },
];

export default function InstitutionRankingStudio({ initialInstitutions }: Props) {
  const { institutions } = useInstitutionsIndex(initialInstitutions);

  const [activePreset, setActivePreset] = useState<string>('composite');
  const [weights, setWeights] = useState<Record<CriterionKey, number>>(PRESETS[0].weights);
  const [showCustomSliders, setShowCustomSliders] = useState(false);

  const [typeFilter, setTypeFilter] = useState<'all' | InstitutionType>('all');
  const [tvetCategory, setTvetCategory] = useState<'all' | TvetCategory>('all');
  const [ownershipFilter, setOwnershipFilter] = useState<'all' | OwnershipType>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');

  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [pinnedSlugs, setPinnedSlugs] = useState<string[]>(() =>
    typeof window !== 'undefined' ? readComparedSlugs() : []
  );

  useEffect(() => {
    setPinnedSlugs(readComparedSlugs());
    return subscribeCompareChanges(setPinnedSlugs);
  }, []);

  const regions = useMemo(() => {
    return Array.from(new Set(institutions.map((i) => i.region))).sort();
  }, [institutions]);

  const totalWeight = useMemo(
    () => Math.max(1, Object.values(weights).reduce((s, v) => s + v, 0)),
    [weights]
  );

  const normalizedWeights = useMemo(() => {
    const out = {} as Record<CriterionKey, number>;
    for (const c of CRITERIA) {
      out[c.key] = weights[c.key] / totalWeight;
    }
    return out;
  }, [weights, totalWeight]);

  const ranked = useMemo(() => {
    const filtered = institutions.filter((inst) => {
      if (typeFilter !== 'all' && inst.type !== typeFilter) return false;
      if (typeFilter === 'tvet' && tvetCategory !== 'all' && inst.category !== tvetCategory) {
        return false;
      }
      if (ownershipFilter !== 'all' && inst.ownership !== ownershipFilter) return false;
      if (regionFilter !== 'all' && inst.region !== regionFilter) return false;
      return true;
    });

    const scored = filtered.map((inst) => {
      let weightedTotal = 0;
      const contributions = {} as Record<CriterionKey, number>;
      for (const c of CRITERIA) {
        const raw = inst.ranking_scores[c.key];
        const contrib = raw * normalizedWeights[c.key];
        contributions[c.key] = contrib;
        weightedTotal += contrib;
      }
      return {
        inst,
        score: Number(weightedTotal.toFixed(1)),
        contributions,
      };
    });

    scored.sort(
      (a, b) =>
        b.score - a.score ||
        b.inst.course_count - a.inst.course_count ||
        a.inst.name.localeCompare(b.inst.name)
    );

    return {
      totalMatching: scored.length,
      top10: scored.slice(0, 10),
    };
  }, [institutions, typeFilter, tvetCategory, ownershipFilter, regionFilter, normalizedWeights]);

  const activeEntry = useMemo(() => {
    if (selectedSlug) {
      const found = ranked.top10.find((r) => r.inst.slug === selectedSlug);
      if (found) return found;
    }
    return ranked.top10[0] ?? null;
  }, [ranked.top10, selectedSlug]);

  const applyPreset = (preset: PresetDef) => {
    setActivePreset(preset.id);
    setWeights({ ...preset.weights });
  };

  const handleSliderChange = (key: CriterionKey, val: number) => {
    setActivePreset('custom');
    setWeights((prev) => ({ ...prev, [key]: val }));
  };

  return (
    <section
      aria-label="Integrative Multi-Criteria Institutional Scoring & Ranking Studio"
      className="space-y-5"
    >
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 border-b border-hairline pb-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-forest font-semibold">
            Integrative Multi-Criteria Scoring
          </p>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-ink mt-0.5">
            Institutional Ranking &amp; Capability Index
          </h2>
          <p className="text-sm text-muted mt-1 max-w-2xl">
            Rank Kenya’s {institutions.length.toLocaleString()} institutions dynamically across five
            evidence-backed criteria, or tune the criterion weights to match your priorities.
          </p>
        </div>

        <a
          href="/directory"
          className="inline-flex items-center gap-1.5 px-4 py-2 border border-ink bg-paper text-ink text-xs font-semibold hover:bg-ink hover:text-paper transition-colors whitespace-nowrap self-start md:self-auto"
        >
          Browse All {institutions.length.toLocaleString()} Institutions
          <ArrowUpRight className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Controls Bar */}
      <div className="border border-hairline bg-limestone/40 p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Ranking Lens Presets */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted mr-1">
              Scoring Lens:
            </span>
            {PRESETS.map((preset) => {
              const active = activePreset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className={`px-3 py-1.5 text-xs font-medium border cursor-pointer transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-ink text-paper border-ink'
                      : 'bg-paper text-muted border-hairline hover:text-ink'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setShowCustomSliders((v) => !v)}
            aria-expanded={showCustomSliders}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border cursor-pointer transition-colors whitespace-nowrap ${
              showCustomSliders || activePreset === 'custom'
                ? 'bg-forest text-paper border-forest'
                : 'bg-paper text-ink border-hairline hover:border-ink'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {showCustomSliders ? 'Hide Weight Controls' : 'Tune Criterion Weights'}
          </button>
        </div>

        {/* Custom Criterion Weight Sliders */}
        {showCustomSliders && (
          <div className="pt-3 border-t border-hairline grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {CRITERIA.map((c) => {
              const sharePct = Math.round(normalizedWeights[c.key] * 100);
              return (
                <div key={c.key} className="bg-paper border border-hairline p-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-ink flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 inline-block shrink-0"
                        style={{ backgroundColor: c.color }}
                      />
                      {c.shortLabel}
                    </span>
                    <span className="font-mono font-semibold text-ink tabular-nums">
                      {sharePct}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={weights[c.key]}
                    aria-label={`${c.label} weight`}
                    onChange={(e) => handleSliderChange(c.key, Number(e.target.value))}
                    className="w-full accent-forest cursor-pointer"
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Segment Filters */}
        <div className="pt-3 border-t border-hairline/70 flex flex-wrap items-center gap-2.5 text-xs">
          <div className="flex border border-hairline bg-paper">
            {(
              [
                { key: 'all', label: 'All Types' },
                { key: 'university', label: 'Universities' },
                { key: 'tvet', label: 'TVET' },
                { key: 'kmtc', label: 'KMTC' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => {
                  setTypeFilter(opt.key);
                  if (opt.key !== 'tvet') setTvetCategory('all');
                }}
                className={`px-3 py-1.5 font-medium cursor-pointer transition-colors whitespace-nowrap ${
                  typeFilter === opt.key ? 'bg-ink text-paper' : 'text-muted hover:text-ink'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {typeFilter === 'tvet' && (
            <div className="flex border border-hairline bg-paper">
              {(['all', 'NP', 'TVC', 'VTC'] as const).map((tier) => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => setTvetCategory(tier)}
                  className={`px-2.5 py-1.5 font-mono text-[11px] cursor-pointer ${
                    tvetCategory === tier ? 'bg-lapis text-paper' : 'text-muted hover:text-ink'
                  }`}
                >
                  {tier === 'all' ? 'All TVET' : tier}
                </button>
              ))}
            </div>
          )}

          <select
            aria-label="Filter ranking by ownership"
            value={ownershipFilter}
            onChange={(e) => setOwnershipFilter(e.target.value as 'all' | OwnershipType)}
            className="px-2.5 py-1.5 bg-paper border border-hairline text-ink focus:outline-none focus:border-forest"
          >
            <option value="all">Public &amp; Private</option>
            <option value="public">Public Only</option>
            <option value="private">Private Only</option>
          </select>

          <select
            aria-label="Filter ranking by region"
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-paper border border-hairline text-ink focus:outline-none focus:border-forest"
          >
            <option value="all">All 8 Regions</option>
            {regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          <span className="ml-auto font-mono text-[11px] text-muted tabular-nums">
            Top 10 of {ranked.totalMatching.toLocaleString()} matching institutions
          </span>
        </div>
      </div>

      {/* Main Visualization Grid: Left Stacked Ranking Bars (8 cols) + Right Inspector (4 cols) */}
      {ranked.top10.length === 0 ? (
        <div className="border border-hairline bg-paper p-10 text-center space-y-3">
          <p className="font-serif text-xl text-ink">No institutions match this segment filter.</p>
          <button
            type="button"
            onClick={() => {
              setTypeFilter('all');
              setTvetCategory('all');
              setOwnershipFilter('all');
              setRegionFilter('all');
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-ink text-paper text-xs font-semibold hover:bg-forest cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left: Stacked Multi-Criteria Horizontal Score Visualization */}
          <div className="lg:col-span-8 border border-hairline bg-paper p-5 sm:p-6 flex flex-col justify-between space-y-4">
            {/* Stacked Segment Legend */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-hairline text-[11px]">
              <div className="flex flex-wrap items-center gap-4">
                {CRITERIA.map((c) => (
                  <span key={c.key} className="inline-flex items-center gap-1.5 text-ink">
                    <span
                      className="w-2.5 h-2.5 inline-block shrink-0"
                      style={{ backgroundColor: c.color }}
                    />
                    <span>{c.shortLabel}</span>
                    <span className="font-mono text-muted tabular-nums">
                      ({Math.round(normalizedWeights[c.key] * 100)}%)
                    </span>
                  </span>
                ))}
              </div>
              <span className="font-mono text-muted uppercase tracking-wider">
                Weighted Score / 100
              </span>
            </div>

            {/* Top 10 Ranked Rows */}
            <div className="divide-y divide-hairline">
              {ranked.top10.map((entry, idx) => {
                const { inst, score, contributions } = entry;
                const isSelected = activeEntry?.inst.slug === inst.slug;
                return (
                  <div
                    key={inst.slug}
                    onClick={() => setSelectedSlug(inst.slug)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedSlug(inst.slug);
                      }
                    }}
                    className={`py-3 px-2.5 -mx-2.5 cursor-pointer transition-colors grid grid-cols-1 sm:grid-cols-12 gap-3 items-center ${
                      isSelected ? 'bg-forest/[0.05]' : 'hover:bg-limestone/40'
                    }`}
                  >
                    {/* Rank + Logo + Title (6 cols) */}
                    <div className="sm:col-span-6 flex items-center gap-3 min-w-0">
                      <span className="font-mono text-xs font-semibold text-muted tabular-nums w-6 shrink-0">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <InstitutionLogo
                        name={inst.name}
                        logoUrl={inst.logo_url}
                        type={inst.type}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <div className="font-serif text-sm sm:text-base font-semibold text-ink truncate">
                          {inst.name}
                        </div>
                        <div className="font-mono text-[10px] text-muted truncate">
                          {formatTypeLabel(inst.type)}
                          {inst.category ? ` (${inst.category})` : ''} · {inst.county} County ·{' '}
                          {inst.course_count} courses
                        </div>
                      </div>
                    </div>

                    {/* Stacked Proportional Contribution Bar + Total Score (6 cols) */}
                    <div className="sm:col-span-6 flex items-center gap-3">
                      <div
                        className="flex-1 h-4 bg-limestone/70 flex overflow-hidden"
                        title={`Composite weighted score: ${score} / 100`}
                      >
                        {CRITERIA.map((c) => {
                          const widthPct = Math.max(0, contributions[c.key]);
                          return (
                            <div
                              key={c.key}
                              style={{
                                width: `${widthPct}%`,
                                backgroundColor: c.color,
                              }}
                              title={`${c.label}: +${contributions[c.key].toFixed(1)} pts (raw ${inst.ranking_scores[c.key]}/100)`}
                              className="h-full transition-all duration-200 border-r border-paper/40 last:border-r-0"
                            />
                          );
                        })}
                      </div>

                      <span className="font-mono text-sm font-semibold text-ink tabular-nums w-12 text-right shrink-0">
                        {score.toFixed(1)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Selected Ranked Institution Breakdown & Quick Actions */}
          {activeEntry && (
            <aside className="lg:col-span-4 border border-hairline bg-paper p-5 sm:p-6 flex flex-col justify-between gap-5">
              <div className="space-y-4">
                <div className="flex items-start gap-3.5 pb-4 border-b border-hairline">
                  <InstitutionLogo
                    name={activeEntry.inst.name}
                    logoUrl={activeEntry.inst.logo_url}
                    type={activeEntry.inst.type}
                    size="md"
                  />
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-forest font-semibold">
                      Score Breakdown · {activeEntry.score.toFixed(1)} / 100
                    </p>
                    <h3 className="font-serif text-xl font-semibold text-ink leading-snug mt-0.5">
                      <a
                        href={`/institutions/${activeEntry.inst.slug}`}
                        className="hover:text-forest hover:underline"
                      >
                        {activeEntry.inst.name}
                      </a>
                    </h3>
                    <p className="font-mono text-[11px] text-muted mt-0.5">
                      {formatTypeLabel(activeEntry.inst.type)} ·{' '}
                      {formatCategoryLabel(activeEntry.inst.category)}
                    </p>
                  </div>
                </div>

                {/* 5-Axis Individual Meter Breakdown */}
                <div className="space-y-3">
                  {CRITERIA.map((c) => {
                    const rawVal = activeEntry.inst.ranking_scores[c.key];
                    const contrib = activeEntry.contributions[c.key];
                    return (
                      <div key={c.key} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-ink">{c.label}</span>
                          <span className="font-mono text-[11px] tabular-nums text-muted">
                            <strong className="text-ink">{rawVal}</strong>/100 (+
                            {contrib.toFixed(1)} wt)
                          </span>
                        </div>
                        <div className="h-2 bg-limestone overflow-hidden">
                          <div
                            className="h-full transition-all duration-200"
                            style={{ width: `${rawVal}%`, backgroundColor: c.color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Metadata Summary */}
                <dl className="pt-3 border-t border-hairline grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <dt className="text-muted">Location</dt>
                    <dd className="font-medium text-ink mt-0.5">
                      {activeEntry.inst.town}, {activeEntry.inst.county}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">Schologic LMS</dt>
                    <dd className="font-mono text-ink mt-0.5 truncate">
                      {activeEntry.inst.portal_subdomain ?? 'Claimable subdomain'}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="pt-4 border-t border-hairline flex flex-col gap-2">
                <a
                  href={`/institutions/${activeEntry.inst.slug}`}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-forest text-paper text-xs font-semibold hover:bg-ink transition-colors"
                >
                  View Full Profile
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>

                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={activeEntry.inst.google_maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1 px-3 py-2 border border-hairline bg-limestone/50 text-ink text-xs font-semibold hover:border-ink transition-colors"
                  >
                    Google Maps
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <button
                    type="button"
                    onClick={() => toggleComparedSlug(activeEntry.inst.slug)}
                    className={`inline-flex items-center justify-center gap-1 px-3 py-2 border text-xs font-semibold cursor-pointer transition-colors ${
                      pinnedSlugs.includes(activeEntry.inst.slug)
                        ? 'bg-ink text-paper border-ink'
                        : 'bg-paper text-ink border-hairline hover:border-ink'
                    }`}
                  >
                    {pinnedSlugs.includes(activeEntry.inst.slug) ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Pinned
                      </>
                    ) : (
                      <>
                        <GitCompare className="w-3.5 h-3.5" /> Compare
                      </>
                    )}
                  </button>
                </div>
              </div>
            </aside>
          )}
        </div>
      )}
    </section>
  );
}
