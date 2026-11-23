import React, { useMemo, useState } from 'react';
import { Search, ArrowUpRight, MapPin } from 'lucide-react';
import { type PublicInstitutionSummary, slugifyCounty } from '../types/institution';
import { useInstitutionsIndex } from '../lib/institutionClientIndex';
import KenyaInteractiveMap from './KenyaInteractiveMap';

interface CountyEntry {
  county: string;
  region: string;
}

interface Props {
  allCounties: CountyEntry[];
  initialInstitutions: PublicInstitutionSummary[];
}

export default function CountyExplorer({ allCounties, initialInstitutions }: Props) {
  const { institutions } = useInstitutionsIndex(initialInstitutions);

  const [query, setQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'indexed' | 'queued'>('all');

  const countyMap = useMemo(() => {
    const map = new Map<string, PublicInstitutionSummary[]>();
    for (const inst of institutions) {
      const list = map.get(inst.county) ?? [];
      list.push(inst);
      map.set(inst.county, list);
    }
    return map;
  }, [institutions]);

  const countyRegionsObj = useMemo(() => {
    const obj: Record<string, string> = {};
    for (const c of allCounties) obj[c.county] = c.region;
    return obj;
  }, [allCounties]);

  const regions = useMemo(() => {
    return Array.from(new Set(allCounties.map((c) => c.region))).sort();
  }, [allCounties]);

  const regionStats = useMemo(() => {
    const totals = new Map<string, { counties: number; indexed: number; enrollment: number }>();
    for (const c of allCounties) {
      const cur = totals.get(c.region) ?? { counties: 0, indexed: 0, enrollment: 0 };
      const insts = countyMap.get(c.county) ?? [];
      cur.counties += 1;
      cur.indexed += insts.length;
      cur.enrollment += insts.reduce((sum, i) => sum + i.estimated_student_count, 0);
      totals.set(c.region, cur);
    }
    return Array.from(totals.entries())
      .map(([region, stats]) => ({ region, ...stats }))
      .sort((a, b) => b.indexed - a.indexed);
  }, [allCounties, countyMap]);

  const filteredCounties = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allCounties.filter((entry) => {
      const insts = countyMap.get(entry.county) ?? [];
      if (regionFilter !== 'all' && entry.region !== regionFilter) return false;
      if (statusFilter === 'indexed' && insts.length === 0) return false;
      if (statusFilter === 'queued' && insts.length > 0) return false;
      if (!q) return true;
      return (
        entry.county.toLowerCase().includes(q) ||
        entry.region.toLowerCase().includes(q) ||
        insts.some((i) => i.name.toLowerCase().includes(q))
      );
    });
  }, [allCounties, countyMap, query, regionFilter, statusFilter]);

  const maxRegionIndexed = Math.max(1, ...regionStats.map((r) => r.indexed));

  return (
    <div className="space-y-8">
      {/* Real Geographic Kenya 47-County Map Explorer */}
      <KenyaInteractiveMap
        initialInstitutions={initialInstitutions}
        countyRegions={countyRegionsObj}
      />

      {/* Regional Distribution Bars */}
      <section className="border border-hairline bg-paper p-5 sm:p-6">
        <div className="pb-4 border-b border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest text-muted">
              Geographic Footprint
            </p>
            <h2 className="font-serif text-xl font-semibold text-ink">
              8-Region Institutional &amp; Registry Coverage
            </h2>
          </div>
          <span className="font-mono text-xs text-muted tabular-nums">
            {countyMap.size} of 47 counties actively profiled
          </span>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          {regionStats.map((row) => {
            const pct = (row.indexed / maxRegionIndexed) * 100;
            const active = regionFilter === row.region;
            return (
              <button
                key={row.region}
                type="button"
                onClick={() => setRegionFilter(active ? 'all' : row.region)}
                className={`text-left p-2.5 border transition-colors cursor-pointer ${
                  active
                    ? 'border-forest bg-forest/[0.04]'
                    : 'border-transparent hover:border-hairline hover:bg-limestone/30'
                }`}
              >
                <div className="flex items-baseline justify-between text-xs mb-1.5">
                  <span className="font-semibold text-ink">
                    {row.region}
                    <span className="font-mono font-normal text-muted ml-2">
                      ({row.counties} counties)
                    </span>
                  </span>
                  <span className="font-mono font-semibold text-ink tabular-nums">
                    {row.indexed.toLocaleString()} institutions
                  </span>
                </div>
                <div className="h-2 w-full bg-limestone overflow-hidden">
                  <div
                    className="h-full bg-forest transition-all duration-300"
                    style={{ width: `${row.indexed > 0 ? Math.max(5, pct) : 0}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Filter Controls */}
      <section className="border border-hairline bg-limestone/45 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter 47 counties by name, region, or institution..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-paper border border-hairline text-ink placeholder:text-muted/75 focus:outline-none focus:border-forest"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="px-2.5 py-2 bg-paper border border-hairline text-ink focus:outline-none focus:border-forest"
          >
            <option value="all">All 8 Regions</option>
            {regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          <div className="flex border border-hairline bg-paper">
            {(
              [
                { key: 'all', label: 'All 47' },
                { key: 'indexed', label: 'Indexed Now' },
                { key: 'queued', label: 'Rollout Queue' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setStatusFilter(opt.key)}
                className={`px-3 py-2 font-medium cursor-pointer transition-colors ${
                  statusFilter === opt.key ? 'bg-ink text-paper' : 'text-muted hover:text-ink'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 47-County Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCounties.map((entry) => {
          const insts = countyMap.get(entry.county) ?? [];
          const verifiedCount = insts.filter((i) => i.is_verified).length;
          const countySlug = slugifyCounty(entry.county);
          const isIndexed = insts.length > 0;

          return (
            <div
              key={entry.county}
              className={`border p-4 flex flex-col justify-between ${
                isIndexed
                  ? 'border-hairline bg-paper hover:border-forest/50 transition-colors'
                  : 'border-hairline/70 bg-limestone/25'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 font-mono text-[11px] text-muted">
                  <span>{entry.region}</span>
                  <span className={isIndexed ? 'text-forest font-semibold' : 'text-muted'}>
                    {isIndexed ? `${insts.length} Indexed` : 'Verification Queued'}
                  </span>
                </div>

                <h3 className="font-serif text-lg font-semibold text-ink mt-1.5 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-muted shrink-0" />
                  {isIndexed ? (
                    <a
                      href={`/counties/${countySlug}`}
                      className="hover:text-forest hover:underline"
                    >
                      {entry.county} County
                    </a>
                  ) : (
                    <span>{entry.county} County</span>
                  )}
                </h3>

                {isIndexed ? (
                  <ul className="mt-2.5 space-y-1 text-xs text-muted">
                    {insts.slice(0, 3).map((inst) => (
                      <li key={inst.slug} className="truncate">
                        <a
                          href={`/institutions/${inst.slug}`}
                          className="text-ink hover:text-forest hover:underline"
                        >
                          {inst.name}
                        </a>
                      </li>
                    ))}
                    {insts.length > 3 && (
                      <li className="font-mono text-[11px] text-muted">
                        + {insts.length - 3} more institutions
                      </li>
                    )}
                  </ul>
                ) : (
                  <p className="mt-2.5 text-xs text-muted leading-relaxed">
                    County institutional registry entries queued for upcoming public verification.
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-hairline/80 flex items-center justify-between text-xs">
                <span className="font-mono text-muted tabular-nums">
                  {isIndexed ? `${verifiedCount} verified` : 'Public registry pending'}
                </span>
                {isIndexed && (
                  <a
                    href={`/counties/${countySlug}`}
                    className="inline-flex items-center gap-1 font-semibold text-forest hover:underline"
                  >
                    County Dossier
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
