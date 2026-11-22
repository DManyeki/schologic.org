import React, { useEffect, useState } from 'react';
import { GitCompare, Check, ArrowRight, AlertCircle } from 'lucide-react';
import {
  PUBLIC_RADAR_AXES,
  type PublicInstitution,
  getPublicRadarScores,
} from '../types/institution';
import {
  readComparedSlugs,
  subscribeCompareChanges,
  toggleComparedSlug,
} from '../lib/compareStore';

interface Props {
  institution: PublicInstitution;
}

export default function InstitutionCompareIsland({ institution }: Props) {
  const [pinnedSlugs, setPinnedSlugs] = useState<string[]>([]);
  const [limitNotice, setLimitNotice] = useState(false);

  useEffect(() => {
    setPinnedSlugs(readComparedSlugs());
    return subscribeCompareChanges(setPinnedSlugs);
  }, []);

  const isPinned = pinnedSlugs.includes(institution.slug);
  const scores = getPublicRadarScores(institution);

  const handleToggle = () => {
    const res = toggleComparedSlug(institution.slug);
    setPinnedSlugs(res.slugs);
    if (res.limitReached) {
      setLimitNotice(true);
      window.setTimeout(() => setLimitNotice(false), 3200);
    } else {
      setLimitNotice(false);
    }
  };

  // Single-institution compact SVG radar geometry (240x240)
  const size = 240;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 78;
  const angleStep = (Math.PI * 2) / PUBLIC_RADAR_AXES.length;

  const pointAt = (index: number, value: number) => {
    const angle = -Math.PI / 2 + index * angleStep;
    const r = (value / 100) * radius;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  const polygonPoints = PUBLIC_RADAR_AXES.map((axis, idx) => {
    const pt = pointAt(idx, scores[axis.key]);
    return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
  }).join(' ');

  return (
    <div className="border border-hairline bg-paper p-5">
      <div className="flex items-start justify-between gap-3 pb-4 border-b border-hairline">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-muted">
            Public Capability Profile
          </p>
          <h3 className="font-serif text-lg font-semibold text-ink mt-0.5">
            6-Axis Institutional Radar
          </h3>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
            isPinned
              ? 'bg-forest text-paper border-forest'
              : 'bg-limestone/70 text-ink border-hairline hover:border-ink'
          }`}
        >
          {isPinned ? <Check className="w-3.5 h-3.5" /> : <GitCompare className="w-3.5 h-3.5" />}
          {isPinned ? 'Pinned to Compare' : 'Pin to Compare'}
        </button>
      </div>

      {limitNotice && (
        <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-terracotta/10 border border-terracotta/30 text-xs text-terracotta">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Maximum of 4 institutions can be pinned. Remove one in Compare first.</span>
        </div>
      )}

      <div className="mt-4 flex flex-col items-center">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="w-full max-w-[240px] h-auto overflow-visible"
          role="img"
          aria-label={`6-axis capability radar for ${institution.name}`}
        >
          {[25, 50, 75, 100].map((ring) => {
            const ringPoints = PUBLIC_RADAR_AXES.map((_, idx) => {
              const pt = pointAt(idx, ring);
              return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
            }).join(' ');
            return (
              <polygon
                key={ring}
                points={ringPoints}
                fill="none"
                stroke="#E5E0D8"
                strokeWidth="1"
              />
            );
          })}

          {PUBLIC_RADAR_AXES.map((axis, idx) => {
            const outer = pointAt(idx, 100);
            const labelPt = pointAt(idx, 122);
            return (
              <g key={axis.key}>
                <line
                  x1={cx}
                  y1={cy}
                  x2={outer.x}
                  y2={outer.y}
                  stroke="#E5E0D8"
                  strokeWidth="1"
                />
                <text
                  x={labelPt.x}
                  y={labelPt.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-muted text-[9px] font-mono uppercase"
                >
                  {axis.shortLabel}
                </text>
              </g>
            );
          })}

          <polygon
            points={polygonPoints}
            fill="rgba(20, 83, 45, 0.16)"
            stroke="#14532D"
            strokeWidth="2"
          />

          {PUBLIC_RADAR_AXES.map((axis, idx) => {
            const pt = pointAt(idx, scores[axis.key]);
            return (
              <circle
                key={axis.key}
                cx={pt.x}
                cy={pt.y}
                r="3"
                fill="#14532D"
                stroke="#FBF9F5"
                strokeWidth="1.5"
              />
            );
          })}
        </svg>
      </div>

      <dl className="mt-3 divide-y divide-hairline border-t border-hairline text-xs">
        {PUBLIC_RADAR_AXES.map((axis) => (
          <div key={axis.key} className="py-2 flex items-center justify-between gap-2">
            <dt className="text-muted">{axis.label}</dt>
            <dd className="font-mono font-semibold text-ink tabular-nums">
              {scores[axis.key]} / 100
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 pt-3 border-t border-hairline flex items-center justify-between gap-2 text-xs">
        <span className="font-mono text-muted tabular-nums">
          {pinnedSlugs.length} / 4 pinned
        </span>
        <a
          href="/compare"
          className="inline-flex items-center gap-1 font-semibold text-forest hover:underline whitespace-nowrap"
        >
          Open Comparison Studio
          <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
