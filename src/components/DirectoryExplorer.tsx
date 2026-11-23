import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  LayoutGrid,
  Table as TableIcon,
  GitCompare,
  Check,
  ArrowUpRight,
  ExternalLink,
  X,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  type InstitutionType,
  type OwnershipType,
  type PublicInstitutionSummary,
  type TvetCategory,
  formatTypeLabel,
  slugifyCounty,
} from '../types/institution';
import {
  readComparedSlugs,
  subscribeCompareChanges,
  toggleComparedSlug,
  writeComparedSlugs,
} from '../lib/compareStore';
import { useInstitutionsIndex } from '../lib/institutionClientIndex';
import InstitutionLogo from './InstitutionLogo';

interface Props {
  initialInstitutions: PublicInstitutionSummary[];
}

type SortKey = 'composite' | 'courses' | 'enrollment' | 'name';
const PAGE_SIZE = 24;

export default function DirectoryExplorer({ initialInstitutions }: Props) {
  const { institutions, isLoadingFull } = useInstitutionsIndex(initialInstitutions);

  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | InstitutionType>('all');
  const [tvetCategory, setTvetCategory] = useState<'all' | TvetCategory>('all');
  const [ownershipFilter, setOwnershipFilter] = useState<'all' | OwnershipType>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [onlyElearning, setOnlyElearning] = useState(false);
  const [onlyDistance, setOnlyDistance] = useState(false);
  const [onlyTeaching, setOnlyTeaching] = useState(false);
  const [onlyPortal, setOnlyPortal] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>('composite');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [page, setPage] = useState(1);
  const [pinnedSlugs, setPinnedSlugs] = useState<string[]>([]);
  const [limitNotice, setLimitNotice] = useState(false);

  useEffect(() => {
    setPinnedSlugs(readComparedSlugs());
    return subscribeCompareChanges(setPinnedSlugs);
  }, []);

  const regions = useMemo(() => {
    return Array.from(new Set(institutions.map((i) => i.region))).sort();
  }, [institutions]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = institutions.filter((inst) => {
      if (typeFilter !== 'all' && inst.type !== typeFilter) return false;
      if (typeFilter === 'tvet' && tvetCategory !== 'all' && inst.category !== tvetCategory) {
        return false;
      }
      if (ownershipFilter !== 'all' && inst.ownership !== ownershipFilter) return false;
      if (regionFilter !== 'all' && inst.region !== regionFilter) return false;
      if (onlyVerified && !inst.is_verified) return false;
      if (onlyElearning && inst.elearning_status === 'none') return false;
      if (onlyDistance && inst.distance_status === 'none') return false;
      if (onlyTeaching && !inst.teaching_enabled) return false;
      if (onlyPortal && !inst.portal_subdomain) return false;

      if (!q) return true;
      const haystack = [
        inst.name,
        inst.slug,
        inst.county,
        inst.region,
        inst.town,
        inst.registration_number ?? '',
        ...inst.disciplines,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'composite') {
        return (
          b.ranking_scores.composite - a.ranking_scores.composite ||
          b.course_count - a.course_count ||
          a.name.localeCompare(b.name)
        );
      }
      if (sortBy === 'courses') {
        return b.course_count - a.course_count || b.ranking_scores.composite - a.ranking_scores.composite;
      }
      if (sortBy === 'enrollment') {
        return b.estimated_student_count - a.estimated_student_count;
      }
      return a.name.localeCompare(b.name);
    });
  }, [
    institutions,
    query,
    typeFilter,
    tvetCategory,
    ownershipFilter,
    regionFilter,
    onlyVerified,
    onlyElearning,
    onlyDistance,
    onlyTeaching,
    onlyPortal,
    sortBy,
  ]);

  useEffect(() => {
    setPage(1);
  }, [
    query,
    typeFilter,
    tvetCategory,
    ownershipFilter,
    regionFilter,
    onlyVerified,
    onlyElearning,
    onlyDistance,
    onlyTeaching,
    onlyPortal,
    sortBy,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, safePage]);

  const activeFilterCount =
    (query.trim() ? 1 : 0) +
    (typeFilter !== 'all' ? 1 : 0) +
    (typeFilter === 'tvet' && tvetCategory !== 'all' ? 1 : 0) +
    (ownershipFilter !== 'all' ? 1 : 0) +
    (regionFilter !== 'all' ? 1 : 0) +
    (onlyVerified ? 1 : 0) +
    (onlyElearning ? 1 : 0) +
    (onlyDistance ? 1 : 0) +
    (onlyTeaching ? 1 : 0) +
    (onlyPortal ? 1 : 0);

  const resetFilters = () => {
    setQuery('');
    setTypeFilter('all');
    setTvetCategory('all');
    setOwnershipFilter('all');
    setRegionFilter('all');
    setOnlyVerified(false);
    setOnlyElearning(false);
    setOnlyDistance(false);
    setOnlyTeaching(false);
    setOnlyPortal(false);
  };

  const handlePinToggle = (slug: string) => {
    const res = toggleComparedSlug(slug);
    setPinnedSlugs(res.slugs);
    if (res.limitReached) {
      setLimitNotice(true);
      window.setTimeout(() => setLimitNotice(false), 3200);
    } else {
      setLimitNotice(false);
    }
  };

  const pinnedInstitutions = useMemo(
    () =>
      pinnedSlugs
        .map((s) => institutions.find((i) => i.slug === s))
        .filter((i): i is PublicInstitutionSummary => Boolean(i)),
    [pinnedSlugs, institutions]
  );

  const compareHref =
    pinnedSlugs.length > 0 ? `/compare?ids=${encodeURIComponent(pinnedSlugs.join(','))}` : '/compare';

  return (
    <div className="space-y-6">
      {/* Archival Filter & Search Toolbar */}
      <section
        aria-label="Filter institutions"
        className="border border-hairline bg-limestone/45 p-4 sm:p-5 space-y-4"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          {/* Search */}
          <div className="lg:col-span-5 relative">
            <label htmlFor="directory-search" className="sr-only">
              Search Kenyan institutions, courses, counties, or registration codes
            </label>
            <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="directory-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search institution, discipline, county, town, or TVETA/CUE code..."
              className="w-full pl-9 pr-3 py-2.5 text-sm bg-paper border border-hairline text-ink placeholder:text-muted/75 focus:outline-none focus:border-forest"
            />
          </div>

          {/* Type Segmented Control */}
          <div className="lg:col-span-4 flex border border-hairline bg-paper">
            {(
              [
                { key: 'all', label: 'All Types' },
                { key: 'university', label: 'Universities' },
                { key: 'tvet', label: 'TVET' },
                { key: 'kmtc', label: 'KMTC' },
              ] as const
            ).map((opt) => {
              const active = typeFilter === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => {
                    setTypeFilter(opt.key);
                    if (opt.key !== 'tvet') setTvetCategory('all');
                  }}
                  className={`flex-1 px-2.5 py-2 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    active
                      ? 'bg-ink text-paper'
                      : 'text-muted hover:text-ink hover:bg-limestone/40'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* Sort & View Toggle */}
          <div className="lg:col-span-3 flex items-center gap-2">
            <label htmlFor="sort-select" className="sr-only">
              Sort institutions
            </label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="flex-1 px-3 py-2.5 text-xs font-medium bg-paper border border-hairline text-ink focus:outline-none focus:border-forest"
            >
              <option value="composite">Sort: Composite Score</option>
              <option value="courses">Sort: Catalogued Courses</option>
              <option value="enrollment">Sort: Est. Enrollment</option>
              <option value="name">Sort: Alphabetical (A–Z)</option>
            </select>

            <div className="flex border border-hairline bg-paper shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                aria-label="Card view"
                aria-pressed={viewMode === 'cards'}
                className={`p-2.5 transition-colors cursor-pointer ${
                  viewMode === 'cards' ? 'bg-ink text-paper' : 'text-muted hover:text-ink'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                aria-label="Table view"
                aria-pressed={viewMode === 'table'}
                className={`p-2.5 transition-colors cursor-pointer ${
                  viewMode === 'table' ? 'bg-ink text-paper' : 'text-muted hover:text-ink'
                }`}
              >
                <TableIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Secondary Facets */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-hairline/80 text-xs">
          {typeFilter === 'tvet' && (
            <div className="flex items-center gap-1.5">
              <span className="font-mono uppercase text-[10px] tracking-wider text-muted">
                TVET Tier:
              </span>
              {(['all', 'NP', 'TVC', 'VTC'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setTvetCategory(cat)}
                  className={`px-2 py-1 border font-mono text-[11px] cursor-pointer transition-colors ${
                    tvetCategory === cat
                      ? 'bg-lapis text-paper border-lapis'
                      : 'bg-paper text-muted border-hairline hover:text-ink'
                  }`}
                >
                  {cat === 'all' ? 'All TVET' : cat}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <label htmlFor="ownership-filter" className="font-mono uppercase text-[10px] tracking-wider text-muted">
              Ownership:
            </label>
            <select
              id="ownership-filter"
              value={ownershipFilter}
              onChange={(e) => setOwnershipFilter(e.target.value as 'all' | OwnershipType)}
              className="px-2.5 py-1 bg-paper border border-hairline text-ink focus:outline-none focus:border-forest"
            >
              <option value="all">Public &amp; Private</option>
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <label htmlFor="region-filter" className="font-mono uppercase text-[10px] tracking-wider text-muted">
              Region:
            </label>
            <select
              id="region-filter"
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="px-2.5 py-1 bg-paper border border-hairline text-ink focus:outline-none focus:border-forest"
            >
              <option value="all">All Regions</option>
              {regions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2 ml-auto">
            {(
              [
                { label: 'Verified', checked: onlyVerified, toggle: () => setOnlyVerified((v) => !v) },
                { label: 'E-Learning', checked: onlyElearning, toggle: () => setOnlyElearning((v) => !v) },
                { label: 'ODeL / Distance', checked: onlyDistance, toggle: () => setOnlyDistance((v) => !v) },
                { label: 'Teaching Practicum', checked: onlyTeaching, toggle: () => setOnlyTeaching((v) => !v) },
                { label: 'Schologic LMS', checked: onlyPortal, toggle: () => setOnlyPortal((v) => !v) },
              ] as const
            ).map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={item.toggle}
                aria-pressed={item.checked}
                className={`px-2.5 py-1 border text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  item.checked
                    ? 'bg-forest/10 text-forest border-forest'
                    : 'bg-paper text-muted border-hairline hover:text-ink'
                }`}
              >
                {item.checked ? '✓ ' : ''}
                {item.label}
              </button>
            ))}

            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-terracotta hover:underline cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Reset ({activeFilterCount})
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Result Count & Page Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 py-2 border-b border-hairline">
        <p className="text-xs sm:text-sm text-muted">
          Showing{' '}
          <span className="font-mono font-semibold text-ink tabular-nums">
            {filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}–
            {Math.min(safePage * PAGE_SIZE, filtered.length)}
          </span>{' '}
          of{' '}
          <span className="font-mono font-semibold text-ink tabular-nums">
            {filtered.length.toLocaleString()}
          </span>{' '}
          matching institutions ({institutions.length.toLocaleString()} total indexed)
          {isLoadingFull ? ' · Syncing registry...' : ''}
        </p>

        {limitNotice && (
          <p className="text-xs font-medium text-terracotta">
            Comparison tray accepts up to 4 institutions. Unpin one to add another.
          </p>
        )}
      </div>

      {pinnedInstitutions.length > 0 && (
        <aside
          aria-label="Pinned institutions for comparison"
          className="border border-forest/30 bg-forest/[0.04] px-4 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] uppercase tracking-wider text-forest font-semibold mr-1">
              Compare Bench ({pinnedInstitutions.length}/4):
            </span>
            {pinnedInstitutions.map((inst) => (
              <span
                key={inst.slug}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-paper border border-hairline text-xs font-medium text-ink"
              >
                <a href={`/institutions/${inst.slug}`} className="hover:text-forest hover:underline">
                  {inst.name}
                </a>
                <button
                  type="button"
                  onClick={() => handlePinToggle(inst.slug)}
                  aria-label={`Remove ${inst.name} from comparison`}
                  className="text-muted hover:text-terracotta cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => writeComparedSlugs([])}
              className="text-xs text-muted hover:text-ink cursor-pointer"
            >
              Clear
            </button>
            <a
              href={compareHref}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-forest text-paper text-xs font-semibold hover:bg-ink transition-colors whitespace-nowrap"
            >
              <GitCompare className="w-3.5 h-3.5" />
              Launch Radar Comparison
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </aside>
      )}

      {/* Empty State */}
      {filtered.length === 0 ? (
        <div className="border border-hairline bg-limestone/30 p-12 text-center space-y-3">
          <p className="font-serif text-xl text-ink">No indexed institutions match these filters.</p>
          <p className="text-sm text-muted max-w-md mx-auto">
            Adjust your search term or clear active modality and regional facets to view Kenyan
            universities, TVETs, and KMTC campuses.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-ink text-paper text-xs font-semibold hover:bg-forest transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Clear All Filters
          </button>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginated.map((inst) => {
            const isPinned = pinnedSlugs.includes(inst.slug);

            return (
              <article
                key={inst.id}
                className="border border-hairline bg-paper flex flex-col justify-between hover:border-ink/40 transition-colors p-5 space-y-4"
              >
                <div>
                  {/* Crest Logo & Header Identity */}
                  <div className="flex items-start gap-3.5">
                    <a href={`/institutions/${inst.slug}`} className="shrink-0">
                      <InstitutionLogo
                        name={inst.name}
                        logoUrl={inst.logo_url}
                        type={inst.type}
                        size="lg"
                      />
                    </a>
                    <div className="min-w-0 flex-1">
                      <div className="font-mono text-[10px] text-muted flex flex-wrap items-center gap-x-1.5 gap-y-0.5 uppercase tracking-wider">
                        <span className="text-forest font-semibold">
                          {formatTypeLabel(inst.type)}
                          {inst.category ? ` · ${inst.category}` : ''}
                        </span>
                        <span>·</span>
                        <span className="capitalize">{inst.ownership}</span>
                        {inst.is_verified && (
                          <>
                            <span>·</span>
                            <span className="text-forest">Verified</span>
                          </>
                        )}
                      </div>

                      <h3 className="font-serif text-lg font-semibold text-ink mt-1 leading-snug">
                        <a
                          href={`/institutions/${inst.slug}`}
                          className="hover:text-forest transition-colors"
                        >
                          {inst.name}
                        </a>
                      </h3>

                      <p className="font-mono text-[11px] text-muted mt-0.5 truncate">
                        <a
                          href={`/counties/${slugifyCounty(inst.county)}`}
                          className="hover:text-forest hover:underline"
                        >
                          {inst.county} County
                        </a>
                        {' · '}
                        {inst.town}
                      </p>
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-muted line-clamp-2 leading-relaxed">
                    {inst.description}
                  </p>

                  {inst.disciplines.length > 0 && (
                    <p className="mt-2.5 text-xs text-ink/80 font-medium truncate">
                      {inst.disciplines.slice(0, 3).join(' · ')}
                    </p>
                  )}
                </div>

                <div>
                  {/* Key Numerics */}
                  <dl className="pt-3 border-t border-hairline grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <dt className="text-muted text-[11px]">Index Score</dt>
                      <dd className="font-mono font-semibold text-forest tabular-nums mt-0.5">
                        {inst.ranking_scores.composite} / 100
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted text-[11px]">Courses</dt>
                      <dd className="font-mono font-semibold text-ink tabular-nums mt-0.5">
                        {inst.course_count} tracked
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted text-[11px]">Schologic LMS</dt>
                      <dd className="font-mono font-semibold text-ink truncate mt-0.5">
                        {inst.portal_subdomain ? 'Active' : 'Available'}
                      </dd>
                    </div>
                  </dl>

                  {/* Google Maps, Compare & Profile Actions */}
                  <div className="mt-4 pt-3 border-t border-hairline flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handlePinToggle(inst.slug)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold border transition-colors cursor-pointer ${
                          isPinned
                            ? 'bg-forest text-paper border-forest'
                            : 'bg-limestone/60 text-ink border-hairline hover:border-ink'
                        }`}
                      >
                        {isPinned ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <GitCompare className="w-3.5 h-3.5" />
                        )}
                        {isPinned ? 'Pinned' : 'Compare'}
                      </button>

                      <a
                        href={inst.google_maps_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={
                          inst.has_verified_maps_url
                            ? 'Open verified Google Maps location'
                            : 'Find on Google Maps'
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium border border-hairline bg-paper text-muted hover:text-ink hover:border-ink transition-colors"
                      >
                        Maps
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    <a
                      href={`/institutions/${inst.slug}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-forest hover:underline whitespace-nowrap"
                    >
                      Full Profile
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        /* Registry Table View */
        <div className="border border-hairline bg-paper overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-hairline bg-limestone/60 font-mono text-[11px] uppercase tracking-wider text-muted">
                <th className="py-3 px-4 font-semibold">Institution</th>
                <th className="py-3 px-3 font-semibold">Type</th>
                <th className="py-3 px-3 font-semibold">County</th>
                <th className="py-3 px-3 font-semibold text-right">Composite</th>
                <th className="py-3 px-3 font-semibold text-right">Courses</th>
                <th className="py-3 px-3 font-semibold">Google Maps</th>
                <th className="py-3 px-4 font-semibold text-right">Compare</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {paginated.map((inst) => {
                const isPinned = pinnedSlugs.includes(inst.slug);
                return (
                  <tr key={inst.id} className="hover:bg-limestone/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <InstitutionLogo
                          name={inst.name}
                          logoUrl={inst.logo_url}
                          type={inst.type}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <a
                            href={`/institutions/${inst.slug}`}
                            className="font-serif font-semibold text-ink hover:text-forest hover:underline block"
                          >
                            {inst.name}
                          </a>
                          <div className="font-mono text-[11px] text-muted mt-0.5">
                            {inst.registration_number ?? 'Registry Listed'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-xs">
                      <span className="font-mono uppercase">
                        {formatTypeLabel(inst.type)}
                        {inst.category ? ` (${inst.category})` : ''}
                      </span>
                      <div className="text-muted capitalize">{inst.ownership}</div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-xs text-ink">
                      <a
                        href={`/counties/${slugifyCounty(inst.county)}`}
                        className="hover:text-forest hover:underline"
                      >
                        {inst.county}
                      </a>
                      <div className="text-muted">{inst.region}</div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-right font-mono font-semibold tabular-nums text-forest">
                      {inst.ranking_scores.composite}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-right font-mono tabular-nums text-ink">
                      {inst.course_count}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap font-mono text-xs">
                      <a
                        href={inst.google_maps_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-lapis hover:underline"
                      >
                        Map
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handlePinToggle(inst.slug)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold border cursor-pointer ${
                          isPinned
                            ? 'bg-forest text-paper border-forest'
                            : 'bg-paper text-ink border-hairline hover:border-ink'
                        }`}
                      >
                        {isPinned ? 'Pinned' : 'Pin'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <nav
          aria-label="Registry pagination"
          className="pt-4 border-t border-hairline flex flex-wrap items-center justify-between gap-3 text-xs"
        >
          <span className="font-mono text-muted tabular-nums">
            Page {safePage} of {totalPages}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => {
                setPage((p) => Math.max(1, p - 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 border border-hairline bg-paper text-ink font-semibold disabled:opacity-40 hover:border-ink cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Previous
            </button>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => {
                setPage((p) => Math.min(totalPages, p + 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 border border-hairline bg-paper text-ink font-semibold disabled:opacity-40 hover:border-ink cursor-pointer"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
