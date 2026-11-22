import React, { useMemo, useState } from 'react';
import { BookOpen, Search, Type, Sun, Contrast, CheckCircle2 } from 'lucide-react';

interface OerResource {
  id: string;
  title: string;
  discipline: 'Engineering & TVET' | 'Health & KMTC' | 'Education & Practicum' | 'Computing & Data';
  level: string;
  license: string;
  chapters: number;
  alignedPrograms: string;
  excerptHeading: string;
  excerptBody: string;
  keyTakeaways: string[];
}

const OER_CATALOG: OerResource[] = [
  {
    id: 'oer-power-systems',
    title: 'Applied Electrical Power & Solar Microgrids for East Africa',
    discipline: 'Engineering & TVET',
    level: 'CBET Level 6 / BTech',
    license: 'CC BY 4.0',
    chapters: 14,
    alignedPrograms: 'Higher Diploma Electrical Power · EPRA Solar T3 · BSc Mechatronics',
    excerptHeading: 'Chapter 4: Sizing Off-Grid PV Arrays for Rural Technical Campuses',
    excerptBody:
      'Across Kenya’s arid and semi-arid counties, peak solar irradiance averages 5.2 to 6.1 kWh/m²/day. When designing campus workshop microgrids, engineers first separate inductive motor loads (lathes, compressors) from steady lighting and ICT lab demand to minimize inverter surge clipping and battery sulfation.',
    keyTakeaways: [
      'Derate photovoltaic output by 15% for ambient roof temperatures above 40°C.',
      'Apply 48V DC bus architecture for workshop installations exceeding 3 kWp.',
      'Document earthing continuity tests per Kenya Wiring Regulations (KS EAS 394).',
    ],
  },
  {
    id: 'oer-community-health',
    title: 'Primary Clinical Assessment & Community Health Practicum Manual',
    discipline: 'Health & KMTC',
    level: 'Diploma KRCHN / Clinical Medicine',
    license: 'CC BY-SA 4.0',
    chapters: 18,
    alignedPrograms: 'KMTC Diploma in Clinical Medicine · Community Health Nursing',
    excerptHeading: 'Module 7: Structured Maternal & Newborn Triage in Sub-County Hospitals',
    excerptBody:
      'Early recognition of obstetric danger signs during clinical rotations depends on standardized vitals documentation and clear SBAR handoffs between nursing students, clinical officers, and referral hospital consultants.',
    keyTakeaways: [
      'Record baseline respiratory rate, blood pressure, and fetal heart rate within 10 minutes of intake.',
      'Complete Practicum Manager supervisor sign-off immediately following ward round debrief.',
    ],
  },
  {
    id: 'oer-cbc-practicum',
    title: 'Competency-Based Pedagogy & Teaching Practice Portfolio Guide',
    discipline: 'Education & Practicum',
    level: 'BEd / Diploma in Education',
    license: 'CC BY 4.0',
    chapters: 11,
    alignedPrograms: 'BEd Science & Arts · Teacher Training Colleges (TSC Practicum)',
    excerptHeading: 'Unit 3: Designing Low-Cost Practical Science Lessons for Large Cohorts',
    excerptBody:
      'Effective teaching practice balances structured lesson observation rubrics with locally available lab materials. Student-teachers map each 40-minute lesson directly to competency outcomes and log reflective evidence for university assessors.',
    keyTakeaways: [
      'Prepare peer-group station cards when laboratory glassware ratio exceeds 1:6.',
      'Attach rubric-aligned learner artifacts to your semester practicum dossier.',
    ],
  },
  {
    id: 'oer-data-systems',
    title: 'Relational Databases, Spatial Indexing & Applied Statistics',
    discipline: 'Computing & Data',
    level: 'BSc Computer Science / ICT L6',
    license: 'CC BY 4.0',
    chapters: 16,
    alignedPrograms: 'BSc Informatics & Computer Science · Diploma in ICT',
    excerptHeading: 'Section 6: Full-Text Trigram Search for Institutional Registries',
    excerptBody:
      'When building public directories across multilingual campus names and aliases, combining PostgreSQL tsvector weighted ranking with pg_trgm trigram similarity ensures students retrieve accurate records even with abbreviated acronyms or spelling variants.',
    keyTakeaways: [
      'Weight institution names (A) above town/county metadata (B) and prose summaries (C).',
      'Project public views strictly to exclude personal contact PII.',
    ],
  },
];

export default function OerReaderShowcase() {
  const [query, setQuery] = useState('');
  const [discipline, setDiscipline] = useState<string>('All');
  const [selectedId, setSelectedId] = useState<string>(OER_CATALOG[0].id);
  const [readerTheme, setReaderTheme] = useState<'paper' | 'warm' | 'high-contrast'>('paper');
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return OER_CATALOG.filter((item) => {
      if (discipline !== 'All' && item.discipline !== discipline) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.alignedPrograms.toLowerCase().includes(q) ||
        item.discipline.toLowerCase().includes(q)
      );
    });
  }, [query, discipline]);

  const activeBook =
    OER_CATALOG.find((b) => b.id === selectedId) ?? filtered[0] ?? OER_CATALOG[0];

  const readerSurfaceClass =
    readerTheme === 'high-contrast'
      ? 'bg-ink text-paper border-ink'
      : readerTheme === 'warm'
        ? 'bg-limestone text-ink border-hairline'
        : 'bg-paper text-ink border-hairline';

  const readerMutedClass =
    readerTheme === 'high-contrast' ? 'text-paper/75' : 'text-muted';

  const readerProseSize =
    fontSize === 'lg' ? 'text-base sm:text-lg' : fontSize === 'sm' ? 'text-xs sm:text-sm' : 'text-sm sm:text-base';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left: OER Catalog Browser */}
      <div className="lg:col-span-5 space-y-4">
        <div className="border border-hairline bg-limestone/45 p-4 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search OER textbooks by subject or course..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-paper border border-hairline text-ink focus:outline-none focus:border-forest"
            />
          </div>

          <div className="flex flex-wrap gap-1.5 text-[11px]">
            {['All', 'Engineering & TVET', 'Health & KMTC', 'Education & Practicum', 'Computing & Data'].map(
              (cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setDiscipline(cat)}
                  className={`px-2.5 py-1 border cursor-pointer transition-colors ${
                    discipline === cat
                      ? 'bg-ink text-paper border-ink'
                      : 'bg-paper text-muted border-hairline hover:text-ink'
                  }`}
                >
                  {cat}
                </button>
              )
            )}
          </div>
        </div>

        <div className="space-y-3">
          {filtered.map((book) => {
            const active = activeBook.id === book.id;
            return (
              <button
                key={book.id}
                type="button"
                onClick={() => setSelectedId(book.id)}
                className={`w-full text-left border p-4 transition-colors cursor-pointer ${
                  active
                    ? 'border-forest bg-forest/[0.04]'
                    : 'border-hairline bg-paper hover:border-ink/40'
                }`}
              >
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted flex items-center justify-between gap-2">
                  <span>{book.discipline}</span>
                  <span className="text-forest font-semibold">{book.license}</span>
                </div>
                <h3 className="font-serif text-base font-semibold text-ink mt-1">
                  {book.title}
                </h3>
                <p className="text-xs text-muted mt-1">{book.alignedPrograms}</p>
                <div className="mt-2.5 pt-2 border-t border-hairline/70 flex items-center justify-between font-mono text-[11px] text-muted">
                  <span>{book.level}</span>
                  <span className="tabular-nums">{book.chapters} chapters</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: Universal Reader Interactive Surface */}
      <div className="lg:col-span-7 border border-hairline bg-paper">
        <div className="px-5 py-3.5 border-b border-hairline bg-limestone/45 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-ink">
            <BookOpen className="w-4 h-4 text-forest" />
            <span>Universal Reader Preview</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex border border-hairline bg-paper">
              <button
                type="button"
                onClick={() => setFontSize('sm')}
                className={`px-2 py-1 font-mono cursor-pointer ${fontSize === 'sm' ? 'bg-ink text-paper' : 'text-muted'}`}
                aria-label="Small reader text"
              >
                A-
              </button>
              <button
                type="button"
                onClick={() => setFontSize('base')}
                className={`px-2 py-1 font-mono cursor-pointer ${fontSize === 'base' ? 'bg-ink text-paper' : 'text-muted'}`}
                aria-label="Standard reader text"
              >
                <Type className="w-3.5 h-3.5 inline" />
              </button>
              <button
                type="button"
                onClick={() => setFontSize('lg')}
                className={`px-2 py-1 font-mono cursor-pointer ${fontSize === 'lg' ? 'bg-ink text-paper' : 'text-muted'}`}
                aria-label="Large reader text"
              >
                A+
              </button>
            </div>

            <div className="flex border border-hairline bg-paper">
              <button
                type="button"
                onClick={() => setReaderTheme('paper')}
                className={`px-2.5 py-1 cursor-pointer ${readerTheme === 'paper' ? 'bg-ink text-paper' : 'text-muted'}`}
                title="Archival Paper"
              >
                <Sun className="w-3.5 h-3.5 inline" />
              </button>
              <button
                type="button"
                onClick={() => setReaderTheme('warm')}
                className={`px-2.5 py-1 cursor-pointer ${readerTheme === 'warm' ? 'bg-ink text-paper' : 'text-muted'}`}
                title="Warm Limestone"
              >
                Sepia
              </button>
              <button
                type="button"
                onClick={() => setReaderTheme('high-contrast')}
                className={`px-2.5 py-1 cursor-pointer ${readerTheme === 'high-contrast' ? 'bg-ink text-paper' : 'text-muted'}`}
                title="High Contrast"
              >
                <Contrast className="w-3.5 h-3.5 inline" />
              </button>
            </div>
          </div>
        </div>

        <article className={`p-6 sm:p-8 space-y-5 transition-colors border-t ${readerSurfaceClass}`}>
          <div className="space-y-1.5">
            <p className={`font-mono text-[11px] uppercase tracking-widest ${readerMutedClass}`}>
              {activeBook.title} · {activeBook.license}
            </p>
            <h3 className="font-serif text-xl sm:text-2xl font-semibold leading-snug">
              {activeBook.excerptHeading}
            </h3>
          </div>

          <p className={`leading-relaxed ${readerProseSize}`}>
            {activeBook.excerptBody}
          </p>

          <div className="pt-4 border-t border-current/15 space-y-2">
            <p className={`font-mono text-[11px] uppercase tracking-wider ${readerMutedClass}`}>
              Key Syllabus Checkpoints
            </p>
            <ul className="space-y-1.5 text-xs sm:text-sm">
              {activeBook.keyTakeaways.map((point) => (
                <li key={point} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-forest" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-4 border-t border-current/15 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className={readerMutedClass}>
              Free inside any active <code className="font-mono">*.schologic.org</code> campus portal
            </span>
            <a
              href="/login"
              className="font-semibold text-forest hover:underline"
            >
              Sign In to Access Full Library →
            </a>
          </div>
        </article>
      </div>
    </div>
  );
}
