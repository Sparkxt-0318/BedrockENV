import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { CoverageMeter } from '@/components/ui/CoverageMeter';
import { ConfidenceBadge } from '@/components/ui/Badge';
import type { CompositeScore, ExposureLayer } from '@/types/exposure';

const LAYER_META: Record<ExposureLayer, { name: string; sources: string }> = {
  water: { name: 'Water', sources: 'UCMR 5, SDWIS, WQP, Census ACS' },
  air: { name: 'Air Quality', sources: 'OpenAQ, AQS, TRI, Green Book' },
  proximity: { name: 'Toxic Proximity', sources: 'FRS/SEMS, ECHO' },
  soil: { name: 'Soil & Land', sources: 'SSURGO, Brownfields, NFHL, NASA' },
  ej: { name: 'Environmental Justice', sources: 'EJScreen, CDC SVI' },
};

const CONFIDENCE_MAP = {
  property: 'high',
  neighborhood: 'moderate',
  area: 'low',
} as const;

const ALL_LAYERS: ExposureLayer[] = ['water', 'air', 'proximity', 'soil', 'ej'];

interface DataCoverageBreakdownProps {
  compositeScore: CompositeScore;
}

export function DataCoverageBreakdown({ compositeScore }: DataCoverageBreakdownProps) {
  const { layerScores } = compositeScore;

  return (
    <section className="border-t border-border py-20">
      <ScrollReveal>
        <span className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.1em] text-text-tertiary">
          Data Coverage
        </span>
        <p className="mt-4 font-[family-name:var(--font-display)] text-2xl text-text-primary">
          What we measured and what we couldn&rsquo;t.
        </p>

        <div className="mt-8 space-y-0">
          {ALL_LAYERS.map((layer) => {
            const ls = layerScores[layer];
            const meta = LAYER_META[layer];
            const available = ls?.available ?? false;

            return (
              <div key={layer} className="py-5 border-t border-border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-sm text-text-primary">{meta.name}</span>
                    {available ? (
                      <ConfidenceBadge confidence={CONFIDENCE_MAP[ls!.confidence]} />
                    ) : (
                      <span className="text-[11px] font-[family-name:var(--font-mono)] text-text-tertiary">
                        Unavailable
                      </span>
                    )}
                  </div>
                  {available && ls && (
                    <span className="font-[family-name:var(--font-mono)] text-sm tabular-nums text-text-primary">
                      {ls.score}/100
                    </span>
                  )}
                </div>
                {available && ls ? (
                  <CoverageMeter
                    coverage={ls.coverage}
                    sufficient={ls.coverage >= 0.35}
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-[var(--radius-full)] bg-border" />
                    <span className="text-xs text-text-tertiary font-[family-name:var(--font-mono)]">
                      0%
                    </span>
                  </div>
                )}
                <p className="mt-2 text-[11px] text-text-tertiary font-[family-name:var(--font-mono)]">
                  {meta.sources}
                </p>
              </div>
            );
          })}
        </div>
      </ScrollReveal>
    </section>
  );
}
