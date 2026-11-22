import React from 'react';
import { GitCompare } from 'lucide-react';

interface HeaderProps {
  comparedCount: number;
  onScrollToCompare: () => void;
}

export const Header: React.FC<HeaderProps> = ({ comparedCount, onScrollToCompare }) => {
  return (
    <header className="sticky top-0 z-30 bg-[#FBF9F5]/95 backdrop-blur-sm border-b border-[#E5E0D8]">
      <div className="max-w-[1360px] mx-auto px-6 md:px-10 h-16 flex items-center justify-between gap-8">
        <a
          href="#top"
          className="font-serif text-xl font-semibold tracking-tight text-[#1C1917] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14532D] rounded-sm"
        >
          Kenyan Academic Index
        </a>

        <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-7 text-sm font-medium text-[#57534E]">
          <a
            href="#directory"
            className="hover:text-[#1C1917] transition-colors whitespace-nowrap shrink-0 py-1 border-b border-transparent hover:border-[#1C1917]"
          >
            Directory
          </a>
          <a
            href="#compare"
            className="hover:text-[#1C1917] transition-colors whitespace-nowrap shrink-0 py-1 border-b border-transparent hover:border-[#1C1917]"
          >
            Compare
          </a>
          <a
            href="#regions"
            className="hover:text-[#1C1917] transition-colors whitespace-nowrap shrink-0 py-1 border-b border-transparent hover:border-[#1C1917]"
          >
            Regions
          </a>
          <a
            href="#methodology"
            className="hover:text-[#1C1917] transition-colors whitespace-nowrap shrink-0 py-1 border-b border-transparent hover:border-[#1C1917]"
          >
            Schema
          </a>
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onScrollToCompare}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium bg-[#14532D] text-[#FBF9F5] rounded-md hover:bg-[#114224] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14532D] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FBF9F5]"
          >
            <GitCompare className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Compare Selected</span>
            <span className="font-mono tabular-nums">({comparedCount})</span>
          </button>
        </div>
      </div>
    </header>
  );
};
