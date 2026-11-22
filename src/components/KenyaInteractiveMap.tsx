import React, { useMemo, useState } from 'react';
import {
  MapPin,
  ZoomIn,
  ZoomOut,
  ArrowUpRight,
  GitCompare,
  Check,
  GraduationCap,
} from 'lucide-react';
import {
  KENYA_COUNTY_PATHS,
  KENYA_LAKE_PATH,
  KENYA_MAP_BOUNDS,
  projectKenyaLatLng,
} from '../data/kenyaMapPaths';
import {
  type InstitutionType,
  type PublicInstitution,
  formatCategoryLabel,
  formatTypeLabel,
  slugifyCounty,
} from '../types/institution';
import {
  readComparedSlugs,
  subscribeCompareChanges,
  toggleComparedSlug,
} from '../lib/compareStore';

interface Props {
  institutions: PublicInstitution[];
  countyRegions?: Record<string, string>;
}

const TYPE_COLOR: Record<InstitutionType, string> = {
  university: '#14532D', // Forest Ink
  tvet: '#1E3A8A',       // Deep Lapis
  kmtc: '#9A3412',       // Warm Terracotta
};

export default function KenyaInteractiveMap({ institutions, countyRegions = {} }: Props) {
  const [typeFilter, setTypeFilter] = useState<'all' | InstitutionType>('all');
  const [zoomMode, setZoomMode] = useState<'national' | 'nairobi-central'>('national');
  const [selectedCounty, setSelectedCounty] = useState<string>('Nairobi');
  const [selectedSlug, setSelectedSlug] = useState<string>(institutions[0]?.slug ?? '');
  const [hoveredCounty, setHoveredCounty] = useState<string | null>(null);
  const [pinnedSlugs, setPinnedSlugs] = useState<string[]>(() =>
    typeof window !== 'undefined' ? readComparedSlugs() : []
  );

  React.useEffect(() => {
    setPinnedSlugs(readComparedSlugs());
    return subscribeCompareChanges(setPinnedSlugs);
  }, []);

  const countyInstMap = useMemo(() => {
    const map = new Map<string, PublicInstitution[]>();
    for (const inst of institutions) {
      if (typeFilter !== 'all' && inst.type !== typeFilter) continue;
      const list = map.get(inst.county) ?? [];
      list.push(inst);
      map.set(inst.county, list);
    }
    return map;
  }, [institutions, typeFilter]);

  const visiblePins = useMemo(() => {
    return institutions
      .filter((inst) => (typeFilter === 'all' ? true : inst.type === typeFilter))
      .filter((inst) => inst.geo !== null)
      .map((inst) => {
        const pt = projectKenyaLatLng(inst.geo!.lat, inst.geo!.lng);
        return { inst, x: pt.x, y: pt.y };
      });
  }, [institutions, typeFilter]);

  const activeInst = useMemo(() => {
    const bySlug = institutions.find((i) => i.slug === selectedSlug);
    if (bySlug && (typeFilter === 'all' || bySlug.type === typeFilter)) return bySlug;
    const inCounty = countyInstMap.get(selectedCounty);
    if (inCounty && inCounty.length > 0) return inCounty[0];
    return visiblePins[0]?.inst ?? institutions[0];
  }, [institutions, selectedSlug, selectedCounty, countyInstMap, typeFilter, visiblePins]);

  const countyInstitutions = countyInstMap.get(selectedCounty) ?? [];

  // Nairobi & Central corridor viewBox zoom around Nairobi/Kiambu/Nyeri
  const viewBox =
    zoomMode === 'nairobi-central'
      ? '135 285 170 200'
      : `0 0 ${KENYA_MAP_BOUNDS.width} ${KENYA_MAP_BOUNDS.height}`;

  const pinRadius = zoomMode === 'nairobi-central' ? 3.2 : 6.2;
  const strokeWidthFactor = zoomMode === 'nairobi-central' ? 0.5 : 1;

  const isPinned = activeInst ? pinnedSlugs.includes(activeInst.slug) : false;

  return (
    <section
      aria-label="Interactive Kenya Institutions Map"
      className="border border-hairline bg-paper grid grid-cols-1 lg:grid-cols-12"
    >
      {/* Left: Real Geographic SVG Map of Kenya (7 cols) */}
      <div className="lg:col-span-7 p-5 sm:p-6 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-hairline bg-limestone/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-hairline">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest text-forest font-semibold">
              Interactive Geographic Atlas
            </p>
            <h2 className="font-serif text-xl sm:text-2xl font-semibold text-ink">
              Kenya 47-County Institution Map
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Zoom Toggle */}
            <div className="flex border border-hairline bg-paper text-xs">
              <button
                type="button"
                onClick={() => setZoomMode('national')}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 font-medium cursor-pointer transition-colors ${
                  zoomMode === 'national' ? 'bg-ink text-paper' : 'text-muted hover:text-ink'
                }`}
              >
                <ZoomOut className="w-3.5 h-3.5" />
                All Kenya
              </button>
              <button
                type="button"
                onClick={() => setZoomMode('nairobi-central')}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 font-medium cursor-pointer transition-colors ${
                  zoomMode === 'nairobi-central' ? 'bg-ink text-paper' : 'text-muted hover:text-ink'
                }`}
              >
                <ZoomIn className="w-3.5 h-3.5" />
                Nairobi &amp; Central
              </button>
            </div>
          </div>
        </div>

        {/* Institution Type Filter Bar */}
        <div className="py-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                { key: 'all', label: 'All Institutions' },
                { key: 'university', label: 'Universities', dot: TYPE_COLOR.university },
                { key: 'tvet', label: 'TVETs & Polytechnics', dot: TYPE_COLOR.tvet },
                { key: 'kmtc', label: 'KMTC Campuses', dot: TYPE_COLOR.kmtc },
              ] as const
            ).map((opt) => {
              const active = typeFilter === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setTypeFilter(opt.key)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 border font-medium cursor-pointer transition-colors ${
                    active
                      ? 'bg-ink text-paper border-ink'
                      : 'bg-paper text-muted border-hairline hover:text-ink'
                  }`}
                >
                  {'dot' in opt && (
                    <span
                      className="w-2 h-2 rounded-full inline-block"
                      style={{ backgroundColor: active ? '#FBF9F5' : opt.dot }}
                    />
                  )}
                  {opt.label}
                </button>
              );
            })}
          </div>

          <span className="font-mono text-[11px] text-muted tabular-nums">
            {hoveredCounty
              ? `${hoveredCounty} County${countyRegions[hoveredCounty] ? ` · ${countyRegions[hoveredCounty]}` : ''}`
              : `${visiblePins.length} geocoded campuses plotted`}
          </span>
        </div>

        {/* SVG Map Canvas */}
        <div className="relative bg-paper border border-hairline p-3 flex items-center justify-center">
          <svg
            viewBox={viewBox}
            className="w-full max-h-[500px] h-auto select-none"
            role="img"
            aria-label="Geographic map of Kenya's 47 counties with geocoded academic institutions"
          >
            {/* Subtle Latitude/Longitude Graticule Lines */}
            <g stroke="#E5E0D8" strokeWidth={0.5 * strokeWidthFactor} strokeDasharray="3 4" opacity="0.6">
              <line x1="0" y1="360" x2="600" y2="360" />
              <line x1="250" y1="0" x2="250" y2="720" />
            </g>

            {/* County Polygons */}
            {KENYA_COUNTY_PATHS.map((c) => {
              const insts = countyInstMap.get(c.county) ?? [];
              const hasInsts = insts.length > 0;
              const isSelected = selectedCounty === c.county;
              const isHovered = hoveredCounty === c.county;

              let fill = '#F7F4EC';
              if (hasInsts) fill = '#EAE4D7';
              if (isHovered) fill = '#DDD5C4';
              if (isSelected) fill = '#D7E4DA';

              return (
                <path
                  key={c.county}
                  d={c.d}
                  fill={fill}
                  stroke={isSelected ? '#14532D' : '#C6BFB2'}
                  strokeWidth={(isSelected ? 1.8 : 0.8) * strokeWidthFactor}
                  className="cursor-pointer transition-colors"
                  onMouseEnter={() => setHoveredCounty(c.county)}
                  onMouseLeave={() => setHoveredCounty(null)}
                  onClick={() => {
                    setSelectedCounty(c.county);
                    if (insts.length > 0) {
                      setSelectedSlug(insts[0].slug);
                    }
                  }}
                >
                  <title>
                    {c.county} County ({insts.length} indexed)
                  </title>
                </path>
              );
            })}

            {/* Lake Turkana Water Feature */}
            {KENYA_LAKE_PATH && (
              <path
                d={KENYA_LAKE_PATH}
                fill="#DCE6F2"
                stroke="#9BB5D1"
                strokeWidth={0.7 * strokeWidthFactor}
                pointerEvents="none"
              />
            )}

            {/* County Labels for key hubs when zoomed or hovered */}
            {KENYA_COUNTY_PATHS.filter(
              (c) =>
                c.county === selectedCounty ||
                c.county === hoveredCounty ||
                (zoomMode === 'national' &&
                  ['Nairobi', 'Mombasa', 'Kisumu', 'Uasin Gishu', 'Nakuru', 'Nyeri', 'Kilifi'].includes(c.county)) ||
                (zoomMode === 'nairobi-central' &&
                  ['Nairobi', 'Kiambu', 'Nyeri', 'Nakuru', "Murang'a", 'Machakos'].includes(c.county))
            ).map((c) => (
              <text
                key={`lbl-${c.county}`}
                x={c.cx}
                y={c.cy - (zoomMode === 'nairobi-central' ? 4 : 8)}
                textAnchor="middle"
                pointerEvents="none"
                style={{ fontSize: `${zoomMode === 'nairobi-central' ? 5.5 : 9.5}px` }}
                className="font-mono font-semibold fill-ink/80"
              >
                {c.county}
              </text>
            ))}

            {/* Geocoded Institution Pins */}
            {visiblePins.map(({ inst, x, y }) => {
              const isSelected = activeInst?.slug === inst.slug;
              const fill = TYPE_COLOR[inst.type];
              return (
                <g
                  key={inst.slug}
                  onClick={() => {
                    setSelectedSlug(inst.slug);
                    setSelectedCounty(inst.county);
                  }}
                  className="cursor-pointer"
                >
                  {isSelected && (
                    <circle
                      cx={x}
                      cy={y}
                      r={pinRadius * 1.9}
                      fill="none"
                      stroke={fill}
                      strokeWidth={1.5 * strokeWidthFactor}
                    />
                  )}
                  <circle
                    cx={x}
                    cy={y}
                    r={isSelected ? pinRadius * 1.25 : pinRadius}
                    fill={fill}
                    stroke="#FBF9F5"
                    strokeWidth={1.5 * strokeWidthFactor}
                  >
                    <title>
                      {inst.name} ({inst.county})
                    </title>
                  </circle>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Map Legend */}
        <div className="pt-3 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-muted">
          <div className="flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-forest inline-block" /> University
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-lapis inline-block" /> TVET / Polytechnic
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-terracotta inline-block" /> KMTC
            </span>
          </div>
          <span>Click any county or coordinate pin</span>
        </div>
      </div>

      {/* Right: Selected County & Institution Preview Card (5 cols) */}
      <aside className="lg:col-span-5 p-5 sm:p-6 flex flex-col justify-between gap-6">
        <div className="space-y-5">
          {/* County Status Header */}
          <div className="pb-4 border-b border-hairline flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-muted">
                Map Selection · {countyRegions[selectedCounty] ?? 'Kenya'}
              </p>
              <h3 className="font-serif text-2xl font-semibold text-ink mt-0.5 flex items-center gap-1.5">
                <MapPin className="w-5 h-5 text-forest shrink-0" />
                {selectedCounty} County
              </h3>
            </div>

            {countyInstitutions.length > 0 && (
              <a
                href={`/counties/${slugifyCounty(selectedCounty)}`}
                className="font-mono text-xs text-forest font-semibold hover:underline whitespace-nowrap shrink-0 mt-1"
              >
                County Page →
              </a>
            )}
          </div>

          {/* Institutions inside Selected County */}
          {countyInstitutions.length > 0 ? (
            <div className="space-y-2">
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted">
                Indexed Campuses in {selectedCounty} ({countyInstitutions.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {countyInstitutions.map((inst) => {
                  const active = activeInst?.slug === inst.slug;
                  return (
                    <button
                      key={inst.slug}
                      type="button"
                      onClick={() => setSelectedSlug(inst.slug)}
                      className={`px-2.5 py-1 text-xs border transition-colors cursor-pointer ${
                        active
                          ? 'bg-ink text-paper border-ink font-semibold'
                          : 'bg-limestone/45 text-ink border-hairline hover:border-ink'
                      }`}
                    >
                      {inst.aliases[0] ?? inst.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="border border-hairline bg-limestone/30 p-3.5 text-xs text-muted leading-relaxed">
              <strong className="text-ink">{selectedCounty} County</strong> records (local TVCs,
              VTCs, and regional colleges) are queued for database ingestion. Showing{' '}
              <strong className="text-ink">{activeInst?.name}</strong> below.
            </div>
          )}

          {/* Active Institution Spotlight Card */}
          {activeInst && (
            <div className="border border-hairline bg-limestone/25 overflow-hidden">
              <div className="aspect-[16/9] bg-limestone relative overflow-hidden border-b border-hairline">
                <img
                  src={activeInst.cover_image_url}
                  alt={`${activeInst.name} campus`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2.5 left-2.5 bg-paper/95 border border-hairline px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ink">
                  {formatTypeLabel(activeInst.type)} · {activeInst.ownership}
                </div>
              </div>

              <div className="p-4 sm:p-5 space-y-3">
                <div>
                  <p className="font-mono text-[11px] text-muted">
                    {activeInst.registration_number ?? formatCategoryLabel(activeInst.category)}
                    {activeInst.geo
                      ? ` · ${activeInst.geo.lat.toFixed(2)}°, ${activeInst.geo.lng.toFixed(2)}°`
                      : ''}
                  </p>
                  <h4 className="font-serif text-xl font-semibold text-ink mt-1">
                    <a
                      href={`/institutions/${activeInst.slug}`}
                      className="hover:text-forest hover:underline"
                    >
                      {activeInst.name}
                    </a>
                  </h4>
                </div>

                <p className="text-xs sm:text-sm text-muted leading-relaxed">
                  {activeInst.description}
                </p>

                <dl className="grid grid-cols-3 gap-2 pt-3 border-t border-hairline text-xs">
                  <div>
                    <dt className="text-muted text-[11px]">Students</dt>
                    <dd className="font-mono font-semibold text-ink tabular-nums">
                      ~{activeInst.estimated_student_count.toLocaleString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted text-[11px]">Programmes</dt>
                    <dd className="font-mono font-semibold text-ink tabular-nums">
                      {activeInst.courses.length} tracked
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted text-[11px]">Campuses</dt>
                    <dd className="font-mono font-semibold text-ink tabular-nums">
                      {activeInst.campuses.length}
                    </dd>
                  </div>
                </dl>

                <div className="pt-3 border-t border-hairline flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => toggleComparedSlug(activeInst.slug)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border cursor-pointer transition-colors ${
                      isPinned
                        ? 'bg-forest text-paper border-forest'
                        : 'bg-paper text-ink border-hairline hover:border-ink'
                    }`}
                  >
                    {isPinned ? <Check className="w-3.5 h-3.5" /> : <GitCompare className="w-3.5 h-3.5" />}
                    {isPinned ? 'Pinned to Compare' : 'Pin to Compare'}
                  </button>

                  <a
                    href={`/institutions/${activeInst.slug}`}
                    className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-ink text-paper text-xs font-semibold hover:bg-forest transition-colors"
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    Full Profile
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </section>
  );
}
