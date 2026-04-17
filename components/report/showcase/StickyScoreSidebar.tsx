'use client';

import { Score } from '@/components/ui/Score';
import { ConfidenceBadge } from '@/components/ui/Badge';
import { CoverageMeter } from '@/components/ui/CoverageMeter';
import type { LayerScore, ExposureLayer, CompositeScore } from '@/types/exposure';

const LAYER_LABELS: Record<ExposureLayer, string> = {
  water: 'Water',
  soil: 'Soil & Land',
  air: 'Air Quality',
  proximity: 'Toxic Proximity',
  ej: 'Environmental Justice',
};

const CONFIDENCE_MAP = {
  property: 'high',
  neighborhood: 'moderate',
  area: 'low',
} as const;

interface StickyScoreSidebarProps {
  compositeScore: CompositeScore;
  activeLayer: ExposureLayer | null;
  layerScores: Partial<Record<ExposureLayer, LayerScore>>;
}

export function StickyScoreSidebar({
  compositeScore,
  activeLayer,
  layerScores,
}: StickyScoreSidebarProps) {
  const currentScore = activeLayer
    ? layerScores[activeLayer]
    : null;

  return (
    <div className="p-6 rounded-[var(--radius-lg)] border border-border bg-bg-surface">
      {activeLayer && currentScore ? (
        <div className="space-y-4">
          <span className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.1em] text-text-tertiary">
            {LAYER_LABELS[activeLayer]}
          </span>
          <Score
            value={currentScore.score}
            confidence={CONFIDENCE_MAP[currentScore.confidence]}
            size="md"
            animate={false}
          />
          <CoverageMeter
            coverage={currentScore.coverage}
            sufficient={currentScore.coverage >= 0.35}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <span className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.1em] text-text-tertiary">
            Composite
          </span>
          <Score
            value={compositeScore.score}
            confidence={compositeScore.confidence}
            size="md"
            animate={false}
          />
          <CoverageMeter
            coverage={compositeScore.coverage}
            sufficient={compositeScore.sufficient}
          />
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-border space-y-2">
        {compositeScore.layersIncluded.map((layer) => {
          const ls = layerScores[layer];
          if (!ls) return null;
          return (
            <div
              key={layer}
              className={`flex items-center justify-between py-1.5 px-2 rounded-[var(--radius-sm)] transition-colors ${
                activeLayer === layer ? 'bg-bg-elevated' : ''
              }`}
            >
              <span className="text-xs text-text-secondary">{LAYER_LABELS[layer]}</span>
              <div className="flex items-center gap-2">
                <span className="font-[family-name:var(--font-mono)] text-xs tabular-nums text-text-primary">
                  {ls.score}
                </span>
                <ConfidenceBadge
                  confidence={CONFIDENCE_MAP[ls.confidence]}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
