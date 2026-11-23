import fullRaw from './institutionsFull.json';
import curatedRaw from './institutionsCurated.json';
import {
  type PublicInstitution,
  type PublicInstitutionSummary,
  slugifyCounty,
} from '../types/institution';

export const PUBLIC_INSTITUTIONS: PublicInstitution[] = fullRaw as PublicInstitution[];
export const CURATED_INSTITUTION_SUMMARIES: PublicInstitutionSummary[] =
  curatedRaw as PublicInstitutionSummary[];

export interface CountyDirectoryEntry {
  county: string;
  countySlug: string;
  region: string;
  institutions: PublicInstitution[];
  totalEnrollment: number;
  verifiedCount: number;
}

export const KENYA_47_COUNTIES: Array<{ county: string; region: string }> = [
  { county: 'Baringo', region: 'Rift Valley' },
  { county: 'Bomet', region: 'Rift Valley' },
  { county: 'Bungoma', region: 'Western' },
  { county: 'Busia', region: 'Western' },
  { county: 'Elgeyo-Marakwet', region: 'Rift Valley' },
  { county: 'Embu', region: 'Eastern' },
  { county: 'Garissa', region: 'North Eastern' },
  { county: 'Homa Bay', region: 'Nyanza' },
  { county: 'Isiolo', region: 'Eastern' },
  { county: 'Kajiado', region: 'Rift Valley' },
  { county: 'Kakamega', region: 'Western' },
  { county: 'Kericho', region: 'Rift Valley' },
  { county: 'Kiambu', region: 'Central' },
  { county: 'Kilifi', region: 'Coast' },
  { county: 'Kirinyaga', region: 'Central' },
  { county: 'Kisii', region: 'Nyanza' },
  { county: 'Kisumu', region: 'Nyanza' },
  { county: 'Kitui', region: 'Eastern' },
  { county: 'Kwale', region: 'Coast' },
  { county: 'Laikipia', region: 'Rift Valley' },
  { county: 'Lamu', region: 'Coast' },
  { county: 'Machakos', region: 'Eastern' },
  { county: 'Makueni', region: 'Eastern' },
  { county: 'Mandera', region: 'North Eastern' },
  { county: 'Marsabit', region: 'Eastern' },
  { county: 'Meru', region: 'Eastern' },
  { county: 'Migori', region: 'Nyanza' },
  { county: 'Mombasa', region: 'Coast' },
  { county: "Murang'a", region: 'Central' },
  { county: 'Nairobi', region: 'Nairobi' },
  { county: 'Nakuru', region: 'Rift Valley' },
  { county: 'Nandi', region: 'Rift Valley' },
  { county: 'Narok', region: 'Rift Valley' },
  { county: 'Nyamira', region: 'Nyanza' },
  { county: 'Nyandarua', region: 'Central' },
  { county: 'Nyeri', region: 'Central' },
  { county: 'Samburu', region: 'Rift Valley' },
  { county: 'Siaya', region: 'Nyanza' },
  { county: 'Taita-Taveta', region: 'Coast' },
  { county: 'Tana River', region: 'Coast' },
  { county: 'Tharaka-Nithi', region: 'Eastern' },
  { county: 'Trans Nzoia', region: 'Rift Valley' },
  { county: 'Turkana', region: 'Rift Valley' },
  { county: 'Uasin Gishu', region: 'Rift Valley' },
  { county: 'Vihiga', region: 'Western' },
  { county: 'Wajir', region: 'North Eastern' },
  { county: 'West Pokot', region: 'Rift Valley' },
];

export function getInstitutionBySlug(slug: string): PublicInstitution | undefined {
  return PUBLIC_INSTITUTIONS.find((inst) => inst.slug === slug);
}

export function getIndexedCounties(): CountyDirectoryEntry[] {
  const grouped = new Map<string, PublicInstitution[]>();
  for (const inst of PUBLIC_INSTITUTIONS) {
    const existing = grouped.get(inst.county) ?? [];
    existing.push(inst);
    grouped.set(inst.county, existing);
  }

  return Array.from(grouped.entries())
    .map(([county, list]) => ({
      county,
      countySlug: slugifyCounty(county),
      region: list[0]?.region ?? 'Kenya',
      institutions: list,
      totalEnrollment: list.reduce((sum, i) => sum + i.estimated_student_count, 0),
      verifiedCount: list.filter((i) => i.is_verified).length,
    }))
    .sort((a, b) => b.institutions.length - a.institutions.length);
}
