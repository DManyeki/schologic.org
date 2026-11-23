import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  MapPin,
  RotateCcw,
  ArrowUpRight,
  GitCompare,
  Check,
  Search,
  ExternalLink,
  X,
  Compass,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  KENYA_COUNTY_PATHS,
  KENYA_LAKE_PATH,
} from '../data/kenyaMapPaths';
import {
  type InstitutionType,
  type OwnershipType,
  type PublicInstitutionSummary,
  type TvetCategory,
  formatCategoryLabel,
  formatTypeLabel,
  slugifyCounty,
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
  countyRegions?: Record<string, string>;
}

interface ViewBoxTuple {
  x: number;
  y: number;
  w: number;
  h: number;
}

const NATIONAL_VIEWBOX: ViewBoxTuple = { x: -240, y: 10, w: 1080, h: 700 };
const MAP_ASPECT = 1080 / 700; // ~1.54 landscape wide framing

const TYPE_COLOR: Record<InstitutionType, string> = {
  university: '#14532D',
  tvet: '#1E3A8A',
  kmtc: '#9A3412',
};

function computeCountyBoundingBoxes() {
  const boxes = new Map<string, ViewBoxTuple>();
  for (const c of KENYA_COUNTY_PATHS) {
    const nums = c.d.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (let i = 0; i + 1 < nums.length; i += 2) {
      const px = nums[i];
      const py = nums[i + 1];
      if (px < minX) minX = px;
      if (px > maxX) maxX = px;
      if (py < minY) minY = py;
      if (py > maxY) maxY = py;
    }
    if (!Number.isFinite(minX)) {
      boxes.set(c.county, NATIONAL_VIEWBOX);
      continue;
    }
    const rawW = Math.max(42, (maxX - minX) * 2.1);
    const rawH = Math.max(42, (maxY - minY) * 2.1);
    let w = rawW;
    let h = rawH;
    if (w / h < MAP_ASPECT) {
      w = h * MAP_ASPECT;
    } else {
      h = w / MAP_ASPECT;
    }
    // Minimum zoom floor so tiny counties (Nairobi, Mombasa, Vihiga) retain rich context
    w = Math.max(w, 155);
    h = Math.max(h, 155 / MAP_ASPECT);
    // Cap below national
    w = Math.min(w, 680);
    h = Math.min(h, 680 / MAP_ASPECT);

    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    // Slight rightward bias (+0.08*w) so floating right inspector panel doesn't cover county center
    const vx = Math.max(-240, Math.min(840 - w, cx - w * 0.42));
    const vy = Math.max(0, Math.min(720 - h, cy - h * 0.5));
    boxes.set(c.county, { x: vx, y: vy, w, h });
  }
  return boxes;
}

const COUNTY_ZOOM_BOXES = computeCountyBoundingBoxes();

export default function KenyaInteractiveMap({ initialInstitutions, countyRegions = {} }: Props) {
  const { institutions, isLoadingFull } = useInstitutionsIndex(initialInstitutions);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | InstitutionType>('all');
  const [tvetTier, setTvetTier] = useState<'all' | TvetCategory>('all');
  const [ownershipFilter, setOwnershipFilter] = useState<'all' | OwnershipType>('all');
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [onlyElearning, setOnlyElearning] = useState(false);
  const [onlySchologicLms, setOnlySchologicLms] = useState(false);

  // Interaction & Camera State
  const [hoverZoomEnabled, setHoverZoomEnabled] = useState(true);
  const [hoveredCounty, setHoveredCounty] = useState<string | null>(null);
  const [lockedCounty, setLockedCounty] = useState<string | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(
    initialInstitutions[0]?.slug ?? null
  );
  const [inspectorOpen, setInspectorOpen] = useState(true);

  const [pinnedSlugs, setPinnedSlugs] = useState<string[]>(() =>
    typeof window !== 'undefined' ? readComparedSlugs() : []
  );

  // Smooth SVG viewBox animation state
  const [viewBox, setViewBox] = useState<ViewBoxTuple>(NATIONAL_VIEWBOX);
  const currentVbRef = useRef<ViewBoxTuple>(NATIONAL_VIEWBOX);
  const animFrameRef = useRef<number | null>(null);
  const hoverTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setPinnedSlugs(readComparedSlugs());
    return subscribeCompareChanges(setPinnedSlugs);
  }, []);

  // Filtered institutions
  const filteredInstitutions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return institutions.filter((inst) => {
      if (typeFilter !== 'all' && inst.type !== typeFilter) return false;
      if (typeFilter === 'tvet' && tvetTier !== 'all' && inst.category !== tvetTier) return false;
      if (ownershipFilter !== 'all' && inst.ownership !== ownershipFilter) return false;
      if (onlyVerified && !inst.is_verified) return false;
      if (onlyElearning && inst.elearning_status === 'none') return false;
      if (onlySchologicLms && !inst.portal_subdomain) return false;
      if (!q) return true;
      return (
        inst.name.toLowerCase().includes(q) ||
        inst.county.toLowerCase().includes(q) ||
        inst.town.toLowerCase().includes(q) ||
        (inst.registration_number ?? '').toLowerCase().includes(q)
      );
    });
  }, [
    institutions,
    searchQuery,
    typeFilter,
    tvetTier,
    ownershipFilter,
    onlyVerified,
    onlyElearning,
    onlySchologicLms,
  ]);

  const countyInstMap = useMemo(() => {
    const map = new Map<string, PublicInstitutionSummary[]>();
    for (const inst of filteredInstitutions) {
      const list = map.get(inst.county) ?? [];
      list.push(inst);
      map.set(inst.county, list);
    }
    return map;
  }, [filteredInstitutions]);

  const activeCounty = lockedCounty ?? hoveredCounty;
  const focusCountyForList = activeCounty ?? 'Nairobi';
  const focusCountyInstitutions = countyInstMap.get(focusCountyForList) ?? [];

  // Target viewBox from locked or hovered county
  const targetViewBox = useMemo<ViewBoxTuple>(() => {
    if (lockedCounty && COUNTY_ZOOM_BOXES.has(lockedCounty)) {
      return COUNTY_ZOOM_BOXES.get(lockedCounty)!;
    }
    if (hoverZoomEnabled && hoveredCounty && COUNTY_ZOOM_BOXES.has(hoveredCounty)) {
      return COUNTY_ZOOM_BOXES.get(hoveredCounty)!;
    }
    return NATIONAL_VIEWBOX;
  }, [lockedCounty, hoveredCounty, hoverZoomEnabled]);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      currentVbRef.current = targetViewBox;
      setViewBox(targetViewBox);
      return;
    }

    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    const startVb = { ...currentVbRef.current };
    const startTime = performance.now();
    const duration = 260;

    const tick = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration);
      const ease = 1 - Math.pow(1 - t, 3);
      const next: ViewBoxTuple = {
        x: startVb.x + (targetViewBox.x - startVb.x) * ease,
        y: startVb.y + (targetViewBox.y - startVb.y) * ease,
        w: startVb.w + (targetViewBox.w - startVb.w) * ease,
        h: startVb.h + (targetViewBox.h - startVb.h) * ease,
      };
      currentVbRef.current = next;
      setViewBox(next);
      if (t < 1) {
        animFrameRef.current = requestAnimationFrame(tick);
      }
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [targetViewBox]);

  const isZoomed = Boolean(lockedCounty || (hoverZoomEnabled && hoveredCounty));
  const zoomScale = NATIONAL_VIEWBOX.w / viewBox.w;
  const strokeScale = 1 / Math.max(1, zoomScale * 0.72);
  const pinRadius = isZoomed ? Math.max(1.8, 4.6 / Math.pow(zoomScale, 0.7)) : 4.2;

  // Pins rendered:
  // - When zoomed into a county: render ALL filtered pins inside the focused county (+ nearby edge pins)
  // - When national: render top ~150 representative pins across all 47 counties (all Universities + NPs + top verified) so map stays fast & legible
  const visiblePins = useMemo(() => {
    if (activeCounty) {
      const inCounty = countyInstMap.get(activeCounty) ?? [];
      return inCounty.slice(0, 180);
    }
    const curated: PublicInstitutionSummary[] = [];
    const perCountyCount = new Map<string, number>();
    for (const inst of filteredInstitutions) {
      const cnt = perCountyCount.get(inst.county) ?? 0;
      const isMajor =
        inst.type === 'university' ||
        inst.category === 'NP' ||
        inst.type === 'kmtc' ||
        inst.has_exact_geo;
      if (isMajor || cnt < 2) {
        curated.push(inst);
        perCountyCount.set(inst.county, cnt + 1);
        if (curated.length >= 165) break;
      }
    }
    return curated;
  }, [activeCounty, countyInstMap, filteredInstitutions]);

  const activeInst = useMemo(() => {
    if (selectedSlug) {
      const found = filteredInstitutions.find((i) => i.slug === selectedSlug);
      if (found) return found;
    }
    if (focusCountyInstitutions.length > 0) return focusCountyInstitutions[0];
    return filteredInstitutions[0] ?? null;
  }, [selectedSlug, filteredInstitutions, focusCountyInstitutions]);

  const activeFilterCount =
    (searchQuery.trim() ? 1 : 0) +
    (typeFilter !== 'all' ? 1 : 0) +
    (typeFilter === 'tvet' && tvetTier !== 'all' ? 1 : 0) +
    (ownershipFilter !== 'all' ? 1 : 0) +
    (onlyVerified ? 1 : 0) +
    (onlyElearning ? 1 : 0) +
    (onlySchologicLms ? 1 : 0);

  const resetFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setTvetTier('all');
    setOwnershipFilter('all');
    setOnlyVerified(false);
    setOnlyElearning(false);
    setOnlySchologicLms(false);
  };

  const handleCountyHover = (county: string) => {
    if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = window.setTimeout(() => {
      setHoveredCounty(county);
    }, 110);
  };

  const handleMapMouseLeave = () => {
    if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current);
    setHoveredCounty(null);
  };

  const handleSelectCounty = (county: string) => {
    setLockedCounty(county);
    setInspectorOpen(true);
    const list = countyInstMap.get(county) ?? [];
    if (list.length > 0) {
      setSelectedSlug(list[0].slug);
    }
  };

  const handleSelectInstitution = (inst: PublicInstitutionSummary) => {
    setSelectedSlug(inst.slug);
    setLockedCounty(inst.county);
    setInspectorOpen(true);
  };

  const isPinned = activeInst ? pinnedSlugs.includes(activeInst.slug) : false;

  return (
    <section
      aria-label="Full-Width Interactive Kenya 47-County Academic Map"
      className="w-full border border-hairline bg-paper overflow-hidden"
    >
      {/* Top Working Filter & Search Bar */}
      <div className="p-4 sm:px-6 border-b border-hairline bg-limestone/40 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest text-forest font-semibold">
              Interactive 47-County Geographic Atlas
            </p>
            <h2 className="font-serif text-xl sm:text-2xl font-semibold text-ink">
              Explore Kenya’s {institutions.length.toLocaleString()} Institutions by County
              {isLoadingFull ? ' (Syncing full dataset...)' : ''}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Hover Zoom Toggle */}
            <button
              type="button"
              onClick={() => setHoverZoomEnabled((v) => !v)}
              aria-pressed={hoverZoomEnabled}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border cursor-pointer transition-colors whitespace-nowrap ${
                hoverZoomEnabled
                  ? 'bg-forest/10 text-forest border-forest'
                  : 'bg-paper text-muted border-hairline hover:text-ink'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              Hover-Zoom: {hoverZoomEnabled ? 'On' : 'Off'}
            </button>

            {/* Quick County Jump */}
            <label htmlFor="map-county-jump" className="sr-only">
              Jump to County
            </label>
            <select
              id="map-county-jump"
              value={lockedCounty ?? ''}
              onChange={(e) => {
                const val = e.target.value;
                if (!val) {
                  setLockedCounty(null);
                  setHoveredCounty(null);
                } else {
                  handleSelectCounty(val);
                }
              }}
              className="px-2.5 py-1.5 text-xs bg-paper border border-hairline text-ink focus:outline-none focus:border-forest"
            >
              <option value="">Jump to any of 47 counties...</option>
              {KENYA_COUNTY_PATHS.map((c) => c.county)
                .sort()
                .map((county) => (
                  <option key={county} value={county}>
                    {county} ({countyInstMap.get(county)?.length ?? 0})
                  </option>
                ))}
            </select>

            {(lockedCounty || hoveredCounty) && (
              <button
                type="button"
                onClick={() => {
                  setLockedCounty(null);
                  setHoveredCounty(null);
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-ink text-paper text-xs font-semibold hover:bg-forest transition-colors cursor-pointer whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset to All Kenya
              </button>
            )}

            <button
              type="button"
              onClick={() => setInspectorOpen((v) => !v)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-hairline bg-paper text-xs font-medium text-ink hover:border-ink cursor-pointer whitespace-nowrap"
            >
              {inspectorOpen ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {inspectorOpen ? 'Hide Card' : 'Show Info Card'}
            </button>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-hairline/70 text-xs">
          {/* Search Input */}
          <div className="relative min-w-[220px] flex-1 max-w-sm">
            <label htmlFor="map-search" className="sr-only">
              Search institutions on map
            </label>
            <Search className="w-3.5 h-3.5 text-muted absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="map-search"
              type="search"
              value={searchQuery}
              onChange={(e) => {
                const val = e.target.value;
                setSearchQuery(val);
                if (val.trim().length >= 3) {
                  const firstMatch = institutions.find(
                    (i) =>
                      i.name.toLowerCase().includes(val.trim().toLowerCase()) ||
                      i.county.toLowerCase().includes(val.trim().toLowerCase())
                  );
                  if (firstMatch) {
                    setSelectedSlug(firstMatch.slug);
                    setLockedCounty(firstMatch.county);
                  }
                }
              }}
              placeholder="Filter map by name, town, or county..."
              className="w-full pl-8 pr-2.5 py-1.5 bg-paper border border-hairline text-ink placeholder:text-muted/75 focus:outline-none focus:border-forest"
            />
          </div>

          {/* Type Segmented Buttons */}
          <div className="flex border border-hairline bg-paper">
            {(
              [
                { key: 'all', label: 'All' },
                { key: 'university', label: 'Universities', color: TYPE_COLOR.university },
                { key: 'tvet', label: 'TVET', color: TYPE_COLOR.tvet },
                { key: 'kmtc', label: 'KMTC', color: TYPE_COLOR.kmtc },
              ] as const
            ).map((opt) => {
              const active = typeFilter === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => {
                    setTypeFilter(opt.key);
                    if (opt.key !== 'tvet') setTvetTier('all');
                  }}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 font-medium cursor-pointer transition-colors whitespace-nowrap ${
                    active ? 'bg-ink text-paper' : 'text-muted hover:text-ink'
                  }`}
                >
                  {'color' in opt && (
                    <span
                      className="w-2 h-2 rounded-full inline-block shrink-0"
                      style={{ backgroundColor: active ? '#FBF9F5' : opt.color }}
                    />
                  )}
                  {opt.label}
                </button>
              );
            })}
          </div>

          {typeFilter === 'tvet' && (
            <div className="flex border border-hairline bg-paper">
              {(['all', 'NP', 'TVC', 'VTC'] as const).map((tier) => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => setTvetTier(tier)}
                  className={`px-2 py-1.5 font-mono text-[11px] cursor-pointer transition-colors ${
                    tvetTier === tier ? 'bg-lapis text-paper' : 'text-muted hover:text-ink'
                  }`}
                >
                  {tier === 'all' ? 'All TVET' : tier}
                </button>
              ))}
            </div>
          )}

          {/* Ownership */}
          <select
            aria-label="Filter by ownership"
            value={ownershipFilter}
            onChange={(e) => setOwnershipFilter(e.target.value as 'all' | OwnershipType)}
            className="px-2.5 py-1.5 bg-paper border border-hairline text-ink focus:outline-none focus:border-forest"
          >
            <option value="all">Public &amp; Private</option>
            <option value="public">Public Only</option>
            <option value="private">Private Only</option>
          </select>

          {/* Attribute Toggles */}
          <button
            type="button"
            onClick={() => setOnlyVerified((v) => !v)}
            aria-pressed={onlyVerified}
            className={`px-2.5 py-1.5 border font-medium cursor-pointer transition-colors whitespace-nowrap ${
              onlyVerified
                ? 'bg-forest/10 text-forest border-forest'
                : 'bg-paper text-muted border-hairline hover:text-ink'
            }`}
          >
            {onlyVerified ? '✓ ' : ''}Verified
          </button>

          <button
            type="button"
            onClick={() => setOnlyElearning((v) => !v)}
            aria-pressed={onlyElearning}
            className={`px-2.5 py-1.5 border font-medium cursor-pointer transition-colors whitespace-nowrap ${
              onlyElearning
                ? 'bg-forest/10 text-forest border-forest'
                : 'bg-paper text-muted border-hairline hover:text-ink'
            }`}
          >
            {onlyElearning ? '✓ ' : ''}E-Learning
          </button>

          <button
            type="button"
            onClick={() => setOnlySchologicLms((v) => !v)}
            aria-pressed={onlySchologicLms}
            className={`px-2.5 py-1.5 border font-medium cursor-pointer transition-colors whitespace-nowrap ${
              onlySchologicLms
                ? 'bg-lapis/10 text-lapis border-lapis'
                : 'bg-paper text-muted border-hairline hover:text-ink'
            }`}
          >
            {onlySchologicLms ? '✓ ' : ''}Schologic LMS
          </button>

          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={resetFilters}
              className="px-2 py-1.5 text-terracotta font-semibold hover:underline cursor-pointer whitespace-nowrap"
            >
              Clear ({activeFilterCount})
            </button>
          )}

          <span className="ml-auto font-mono text-[11px] text-muted tabular-nums whitespace-nowrap">
            {filteredInstitutions.length.toLocaleString()} matching
          </span>
        </div>
      </div>

      {/* Full-Width Map Viewport + Floating Basic Info Inspector */}
      <div
        className="relative w-full bg-[#F6F2E8]"
        onMouseLeave={handleMapMouseLeave}
      >
        {/* Top-Left Live County Telemetry Pill (Plain text card, no pill rounding) */}
        <div className="sm:absolute sm:top-4 sm:left-4 z-10 border border-hairline bg-paper/95 px-3.5 py-2.5 text-xs shadow-sm max-w-xs">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted">
            {lockedCounty
              ? 'Locked County View'
              : hoveredCounty
                ? 'Hovering County (Zoomed)'
                : 'National 47-County Overview'}
          </div>
          <div className="font-serif text-base font-semibold text-ink mt-0.5 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-forest shrink-0" />
            <span>
              {activeCounty ? `${activeCounty} County` : 'All 47 Kenyan Counties'}
            </span>
          </div>
          <div className="font-mono text-[11px] text-muted mt-0.5 tabular-nums">
            {activeCounty
              ? `${countyInstMap.get(activeCounty)?.length ?? 0} matching institutions${
                  countyRegions[activeCounty] ? ` · ${countyRegions[activeCounty]}` : ''
                }`
              : `${filteredInstitutions.length.toLocaleString()} institutions · Hover any county to zoom`}
          </div>
        </div>

        {/* Full-Width SVG Map Canvas */}
        <svg
          viewBox={`${viewBox.x.toFixed(1)} ${viewBox.y.toFixed(1)} ${viewBox.w.toFixed(1)} ${viewBox.h.toFixed(1)}`}
          className="w-full h-[460px] sm:h-[560px] lg:h-[640px] block select-none"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Full-width interactive map of Kenya's 47 counties and academic institutions"
        >
          {/* Subtle Geographic Graticule Grid */}
          <g stroke="#DFD8CA" strokeWidth={0.6 * strokeScale} strokeDasharray="4 5" opacity="0.7">
            <line x1="-240" y1="360" x2="840" y2="360" />
            <line x1="-240" y1="180" x2="840" y2="180" />
            <line x1="-240" y1="540" x2="840" y2="540" />
            <line x1="120" y1="0" x2="120" y2="720" />
            <line x1="250" y1="0" x2="250" y2="720" />
            <line x1="420" y1="0" x2="420" y2="720" />
          </g>

          {/* Subtle Equator Marker */}
          <text
            x="-215"
            y="355"
            style={{ fontSize: `${9 * strokeScale}px` }}
            className="font-mono fill-muted/60"
            pointerEvents="none"
          >
            0° EQUATOR
          </text>

          {/* 47 County Polygons */}
          {KENYA_COUNTY_PATHS.map((c) => {
            const count = countyInstMap.get(c.county)?.length ?? 0;
            const isLocked = lockedCounty === c.county;
            const isHovered = hoveredCounty === c.county;

            let fill = '#FBF9F5';
            if (count > 0 && count <= 20) fill = '#EFEAE0';
            else if (count > 20 && count <= 60) fill = '#E5DFD0';
            else if (count > 60) fill = '#DCD4C2';
            if (isHovered) fill = '#D7E4DA';
            if (isLocked) fill = '#C7DCCB';

            return (
              <path
                key={c.county}
                d={c.d}
                fill={fill}
                stroke={isLocked ? '#14532D' : isHovered ? '#1C1917' : '#BEB6A7'}
                strokeWidth={(isLocked ? 1.8 : isHovered ? 1.3 : 0.75) * strokeScale}
                className="cursor-pointer transition-colors duration-150"
                onMouseEnter={() => handleCountyHover(c.county)}
                onClick={() => handleSelectCounty(c.county)}
              >
                <title>
                  {c.county} County ({count} matching)
                </title>
              </path>
            );
          })}

          {/* Lake Feature */}
          {KENYA_LAKE_PATH && (
            <path
              d={KENYA_LAKE_PATH}
              fill="#DCE6F2"
              stroke="#9BB5D1"
              strokeWidth={0.7 * strokeScale}
              pointerEvents="none"
            />
          )}

          {/* County Centroid Labels & Counts */}
          {KENYA_COUNTY_PATHS.filter((c) => {
            if (c.county === lockedCounty || c.county === hoveredCounty) return true;
            if (!isZoomed) {
              return [
                'Nairobi',
                'Mombasa',
                'Kisumu',
                'Uasin Gishu',
                'Nakuru',
                'Nyeri',
                'Kilifi',
                'Turkana',
                'Garissa',
                'Mandera',
                'Marsabit',
                'Kakamega',
              ].includes(c.county);
            }
            return true;
          }).map((c) => {
            const cnt = countyInstMap.get(c.county)?.length ?? 0;
            const fontSize = isZoomed ? Math.max(2.8, 7.5 * strokeScale) : 8.5;
            return (
              <text
                key={`lbl-${c.county}`}
                x={c.cx}
                y={c.cy - (isZoomed ? 3 * strokeScale : 6)}
                textAnchor="middle"
                pointerEvents="none"
                style={{ fontSize: `${fontSize}px` }}
                className="font-mono font-semibold fill-ink/75"
              >
                {c.county}
                {isZoomed ? ` (${cnt})` : ''}
              </text>
            );
          })}

          {/* Institution Pins */}
          {visiblePins.map((inst) => {
            const isSelected = activeInst?.slug === inst.slug;
            const color = TYPE_COLOR[inst.type];
            return (
              <g
                key={inst.slug}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectInstitution(inst);
                }}
                className="cursor-pointer"
              >
                {isSelected && (
                  <circle
                    cx={inst.map_x}
                    cy={inst.map_y}
                    r={pinRadius * 2.1}
                    fill="none"
                    stroke={color}
                    strokeWidth={1.4 * strokeScale}
                  />
                )}
                <circle
                  cx={inst.map_x}
                  cy={inst.map_y}
                  r={isSelected ? pinRadius * 1.35 : pinRadius}
                  fill={color}
                  stroke="#FBF9F5"
                  strokeWidth={1.1 * strokeScale}
                >
                  <title>
                    {inst.name} · {formatTypeLabel(inst.type)} ({inst.county})
                  </title>
                </circle>
              </g>
            );
          })}
        </svg>

        {/* Bottom-Left Map Legend */}
        <div className="sm:absolute sm:bottom-4 sm:left-4 z-10 border border-hairline bg-paper/95 px-3 py-2 flex flex-wrap items-center gap-3 text-[11px] font-mono text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-forest inline-block" /> University
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-lapis inline-block" /> TVET / Poly
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-terracotta inline-block" /> KMTC
          </span>
          <span className="hidden md:inline text-ink/70">· Click any pin for quick info</span>
        </div>

        {/* Right Floating / Docked Institution Basic Info Card + County List */}
        {inspectorOpen && activeInst && (
          <aside
            aria-label="Selected institution basic information"
            className="lg:absolute lg:top-4 lg:right-4 lg:bottom-4 lg:w-[370px] z-20 border-t lg:border border-hairline bg-paper/98 shadow-sm flex flex-col max-h-[540px] lg:max-h-none"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-hairline flex items-center justify-between gap-2 bg-limestone/45">
              <div className="min-w-0">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted truncate">
                  {focusCountyForList} County · {focusCountyInstitutions.length} Institutions
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {focusCountyInstitutions.length > 0 && (
                  <a
                    href={`/counties/${slugifyCounty(focusCountyForList)}`}
                    className="font-mono text-[11px] font-semibold text-forest hover:underline whitespace-nowrap"
                  >
                    County Page →
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setInspectorOpen(false)}
                  aria-label="Close institution info card"
                  className="p-1 text-muted hover:text-ink cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Clicked / Active Institution Basic Info Card */}
            <div className="p-4 border-b border-hairline space-y-3 bg-paper">
              <div className="flex items-start gap-3">
                <InstitutionLogo
                  name={activeInst.name}
                  logoUrl={activeInst.logo_url}
                  type={activeInst.type}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-muted flex flex-wrap items-center gap-x-1.5">
                    <span className="text-forest font-semibold">
                      {formatTypeLabel(activeInst.type)}
                    </span>
                    {activeInst.category && (
                      <>
                        <span>·</span>
                        <span>{activeInst.category}</span>
                      </>
                    )}
                    <span>·</span>
                    <span className="capitalize">{activeInst.ownership}</span>
                    {activeInst.is_verified && (
                      <>
                        <span>·</span>
                        <span className="text-forest">Verified</span>
                      </>
                    )}
                  </div>
                  <h3 className="font-serif text-lg font-semibold text-ink leading-snug mt-0.5">
                    <a
                      href={`/institutions/${activeInst.slug}`}
                      className="hover:text-forest hover:underline"
                    >
                      {activeInst.name}
                    </a>
                  </h3>
                  <p className="font-mono text-[11px] text-muted mt-0.5 truncate">
                    {activeInst.town}, {activeInst.county} County
                  </p>
                </div>
              </div>

              <p className="text-xs text-muted leading-relaxed line-clamp-3">
                {activeInst.description}
              </p>

              {/* Key Snapshot */}
              <dl className="grid grid-cols-3 gap-2 pt-2 border-t border-hairline text-[11px]">
                <div>
                  <dt className="text-muted">Courses</dt>
                  <dd className="font-mono font-semibold text-ink tabular-nums">
                    {activeInst.course_count} tracked
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Composite</dt>
                  <dd className="font-mono font-semibold text-forest tabular-nums">
                    {activeInst.ranking_scores.composite} / 100
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Schologic LMS</dt>
                  <dd className="font-mono font-semibold text-ink truncate">
                    {activeInst.portal_subdomain ? 'Active' : 'Available'}
                  </dd>
                </div>
              </dl>

              {/* Action Buttons: Google Maps + View Full Profile + Pin to Compare */}
              <div className="pt-2 border-t border-hairline flex flex-wrap items-center gap-2">
                <a
                  href={`/institutions/${activeInst.slug}`}
                  className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 bg-forest text-paper text-xs font-semibold hover:bg-ink transition-colors whitespace-nowrap"
                >
                  View Full Profile
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>

                <a
                  href={activeInst.google_maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-2 border border-hairline bg-limestone/60 text-ink text-xs font-semibold hover:border-ink transition-colors whitespace-nowrap"
                  title={
                    activeInst.has_verified_maps_url
                      ? 'Verified Google Maps location link'
                      : 'Search location on Google Maps'
                  }
                >
                  Google Maps
                  <ExternalLink className="w-3 h-3" />
                </a>

                <button
                  type="button"
                  onClick={() => toggleComparedSlug(activeInst.slug)}
                  aria-label={isPinned ? 'Unpin from comparison' : 'Pin to comparison'}
                  className={`inline-flex items-center gap-1 px-2.5 py-2 border text-xs font-semibold cursor-pointer transition-colors ${
                    isPinned
                      ? 'bg-ink text-paper border-ink'
                      : 'bg-paper text-ink border-hairline hover:border-ink'
                  }`}
                >
                  {isPinned ? <Check className="w-3.5 h-3.5" /> : <GitCompare className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Scrollable Filtered Institutions in Focused County */}
            <div className="flex-1 overflow-y-auto divide-y divide-hairline">
              {focusCountyInstitutions.length === 0 ? (
                <div className="p-4 text-xs text-muted">
                  No matching institutions in {focusCountyForList} County with the active filters.
                </div>
              ) : (
                focusCountyInstitutions.slice(0, 60).map((inst) => {
                  const selected = activeInst.slug === inst.slug;
                  return (
                    <button
                      key={inst.slug}
                      type="button"
                      onClick={() => handleSelectInstitution(inst)}
                      className={`w-full text-left px-4 py-2.5 flex items-center justify-between gap-2.5 transition-colors cursor-pointer ${
                        selected ? 'bg-forest/[0.06]' : 'hover:bg-limestone/40'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-ink truncate">{inst.name}</div>
                        <div className="font-mono text-[10px] text-muted truncate">
                          {formatTypeLabel(inst.type)}
                          {inst.category ? ` (${inst.category})` : ''} · {inst.town} ·{' '}
                          {inst.course_count} courses
                        </div>
                      </div>
                      <span className="font-mono text-[11px] font-semibold text-forest tabular-nums shrink-0">
                        {inst.ranking_scores.composite}
                      </span>
                    </button>
                  );
                })
              )}
              {focusCountyInstitutions.length > 60 && (
                <div className="px-4 py-2.5 text-[11px] font-mono text-muted bg-limestone/30">
                  Showing top 60 of {focusCountyInstitutions.length}. Use search filter to narrow.
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </section>
  );
}
