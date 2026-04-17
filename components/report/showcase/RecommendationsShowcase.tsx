import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { RiskBadge } from '@/components/ui/Badge';
import type { TriggeredRecommendation } from '@/lib/recommendations/types';

interface RecommendationsShowcaseProps {
  recommendations: TriggeredRecommendation[];
}

export function RecommendationsShowcase({ recommendations }: RecommendationsShowcaseProps) {
  if (recommendations.length === 0) {
    return (
      <section className="border-t border-border py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <span className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.1em] text-text-tertiary">
            Recommendations
          </span>
          <p className="mt-4 text-text-secondary">
            No specific recommendations triggered — generally a positive indicator.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="border-t border-border py-20">
      <ScrollReveal>
        <span className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.1em] text-text-tertiary">
          Recommendations
        </span>
        <p className="mt-4 font-[family-name:var(--font-display)] text-2xl text-text-primary">
          {recommendations.length} action{recommendations.length > 1 ? 's' : ''} based on your data.
        </p>

        <div className="mt-8 space-y-6">
          {recommendations.map((rec, i) => (
            <div
              key={rec.templateId || i}
              className="py-5 border-t border-border"
            >
              <div className="flex items-center gap-2 mb-3">
                <RiskBadge tier={rec.riskTier} />
                <span className="font-[family-name:var(--font-mono)] text-xs text-text-tertiary uppercase">
                  {rec.layer}
                </span>
              </div>
              <p className="text-text-primary text-sm leading-relaxed">{rec.finding}</p>
              <p className="mt-3 text-text-primary text-sm leading-relaxed font-medium">
                {rec.recommendation}
              </p>
              <cite className="mt-2 block not-italic font-[family-name:var(--font-mono)] text-[11px] text-text-tertiary">
                {rec.sourceCitation}
              </cite>
            </div>
          ))}
        </div>
      </ScrollReveal>
    </section>
  );
}
