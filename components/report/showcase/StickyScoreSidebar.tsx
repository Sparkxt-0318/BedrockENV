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

const LAYER_MOTIF: Record<ExposureLayer, { src: string; label: string }> = {
  water: { src: '/media/hero-delta', label: 'Mississippi River Delta — NASA Worldview' },
  soil: { src: '/media/chapter-soil', label: 'Center-pivot irrigation — NASA Worldview' },
  air: { src: '/media/chapter-air', label: 'LA basin — NASA Worldview' },
  proximity: { src: '/media/chapter-flood', label: 'Hurricane Harvey flooding — NASA Worldview' },
  ej: { src: '/media/blue-marble', label: 'Blue Marble — NASA Worldview' },
};

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

  const motif = activeLayer ? LAYER_MOTIF[activeLayer] : null;

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

      {motif && (
        <div className="mt-4 overflow-hidden rounded-[var(--radius-md)]">
          <picture>
            <source srcSet={`${motif.src}.webp`} type="image/webp" />
            <img
              src={`${motif.src}.jpg`}
              alt={motif.label}
              loading="lazy"
              decoding="async"
              className="h-[120px] w-full object-cover"
              style={{ filter: 'grayscale(80%) contrast(1.05) brightness(0.95)' }}
            />
          </picture>
          <p className="mt-1 font-[family-name:var(--font-mono)] text-[9px] text-text-tertiary">
            {motif.label}
          </p>
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
