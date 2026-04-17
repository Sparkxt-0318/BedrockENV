'use client';

import { Score } from '@/components/ui/Score';
import { CoverageMeter } from '@/components/ui/CoverageMeter';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import type { ExposureAssessment } from '@/types/exposure';

interface ShowcaseIntroProps {
  assessment: ExposureAssessment;
}

export function ShowcaseIntro({ assessment }: ShowcaseIntroProps) {
  const { compositeScore, address } = assessment;
  const layerCount = compositeScore.layersIncluded.length;

  return (
    <section className="min-h-[70vh] flex items-end pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <ScrollReveal>
          <span className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.1em] text-text-tertiary">
            Environmental Exposure Report
          </span>
          <h1 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(1.75rem,4vw,3rem)] leading-[1.15] text-text-primary">
            {address.normalized || address.raw}
          </h1>
          <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-end gap-8">
            <Score
              value={compositeScore.score}
              confidence={compositeScore.confidence}
              size="lg"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="font-[family-name:var(--font-mono)] text-sm text-text-secondary">
                  {layerCount} of 5 layers
                </span>
                <span className="text-text-tertiary text-sm">·</span>
                <span className="font-[family-name:var(--font-mono)] text-sm text-text-secondary">
                  v{compositeScore.scoringVersion}
                </span>
              </div>
              <div className="mt-3 max-w-xs">
                <CoverageMeter
                  coverage={compositeScore.coverage}
                  sufficient={compositeScore.sufficient}
                />
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
