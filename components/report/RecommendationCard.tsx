import { TriggeredRecommendation } from '@/lib/recommendations/types';
import { RiskBadge } from '@/components/ui';

interface RecommendationCardProps {
  recommendation: TriggeredRecommendation;
}

const LAYER_LABELS: Record<string, string> = {
  water: 'Water',
  soil: 'Soil',
  air: 'Air',
  proximity: 'Proximity',
  ej: 'Environmental Justice',
  general: 'General',
};

const TIER_BORDER_COLORS: Record<string, string> = {
  HIGH: 'var(--exposure-high)',
  ELEVATED: 'var(--exposure-elevated)',
  MODERATE: 'var(--exposure-moderate)',
  LOW: 'var(--exposure-low)',
};

export function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const borderColor = TIER_BORDER_COLORS[recommendation.riskTier] ?? 'var(--border)';

  return (
    <div
      className="rounded-[var(--radius-lg)] border border-border bg-bg-surface overflow-hidden"
      style={{ borderLeftWidth: 4, borderLeftColor: borderColor }}
    >
      <div className="px-5 py-4 space-y-3">
        {/* Header */}
        <div className="flex items-center gap-2">
          <RiskBadge tier={recommendation.riskTier} />
          <span className="text-xs text-text-tertiary">
            {LAYER_LABELS[recommendation.layer] ?? recommendation.layer}
          </span>
        </div>

        {/* Finding */}
        <p className="text-text-primary text-[15px] leading-relaxed">
          {recommendation.finding}
        </p>

        {/* Recommendation */}
        <div className="p-3 rounded-[var(--radius-md)] bg-bg-primary border border-border">
          <p className="text-sm text-text-primary leading-relaxed">
            {recommendation.recommendation}
          </p>
        </div>

        {/* Source citation */}
        <p className="text-xs text-text-secondary">
          <span className="font-medium">Source:</span> {recommendation.sourceCitation}
        </p>

        {/* Disclaimer */}
        <p className="text-xs text-text-tertiary italic">
          {recommendation.disclaimer}
        </p>
      </div>
    </div>
  );
}

interface RecommendationListProps {
  recommendations: TriggeredRecommendation[];
}

export function RecommendationList({ recommendations }: RecommendationListProps) {
  if (recommendations.length === 0) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-border bg-bg-surface px-5 py-8 text-center">
        <p className="text-sm text-text-secondary">
          No specific recommendations triggered based on the data analyzed.
          This is generally a positive indicator.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {recommendations.map((rec) => (
        <RecommendationCard key={rec.templateId} recommendation={rec} />
      ))}
    </div>
  );
}
