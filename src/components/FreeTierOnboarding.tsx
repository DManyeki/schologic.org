import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ArrowRight, KeyRound } from 'lucide-react';
import { type PublicInstitution, formatTypeLabel } from '../types/institution';

interface Props {
  institutions: PublicInstitution[];
}

const TOOL_MODULES = [
  {
    id: 'class-manager',
    label: 'Class Manager',
    summary: 'Units, cohorts, attendance & gradebook oversight',
  },
  {
    id: 'oer-reader',
    label: 'OER Library & Universal Reader',
    summary: 'Zero-cost open textbooks packaged for mobile & labs',
  },
  {
    id: 'ai-assistant',
    label: 'AI Assistant & Advisory Detection',
    summary: 'Rubric feedback support + fair academic integrity signals',
  },
  {
    id: 'practicum',
    label: 'Practicum Manager',
    summary: 'TVET industrial attachments, clinical rotations & teaching practice logs',
  },
] as const;

export default function FreeTierOnboarding({ institutions }: Props) {
  const [selectedSlug, setSelectedSlug] = useState<string>(institutions[0]?.slug ?? '');
  const [role, setRole] = useState<'instructor' | 'practicum' | 'department'>('instructor');
  const [email, setEmail] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [selectedTools, setSelectedTools] = useState<string[]>([
    'class-manager',
    'oer-reader',
    'practicum',
  ]);
  const [provisionedSummary, setProvisionedSummary] = useState<{
    host: string;
    institutionName: string;
    email: string;
    role: string;
    tools: string[];
  } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const campusParam = new URLSearchParams(window.location.search).get('campus');
    if (campusParam && institutions.some((i) => i.slug === campusParam)) {
      setSelectedSlug(campusParam);
    }
  }, [institutions]);

  const selectedInst = useMemo(
    () => institutions.find((i) => i.slug === selectedSlug) ?? institutions[0],
    [institutions, selectedSlug]
  );

  const portalHost =
    selectedInst?.custom_portal_domain ??
    selectedInst?.portal_subdomain ??
    `${selectedInst?.slug ?? 'yourcampus'}.schologic.org`;

  const toggleTool = (id: string) => {
    setSelectedTools((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInst) return;
    setProvisionedSummary({
      host: portalHost,
      institutionName: selectedInst.name,
      email,
      role,
      tools: selectedTools,
    });
  };

  if (provisionedSummary) {
    return (
      <div className="border border-forest bg-paper p-6 sm:p-8 space-y-5 max-w-2xl">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-6 h-6 text-forest shrink-0 mt-0.5" />
          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest text-forest font-semibold">
              Free-Tier Workspace Ready (Preview)
            </p>
            <h2 className="font-serif text-2xl font-semibold text-ink mt-1">
              {provisionedSummary.host}
            </h2>
          </div>
        </div>

        <p className="text-sm text-muted leading-relaxed">
          Your free-tier practitioner setup for{' '}
          <strong className="text-ink">{provisionedSummary.institutionName}</strong> (
          <span className="font-mono text-ink">{provisionedSummary.email}</span>) has been
          configured with {provisionedSummary.tools.length} active modules. Students join using
          your cohort link with zero textbook fees.
        </p>

        <div className="border border-hairline bg-limestone/35 p-4 text-xs space-y-1.5">
          <div className="font-mono uppercase tracking-wider text-muted">
            Selected Capabilities
          </div>
          <ul className="space-y-1 text-ink">
            {provisionedSummary.tools.map((t) => {
              const mod = TOOL_MODULES.find((m) => m.id === t);
              return <li key={t}>· {mod?.label ?? t}</li>;
            })}
          </ul>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <a
            href="/login"
            className="px-4 py-2.5 bg-forest text-paper text-xs font-semibold hover:bg-ink transition-colors"
          >
            Continue to Login
          </a>
          <button
            type="button"
            onClick={() => setProvisionedSummary(null)}
            className="px-4 py-2.5 border border-hairline bg-paper text-ink text-xs font-semibold hover:border-ink cursor-pointer"
          >
            Configure Another Campus
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-hairline bg-paper p-6 sm:p-8 space-y-6"
    >
      <div className="pb-4 border-b border-hairline">
        <p className="font-mono text-[11px] uppercase tracking-widest text-forest font-semibold flex items-center gap-1.5">
          <KeyRound className="w-3.5 h-3.5" />
          Instant Free-Tier Subdomain Setup
        </p>
        <h2 className="font-serif text-2xl font-semibold text-ink mt-1">
          Provision Your Course or Practicum Workspace
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
        <div>
          <label htmlFor="onboard-inst" className="block font-medium text-ink mb-1.5">
            1. Select Kenyan Institution
          </label>
          <select
            id="onboard-inst"
            value={selectedSlug}
            onChange={(e) => setSelectedSlug(e.target.value)}
            className="w-full px-3 py-2.5 border border-hairline bg-paper text-ink text-sm focus:outline-none focus:border-forest"
          >
            {institutions.map((inst) => (
              <option key={inst.slug} value={inst.slug}>
                {inst.name} ({formatTypeLabel(inst.type)} · {inst.county})
              </option>
            ))}
          </select>
          <p className="mt-1.5 font-mono text-[11px] text-muted">
            Assigned endpoint: <span className="text-forest font-semibold">{portalHost}</span>
          </p>
        </div>

        <div>
          <label htmlFor="onboard-email" className="block font-medium text-ink mb-1.5">
            2. Academic / Institutional Email
          </label>
          <input
            id="onboard-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="lecturer@campus.ac.ke"
            className="w-full px-3 py-2.5 border border-hairline bg-paper text-ink text-sm focus:outline-none focus:border-forest"
          />
          <p className="mt-1.5 text-xs text-muted">
            Cookieless workspace · No procurement review required for individual units.
          </p>
        </div>

        <div>
          <label htmlFor="onboard-role" className="block font-medium text-ink mb-1.5">
            3. Practitioner Role
          </label>
          <select
            id="onboard-role"
            value={role}
            onChange={(e) => setRole(e.target.value as 'instructor' | 'practicum' | 'department')}
            className="w-full px-3 py-2.5 border border-hairline bg-paper text-ink text-sm focus:outline-none focus:border-forest"
          >
            <option value="instructor">Lecturer / Instructor</option>
            <option value="practicum">Practicum / Attachment / Clinical Supervisor</option>
            <option value="department">Head of Department / Unit Coordinator</option>
          </select>
        </div>

        <div>
          <label htmlFor="onboard-course" className="block font-medium text-ink mb-1.5">
            4. Initial Unit or Cohort Code (Optional)
          </label>
          <input
            id="onboard-course"
            type="text"
            value={courseCode}
            onChange={(e) => setCourseCode(e.target.value)}
            placeholder="e.g. DIP-CM-2026 or BSc-ICS-301"
            className="w-full px-3 py-2.5 border border-hairline bg-paper text-ink text-sm focus:outline-none focus:border-forest"
          />
        </div>
      </div>

      <div className="space-y-2.5 pt-2 border-t border-hairline">
        <span className="block text-sm font-medium text-ink">
          5. Enable Free-Tier Capabilities
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TOOL_MODULES.map((mod) => {
            const checked = selectedTools.includes(mod.id);
            return (
              <label
                key={mod.id}
                className={`border p-3.5 cursor-pointer flex items-start gap-2.5 transition-colors ${
                  checked
                    ? 'border-forest bg-forest/[0.04]'
                    : 'border-hairline bg-limestone/25 hover:border-ink/40'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleTool(mod.id)}
                  className="mt-1 accent-forest"
                />
                <div className="text-xs">
                  <span className="font-semibold text-ink block">{mod.label}</span>
                  <span className="text-muted">{mod.summary}</span>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      <div className="pt-3 border-t border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-xs text-muted">
          Institution-wide deployment with custom domains?{' '}
          <a
            href="https://schologic.com/demo"
            target="_blank"
            rel="noopener noreferrer"
            className="text-lapis underline"
          >
            Apply on schologic.com/demo
          </a>
          .
        </p>

        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-forest text-paper text-sm font-semibold hover:bg-ink transition-colors cursor-pointer whitespace-nowrap"
        >
          Activate {portalHost}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
}
