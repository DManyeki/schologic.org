export type InstitutionType = 'university' | 'tvet' | 'kmtc';
export type TvetCategory = 'NP' | 'TVC' | 'VTC';
export type OwnershipType = 'public' | 'private';
export type ModalityStatus = 'verified' | 'implied' | 'none';
export type VerificationStatus = 'verified' | 'flagged' | 'unverified';

export interface CourseItem {
  code: string;
  title: string;
  level:
    | 'Doctorate'
    | 'Masters'
    | 'Bachelors'
    | 'Higher Diploma'
    | 'Diploma'
    | 'Certificate'
    | 'Artisan';
  duration: string;
  modality: 'Full-Time' | 'E-Learning' | 'Distance' | 'Evening / Weekend';
  exam_body?: string;
}

export interface CampusItem {
  name: string;
  town: string;
  county: string;
  is_main: boolean;
}

export interface AffiliationItem {
  body: string;
  role: string;
}

export interface SocialMediaLink {
  platform: 'X' | 'LinkedIn' | 'Facebook' | 'YouTube' | 'Instagram';
  handle: string;
  url: string;
}

export interface PublicGeoPoint {
  lat: number;
  lng: number;
  place_name: string;
}

export interface RankingScores {
  registry_standing: number;
  curriculum_depth: number;
  digital_readiness: number;
  facilities_footprint: number;
  practicum_alignment: number;
  composite: number;
}

/**
 * Sanitized public projection for schologic.org (equivalent to a SQL VIEW
 * filtered by duplicate_of IS NULL AND operational_status = 'active').
 * Strictly excludes personal_contacts PII and internal ETL/staging metadata.
 */
export interface PublicInstitution {
  id: string;
  slug: string;
  portal_subdomain: string | null;
  custom_portal_domain: string | null;
  name: string;
  aliases: string[];
  registration_number: string | null;
  type: InstitutionType;
  category: TvetCategory | null;
  ownership: OwnershipType;
  county: string;
  region: string;
  town: string;
  location: string;
  geo: PublicGeoPoint | null;
  map_x: number;
  map_y: number;
  has_exact_geo: boolean;
  google_maps_url: string;
  has_verified_maps_url: boolean;
  website: string | null;
  email: string | null;
  phone: string | null;
  logo_url: string | null;
  description: string;
  about: string;
  founded_year: number | null;
  charter_year: number | null;
  faculty_student_ratio: string | null;
  estimated_student_count: number;
  flagship_disciplines: string[];
  facilities: string[];
  accreditations: string[];
  courses: CourseItem[];
  total_courses_count: number;
  campuses: CampusItem[];
  affiliation: AffiliationItem[];
  elearning_status: ModalityStatus;
  elearning_notes: string;
  distance_status: ModalityStatus;
  distance_notes: string;
  teaching_enabled: boolean;
  teaching_notes: string;
  social_media: SocialMediaLink[];
  is_verified: boolean;
  verification_status: VerificationStatus;
  research_score: number;
  health_score: number;
  ranking_scores: RankingScores;
}

/**
 * Compact client-side index record served from /data/institutions-index.json
 */
export interface PublicInstitutionSummary {
  id: string;
  slug: string;
  name: string;
  type: InstitutionType;
  category: TvetCategory | null;
  ownership: OwnershipType;
  county: string;
  region: string;
  town: string;
  location: string;
  logo_url: string | null;
  website: string | null;
  portal_subdomain: string | null;
  google_maps_url: string;
  has_verified_maps_url: boolean;
  map_x: number;
  map_y: number;
  has_exact_geo: boolean;
  registration_number: string | null;
  estimated_student_count: number;
  course_count: number;
  facility_count: number;
  accreditation_count: number;
  campus_count: number;
  elearning_status: ModalityStatus;
  distance_status: ModalityStatus;
  teaching_enabled: boolean;
  is_verified: boolean;
  verification_status: VerificationStatus;
  research_score: number;
  health_score: number;
  ranking_scores: RankingScores;
  description: string;
  disciplines: string[];
}

export type PublicRadarAxisKey =
  | 'curriculum_depth'
  | 'digital_learning'
  | 'practicum_readiness'
  | 'campus_facilities'
  | 'regional_footprint'
  | 'registry_standing';

export interface PublicRadarAxisMeta {
  key: PublicRadarAxisKey;
  label: string;
  shortLabel: string;
  description: string;
}

export const PUBLIC_RADAR_AXES: PublicRadarAxisMeta[] = [
  {
    key: 'curriculum_depth',
    label: 'Program & Course Depth',
    shortLabel: 'Programs',
    description:
      'Diversity of catalogued qualifications across degree, higher diploma, diploma, certificate, and artisan tracks.',
  },
  {
    key: 'digital_learning',
    label: 'Digital & ODeL Readiness',
    shortLabel: 'Digital',
    description:
      'Verified or implied e-learning platforms, distance-learning centres, official web presence, and Schologic LMS portals.',
  },
  {
    key: 'practicum_readiness',
    label: 'Practicum & Clinical Focus',
    shortLabel: 'Practicum',
    description:
      'Strength of teaching practice, KMTC hospital clinical rotations, or CBET/NITA technical attachments.',
  },
  {
    key: 'campus_facilities',
    label: 'Facilities & Labs',
    shortLabel: 'Facilities',
    description:
      'Indexed libraries, research centres, specialized laboratories, and practical engineering workshops.',
  },
  {
    key: 'regional_footprint',
    label: 'Campus Footprint',
    shortLabel: 'Campuses',
    description:
      'Multi-campus network reach, distance delivery coverage, and institutional affiliations across Kenya.',
  },
  {
    key: 'registry_standing',
    label: 'Accreditation Standing',
    shortLabel: 'Accredited',
    description:
      'Verified registration with CUE, TVETA, Ministry of Health, and overall registry completeness.',
  },
];

export const SERIES_PALETTE = [
  {
    name: 'Forest Ink',
    hex: '#14532D',
    fill: 'rgba(20, 83, 45, 0.16)',
    dash: undefined,
  },
  {
    name: 'Deep Lapis',
    hex: '#1E3A8A',
    fill: 'rgba(30, 58, 138, 0.14)',
    dash: '6 3',
  },
  {
    name: 'Warm Terracotta',
    hex: '#9A3412',
    fill: 'rgba(154, 52, 18, 0.14)',
    dash: '2 3',
  },
  {
    name: 'Burnished Bronze',
    hex: '#92400E',
    fill: 'rgba(146, 64, 14, 0.14)',
    dash: '8 3 2 3',
  },
] as const;

export function getPublicRadarScores(
  inst: PublicInstitution | PublicInstitutionSummary
): Record<PublicRadarAxisKey, number> {
  const rs = inst.ranking_scores;
  const campusCount = 'campuses' in inst ? inst.campuses.length : inst.campus_count;
  const distBonus = inst.distance_status === 'verified' ? 24 : inst.distance_status === 'implied' ? 12 : 0;
  const regional_footprint = Math.min(100, 26 + campusCount * 14 + distBonus);

  return {
    curriculum_depth: rs.curriculum_depth,
    digital_learning: rs.digital_readiness,
    practicum_readiness: rs.practicum_alignment,
    campus_facilities: rs.facilities_footprint,
    regional_footprint,
    registry_standing: rs.registry_standing,
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
      return 'Chartered / Statutory Institution';
  }
}

export function slugifyCounty(county: string): string {
  return county
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
