import React from 'react';
import { LayoutGrid, RotateCcw, Search, Table as TableIcon, Upload } from 'lucide-react';
import {
  InstitutionType,
  OperationalStatus,
  OwnershipType,
  TvetCategory,
} from '../types/institution';

export type SortKey = 'research_score' | 'health_score' | 'estimated_student_count' | 'name';
export type ViewMode = 'cards' | 'table';

export interface FilterState {
  searchQuery: string;
  type: 'all' | InstitutionType;
  category: 'all' | TvetCategory;
  ownership: 'all' | OwnershipType;
  status: 'all' | OperationalStatus;
  region: string;
  verifiedOnly: boolean;
  elearningOnly: boolean;
  distanceOnly: boolean;
  teachingOnly: boolean;
  sortKey: SortKey;
  viewMode: ViewMode;
}

interface FilterToolbarProps {
  filters: FilterState;
  availableRegions: string[];
  totalCount: number;
  filteredCount: number;
  hasActiveFilters: boolean;
  onUpdate: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  onReset: () => void;
  onOpenImportModal: () => void;
}

export const FilterToolbar: React.FC<FilterToolbarProps> = ({
  filters,
  availableRegions,
  totalCount,
  filteredCount,
  hasActiveFilters,
  onUpdate,
  onReset,
  onOpenImportModal,
}) => {
  const typeTabs: Array<{ value: FilterState['type']; label: string }> = [
    { value: 'all', label: 'All Institutions' },
    { value: 'university', label: 'Universities' },
    { value: 'tvet', label: 'TVET' },
    { value: 'kmtc', label: 'KMTC' },
  ];

  const categoryTabs: Array<{ value: FilterState['category']; label: string }> = [
    { value: 'all', label: 'All Tiers' },
    { value: 'NP', label: 'NP · National Polytechnics' },
    { value: 'TVC', label: 'TVC · Technical Colleges' },
    { value: 'VTC', label: 'VTC · Vocational Centers' },
  ];

  return (
    <section
      aria-label="Directory search and filters"
      className="bg-white border border-[#E5E0D8] rounded-lg p-5 md:p-6 space-y-5"
    >
      {/* Row 1: Search Input + Type Segmented Tabs + View & Schema Import */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-xl">
          <Search
            className="w-4 h-4 text-[#57534E] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={filters.searchQuery}
            onChange={(e) => onUpdate('searchQuery', e.target.value)}
            placeholder="Search by institution name, alias, county, registration no., or course..."
            aria-label="Search Kenyan institutions"
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#FBF9F5] border border-[#E5E0D8] rounded-md text-[#1C1917] placeholder:text-[#78716C] focus:outline-none focus:border-[#14532D] focus:ring-1 focus:ring-[#14532D]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div
            role="group"
            aria-label="Filter by institution type"
            className="inline-flex items-center p-1 bg-[#F3EFE6] border border-[#E5E0D8] rounded-md"
          >
            {typeTabs.map((tab) => {
              const active = filters.type === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => {
                    onUpdate('type', tab.value);
                    if (tab.value !== 'tvet' && tab.value !== 'all') {
                      onUpdate('category', 'all');
                    }
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-white text-[#1C1917] shadow-xs'
                      : 'text-[#57534E] hover:text-[#1C1917]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="inline-flex items-center p-1 bg-[#F3EFE6] border border-[#E5E0D8] rounded-md">
            <button
              type="button"
              onClick={() => onUpdate('viewMode', 'cards')}
              aria-label="Editorial card view"
              aria-pressed={filters.viewMode === 'cards'}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                filters.viewMode === 'cards'
                  ? 'bg-white text-[#1C1917] shadow-xs'
                  : 'text-[#57534E] hover:text-[#1C1917]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Cards</span>
            </button>
            <button
              type="button"
              onClick={() => onUpdate('viewMode', 'table')}
              aria-label="Compact schema table view"
              aria-pressed={filters.viewMode === 'table'}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                filters.viewMode === 'table'
                  ? 'bg-white text-[#1C1917] shadow-xs'
                  : 'text-[#57534E] hover:text-[#1C1917]'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Table</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenImportModal}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#1C1917] bg-[#FBF9F5] border border-[#E5E0D8] rounded-md hover:bg-[#F3EFE6] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-[#57534E]" aria-hidden="true" />
            <span>Import / Export JSON</span>
          </button>
        </div>
      </div>

      {/* Contextual TVET Category Sub-bar */}
      {(filters.type === 'all' || filters.type === 'tvet') && (
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#F3EFE6]">
          <span className="text-xs font-medium text-[#57534E] mr-1">TVET Category:</span>
          {categoryTabs.map((cat) => {
            const active = filters.category === cat.value;
            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => onUpdate('category', cat.value)}
                className={`px-2.5 py-1 text-xs font-medium rounded border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-[#14532D] text-white border-[#14532D]'
                    : 'bg-[#FBF9F5] text-[#57534E] border-[#E5E0D8] hover:text-[#1C1917] hover:border-[#D6CEBE]'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Row 2: Ownership, Region, Status, Modalities & Sort */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-[#E5E0D8]">
        <div className="flex flex-wrap items-center gap-3">
          {/* Ownership */}
          <label className="inline-flex items-center gap-2 text-xs text-[#57534E]">
            <span className="font-medium">Ownership</span>
            <select
              value={filters.ownership}
              onChange={(e) => onUpdate('ownership', e.target.value as FilterState['ownership'])}
              className="px-2.5 py-1.5 text-xs font-medium text-[#1C1917] bg-[#FBF9F5] border border-[#E5E0D8] rounded focus:outline-none focus:border-[#14532D]"
            >
              <option value="all">All Ownership</option>
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </label>

          {/* Region */}
          <label className="inline-flex items-center gap-2 text-xs text-[#57534E]">
            <span className="font-medium">Region</span>
            <select
              value={filters.region}
              onChange={(e) => onUpdate('region', e.target.value)}
              className="px-2.5 py-1.5 text-xs font-medium text-[#1C1917] bg-[#FBF9F5] border border-[#E5E0D8] rounded focus:outline-none focus:border-[#14532D]"
            >
              <option value="all">All Regions</option>
              {availableRegions.map((reg) => (
                <option key={reg} value={reg}>
                  {reg}
                </option>
              ))}
            </select>
          </label>

          {/* Operational Status */}
          <label className="inline-flex items-center gap-2 text-xs text-[#57534E]">
            <span className="font-medium">Status</span>
            <select
              value={filters.status}
              onChange={(e) => onUpdate('status', e.target.value as FilterState['status'])}
              className="px-2.5 py-1.5 text-xs font-medium text-[#1C1917] bg-[#FBF9F5] border border-[#E5E0D8] rounded focus:outline-none focus:border-[#14532D]"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>

          {/* Boolean Schema Modality & Verification Toggles */}
          <div className="flex flex-wrap items-center gap-1.5 pl-1">
            <button
              type="button"
              onClick={() => onUpdate('verifiedOnly', !filters.verifiedOnly)}
              aria-pressed={filters.verifiedOnly}
              className={`px-2.5 py-1.5 text-xs font-medium rounded border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                filters.verifiedOnly
                  ? 'bg-[#14532D]/10 text-[#14532D] border-[#14532D]/40'
                  : 'bg-[#FBF9F5] text-[#57534E] border-[#E5E0D8] hover:text-[#1C1917]'
              }`}
            >
              Verified Only
            </button>
            <button
              type="button"
              onClick={() => onUpdate('elearningOnly', !filters.elearningOnly)}
              aria-pressed={filters.elearningOnly}
              className={`px-2.5 py-1.5 text-xs font-medium rounded border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                filters.elearningOnly
                  ? 'bg-[#14532D]/10 text-[#14532D] border-[#14532D]/40'
                  : 'bg-[#FBF9F5] text-[#57534E] border-[#E5E0D8] hover:text-[#1C1917]'
              }`}
            >
              E-Learning
            </button>
            <button
              type="button"
              onClick={() => onUpdate('distanceOnly', !filters.distanceOnly)}
              aria-pressed={filters.distanceOnly}
              className={`px-2.5 py-1.5 text-xs font-medium rounded border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                filters.distanceOnly
                  ? 'bg-[#14532D]/10 text-[#14532D] border-[#14532D]/40'
                  : 'bg-[#FBF9F5] text-[#57534E] border-[#E5E0D8] hover:text-[#1C1917]'
              }`}
            >
              Distance
            </button>
            <button
              type="button"
              onClick={() => onUpdate('teachingOnly', !filters.teachingOnly)}
              aria-pressed={filters.teachingOnly}
              className={`px-2.5 py-1.5 text-xs font-medium rounded border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                filters.teachingOnly
                  ? 'bg-[#14532D]/10 text-[#14532D] border-[#14532D]/40'
                  : 'bg-[#FBF9F5] text-[#57534E] border-[#E5E0D8] hover:text-[#1C1917]'
              }`}
            >
              Teaching Courses
            </button>
          </div>
        </div>

        {/* Sort & Result Count */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#57534E] font-mono tabular-nums whitespace-nowrap">
            Showing {filteredCount} of {totalCount}
          </span>

          <label className="inline-flex items-center gap-2 text-xs text-[#57534E]">
            <span className="font-medium">Sort</span>
            <select
              value={filters.sortKey}
              onChange={(e) => onUpdate('sortKey', e.target.value as SortKey)}
              className="px-2.5 py-1.5 text-xs font-medium text-[#1C1917] bg-[#FBF9F5] border border-[#E5E0D8] rounded focus:outline-none focus:border-[#14532D]"
            >
              <option value="research_score">Research Score</option>
              <option value="health_score">Health Score</option>
              <option value="estimated_student_count">Enrollment</option>
              <option value="name">Name (A–Z)</option>
            </select>
          </label>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#9A3412] hover:bg-[#9A3412]/10 rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" aria-hidden="true" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
};
