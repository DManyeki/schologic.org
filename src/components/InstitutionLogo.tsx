import React, { useState } from 'react';
import type { InstitutionType } from '../types/institution';

interface Props {
  name: string;
  logoUrl: string | null | undefined;
  type: InstitutionType;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASSES: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'w-9 h-9 text-[10px]',
  md: 'w-12 h-12 text-xs',
  lg: 'w-20 h-20 sm:w-24 sm:h-24 text-base',
};

const TYPE_FALLBACK_STYLE: Record<InstitutionType, string> = {
  university: 'bg-forest/[0.06] text-forest border-forest/25',
  tvet: 'bg-lapis/[0.06] text-lapis border-lapis/25',
  kmtc: 'bg-terracotta/[0.06] text-terracotta border-terracotta/25',
};

function getInitials(name: string): string {
  const words = name
    .replace(/[^A-Za-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 0 && !['of', 'and', 'the', 'for', 'in', 'at'].includes(w.toLowerCase()));
  if (words.length === 0) return 'KE';
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words
    .slice(0, 3)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export default function InstitutionLogo({
  name,
  logoUrl,
  type,
  size = 'md',
  className = '',
}: Props) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(logoUrl) && !failed;
  const initials = getInitials(name);

  if (showImage) {
    return (
      <div
        className={`shrink-0 border border-hairline bg-white flex items-center justify-center overflow-hidden p-1 ${SIZE_CLASSES[size]} ${className}`}
      >
        <img
          src={logoUrl!}
          alt={`${name} logo`}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  return (
    <div
      aria-label={`${name} crest`}
      className={`shrink-0 border flex items-center justify-center font-mono font-bold tracking-wider select-none ${SIZE_CLASSES[size]} ${TYPE_FALLBACK_STYLE[type]} ${className}`}
    >
      {initials}
    </div>
  );
}
