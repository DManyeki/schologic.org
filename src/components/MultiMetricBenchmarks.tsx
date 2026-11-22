import React, { useState } from 'react';
import {
  formatCategoryLabel,
  formatTypeLabel,
  InstitutionRecord,
  SERIES_PALETTE,
} from '../types/institution';

interface MultiMetricBenchmarksProps {
  institutions: InstitutionRecord[];
  onSelectProfile: (id: string) => void;
}

export const MultiMetricBenchmarks: React.FC<MultiMetricBenchmarksProps> = ({
  institutions,
  onSelectProfile,
}) => {
  const [enrollmentScale, setEnrollmentScale] = useState<'linear' | 'log'>('linear');

  if (institutions.length === 0) {
    return null;
  }

  const maxEnrollment = Math.max(
    1000,
    ...institutions.map((i) => i.estimated_student_count ?? 0)
  );
  const maxCourses = Math.max(1, ...institutions.map((i) => i.courses.length));
  const maxFacilities = Math.max(1, ...institutions.map((i) => i.facilities.length));

  const getEnrollmentWidth = (count: number | null) => {
    const val = count ?? 0;
    if (val <= 0) return 0;
    if (enrollmentScale === 'log') {
      const logMax = Math.log10(maxEnrollment + 1);
      const logVal = Math.log10(val + 1);
      return Math.max(6, Math.round((logVal / logMax) * 100));
    }
    return Math.max(3, Math.round((val / maxEnrollment) * 100));
  };

  return (
    <div className="bg-white border border-[#E5E0D8] rounded-lg p-6 md:p-7 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#E5E0D8]">
        <div>
          <div className="text-xs font-medium text-[#57534E]">
            02 · Synchronized Multi-Metric Benchmarks
          </div>
          <h3 className="mt-1 font-serif text-2xl font-semibold text-[#1C1917] text-balance">
            Schema Scores, Enrollment Scale &amp; Program Footprint
          </h3>
        </div>

        <div className="inline-flex items-center gap-2 text-xs text-[#57534E]">
          <span>Enrollment Scale:</span>
          <div className="inline-flex items-center p-1 bg-[#F3EFE6] border border-[#E5E0D8] rounded-md">
            <button
              type="button"
              onClick={() => setEnrollmentScale('linear')}
              aria-pressed={enrollmentScale === 'linear'}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                enrollmentScale === 'linear'
                  ? 'bg-white text-[#1C1917] shadow-xs'
                  : 'text-[#57534E] hover:text-[#1C1917]'
              }`}
            >
              Linear
            </button>
            <button
              type="button"
              onClick={() => setEnrollmentScale('log')}
              aria-pressed={enrollmentScale === 'log'}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                enrollmentScale === 'log'
                  ? 'bg-white text-[#1C1917] shadow-xs'
                  : 'text-[#57534E] hover:text-[#1C1917]'
              }`}
            >
              Logarithmic
            </button>
          </div>
        </div>
      </div>

      {/* 4 Grouped Horizontal Bar Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Metric 1: Operational Health Score */}
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h4 className="text-sm font-semibold text-[#1C1917]">
              Operational Health (<code className="font-mono text-xs text-[#57534E]">health_score</code>)
            </h4>
            <span className="text-xs font-mono text-[#57534E]">0–100 Scale</span>
          </div>
          <div className="space-y-2.5">
            {institutions.map((inst, idx) => {
              const color = SERIES_PALETTE[idx % SERIES_PALETTE.length];
              return (
                <div key={inst.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#1C1917] font-medium truncate pr-3">
                      {inst.aliases?.[0] ?? inst.name}
                    </span>
                    <span className="font-mono tabular-nums font-semibold text-[#1C1917]">
                      {inst.health_score}
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-[#F3EFE6] rounded-xs overflow-hidden">
                    <div
                      className="h-full transition-all duration-200"
                      style={{
                        width: `${Math.min(100, inst.health_score)}%`,
                        backgroundColor: color.hex,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Metric 2: Research Score */}
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h4 className="text-sm font-semibold text-[#1C1917]">
              Research &amp; Data Index (<code className="font-mono text-xs text-[#57534E]">research_score</code>)
            </h4>
            <span className="text-xs font-mono text-[#57534E]">0–100 Scale</span>
          </div>
          <div className="space-y-2.5">
            {institutions.map((inst, idx) => {
              const color = SERIES_PALETTE[idx % SERIES_PALETTE.length];
              return (
                <div key={inst.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#1C1917] font-medium truncate pr-3">
                      {inst.aliases?.[0] ?? inst.name}
                    </span>
                    <span className="font-mono tabular-nums font-semibold text-[#1C1917]">
                      {inst.research_score}
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-[#F3EFE6] rounded-xs overflow-hidden">
                    <div
                      className="h-full transition-all duration-200"
                      style={{
                        width: `${Math.min(100, inst.research_score)}%`,
                        backgroundColor: color.hex,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Metric 3: Estimated Student Count */}
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h4 className="text-sm font-semibold text-[#1C1917]">
              Student Population (<code className="font-mono text-xs text-[#57534E]">estimated_student_count</code>)
            </h4>
            <span className="text-xs font-mono text-[#57534E] capitalize">{enrollmentScale}</span>
          </div>
          <div className="space-y-2.5">
            {institutions.map((inst, idx) => {
              const color = SERIES_PALETTE[idx % SERIES_PALETTE.length];
              return (
                <div key={inst.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#1C1917] font-medium truncate pr-3">
                      {inst.aliases?.[0] ?? inst.name}
                    </span>
                    <span className="font-mono tabular-nums font-semibold text-[#1C1917]">
                      {inst.estimated_student_count?.toLocaleString() ?? 'N/A'}
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-[#F3EFE6] rounded-xs overflow-hidden">
                    <div
                      className="h-full transition-all duration-200"
                      style={{
                        width: `${getEnrollmentWidth(inst.estimated_student_count)}%`,
                        backgroundColor: color.hex,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Metric 4: Indexed Academic Courses & Facilities */}
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h4 className="text-sm font-semibold text-[#1C1917]">
              Catalogued Courses &amp; Facilities Depth
            </h4>
            <span className="text-xs font-mono text-[#57534E]">Courses / Facilities</span>
          </div>
          <div className="space-y-2.5">
            {institutions.map((inst, idx) => {
              const color = SERIES_PALETTE[idx % SERIES_PALETTE.length];
              const pct = Math.round(
                ((inst.courses.length / maxCourses + inst.facilities.length / maxFacilities) / 2) *
                  100
              );
              return (
                <div key={inst.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#1C1917] font-medium truncate pr-3">
                      {inst.aliases?.[0] ?? inst.name}
                    </span>
                    <span className="font-mono tabular-nums text-[#1C1917]">
                      <strong>{inst.courses.length}</strong> courses ·{' '}
                      <strong>{inst.facilities.length}</strong> facilities
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-[#F3EFE6] rounded-xs overflow-hidden">
                    <div
                      className="h-full transition-all duration-200"
                      style={{
                        width: `${Math.max(10, pct)}%`,
                        backgroundColor: color.hex,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Synchronized Comparative Schema Matrix */}
      <div className="pt-4 border-t border-[#E5E0D8]">
        <h4 className="text-xs font-semibold text-[#57534E] uppercase tracking-wider mb-3">
          Side-by-Side Schema Record Matrix
        </h4>
        <div className="overflow-x-auto border border-[#E5E0D8] rounded-md">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F3EFE6]/70 border-b border-[#E5E0D8]">
                <th className="py-2.5 px-3 font-medium text-[#57534E] w-44">Schema Field</th>
                {institutions.map((inst, idx) => {
                  const color = SERIES_PALETTE[idx % SERIES_PALETTE.length];
                  return (
                    <th key={inst.id} className="py-2.5 px-3 font-semibold text-[#1C1917]">
                      <button
                        type="button"
                        onClick={() => onSelectProfile(inst.id)}
                        className="inline-flex items-center gap-1.5 hover:text-[#14532D] cursor-pointer text-left"
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-xs shrink-0"
                          style={{ backgroundColor: color.hex }}
                          aria-hidden="true"
                        />
                        <span>{inst.aliases?.[0] ?? inst.name}</span>
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E0D8]">
              <tr>
                <td className="py-2 px-3 font-mono text-[#57534E]">type / category</td>
                {institutions.map((inst) => (
                  <td key={inst.id} className="py-2 px-3 text-[#1C1917]">
                    {formatTypeLabel(inst.type)}
                    {inst.category ? ` · ${formatCategoryLabel(inst.category)}` : ''}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2 px-3 font-mono text-[#57534E]">ownership / status</td>
                {institutions.map((inst) => (
                  <td key={inst.id} className="py-2 px-3 capitalize text-[#1C1917]">
                    {inst.ownership} · {inst.operational_status}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2 px-3 font-mono text-[#57534E]">registration_number</td>
                {institutions.map((inst) => (
                  <td key={inst.id} className="py-2 px-3 font-mono tabular-nums text-[#1C1917]">
                    {inst.registration_number ?? '—'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2 px-3 font-mono text-[#57534E]">county / region</td>
                {institutions.map((inst) => (
                  <td key={inst.id} className="py-2 px-3 text-[#1C1917]">
                    {inst.county} · {inst.region}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2 px-3 font-mono text-[#57534E]">faculty_student_ratio</td>
                {institutions.map((inst) => (
                  <td key={inst.id} className="py-2 px-3 font-mono tabular-nums text-[#1C1917]">
                    {inst.research_data.faculty_student_ratio ?? '—'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2 px-3 font-mono text-[#57534E]">learning_modalities</td>
                {institutions.map((inst) => {
                  const modes = [
                    inst.has_elearning?.[0]?.enabled ? 'E-Learning' : null,
                    inst.has_distance_learning?.[0]?.enabled ? 'Distance' : null,
                    inst.has_teaching_courses?.[0]?.enabled ? 'Teaching' : null,
                  ].filter(Boolean);
                  return (
                    <td key={inst.id} className="py-2 px-3 text-[#1C1917]">
                      {modes.length > 0 ? modes.join(', ') : 'In-Person Only'}
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td className="py-2 px-3 font-mono text-[#57534E]">campuses / verified</td>
                {institutions.map((inst) => (
                  <td key={inst.id} className="py-2 px-3 font-mono tabular-nums text-[#1C1917]">
                    {inst.campuses.length} campus{inst.campuses.length === 1 ? '' : 'es'} ·{' '}
                    {inst.is_verified ? 'Verified' : 'Unverified'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
