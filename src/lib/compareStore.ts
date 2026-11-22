export const DEFAULT_COMPARE_SLUGS = [
  'university-of-nairobi',
  'strathmore-university',
  'the-nairobi-national-polytechnic',
];

const STORAGE_KEY = 'schologic_compare_slugs';
const CHANGE_EVENT = 'schologic:compare-change';

export function readComparedSlugs(): string[] {
  if (typeof window === 'undefined') return DEFAULT_COMPARE_SLUGS;

  const params = new URLSearchParams(window.location.search);
  const urlIds = params.get('ids');
  if (urlIds) {
    const parsed = urlIds
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 4);
    if (parsed.length > 0) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      } catch {
        // Ignore storage errors
      }
      return parsed;
    }
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_COMPARE_SLUGS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((x): x is string => typeof x === 'string').slice(0, 4);
    }
  } catch {
    // Ignore storage errors
  }

  return DEFAULT_COMPARE_SLUGS;
}

export function writeComparedSlugs(slugs: string[]): void {
  if (typeof window === 'undefined') return;
  const cleaned = slugs.slice(0, 4);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
  } catch {
    // Ignore storage errors
  }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: cleaned }));
}

export function toggleComparedSlug(slug: string): { slugs: string[]; limitReached: boolean } {
  const current = readComparedSlugs();
  if (current.includes(slug)) {
    const next = current.filter((item) => item !== slug);
    writeComparedSlugs(next);
    return { slugs: next, limitReached: false };
  }
  if (current.length >= 4) {
    return { slugs: current, limitReached: true };
  }
  const next = [...current, slug];
  writeComparedSlugs(next);
  return { slugs: next, limitReached: false };
}

export function subscribeCompareChanges(callback: (slugs: string[]) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (event: Event) => {
    const custom = event as CustomEvent<string[]>;
    callback(Array.isArray(custom.detail) ? custom.detail : readComparedSlugs());
  };
  const storageHandler = () => {
    callback(readComparedSlugs());
  };
  window.addEventListener(CHANGE_EVENT, handler);
  window.addEventListener('storage', storageHandler);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
    window.removeEventListener('storage', storageHandler);
  };
}
