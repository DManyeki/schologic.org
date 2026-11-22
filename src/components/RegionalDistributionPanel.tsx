import React from 'react';
import { InstitutionRecord } from '../types/institution';

interface RegionalDistributionPanelProps {
  institutions: InstitutionRecord[];
  activeRegion: string;
  onSelectRegion: (region: string) => void;
}

interface RegionStats {
  region: string;
  total: number;
  universities: number;
  tvet: number;
  kmtc: number;
  enrollment: number;
  avgHealth: number;
  avgResearch: number;
}

export const RegionalDistributionPanel: React.FC<RegionalDistributionPanelProps> = ({
  institutions,
  activeRegion,
  onSelectRegion,
}) => {
  const regionMap = new Map<string, InstitutionRecord[]>();

  for (const inst of institutions) {
    const regionName = inst.region ?? 'Unspecified';
    const existing = regionMap.get(regionName) ?? [];
    existing.push(inst);
    regionMap.set(regionName, existing);
  }

  const rows: RegionStats[] = Array.from(regionMap.entries())
    .map(([region, list]) => {
      const total = list.length;
      const universities = list.filter((i) => i.type === 'university').length;
      const tvet = list.filter((i) => i.type === 'tvet').length;
      const kmtc = list.filter((i) => i.type === 'kmtc').length;
      const enrollment = list.reduce((sum, i) => sum + (i.estimated_student_count ?? 0), 0);
      const avgHealth = Math.round(
        list.reduce((sum, i) => sum + (i.health_score ?? 0), 0) / Math.max(1, total)
      );
      const avgResearch = Math.round(
        list.reduce((sum, i) => sum + (i.research_score ?? 0), 0) / Math.max(1, total)
      );

      return {
        region,
        total,
        universities,
        tvet,
        kmtc,
        enrollment,
        avgHealth,
        avgResearch,
      };
    })
    .sort((a, b) => b.enrollment - a.enrollment);

  return (
    <section
      id="regions"
      aria-labelledby="regions-heading"
      className="bg-white border border-[#E5E0D8] rounded-lg p-6 md:p-7 space-y-5"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 pb-4 border-b border-[#E5E0D8]">
        <div>
          <div className="text-xs font-medium text-[#57534E]">
            03 · Geographic Footprint Across Kenya
          </div>
          <h3
            id="regions-heading"
            className="mt-1 font-serif text-2xl font-semibold text-[#1C1917] text-balance"
          >
            Regional Distribution by Institution Type
          </h3>
        </div>
        <p className="text-xs text-[#57534E]">
          Select any region row to filter the main directory below.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-[#E5E0D8] text-xs font-medium text-[#57534E]">
              <th className="py-2.5 px-3 font-medium">Region</th>
              <th className="py-2.5 px-3 font-medium text-right">Indexed</th>
              <th className="py-2.5 px-3 font-medium text-right">Universities</th>
              <th className="py-2.5 px-3 font-medium text-right">TVET</th>
              <th className="py-2.5 px-3 font-medium text-right">KMTC</th>
              <th className="py-2.5 px-3 font-medium text-right">Est. Enrollment</th>
              <th className="py-2.5 px-3 font-medium text-right">Mean Health</th>
              <th className="py-2.5 px-3 font-medium text-right">Mean Research</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E0D8]">
            {rows.map((row) => {
              const isSelected = activeRegion === row.region;
              return (
                <tr
                  key={row.region}
                  className={`transition-colors ${
                    isSelected ? 'bg-[#14532D]/8' : 'hover:bg-[#FBF9F5]'
                  }`}
                >
                  <td className="py-3 px-3">
                    <button
                      type="button"
                      onClick={() => onSelectRegion(isSelected ? 'all' : row.region)}
                      className={`font-medium text-left hover:text-[#14532D] cursor-pointer ${
                        isSelected ? 'text-[#14532D] underline' : 'text-[#1C1917]'
                      }`}
                    >
                      {row.region}
                    </button>
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-[#1C1917]">
                    {row.total}
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-[#57534E]">
                    {row.universities}
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-[#57534E]">
                    {row.tvet}
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-[#57534E]">
                    {row.kmtc}
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-[#1C1917]">
                    {row.enrollment.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-[#1C1917]">
                    {row.avgHealth}
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-[#1C1917]">
                    {row.avgResearch}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};
