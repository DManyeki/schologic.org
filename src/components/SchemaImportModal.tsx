import React, { useEffect, useState } from 'react';
import { Download, Upload, X } from 'lucide-react';
import { InstitutionRecord } from '../types/institution';

interface SchemaImportModalProps {
  isOpen: boolean;
  institutions: InstitutionRecord[];
  onClose: () => void;
  onImportRecords: (records: InstitutionRecord[]) => void;
}

const SAMPLE_SNIPPET = `[
  {
    "name": "Kabarak University",
    "aliases": ["KABU"],
    "registration_number": "CUE/UNIV/PRIV/008-2008",
    "type": "university",
    "category": null,
    "ownership": "private",
    "operational_status": "active",
    "county": "Nakuru",
    "region": "Rift Valley",
    "town": "Nakuru",
    "description": "Chartered private Christian university along the Nakuru–Eldama Ravine corridor specializing in music, law, medicine, and IT.",
    "estimated_student_count": 12500,
    "health_score": 88,
    "research_score": 76,
    "is_verified": true
  }
]`;

export const SchemaImportModal: React.FC<SchemaImportModalProps> = ({
  isOpen,
  institutions,
  onClose,
  onImportRecords,
}) => {
  const [rawInput, setRawInput] = useState(SAMPLE_SNIPPET);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(institutions, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'kenya_institutions_export.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const parsed = JSON.parse(rawInput);
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      if (arr.length === 0) {
        setErrorMsg('Provide at least one institution JSON object.');
        return;
      }

      const normalized: InstitutionRecord[] = arr.map((item, idx) => {
        if (!item.name || !item.type) {
          throw new Error(`Row ${idx + 1} requires both "name" and "type" ('university' | 'tvet' | 'kmtc').`);
        }
        const typeNorm = String(item.type).trim().toLowerCase();
        if (!['university', 'tvet', 'kmtc'].includes(typeNorm)) {
          throw new Error(`Invalid type "${item.type}" in row ${idx + 1}. Must be university, tvet, or kmtc.`);
        }

        const catNorm = item.category ? String(item.category).trim().toUpperCase() : null;
        if (catNorm && !['NP', 'TVC', 'VTC'].includes(catNorm)) {
          throw new Error(`Invalid category "${item.category}" in row ${idx + 1}. Must be NP, TVC, or VTC.`);
        }

        const nowIso = new Date().toISOString();
        const health = typeof item.health_score === 'number' ? item.health_score : 75;
        const research = typeof item.research_score === 'number' ? item.research_score : 65;

        return {
          id: item.id ?? crypto.randomUUID(),
          name: String(item.name),
          aliases: Array.isArray(item.aliases) ? item.aliases : null,
          registration_number: item.registration_number ?? null,
          type: typeNorm as InstitutionRecord['type'],
          category: catNorm as InstitutionRecord['category'],
          ownership: (item.ownership ?? 'public') as InstitutionRecord['ownership'],
          operational_status: (item.operational_status ?? 'active') as InstitutionRecord['operational_status'],
          email: item.email ?? null,
          phone: item.phone ?? null,
          website: item.website ?? null,
          county: item.county ?? 'Nairobi',
          region: item.region ?? 'Nairobi',
          town: item.town ?? item.county ?? 'Nairobi',
          address: item.address ?? null,
          location: item.location ?? `${item.town ?? ''}, ${item.county ?? 'Kenya'}`,
          google_maps_data: item.google_maps_data ?? null,
          description: item.description ?? 'Imported Kenyan academic institution record.',
          about: item.about ?? null,
          logo_url: item.logo_url ?? null,
          cover_image_url: item.cover_image_url ?? null,
          facilities: Array.isArray(item.facilities) ? item.facilities : ['Central Library', 'Academic Block'],
          accreditations: Array.isArray(item.accreditations)
            ? item.accreditations
            : [typeNorm === 'university' ? 'CUE Chartered' : typeNorm === 'tvet' ? 'TVETA Licensed' : 'Ministry of Health'],
          courses: Array.isArray(item.courses) ? item.courses : [],
          campuses: Array.isArray(item.campuses)
            ? item.campuses
            : [{ name: 'Main Campus', town: item.town ?? 'Nairobi', county: item.county ?? 'Nairobi', is_main: true }],
          has_elearning: Array.isArray(item.has_elearning) ? item.has_elearning : [{ enabled: false }],
          has_distance_learning: Array.isArray(item.has_distance_learning) ? item.has_distance_learning : [{ enabled: false }],
          has_teaching_courses: Array.isArray(item.has_teaching_courses) ? item.has_teaching_courses : [{ enabled: false }],
          data_source: item.data_source ?? 'Manual JSON Schema Import',
          source_url: item.source_url ?? null,
          is_verified: Boolean(item.is_verified ?? false),
          verified_at: item.is_verified ? nowIso : null,
          created_at: item.created_at ?? nowIso,
          updated_at: item.updated_at ?? nowIso,
          estimated_student_count:
            typeof item.estimated_student_count === 'number' ? item.estimated_student_count : null,
          health_score: health,
          research_score: research,
          parent_institution_id: item.parent_institution_id ?? null,
          main_institution_id: item.main_institution_id ?? null,
          verified_fields_jsonb: Array.isArray(item.verified_fields_jsonb)
            ? item.verified_fields_jsonb
            : ['name', 'type', 'county'],
          research_data: item.research_data ?? {
            flagship_disciplines: ['General Studies'],
            dimensions: {
              program_breadth: Math.min(100, Math.round((health + research) / 2)),
              digital_readiness: 65,
              facility_capacity: 70,
              verification_integrity: item.is_verified ? 90 : 50,
            },
          },
          affiliation: Array.isArray(item.affiliation) ? item.affiliation : [],
          sync_status: item.sync_status === 'synced' ? 'synced' : 'not synced',
          profile_summary: Array.isArray(item.profile_summary) ? item.profile_summary : [],
        };
      });

      onImportRecords(normalized);
      setSuccessMsg(`Added ${normalized.length} schema-validated institution record(s) to the active index.`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Invalid JSON payload.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C1917]/40 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#FBF9F5] border border-[#E5E0D8] rounded-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 bg-white border-b border-[#E5E0D8] flex items-center justify-between">
          <div>
            <h3 id="import-modal-title" className="font-serif text-xl font-semibold text-[#1C1917]">
              Schema JSON Import &amp; Export
            </h3>
            <p className="text-xs text-[#57534E] mt-0.5">
              Compatible with <code className="font-mono">public.institutions</code> row exports.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-[#57534E] hover:text-[#1C1917] rounded-md border border-[#E5E0D8] cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleImportSubmit} className="p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E5E0D8]">
            <span className="text-xs text-[#57534E]">
              Export the current {institutions.length} indexed records or append new JSON rows below.
            </span>
            <button
              type="button"
              onClick={handleExportJson}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-[#E5E0D8] text-[#1C1917] rounded-md hover:bg-[#F3EFE6] transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Export Current JSON</span>
            </button>
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-[#1C1917]">
              Paste <code className="font-mono">public.institutions</code> JSON Array or Object
            </span>
            <textarea
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              rows={11}
              spellCheck={false}
              className="w-full p-3 text-xs font-mono bg-white border border-[#E5E0D8] rounded-md text-[#1C1917] focus:outline-none focus:border-[#14532D] leading-relaxed"
            />
          </label>

          {errorMsg && (
            <p role="alert" className="text-xs text-[#9A3412] bg-[#9A3412]/10 border border-[#9A3412]/25 rounded px-3 py-2">
              {errorMsg}
            </p>
          )}
          {successMsg && (
            <p role="status" className="text-xs text-[#14532D] bg-[#14532D]/10 border border-[#14532D]/25 rounded px-3 py-2">
              {successMsg}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#57534E] hover:text-[#1C1917] cursor-pointer"
            >
              Close
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-[#14532D] text-white rounded-md hover:bg-[#114224] transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Validate &amp; Append to Index</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
