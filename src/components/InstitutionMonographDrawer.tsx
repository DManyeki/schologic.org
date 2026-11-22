import React, { useEffect, useState } from 'react';
import {
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  ExternalLink,
  GitBranch,
  Globe,
  Mail,
  MapPin,
  Phone,
  Plus,
  X,
} from 'lucide-react';
import {
  formatCategoryLabel,
  formatTypeLabel,
  getRadarScores,
  InstitutionRecord,
  RADAR_AXES,
} from '../types/institution';

interface InstitutionMonographDrawerProps {
  institution: InstitutionRecord | null;
  allInstitutions: InstitutionRecord[];
  isPinned: boolean;
  onClose: () => void;
  onToggleCompare: (id: string) => void;
  onSelectProfile: (id: string) => void;
}

export const InstitutionMonographDrawer: React.FC<InstitutionMonographDrawerProps> = ({
  institution,
  allInstitutions,
  isPinned,
  onClose,
  onToggleCompare,
  onSelectProfile,
}) => {
  const [imgError, setImgError] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setImgError(false);
    setShowRawJson(false);
    setCopied(false);
  }, [institution?.id]);

  useEffect(() => {
    if (!institution) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [institution, onClose]);

  if (!institution) return null;

  const parentInst = institution.parent_institution_id
    ? allInstitutions.find((i) => i.id === institution.parent_institution_id) ?? null
    : null;

  const childCampuses = allInstitutions.filter(
    (i) => i.parent_institution_id === institution.id || i.main_institution_id === institution.id
  );

  const radarScores = getRadarScores(institution);

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(institution, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard fallback ignored safely
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-[#1C1917]/40 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="monograph-title"
      onClick={onClose}
    >
      <aside
        className="w-full max-w-3xl bg-[#FBF9F5] h-full overflow-y-auto border-l border-[#E5E0D8] shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Monograph Bar */}
        <div className="sticky top-0 z-10 bg-[#FBF9F5]/95 backdrop-blur-sm border-b border-[#E5E0D8] px-6 py-4 flex items-center justify-between gap-4">
          <div className="min-w-0 flex items-center gap-2 text-xs text-[#57534E]">
            <span className="font-mono tabular-nums text-[#1C1917] font-medium">
              {institution.registration_number ?? 'PENDING-REG'}
            </span>
            <span aria-hidden="true">·</span>
            <span>{formatTypeLabel(institution.type)}</span>
            {institution.category && (
              <>
                <span aria-hidden="true">·</span>
                <span>{institution.category}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onToggleCompare(institution.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                isPinned
                  ? 'bg-[#14532D] text-white border-[#14532D]'
                  : 'bg-white text-[#14532D] border-[#14532D]/40 hover:bg-[#14532D]/5'
              }`}
            >
              {isPinned ? (
                <>
                  <Check className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Pinned to Compare</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Pin to Compare</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close institution monograph"
              className="p-1.5 text-[#57534E] hover:text-[#1C1917] bg-white border border-[#E5E0D8] rounded-md transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Monograph Content Body */}
        <div className="p-6 md:p-8 space-y-8">
          {/* Campus Visual with Zero-Broken-Image Fallback */}
          <figure>
            <div className="aspect-[16/9] w-full rounded-lg overflow-hidden border border-[#E5E0D8] bg-[#F3EFE6]">
              {institution.cover_image_url && !imgError ? (
                <img
                  src={institution.cover_image_url}
                  alt={`${institution.name} campus architecture`}
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#F3EFE6] to-[#E5E0D8]">
                  <Building2 className="w-8 h-8 text-[#57534E] mb-2" aria-hidden="true" />
                  <p className="font-serif text-lg text-[#1C1917]">{institution.name}</p>
                  <p className="text-xs text-[#57534E] mt-1">
                    {institution.county} County · {institution.region} Region
                  </p>
                </div>
              )}
            </div>
            <figcaption className="mt-2 text-xs font-serif italic text-[#57534E]">
              Fig. — Institutional archive visual for {institution.name} ({institution.town},{' '}
              {institution.county} County).
            </figcaption>
          </figure>

          {/* Editorial Heading & Summary */}
          <div className="space-y-3 pb-6 border-b border-[#E5E0D8]">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#57534E]">
              <span className="capitalize font-medium text-[#1C1917]">{institution.ownership}</span>
              <span aria-hidden="true">·</span>
              <span className="capitalize">{institution.operational_status}</span>
              <span aria-hidden="true">·</span>
              <span>{formatCategoryLabel(institution.category)}</span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1">
                {institution.is_verified ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#14532D]" aria-hidden="true" />
                    <span className="text-[#14532D] font-medium">Record Verified</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-3.5 h-3.5 text-[#9A3412]" aria-hidden="true" />
                    <span className="text-[#9A3412] font-medium">Verification Pending</span>
                  </>
                )}
              </span>
            </div>

            <h2
              id="monograph-title"
              className="font-serif text-3xl font-semibold text-[#1C1917] leading-tight text-balance"
            >
              {institution.name}
            </h2>

            {institution.aliases && institution.aliases.length > 0 && (
              <p className="text-xs text-[#57534E]">
                Known aliases: <span className="text-[#1C1917]">{institution.aliases.join(' · ')}</span>
              </p>
            )}

            <p className="text-base leading-relaxed text-[#1C1917] pt-1">
              {institution.description}
            </p>
            {institution.about && (
              <p className="text-sm leading-relaxed text-[#57534E]">{institution.about}</p>
            )}

            {/* Parent / Constituent Campus Links */}
            {(parentInst || childCampuses.length > 0) && (
              <div className="pt-3 flex flex-wrap items-center gap-3 text-xs">
                {parentInst && (
                  <button
                    type="button"
                    onClick={() => onSelectProfile(parentInst.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E5E0D8] rounded hover:border-[#1E3A8A] text-[#1E3A8A] transition-colors cursor-pointer"
                  >
                    <GitBranch className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Parent Institution: {parentInst.name}</span>
                  </button>
                )}
                {childCampuses.map((child) => (
                  <button
                    key={child.id}
                    type="button"
                    onClick={() => onSelectProfile(child.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E5E0D8] rounded hover:border-[#14532D] text-[#14532D] transition-colors cursor-pointer"
                  >
                    <GitBranch className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Branch Campus: {child.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 6-Axis Quantitative Breakdown */}
          <section aria-label="Institutional metric breakdown" className="space-y-4">
            <div className="flex items-baseline justify-between">
              <h3 className="font-serif text-lg font-semibold text-[#1C1917]">
                Quantitative Evaluation &amp; Schema Scores
              </h3>
              <span className="text-xs font-mono tabular-nums text-[#57534E]">
                Enrollment: {institution.estimated_student_count?.toLocaleString() ?? 'N/A'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white border border-[#E5E0D8] rounded-lg p-5">
              {RADAR_AXES.map((axis) => {
                const value = radarScores[axis.key];
                return (
                  <div key={axis.key} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[#1C1917]">{axis.label}</span>
                      <span className="font-mono tabular-nums font-semibold text-[#14532D]">
                        {value}/100
                      </span>
                    </div>
                    <div className="h-2 w-full bg-[#F3EFE6] rounded-xs overflow-hidden">
                      <div
                        className="h-full bg-[#14532D]"
                        style={{ width: `${Math.min(100, value)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Accession & Provenance Definition List */}
          <section aria-label="Provenance and contact details" className="space-y-3">
            <h3 className="font-serif text-lg font-semibold text-[#1C1917]">
              Registry Provenance &amp; Geography
            </h3>
            <dl className="bg-white border border-[#E5E0D8] rounded-lg divide-y divide-[#E5E0D8] text-xs">
              <div className="grid grid-cols-3 gap-4 px-4 py-3">
                <dt className="text-[#57534E] font-medium">Location &amp; Address</dt>
                <dd className="col-span-2 text-[#1C1917] flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#57534E] shrink-0 mt-0.5" aria-hidden="true" />
                  <span>
                    {institution.location ?? institution.address} · {institution.town},{' '}
                    {institution.county} County ({institution.region} Region)
                    {institution.google_maps_data && (
                      <span className="block font-mono tabular-nums text-[#57534E] mt-0.5">
                        {institution.google_maps_data.lat.toFixed(4)},{' '}
                        {institution.google_maps_data.lng.toFixed(4)}
                      </span>
                    )}
                  </span>
                </dd>
              </div>
              <div className="grid grid-cols-3 gap-4 px-4 py-3">
                <dt className="text-[#57534E] font-medium">Contact Channels</dt>
                <dd className="col-span-2 text-[#1C1917] space-y-1">
                  {institution.website && (
                    <a
                      href={institution.website}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-[#14532D] hover:underline mr-4"
                    >
                      <Globe className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{institution.website}</span>
                      <ExternalLink className="w-3 h-3" aria-hidden="true" />
                    </a>
                  )}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[#57534E]">
                    {institution.email && (
                      <span className="inline-flex items-center gap-1">
                        <Mail className="w-3 h-3" aria-hidden="true" />
                        {institution.email}
                      </span>
                    )}
                    {institution.phone && (
                      <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                        <Phone className="w-3 h-3" aria-hidden="true" />
                        {institution.phone}
                      </span>
                    )}
                  </div>
                </dd>
              </div>
              <div className="grid grid-cols-3 gap-4 px-4 py-3">
                <dt className="text-[#57534E] font-medium">Accreditations</dt>
                <dd className="col-span-2 text-[#1C1917]">
                  {institution.accreditations.join(' · ')}
                </dd>
              </div>
              <div className="grid grid-cols-3 gap-4 px-4 py-3">
                <dt className="text-[#57534E] font-medium">Learning Modalities</dt>
                <dd className="col-span-2 text-[#1C1917] space-y-1">
                  <div>
                    E-Learning:{' '}
                    <strong>
                      {institution.has_elearning?.[0]?.enabled
                        ? `Active (${institution.has_elearning[0].platform ?? 'LMS'})`
                        : 'Not Listed'}
                    </strong>
                  </div>
                  <div>
                    Distance Learning:{' '}
                    <strong>
                      {institution.has_distance_learning?.[0]?.enabled
                        ? `Active (${institution.has_distance_learning[0].platform ?? 'ODeL'})`
                        : 'Not Listed'}
                    </strong>
                  </div>
                  <div>
                    Teaching Courses:{' '}
                    <strong>
                      {institution.has_teaching_courses?.[0]?.enabled
                        ? `Offered (${institution.has_teaching_courses[0].program_count ?? 'Yes'} programs)`
                        : 'Not Offered'}
                    </strong>
                  </div>
                </dd>
              </div>
              <div className="grid grid-cols-3 gap-4 px-4 py-3">
                <dt className="text-[#57534E] font-medium">Data Source &amp; Sync</dt>
                <dd className="col-span-2 text-[#1C1917]">
                  {institution.data_source} ·{' '}
                  <span className="font-mono">{institution.sync_status}</span>
                </dd>
              </div>
            </dl>
          </section>

          {/* Courses Catalog Table */}
          {institution.courses.length > 0 && (
            <section aria-label="Sampled accredited courses" className="space-y-3">
              <h3 className="font-serif text-lg font-semibold text-[#1C1917]">
                Accredited Programs &amp; Courses ({institution.courses.length})
              </h3>
              <div className="bg-white border border-[#E5E0D8] rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F3EFE6]/70 border-b border-[#E5E0D8] text-[#57534E]">
                      <th className="py-2.5 px-3 font-medium">Code</th>
                      <th className="py-2.5 px-3 font-medium">Program Title</th>
                      <th className="py-2.5 px-3 font-medium">Level</th>
                      <th className="py-2.5 px-3 font-medium">Duration</th>
                      <th className="py-2.5 px-3 font-medium">Modality</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E0D8]">
                    {institution.courses.map((course) => (
                      <tr key={`${course.code}-${course.title}`}>
                        <td className="py-2.5 px-3 font-mono text-[#57534E] whitespace-nowrap">
                          {course.code}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-[#1C1917]">{course.title}</td>
                        <td className="py-2.5 px-3 text-[#57534E] whitespace-nowrap">{course.level}</td>
                        <td className="py-2.5 px-3 font-mono tabular-nums text-[#57534E] whitespace-nowrap">
                          {course.duration}
                        </td>
                        <td className="py-2.5 px-3 text-[#14532D] whitespace-nowrap">{course.modality}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Facilities, Campuses & Verified Fields Audit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white border border-[#E5E0D8] rounded-lg p-4 space-y-2.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#57534E]">
                Campus Facilities ({institution.facilities.length})
              </h4>
              <ul className="space-y-1.5 text-xs text-[#1C1917]">
                {institution.facilities.map((fac) => (
                  <li key={fac} className="leading-relaxed">
                    — {fac}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white border border-[#E5E0D8] rounded-lg p-4 space-y-2.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#57534E]">
                Verified Fields (<code className="font-mono">verified_fields_jsonb</code>)
              </h4>
              <p className="text-xs text-[#1C1917] font-mono leading-relaxed">
                {institution.verified_fields_jsonb.join(', ')}
              </p>
              <div className="pt-2 border-t border-[#E5E0D8]">
                <h5 className="text-xs font-semibold uppercase tracking-wider text-[#57534E] mb-1.5">
                  Indexed Campuses ({institution.campuses.length})
                </h5>
                <ul className="space-y-1 text-xs text-[#57534E]">
                  {institution.campuses.map((c) => (
                    <li key={c.name}>
                      <span className="text-[#1C1917] font-medium">{c.name}</span> · {c.county}
                      {c.is_main ? ' (Main)' : ''}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Collapsible Schema Record Inspector */}
          <div className="border border-[#E5E0D8] rounded-lg bg-white overflow-hidden">
            <div className="px-4 py-3 flex items-center justify-between bg-[#F3EFE6]/50">
              <button
                type="button"
                onClick={() => setShowRawJson((prev) => !prev)}
                className="inline-flex items-center gap-2 text-xs font-medium text-[#1C1917] cursor-pointer"
              >
                {showRawJson ? (
                  <ChevronUp className="w-4 h-4 text-[#57534E]" aria-hidden="true" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#57534E]" aria-hidden="true" />
                )}
                <span>Inspect Raw <code className="font-mono">public.institutions</code> Record</span>
              </button>
              <button
                type="button"
                onClick={handleCopyJson}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#57534E] hover:text-[#1C1917] border border-[#E5E0D8] rounded bg-white cursor-pointer"
              >
                <Copy className="w-3 h-3" aria-hidden="true" />
                <span>{copied ? 'Copied' : 'Copy JSON'}</span>
              </button>
            </div>
            {showRawJson && (
              <pre className="p-4 text-[11px] font-mono text-[#1C1917] bg-[#FBF9F5] border-t border-[#E5E0D8] overflow-x-auto max-h-80 leading-relaxed">
                {JSON.stringify(institution, null, 2)}
              </pre>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
};
