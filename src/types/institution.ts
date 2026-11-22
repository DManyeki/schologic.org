export type InstitutionType = 'university' | 'tvet' | 'kmtc';
export type TvetCategory = 'NP' | 'TVC' | 'VTC';
export type OwnershipType = 'public' | 'private';

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
  website: string | null;
  email: string | null;
  phone: string | null;
  cover_image_url: string;
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
  campuses: CampusItem[];
  affiliation: AffiliationItem[];
  has_elearning: ModalityRecord[];
  has_distance_learning: ModalityRecord[];
  has_teaching_courses: ModalityRecord[];
  social_media: SocialMediaLink[];
  is_verified: boolean;
  parent_institution_slug: string | null;
  parent_institution_name: string | null;
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
    description: 'Diversity of catalogued qualifications across degree, higher diploma, diploma, and certificate tracks.',
  },
  {
    key: 'digital_learning',
    label: 'Digital & ODeL Readiness',
    shortLabel: 'Digital',
    description: 'Active e-learning platforms, distance-learning centres, and virtual course availability.',
  },
  {
    key: 'practicum_readiness',
    label: 'Practicum & Clinical Focus',
    shortLabel: 'Practicum',
    description: 'Strength of teaching practice, hospital clinical rotations, or technical workshop attachments.',
  },
  {
    key: 'campus_facilities',
    label: 'Facilities & Labs',
    shortLabel: 'Facilities',
    description: 'Indexed libraries, research centres, specialized laboratories, and practical studios.',
  },
  {
    key: 'regional_footprint',
    label: 'Campus Footprint',
    shortLabel: 'Campuses',
    description: 'Multi-campus presence, county coverage, and hybrid delivery reach across Kenya.',
  },
  {
    key: 'registry_standing',
    label: 'Accreditation Standing',
    shortLabel: 'Accredited',
    description: 'Verified registration with CUE, TVETA, Ministry of Health, and professional statutory boards.',
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

export function getPublicRadarScores(inst: PublicInstitution): Record<PublicRadarAxisKey, number> {
  const levels = new Set(inst.courses.map((c) => c.level));
  const curriculum_depth = Math.min(100, 42 + inst.courses.length * 10 + levels.size * 6);

  const hasE = inst.has_elearning?.[0]?.enabled ? 38 : 0;
  const eCount = Math.min(34, (inst.has_elearning?.[0]?.program_count ?? 0) * 0.6);
  const hasD = inst.has_distance_learning?.[0]?.enabled ? 22 : 0;
  const digital_learning = Math.min(100, Math.round(20 + hasE + eCount + hasD));

  const hasTeaching = inst.has_teaching_courses?.[0]?.enabled ? 28 : 0;
  const typePracticumBonus = inst.type === 'kmtc' ? 42 : inst.type === 'tvet' ? 36 : 18;
  const facilityPracticum = Math.min(26, inst.facilities.length * 5);
  const practicum_readiness = Math.min(100, 14 + hasTeaching + typePracticumBonus + facilityPracticum);

  const campus_facilities = Math.min(100, 38 + inst.facilities.length * 11);

  const uniqueCounties = new Set(inst.campuses.map((c) => c.county)).size;
  const regional_footprint = Math.min(
    100,
    30 + inst.campuses.length * 11 + uniqueCounties * 8 + (inst.has_distance_learning?.[0]?.enabled ? 12 : 0)
  );

  const registry_standing = Math.min(
    100,
    (inst.is_verified ? 52 : 25) + inst.accreditations.length * 11 + (inst.registration_number ? 8 : 0)
  );

  return {
    curriculum_depth,
    digital_learning,
    practicum_readiness,
    campus_facilities,
    regional_footprint,
    registry_standing,
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
      return 'Chartered Institution';
  }
}

export function slugifyCounty(county: string): string {
  return county
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
