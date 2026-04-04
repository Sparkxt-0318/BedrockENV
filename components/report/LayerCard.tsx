'use client';

import { useState } from 'react';
import { LayerScore, ExposureLayer } from '@/types/exposure';
import { ResolutionBadge, RiskBadge } from '@/components/ui';
import { getExposureColor, getRiskTierFromScore } from '@/lib/utils';

interface LayerCardProps {
  layer: ExposureLayer;
  layerScore: LayerScore;
  title: string;
  summary: string;
  children?: React.ReactNode;
}

const LAYER_ICONS: Record<ExposureLayer, React.ReactNode> = {
  water: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" />
    </svg>
  ),
  soil: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 22h20" />
      <path d="M6 18v-2a4 4 0 014-4h0a4 4 0 014 4v2" />
      <path d="M10 12V6a2 2 0 114 0v6" />
    </svg>
  ),
  air: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.7 7.7a2.5 2.5 0 111.8 4.3H2" />
      <path d="M9.6 4.6A2 2 0 1111 8H2" />
      <path d="M12.6 19.4A2 2 0 1014 16H2" />
    </svg>
  ),
  proximity: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4l2 2" />
    </svg>
  ),
  ej: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
};

export function LayerCard({
  layer,
  layerScore,
  title,
  summary,
  children,
}: LayerCardProps) {
  const [expanded, setExpanded] = useState(false);
  const color = getExposureColor(layerScore.score);
  const riskTier = getRiskTierFromScore(layerScore.score);

  return (
    <div
      className="rounded-[var(--radius-lg)] border border-border bg-bg-surface overflow-hidden"
      style={{ borderLeftWidth: 4, borderLeftColor: color }}
    >
      <div className="px-5 py-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="text-text-secondary">{LAYER_ICONS[layer]}</div>
            <div>
              <h3 className="font-semibold text-text-primary">{title}</h3>
              <p className="text-sm text-text-secondary mt-0.5">{summary}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <span
              className="font-[family-name:var(--font-instrument-serif)] text-2xl"
              style={{ color }}
            >
              {layerScore.score}
            </span>
            <div className="flex gap-1.5">
              <RiskBadge tier={riskTier} />
              <ResolutionBadge resolution={layerScore.confidence} />
            </div>
          </div>
        </div>

        {/* Expand/collapse */}
        {children && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-3 text-sm text-accent hover:text-accent-hover transition-colors flex items-center gap-1"
          >
            {expanded ? 'Show less' : 'Show details'}
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        )}
      </div>

      {/* Expanded content */}
      {expanded && children && (
        <div className="px-5 py-4 border-t border-border bg-bg-primary">
          {children}
        </div>
      )}
    </div>
  );
}
