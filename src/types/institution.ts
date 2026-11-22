export type InstitutionType = 'university' | 'tvet' | 'kmtc';
export type TvetCategory = 'NP' | 'TVC' | 'VTC';
export type OwnershipType = 'public' | 'private';
export type OperationalStatus = 'active' | 'inactive' | 'pending';
export type SyncStatus = 'not synced' | 'synced';

export interface CourseItem {
  code: string;
  title: string;
  level: 'Doctorate' | 'Masters' | 'Bachelors' | 'Higher Diploma' | 'Diploma' | 'Certificate' | 'Artisan';
  duration: string;
  modality: 'Full-Time' | 'E-Learning' | 'Distance' | 'Evening / Weekend';
}

export interface CampusItem {
  name: string;
  town: string;
  county: string;
  is_main: boolean;
}

export interface ModalityRecord {
  enabled: boolean;
  platform?: string;
  program_count?: number;
  notes?: string;
}

export interface ResearchDimensions {
  program_breadth: number;
  digital_readiness: number;
  facility_capacity: number;
  verification_integrity: number;
}

export interface ResearchDataPayload {
  charter_year?: number;
  founded_year?: number;
  faculty_student_ratio?: string;
  flagship_disciplines: string[];
  annual_publications_estimate?: number;
  industry_partners_count?: number;
  dimensions: ResearchDimensions;
}

export interface GoogleMapsData {
  lat: number;
  lng: number;
  place_name: string;
}

export interface AffiliationItem {
  body: string;
  role: string;
}

export interface ProfileSummaryPoint {
  label: string;
  detail: string;
}

export interface InstitutionRecord {
  id: string;
  name: string;
  aliases: string[] | null;
  registration_number: string | null;
  type: InstitutionType;
  category: TvetCategory | null;
  ownership: OwnershipType | null;
  operational_status: OperationalStatus | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  county: string | null;
  region: string | null;
  town: string | null;
  address: string | null;
  location: string | null;
  google_maps_data: GoogleMapsData | null;
  description: string | null;
  about: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  facilities: string[];
  accreditations: string[];
  courses: CourseItem[];
  campuses: CampusItem[];
  has_elearning: ModalityRecord[];
  has_distance_learning: ModalityRecord[];
  has_teaching_courses: ModalityRecord[];
  data_source: string | null;
  source_url: string | null;
  is_verified: boolean;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
  estimated_student_count: number | null;
  health_score: number;
  research_score: number;
  parent_institution_id: string | null;
  main_institution_id: string | null;
  verified_fields_jsonb: string[];
  research_data: ResearchDataPayload;
  affiliation: AffiliationItem[];
  sync_status: SyncStatus;
  profile_summary: ProfileSummaryPoint[];
}

export type RadarAxisKey =
  | 'health_score'
  | 'research_score'
  | 'program_breadth'
  | 'digital_readiness'
  | 'facility_capacity'
  | 'verification_integrity';

export interface RadarAxisMeta {
  key: RadarAxisKey;
  label: string;
  shortLabel: string;
  description: string;
}

export const RADAR_AXES: RadarAxisMeta[] = [
  {
    key: 'health_score',
    label: 'Operational Health',
    shortLabel: 'Health',
    description: 'Schema health_score reflecting operational status, contact completeness, and record hygiene (0–100).',
  },
  {
    key: 'research_score',
    label: 'Research Output',
    shortLabel: 'Research',
    description: 'Schema research_score capturing scholarly citations, grants, and technical innovation activity (0–100).',
  },
  {
    key: 'program_breadth',
    label: 'Curriculum Breadth',
    shortLabel: 'Curriculum',
    description: 'Normalized index of accredited qualifications across degree, diploma, and trade tiers.',
  },
  {
    key: 'digital_readiness',
    label: 'Digital & E-Learning',
    shortLabel: 'Digital',
    description: 'Availability and depth of has_elearning, LMS platforms, and distance learning infrastructure.',
  },
  {
    key: 'facility_capacity',
    label: 'Facilities & Labs',
    shortLabel: 'Facilities',
    description: 'Physical laboratories, teaching hospitals, workshops, libraries, and multi-campus reach.',
  },
  {
    key: 'verification_integrity',
    label: 'Record Verification',
    shortLabel: 'Verified',
    description: 'Percentage of verified_fields_jsonb coverage and regulatory accreditation alignment.',
  },
];

export const SERIES_PALETTE = [
  {
    name: 'Forest Ink',
    hex: '#14532D',
    fill: 'rgba(20, 83, 45, 0.16)',
    borderClass: 'border-[#14532D]',
    textClass: 'text-[#14532D]',
    bgClass: 'bg-[#14532D]',
    dash: undefined,
  },
  {
    name: 'Deep Lapis',
    hex: '#1E3A8A',
    fill: 'rgba(30, 58, 138, 0.14)',
    borderClass: 'border-[#1E3A8A]',
    textClass: 'text-[#1E3A8A]',
    bgClass: 'bg-[#1E3A8A]',
    dash: '6 3',
  },
  {
    name: 'Warm Terracotta',
    hex: '#9A3412',
    fill: 'rgba(154, 52, 18, 0.14)',
    borderClass: 'border-[#9A3412]',
    textClass: 'text-[#9A3412]',
    bgClass: 'bg-[#9A3412]',
    dash: '2 3',
  },
  {
    name: 'Burnished Bronze',
    hex: '#92400E',
    fill: 'rgba(146, 64, 14, 0.14)',
    borderClass: 'border-[#92400E]',
    textClass: 'text-[#92400E]',
    bgClass: 'bg-[#92400E]',
    dash: '8 3 2 3',
  },
] as const;

export function getRadarScores(inst: InstitutionRecord): Record<RadarAxisKey, number> {
  return {
    health_score: inst.health_score ?? 0,
    research_score: inst.research_score ?? 0,
    program_breadth: inst.research_data?.dimensions?.program_breadth ?? 50,
    digital_readiness: inst.research_data?.dimensions?.digital_readiness ?? 45,
    facility_capacity: inst.research_data?.dimensions?.facility_capacity ?? 50,
    verification_integrity: inst.research_data?.dimensions?.verification_integrity ?? (inst.is_verified ? 85 : 40),
  };
}

export function formatTypeLabel(type: InstitutionType): string {
  switch (type) {
    case 'university':
      return 'University';
    case 'tvet':
      return 'TVET';
    case 'kmtc':
      return 'KMTC';
  }
}

export function formatCategoryLabel(category: TvetCategory | null): string {
  switch (category) {
    case 'NP':
      return 'National Polytechnic (NP)';
    case 'TVC':
      return 'Technical & Vocational College (TVC)';
    case 'VTC':
      return 'Vocational Training Center (VTC)';
    default:
      return 'Standard Chartered';
  }
}
