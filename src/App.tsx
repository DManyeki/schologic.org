import React, { useMemo, useState } from 'react';
import { INITIAL_INSTITUTIONS } from './data/kenyaInstitutions';
import { InstitutionRecord, RadarAxisKey } from './types/institution';
import { Header } from './components/Header';
import { FilterState, FilterToolbar } from './components/FilterToolbar';
import { InstitutionDirectory } from './components/InstitutionDirectory';
import { RadarComparisonChart } from './components/RadarComparisonChart';
import { MultiMetricBenchmarks } from './components/MultiMetricBenchmarks';
import { RegionalDistributionPanel } from './components/RegionalDistributionPanel';
import { InstitutionMonographDrawer } from './components/InstitutionMonographDrawer';
import { SchemaImportModal } from './components/SchemaImportModal';

const HERO_IMAGE = '/src/assets/images/kenya_university_campus_1795351876133.jpg';

const DEFAULT_FILTERS: FilterState = {
  searchQuery: '',
  type: 'all',
  category: 'all',
  ownership: 'all',
  status: 'all',
  region: 'all',
  verifiedOnly: false,
  elearningOnly: false,
  distanceOnly: false,
  teachingOnly: false,
  sortKey: 'research_score',
  viewMode: 'cards',
};

// Pre-seeded contrasting trio: University of Nairobi, Strathmore University, The Nairobi National Polytechnic
const DEFAULT_COMPARED_IDS = [
  'd4f8a101-7c2b-4e9d-9a11-000000000001',
  'd4f8a101-7c2b-4e9d-9a11-000000000002',
  'd4f8a101-7c2b-4e9d-9a11-000000000014',
];

export default function App() {
  const [institutions, setInstitutions] = useState<InstitutionRecord[]>(INITIAL_INSTITUTIONS);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [comparedIds, setComparedIds] = useState<string[]>(DEFAULT_COMPARED_IDS);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [activeAxis, setActiveAxis] = useState<RadarAxisKey | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [limitNotice, setLimitNotice] = useState<string | null>(null);
  const [heroImgError, setHeroImgError] = useState(false);

  const availableRegions = useMemo(() => {
    const set = new Set<string>();
    institutions.forEach((inst) => {
      if (inst.region) set.add(inst.region);
    });
    return Array.from(set).sort();
  }, [institutions]);

  const filteredInstitutions = useMemo(() => {
    const query = filters.searchQuery.trim().toLowerCase();

    const list = institutions.filter((inst) => {
      if (filters.type !== 'all' && inst.type !== filters.type) return false;
      if (filters.category !== 'all' && inst.category !== filters.category) return false;
      if (filters.ownership !== 'all' && inst.ownership !== filters.ownership) return false;
      if (filters.status !== 'all' && inst.operational_status !== filters.status) return false;
      if (filters.region !== 'all' && inst.region !== filters.region) return false;
      if (filters.verifiedOnly && !inst.is_verified) return false;
      if (filters.elearningOnly && !inst.has_elearning?.[0]?.enabled) return false;
      if (filters.distanceOnly && !inst.has_distance_learning?.[0]?.enabled) return false;
      if (filters.teachingOnly && !inst.has_teaching_courses?.[0]?.enabled) return false;

      if (query) {
        const haystack = [
          inst.name,
          ...(inst.aliases ?? []),
          inst.registration_number ?? '',
          inst.county ?? '',
          inst.region ?? '',
          inst.town ?? '',
          inst.description ?? '',
          ...inst.research_data.flagship_disciplines,
          ...inst.courses.map((c) => c.title),
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }

      return true;
    });

    return [...list].sort((a, b) => {
      switch (filters.sortKey) {
        case 'research_score':
          return b.research_score - a.research_score;
        case 'health_score':
          return b.health_score - a.health_score;
        case 'estimated_student_count':
          return (b.estimated_student_count ?? 0) - (a.estimated_student_count ?? 0);
        case 'name':
          return a.name.localeCompare(b.name);
      }
    });
  }, [institutions, filters]);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.searchQuery !== '' ||
      filters.type !== 'all' ||
      filters.category !== 'all' ||
      filters.ownership !== 'all' ||
      filters.status !== 'all' ||
      filters.region !== 'all' ||
      filters.verifiedOnly ||
      filters.elearningOnly ||
      filters.distanceOnly ||
      filters.teachingOnly
    );
  }, [filters]);

  const kpiStats = useMemo(() => {
    const count = filteredInstitutions.length;
    const verified = filteredInstitutions.filter((i) => i.is_verified).length;
    const enrollment = filteredInstitutions.reduce(
      (sum, i) => sum + (i.estimated_student_count ?? 0),
      0
    );
    const meanHealth = count
      ? Math.round(
          filteredInstitutions.reduce((sum, i) => sum + i.health_score, 0) / count
        )
      : 0;
    const meanResearch = count
      ? Math.round(
          filteredInstitutions.reduce((sum, i) => sum + i.research_score, 0) / count
        )
      : 0;

    return { count, verified, enrollment, meanHealth, meanResearch };
  }, [filteredInstitutions]);

  const comparedInstitutions = useMemo(() => {
    return comparedIds
      .map((id) => institutions.find((inst) => inst.id === id))
      .filter((inst): inst is InstitutionRecord => Boolean(inst));
  }, [comparedIds, institutions]);

  const activeProfile = useMemo(() => {
    if (!activeProfileId) return null;
    return institutions.find((i) => i.id === activeProfileId) ?? null;
  }, [activeProfileId, institutions]);

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters((prev) => ({
      ...DEFAULT_FILTERS,
      sortKey: prev.sortKey,
      viewMode: prev.viewMode,
    }));
  };

  const toggleCompare = (id: string) => {
    setLimitNotice(null);
    setComparedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 4) {
        setLimitNotice('Comparison studio supports up to 4 pinned institutions simultaneously. Unpin one to add another.');
        return prev;
      }
      return [...prev, id];
    });
  };

  const scrollToCompare = () => {
    document.getElementById('compare')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleImportRecords = (newRecords: InstitutionRecord[]) => {
    setInstitutions((prev) => [...newRecords, ...prev]);
  };

  const applyPresetComparison = (ids: string[]) => {
    setLimitNotice(null);
    setComparedIds(ids.filter((id) => institutions.some((inst) => inst.id === id)));
  };

  return (
    <div id="top" className="min-h-screen flex flex-col bg-[#FBF9F5] text-[#1C1917]">
      <Header comparedCount={comparedInstitutions.length} onScrollToCompare={scrollToCompare} />

      <main className="flex-1 max-w-[1360px] w-full mx-auto px-6 md:px-10 py-10 space-y-14">
        {/* Editorial Masthead Hero Split */}
        <section aria-labelledby="masthead-title" className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            <div className="lg:col-span-7 flex flex-col justify-between py-2 space-y-6">
              <div className="space-y-4">
                <p className="text-xs font-medium tracking-widest uppercase text-[#57534E]">
                  Republic of Kenya · Higher Education &amp; Technical Registry
                </p>
                <h1
                  id="masthead-title"
                  className="font-serif text-4xl sm:text-5xl font-semibold tracking-tight text-[#1C1917] leading-[1.12] text-balance"
                >
                  Kenyan Academic Institutions Index
                </h1>
                <p className="text-base sm:text-lg leading-relaxed text-[#57534E] max-w-2xl">
                  An analytical dossier and comparative directory spanning Kenya’s chartered universities, TVET polytechnics and technical colleges, and KMTC medical campuses—structured for cross-sector benchmarking and verified record inspection.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <a
                  href="#directory"
                  className="px-5 py-2.5 text-sm font-medium bg-[#14532D] text-[#FBF9F5] rounded-md hover:bg-[#114224] transition-colors whitespace-nowrap shrink-0"
                >
                  Browse Institution Index
                </a>
                <a
                  href="#compare"
                  className="px-5 py-2.5 text-sm font-medium bg-white text-[#1C1917] border border-[#E5E0D8] rounded-md hover:bg-[#F3EFE6] transition-colors whitespace-nowrap shrink-0"
                >
                  Open Comparison Studio
                </a>
              </div>
            </div>

            <figure className="lg:col-span-5 flex flex-col">
              <div className="flex-1 min-h-[260px] rounded-lg overflow-hidden border border-[#E5E0D8] bg-[#F3EFE6]">
                {!heroImgError ? (
                  <img
                    src={HERO_IMAGE}
                    alt="Historic cut-stone quadrangle and jacaranda trees at a Kenyan university campus"
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImgError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-6 text-center text-sm text-[#57534E]">
                    Kenyan Higher Education Quadrangle Archive
                  </div>
                )}
              </div>
              <figcaption className="mt-2 text-xs font-serif italic text-[#57534E]">
                Fig. 1 — Morning light across cut-stone academic colonnades, Nairobi higher education corridor.
              </figcaption>
            </figure>
          </div>

          {/* 4-Column Full-Width KPI Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-[#E5E0D8]">
            <div className="bg-white border border-[#E5E0D8] rounded-lg p-4">
              <div className="text-xs text-[#57534E]">Institutions Matching Filters</div>
              <div className="mt-1 font-mono tabular-nums text-2xl font-semibold text-[#1C1917]">
                {kpiStats.count}
              </div>
              <div className="mt-0.5 text-xs text-[#57534E]">
                Across {availableRegions.length} Kenyan regions
              </div>
            </div>

            <div className="bg-white border border-[#E5E0D8] rounded-lg p-4">
              <div className="text-xs text-[#57534E]">Verified Registry Records</div>
              <div className="mt-1 font-mono tabular-nums text-2xl font-semibold text-[#14532D]">
                {kpiStats.verified}{' '}
                <span className="text-sm font-normal text-[#57534E]">/ {kpiStats.count}</span>
              </div>
              <div className="mt-0.5 text-xs text-[#57534E]">
                CUE, TVETA &amp; MoH aligned
              </div>
            </div>

            <div className="bg-white border border-[#E5E0D8] rounded-lg p-4">
              <div className="text-xs text-[#57534E]">Combined Est. Enrollment</div>
              <div className="mt-1 font-mono tabular-nums text-2xl font-semibold text-[#1C1917]">
                {kpiStats.enrollment.toLocaleString()}
              </div>
              <div className="mt-0.5 text-xs text-[#57534E]">
                Sum of active student capacity
              </div>
            </div>

            <div className="bg-white border border-[#E5E0D8] rounded-lg p-4">
              <div className="text-xs text-[#57534E]">Mean Health · Research Index</div>
              <div className="mt-1 font-mono tabular-nums text-2xl font-semibold text-[#1C1917]">
                {kpiStats.meanHealth}{' '}
                <span className="text-sm font-normal text-[#57534E]">·</span>{' '}
                {kpiStats.meanResearch}
              </div>
              <div className="mt-0.5 text-xs text-[#57534E]">
                Normalized 0–100 schema scores
              </div>
            </div>
          </div>
        </section>

        {/* Directory & Dynamic Search Section */}
        <section id="directory" aria-labelledby="directory-heading" className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-[#57534E]">Index Catalogue</p>
              <h2
                id="directory-heading"
                className="font-serif text-3xl font-semibold text-[#1C1917] text-balance"
              >
                Institutions Directory
              </h2>
            </div>
            <p className="text-xs text-[#57534E] max-w-md">
              Filter by institution <code className="font-mono">type</code>, TVET tier (<code className="font-mono">NP/TVC/VTC</code>), ownership, regional footprint, or learning modalities. Pin up to four records to compare below.
            </p>
          </div>

          <FilterToolbar
            filters={filters}
            availableRegions={availableRegions}
            totalCount={institutions.length}
            filteredCount={filteredInstitutions.length}
            hasActiveFilters={hasActiveFilters}
            onUpdate={updateFilter}
            onReset={resetFilters}
            onOpenImportModal={() => setIsImportOpen(true)}
          />

          {limitNotice && (
            <div
              role="status"
              className="px-4 py-3 text-xs text-[#9A3412] bg-[#9A3412]/10 border border-[#9A3412]/25 rounded-md flex items-center justify-between gap-4"
            >
              <span>{limitNotice}</span>
              <button
                type="button"
                onClick={() => setLimitNotice(null)}
                className="font-medium underline cursor-pointer shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}

          <InstitutionDirectory
            institutions={filteredInstitutions}
            allInstitutions={institutions}
            viewMode={filters.viewMode}
            comparedIds={comparedIds}
            onToggleCompare={toggleCompare}
            onSelectProfile={(id) => setActiveProfileId(id)}
            onResetFilters={resetFilters}
          />
        </section>

        {/* Comparison Visualization Studio */}
        <section id="compare" aria-labelledby="compare-heading" className="space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-[#57534E]">Comparative Data Studio</p>
              <h2
                id="compare-heading"
                className="font-serif text-3xl font-semibold text-[#1C1917] text-balance"
              >
                Side-by-Side Radar &amp; Multi-Metric Benchmarks
              </h2>
            </div>

            {/* Quick Comparison Presets */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[#57534E] mr-1">Presets:</span>
              <button
                type="button"
                onClick={() =>
                  applyPresetComparison([
                    'd4f8a101-7c2b-4e9d-9a11-000000000001',
                    'd4f8a101-7c2b-4e9d-9a11-000000000002',
                    'd4f8a101-7c2b-4e9d-9a11-000000000014',
                  ])
                }
                className="px-2.5 py-1.5 bg-white border border-[#E5E0D8] rounded hover:bg-[#F3EFE6] text-[#1C1917] transition-colors cursor-pointer whitespace-nowrap"
              >
                Cross-Sector (UoN · Strathmore · NNP)
              </button>
              <button
                type="button"
                onClick={() =>
                  applyPresetComparison([
                    'd4f8a101-7c2b-4e9d-9a11-000000000003',
                    'd4f8a101-7c2b-4e9d-9a11-000000000007',
                    'd4f8a101-7c2b-4e9d-9a11-000000000008',
                  ])
                }
                className="px-2.5 py-1.5 bg-white border border-[#E5E0D8] rounded hover:bg-[#F3EFE6] text-[#1C1917] transition-colors cursor-pointer whitespace-nowrap"
              >
                STEM &amp; Tech (JKUAT · DeKUT · TU-K)
              </button>
              <button
                type="button"
                onClick={() =>
                  applyPresetComparison([
                    'd4f8a101-7c2b-4e9d-9a11-000000000015',
                    'd4f8a101-7c2b-4e9d-9a11-000000000021',
                    'd4f8a101-7c2b-4e9d-9a11-000000000022',
                  ])
                }
                className="px-2.5 py-1.5 bg-white border border-[#E5E0D8] rounded hover:bg-[#F3EFE6] text-[#1C1917] transition-colors cursor-pointer whitespace-nowrap"
              >
                KMTC Network (HQ · Mombasa · Kisumu)
              </button>
            </div>
          </div>

          <RadarComparisonChart
            institutions={comparedInstitutions}
            allInstitutions={institutions}
            activeAxis={activeAxis}
            onHoverAxis={setActiveAxis}
            onRemoveCompare={toggleCompare}
            onAddCompare={(id) => toggleCompare(id)}
            onSelectProfile={(id) => setActiveProfileId(id)}
            onClearCompare={() => setComparedIds([])}
          />

          <MultiMetricBenchmarks
            institutions={comparedInstitutions}
            onSelectProfile={(id) => setActiveProfileId(id)}
          />
        </section>

        {/* Regional Distribution Section */}
        <RegionalDistributionPanel
          institutions={institutions}
          activeRegion={filters.region}
          onSelectRegion={(reg) => {
            updateFilter('region', reg);
            document.getElementById('directory')?.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        {/* Schema & Evaluation Methodology Section */}
        <section
          id="methodology"
          aria-labelledby="methodology-heading"
          className="bg-white border border-[#E5E0D8] rounded-lg p-6 md:p-8 space-y-6"
        >
          <div className="pb-4 border-b border-[#E5E0D8]">
            <p className="text-xs font-medium text-[#57534E]">04 · Schema &amp; Index Architecture</p>
            <h2
              id="methodology-heading"
              className="mt-1 font-serif text-2xl font-semibold text-[#1C1917]"
            >
              Data Model Parity &amp; Normalization Methodology
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm leading-relaxed text-[#57534E]">
            <div className="space-y-2">
              <h3 className="font-semibold text-[#1C1917]">
                Taxonomy (<code className="font-mono text-xs">type</code> &amp; <code className="font-mono text-xs">category</code>)
              </h3>
              <p>
                Records conform strictly to <code className="font-mono text-xs">public.institutions</code> constraints across{' '}
                <strong className="text-[#1C1917]">university</strong>, <strong className="text-[#1C1917]">tvet</strong>, and{' '}
                <strong className="text-[#1C1917]">kmtc</strong> classifications, distinguishing TVET tiers into National Polytechnics (<code className="font-mono text-xs">NP</code>), Technical &amp; Vocational Colleges (<code className="font-mono text-xs">TVC</code>), and Vocational Training Centers (<code className="font-mono text-xs">VTC</code>).
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-[#1C1917]">
                Hierarchy &amp; Verification
              </h3>
              <p>
                Multi-campus networks such as KMTC link regional campuses back to headquarters via{' '}
                <code className="font-mono text-xs">parent_institution_id</code> and{' '}
                <code className="font-mono text-xs">main_institution_id</code>. Audit completeness is tracked via{' '}
                <code className="font-mono text-xs">is_verified</code>,{' '}
                <code className="font-mono text-xs">verified_fields_jsonb</code>, and{' '}
                <code className="font-mono text-xs">sync_status</code>.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-[#1C1917]">
                6-Axis Comparative Scaling
              </h3>
              <p>
                Radar profiles combine <code className="font-mono text-xs">health_score</code> and{' '}
                <code className="font-mono text-xs">research_score</code> with normalized{' '}
                <code className="font-mono text-xs">research_data</code> dimensions (Curriculum Breadth, Digital Readiness, Facilities, and Verification Integrity) so large research universities and specialized training colleges compare transparently.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#E5E0D8] bg-[#FBF9F5] py-8 mt-8">
        <div className="max-w-[1360px] mx-auto px-6 md:px-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#57534E]">
          <div>
            <span className="font-serif font-semibold text-[#1C1917]">Kenyan Academic Index</span>
            <span className="mx-2" aria-hidden="true">·</span>
            <span>Aligned with CUE, TVETA &amp; Ministry of Health institutional classifications.</span>
          </div>
          <div className="flex items-center gap-5">
            <a href="#directory" className="hover:text-[#1C1917]">
              Directory
            </a>
            <a href="#compare" className="hover:text-[#1C1917]">
              Compare
            </a>
            <button
              type="button"
              onClick={() => setIsImportOpen(true)}
              className="hover:text-[#1C1917] cursor-pointer"
            >
              Export JSON
            </button>
          </div>
        </div>
      </footer>

      {/* Monograph Slide-Over Drawer */}
      <InstitutionMonographDrawer
        institution={activeProfile}
        allInstitutions={institutions}
        isPinned={activeProfile ? comparedIds.includes(activeProfile.id) : false}
        onClose={() => setActiveProfileId(null)}
        onToggleCompare={toggleCompare}
        onSelectProfile={(id) => setActiveProfileId(id)}
      />

      {/* Schema JSON Import / Export Modal */}
      <SchemaImportModal
        isOpen={isImportOpen}
        institutions={filteredInstitutions}
        onClose={() => setIsImportOpen(false)}
        onImportRecords={handleImportRecords}
      />
    </div>
  );
}
