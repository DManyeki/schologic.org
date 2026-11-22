import React from 'react';
import {
  ArrowUpRight,
  Check,
  CheckCircle2,
  Clock,
  GitBranch,
  Plus,
} from 'lucide-react';
import {
  formatTypeLabel,
  InstitutionRecord,
  SERIES_PALETTE,
} from '../types/institution';
import { ViewMode } from './FilterToolbar';

interface InstitutionDirectoryProps {
  institutions: InstitutionRecord[];
  allInstitutions: InstitutionRecord[];
  viewMode: ViewMode;
  comparedIds: string[];
  onToggleCompare: (id: string) => void;
  onSelectProfile: (id: string) => void;
  onResetFilters: () => void;
}

export const InstitutionDirectory: React.FC<InstitutionDirectoryProps> = ({
  institutions,
  allInstitutions,
  viewMode,
  comparedIds,
  onToggleCompare,
  onSelectProfile,
  onResetFilters,
}) => {
  const getParentName = (parentId: string | null) => {
    if (!parentId) return null;
    return allInstitutions.find((item) => item.id === parentId)?.name ?? null;
  };

  if (institutions.length === 0) {
    return (
      <div className="bg-white border border-[#E5E0D8] rounded-lg px-6 py-16 text-center space-y-3">
        <p className="font-serif text-xl text-[#1C1917]">No matching institutions in the index</p>
        <p className="text-sm text-[#57534E] max-w-md mx-auto">
          Adjust your search query or clear one of the active type, TVET category, region, or modality filters.
        </p>
        <div className="pt-2">
          <button
            type="button"
            onClick={onResetFilters}
            className="px-4 py-2 text-xs font-medium bg-[#14532D] text-white rounded-md hover:bg-[#114224] transition-colors cursor-pointer"
          >
            Reset All Filters
          </button>
        </div>
      </div>
    );
  }

  if (viewMode === 'table') {
    return (
      <div className="bg-white border border-[#E5E0D8] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E5E0D8] bg-[#F3EFE6]/60 text-xs font-medium text-[#57534E]">
                <th className="py-3 px-4 font-medium">Institution & Registration</th>
                <th className="py-3 px-3 font-medium">Type / Tier</th>
                <th className="py-3 px-3 font-medium">County · Region</th>
                <th className="py-3 px-3 font-medium text-right">Students</th>
                <th className="py-3 px-3 font-medium text-right">Health</th>
                <th className="py-3 px-3 font-medium text-right">Research</th>
                <th className="py-3 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E0D8] text-sm">
              {institutions.map((inst) => {
                const compareIdx = comparedIds.indexOf(inst.id);
                const isPinned = compareIdx !== -1;
                const seriesColor = isPinned ? SERIES_PALETTE[compareIdx] : null;
                const parentName = getParentName(inst.parent_institution_id);

                return (
                  <tr
                    key={inst.id}
                    className="hover:bg-[#FBF9F5] transition-colors group"
                  >
                    <td className="py-3.5 px-4 align-top">
                      <button
                        type="button"
                        onClick={() => onSelectProfile(inst.id)}
                        className="text-left group-hover:text-[#14532D] transition-colors cursor-pointer"
                      >
                        <div className="font-serif font-semibold text-[#1C1917] group-hover:text-[#14532D] flex items-center gap-2">
                          <span>{inst.name}</span>
                          {inst.is_verified ? (
                            <CheckCircle2
                              className="w-3.5 h-3.5 text-[#14532D] shrink-0"
                              aria-label="Verified record"
                            />
                          ) : (
                            <Clock
                              className="w-3.5 h-3.5 text-[#9A3412] shrink-0"
                              aria-label="Pending verification"
                            />
                          )}
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-[#57534E] font-mono tabular-nums">
                          <span>{inst.registration_number ?? 'Unregistered'}</span>
                          {inst.aliases && inst.aliases.length > 0 && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-sans">{inst.aliases[0]}</span>
                            </>
                          )}
                          {parentName && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-sans inline-flex items-center gap-1 text-[#1E3A8A]">
                                <GitBranch className="w-3 h-3" aria-hidden="true" />
                                Branch of {parentName}
                              </span>
                            </>
                          )}
                        </div>
                      </button>
                    </td>
                    <td className="py-3.5 px-3 align-top text-xs text-[#1C1917] whitespace-nowrap">
                      <span>{formatTypeLabel(inst.type)}</span>
                      {inst.category && (
                        <span className="text-[#57534E]"> · {inst.category}</span>
                      )}
                      <div className="text-[#57534E] capitalize mt-0.5">
                        {inst.ownership} · {inst.operational_status}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 align-top text-xs text-[#1C1917] whitespace-nowrap">
                      <div>{inst.county}</div>
                      <div className="text-[#57534E] mt-0.5">{inst.region}</div>
                    </td>
                    <td className="py-3.5 px-3 align-top text-right font-mono tabular-nums text-xs text-[#1C1917]">
                      {inst.estimated_student_count?.toLocaleString() ?? '—'}
                    </td>
                    <td className="py-3.5 px-3 align-top text-right font-mono tabular-nums text-xs font-medium text-[#1C1917]">
                      {inst.health_score}
                    </td>
                    <td className="py-3.5 px-3 align-top text-right font-mono tabular-nums text-xs font-medium text-[#1C1917]">
                      {inst.research_score}
                    </td>
                    <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onSelectProfile(inst.id)}
                          className="px-2.5 py-1.5 text-xs font-medium text-[#57534E] hover:text-[#1C1917] border border-[#E5E0D8] rounded hover:bg-[#F3EFE6] transition-colors cursor-pointer"
                        >
                          Dossier
                        </button>
                        <button
                          type="button"
                          onClick={() => onToggleCompare(inst.id)}
                          style={
                            seriesColor
                              ? { backgroundColor: seriesColor.hex, borderColor: seriesColor.hex }
                              : undefined
                          }
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded border transition-colors cursor-pointer ${
                            isPinned
                              ? 'text-white'
                              : 'text-[#14532D] border-[#14532D]/35 hover:bg-[#14532D]/5'
                          }`}
                        >
                          {isPinned ? (
                            <>
                              <Check className="w-3 h-3" aria-hidden="true" />
                              <span>Pinned</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3 h-3" aria-hidden="true" />
                              <span>Compare</span>
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {institutions.map((inst) => {
        const compareIdx = comparedIds.indexOf(inst.id);
        const isPinned = compareIdx !== -1;
        const seriesColor = isPinned ? SERIES_PALETTE[compareIdx] : null;
        const parentName = getParentName(inst.parent_institution_id);
        const elearningEnabled = inst.has_elearning?.[0]?.enabled;
        const distanceEnabled = inst.has_distance_learning?.[0]?.enabled;

        return (
          <article
            key={inst.id}
            className="bg-white border border-[#E5E0D8] rounded-lg p-5 flex flex-col justify-between transition-colors hover:border-[#C7BFA9]"
          >
            <div>
              {/* Quiet 1-line text kicker — zero pills */}
              <div className="flex items-center justify-between gap-2 text-xs text-[#57534E]">
                <div className="flex items-center gap-1.5 min-w-0 truncate">
                  <span className="font-medium text-[#1C1917]">{formatTypeLabel(inst.type)}</span>
                  {inst.category && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>{inst.category}</span>
                    </>
                  )}
                  <span aria-hidden="true">·</span>
                  <span className="capitalize">{inst.ownership}</span>
                  <span aria-hidden="true">·</span>
                  <span className="truncate">{inst.county}</span>
                </div>

                <span className="inline-flex items-center gap-1 shrink-0 text-xs">
                  {inst.is_verified ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#14532D]" aria-hidden="true" />
                      <span className="text-[#14532D] font-medium">Verified</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-3.5 h-3.5 text-[#9A3412]" aria-hidden="true" />
                      <span className="text-[#9A3412] font-medium capitalize">
                        {inst.operational_status}
                      </span>
                    </>
                  )}
                </span>
              </div>

              {/* Institution Title */}
              <h3 className="mt-2.5 font-serif text-xl font-semibold leading-snug text-[#1C1917] text-balance">
                <button
                  type="button"
                  onClick={() => onSelectProfile(inst.id)}
                  className="text-left hover:text-[#14532D] transition-colors cursor-pointer focus-visible:outline-none focus-visible:underline"
                >
                  {inst.name}
                </button>
              </h3>

              {/* Registration No & Parent Campus Link */}
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#57534E]">
                <span className="font-mono tabular-nums">
                  {inst.registration_number ?? 'Registry Pending'}
                </span>
                {inst.aliases && inst.aliases.length > 0 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{inst.aliases[0]}</span>
                  </>
                )}
                {parentName && (
                  <>
                    <span aria-hidden="true">·</span>
                    <button
                      type="button"
                      onClick={() => inst.parent_institution_id && onSelectProfile(inst.parent_institution_id)}
                      className="inline-flex items-center gap-1 text-[#1E3A8A] hover:underline cursor-pointer"
                    >
                      <GitBranch className="w-3 h-3" aria-hidden="true" />
                      <span>Campus of {parentName}</span>
                    </button>
                  </>
                )}
              </div>

              <p className="mt-3 text-sm leading-relaxed text-[#57534E] line-clamp-2">
                {inst.description}
              </p>

              {/* Inline disciplines & modalities as unboxed text */}
              <div className="mt-3 text-xs text-[#57534E] leading-relaxed">
                <span className="text-[#1C1917] font-medium">Focus: </span>
                {inst.research_data.flagship_disciplines.slice(0, 3).join(' · ')}
                {(elearningEnabled || distanceEnabled) && (
                  <span className="text-[#14532D]">
                    {' '}
                    · {[elearningEnabled ? 'E-Learning' : null, distanceEnabled ? 'Distance' : null]
                      .filter(Boolean)
                      .join(' & ')}
                  </span>
                )}
              </div>
            </div>

            {/* Footer Quantitative Bar + Actions */}
            <div className="mt-5 pt-4 border-t border-[#E5E0D8] space-y-3">
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <div className="text-[#57534E]">Health</div>
                  <div className="font-mono tabular-nums font-semibold text-sm text-[#1C1917]">
                    {inst.health_score}/100
                  </div>
                </div>
                <div>
                  <div className="text-[#57534E]">Research</div>
                  <div className="font-mono tabular-nums font-semibold text-sm text-[#1C1917]">
                    {inst.research_score}/100
                  </div>
                </div>
                <div>
                  <div className="text-[#57534E]">Enrollment</div>
                  <div className="font-mono tabular-nums font-semibold text-sm text-[#1C1917]">
                    {inst.estimated_student_count?.toLocaleString() ?? '—'}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => onSelectProfile(inst.id)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#1C1917] hover:text-[#14532D] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Read Monograph</span>
                  <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={() => onToggleCompare(inst.id)}
                  style={
                    seriesColor
                      ? { backgroundColor: seriesColor.hex, borderColor: seriesColor.hex }
                      : undefined
                  }
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isPinned
                      ? 'text-white'
                      : 'bg-[#FBF9F5] text-[#14532D] border-[#14532D]/35 hover:bg-[#14532D]/5'
                  }`}
                >
                  {isPinned ? (
                    <>
                      <Check className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Pinned ({compareIdx + 1})</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Pin to Compare</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
};
