import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  MessageSquareText,
  X,
  Send,
  ArrowUpRight,
  GitCompare,
  Sparkles,
  RotateCcw,
  ExternalLink,
} from 'lucide-react';
import {
  type PublicInstitutionSummary,
  formatTypeLabel,
} from '../types/institution';
import { useInstitutionsIndex } from '../lib/institutionClientIndex';
import InstitutionLogo from './InstitutionLogo';

interface Props {
  initialInstitutions: PublicInstitutionSummary[];
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  matchedSlugs?: string[];
  suggestedCompareUrl?: string;
}

const SUGGESTED_PROMPTS = [
  'Public universities with accredited engineering or computer science',
  'KMTC campuses outside Nairobi with clinical nursing tracks',
  'National Polytechnics offering CBET diplomas',
  'Institutions with e-learning and Schologic LMS readiness',
];

function runDiscoveryQuery(
  rawQuery: string,
  institutions: PublicInstitutionSummary[]
): { summary: string; matches: PublicInstitutionSummary[] } {
  const q = rawQuery.toLowerCase().trim();
  const tokens = q
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(
      (t) =>
        t.length > 2 &&
        ![
          'with',
          'and',
          'for',
          'the',
          'that',
          'from',
          'which',
          'outside',
          'show',
          'find',
          'kenya',
          'kenyan',
          'institutions',
          'offering',
        ].includes(t)
    );

  const wantsUniversity = /\b(universit|degree|bachelor|masters|phd)\b/.test(q);
  const wantsTvet = /\b(tvet|polytechnic|np|tvc|vtc|cbet|technical|artisan)\b/.test(q);
  const wantsKmtc = /\b(kmtc|medical|nursing|clinical|pharmacy|health)\b/.test(q);
  const wantsPublic = /\bpublic\b/.test(q);
  const wantsPrivate = /\bprivate\b/.test(q);
  const wantsElearning = /\b(e-learning|elearning|online|odel|distance|virtual|lms)\b/.test(q);
  const wantsPortal = /\b(portal|schologic|subdomain|lms)\b/.test(q);
  const wantsPracticum = /\b(practicum|teaching|education|attachment|clinical)\b/.test(q);
  const excludesNairobi = /\boutside nairobi\b/.test(q);

  const scored = institutions.map((inst) => {
    let score = 0;

    if (wantsUniversity && inst.type === 'university') score += 14;
    if (wantsTvet && inst.type === 'tvet') score += 14;
    if (wantsKmtc && inst.type === 'kmtc') score += 14;
    if (wantsPublic && inst.ownership === 'public') score += 6;
    if (wantsPrivate && inst.ownership === 'private') score += 6;
    if (wantsElearning && (inst.elearning_status !== 'none' || inst.distance_status !== 'none')) {
      score += 8;
    }
    if (wantsPortal && inst.portal_subdomain) score += 9;
    if (wantsPracticum && (inst.teaching_enabled || inst.type === 'kmtc' || inst.type === 'tvet')) {
      score += 6;
    }
    if (excludesNairobi && inst.county.toLowerCase() === 'nairobi') score -= 30;

    const corpus = [
      inst.name,
      inst.slug,
      inst.county,
      inst.region,
      inst.town,
      inst.category ?? '',
      inst.description,
      ...inst.disciplines,
    ]
      .join(' ')
      .toLowerCase();

    for (const token of tokens) {
      if (corpus.includes(token)) {
        score += 5;
      }
      if (
        inst.name.toLowerCase().includes(token) ||
        inst.county.toLowerCase().includes(token) ||
        inst.disciplines.some((d) => d.toLowerCase().includes(token))
      ) {
        score += 5;
      }
    }

    return { inst, score };
  });

  const positive = scored
    .filter((item) => item.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.inst.ranking_scores.composite - a.inst.ranking_scores.composite ||
        b.inst.course_count - a.inst.course_count
    )
    .slice(0, 4)
    .map((item) => item.inst);

  if (positive.length === 0) {
    return {
      summary:
        'No direct matches surfaced for those exact criteria. Showing top Kenyan institutions by composite index score — refine by county, qualification level, or type (University, TVET, KMTC).',
      matches: [...institutions]
        .sort((a, b) => b.ranking_scores.composite - a.ranking_scores.composite)
        .slice(0, 3),
    };
  }

  const counties = Array.from(new Set(positive.map((m) => m.county))).join(', ');
  const summary = `Found ${positive.length} Kenyan institution${positive.length > 1 ? 's' : ''} matching your query across ${counties}. View full profiles, open campus locations in Google Maps, or launch a side-by-side radar comparison.`;

  return { summary, matches: positive };
}

export default function AIChatDrawer({ initialInstitutions }: Props) {
  const { institutions } = useInstitutionsIndex(initialInstitutions);

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Ask about Kenyan universities, TVET National Polytechnics, KMTC clinical campuses, accredited courses, ODeL readiness, or Schologic LMS workspaces.',
    },
  ]);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onOpen = () => setIsOpen(true);
    window.addEventListener('schologic:open-discovery', onOpen);
    return () => window.removeEventListener('schologic:open-discovery', onOpen);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const institutionLookup = useMemo(() => {
    const map = new Map<string, PublicInstitutionSummary>();
    for (const inst of institutions) map.set(inst.slug, inst);
    return map;
  }, [institutions]);

  const handleAsk = (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: trimmed,
    };

    const { summary, matches } = runDiscoveryQuery(trimmed, institutions);
    const matchedSlugs = matches.map((m) => m.slug);
    const compareUrl =
      matchedSlugs.length >= 2
        ? `/compare?ids=${encodeURIComponent(matchedSlugs.slice(0, 4).join(','))}`
        : undefined;

    const assistantMsg: ChatMessage = {
      id: `a-${Date.now() + 1}`,
      role: 'assistant',
      text: summary,
      matchedSlugs,
      suggestedCompareUrl: compareUrl,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput('');
  };

  return (
    <>
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Open Institution Discovery Assistant"
          className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 px-4 py-3 bg-ink text-paper border border-ink hover:bg-forest hover:border-forest transition-colors shadow-sm cursor-pointer text-xs sm:text-sm font-semibold"
        >
          <MessageSquareText className="w-4 h-4" />
          <span>Discovery Assistant</span>
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-ink/35">
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Kenyan Institutions Discovery Assistant"
            className="w-full max-w-md bg-paper border-l border-ink h-full flex flex-col"
          >
            <div className="px-5 py-4 border-b border-hairline bg-limestone/60 flex items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-forest font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Index Discovery Chat
                </p>
                <h2 className="font-serif text-lg font-semibold text-ink">
                  Kenyan Institutions Advisor
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setMessages([
                      {
                        id: 'welcome-reset',
                        role: 'assistant',
                        text: 'Ask about Kenyan universities, TVET National Polytechnics, KMTC clinical campuses, accredited courses, ODeL readiness, or Schologic LMS workspaces.',
                      },
                    ])
                  }
                  title="Reset conversation"
                  className="p-1.5 border border-hairline bg-paper text-muted hover:text-ink cursor-pointer"
                  aria-label="Reset conversation"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 border border-hairline bg-paper text-muted hover:text-ink cursor-pointer"
                  aria-label="Close Discovery Assistant"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="px-5 py-3 border-b border-hairline bg-paper space-y-2">
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted">
                Sample Discovery Queries
              </p>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => handleAsk(prompt)}
                    className="text-left px-2.5 py-1 text-[11px] border border-hairline bg-limestone/45 text-ink hover:border-forest hover:text-forest transition-colors cursor-pointer"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={
                    msg.role === 'user'
                      ? 'ml-8 border border-ink bg-ink text-paper p-3 text-xs sm:text-sm'
                      : 'mr-4 border border-hairline bg-limestone/35 p-3.5 text-xs sm:text-sm text-ink space-y-3'
                  }
                >
                  <p className="leading-relaxed">{msg.text}</p>

                  {msg.matchedSlugs && msg.matchedSlugs.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-hairline">
                      {msg.matchedSlugs.map((slug) => {
                        const inst = institutionLookup.get(slug);
                        if (!inst) return null;
                        return (
                          <div
                            key={slug}
                            className="bg-paper border border-hairline p-2.5 flex items-start justify-between gap-2.5"
                          >
                            <InstitutionLogo
                              name={inst.name}
                              logoUrl={inst.logo_url}
                              type={inst.type}
                              size="sm"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="font-mono text-[10px] text-muted uppercase">
                                {formatTypeLabel(inst.type)}
                                {inst.category ? ` (${inst.category})` : ''} · {inst.county}
                              </div>
                              <a
                                href={`/institutions/${inst.slug}`}
                                className="font-serif text-sm font-semibold text-ink hover:text-forest hover:underline block truncate"
                              >
                                {inst.name}
                              </a>
                              <div className="text-[11px] text-muted mt-0.5 truncate">
                                {inst.disciplines.length > 0
                                  ? inst.disciplines.slice(0, 3).join(' · ')
                                  : `${inst.course_count} tracked programmes`}
                              </div>
                              <div className="flex items-center gap-3 mt-1 font-mono text-[10px]">
                                <a
                                  href={inst.google_maps_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-lapis hover:underline inline-flex items-center gap-0.5"
                                >
                                  Google Maps <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                                <span className="text-forest">
                                  Score: {inst.ranking_scores.composite}/100
                                </span>
                              </div>
                            </div>
                            <a
                              href={`/institutions/${inst.slug}`}
                              aria-label={`Open ${inst.name}`}
                              className="p-1 text-forest hover:text-ink shrink-0"
                            >
                              <ArrowUpRight className="w-4 h-4" />
                            </a>
                          </div>
                        );
                      })}

                      {msg.suggestedCompareUrl && (
                        <a
                          href={msg.suggestedCompareUrl}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-forest text-paper text-xs font-semibold hover:bg-ink transition-colors w-full justify-center"
                        >
                          <GitCompare className="w-3.5 h-3.5" />
                          Compare These Matches Side-by-Side
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAsk(input);
              }}
              className="p-4 border-t border-hairline bg-paper flex items-center gap-2"
            >
              <label htmlFor="discovery-chat-input" className="sr-only">
                Ask the institution discovery assistant
              </label>
              <input
                id="discovery-chat-input"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask by course, county, TVET, KMTC, or LMS..."
                className="flex-1 px-3 py-2 text-sm border border-hairline bg-paper text-ink focus:outline-none focus:border-forest"
              />
              <button
                type="submit"
                className="px-3.5 py-2 bg-forest text-paper hover:bg-ink transition-colors cursor-pointer shrink-0"
                aria-label="Send discovery query"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </aside>
        </div>
      )}
    </>
  );
}
