import { useEffect, useState } from 'react';
import type { PublicInstitutionSummary } from '../types/institution';

let cachedIndex: PublicInstitutionSummary[] | null = null;
let inflightPromise: Promise<PublicInstitutionSummary[]> | null = null;

export async function loadInstitutionsIndex(): Promise<PublicInstitutionSummary[]> {
  if (cachedIndex) return cachedIndex;
  if (inflightPromise) return inflightPromise;

  inflightPromise = fetch('/data/institutions-index.json')
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((data: PublicInstitutionSummary[]) => {
      cachedIndex = data;
      return data;
    })
    .catch((err) => {
      inflightPromise = null;
      throw err;
    });

  return inflightPromise;
}

export function useInstitutionsIndex(initialFallback: PublicInstitutionSummary[]) {
  const [institutions, setInstitutions] = useState<PublicInstitutionSummary[]>(
    () => cachedIndex ?? initialFallback
  );
  const [isLoadingFull, setIsLoadingFull] = useState<boolean>(() => !cachedIndex);

  useEffect(() => {
    let mounted = true;
    if (cachedIndex) {
      setInstitutions(cachedIndex);
      setIsLoadingFull(false);
      return;
    }
    loadInstitutionsIndex()
      .then((data) => {
        if (!mounted) return;
        setInstitutions(data);
        setIsLoadingFull(false);
      })
      .catch(() => {
        if (mounted) setIsLoadingFull(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return { institutions, isLoadingFull };
}
