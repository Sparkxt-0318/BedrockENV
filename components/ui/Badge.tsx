import { DataResolution } from '@/types/resolution';
import { RiskTier } from '@/types/exposure';

interface ResolutionBadgeProps {
  resolution: DataResolution;
  className?: string;
}

const resolutionStyles: Record<DataResolution, string> = {
  property: 'bg-[var(--badge-property-bg)] text-[var(--badge-property-text)]',
  neighborhood: 'bg-[var(--badge-neighborhood-bg)] text-[var(--badge-neighborhood-text)]',
  area: 'bg-[var(--badge-area-bg)] text-[var(--badge-area-text)]',
};

const resolutionLabels: Record<DataResolution, string> = {
  property: 'Property-level',
  neighborhood: 'Neighborhood-level',
  area: 'Area-level',
};

export function ResolutionBadge({ resolution, className = '' }: ResolutionBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-[11px] font-[family-name:var(--font-mono)] font-medium rounded-[var(--radius-sm)] ${resolutionStyles[resolution]} ${className}`}
    >
      {resolutionLabels[resolution]}
    </span>
  );
}

interface RiskBadgeProps {
  tier: RiskTier;
  className?: string;
}

const riskStyles: Record<RiskTier, string> = {
  LOW: 'bg-exposure-low/10 text-exposure-low',
  MODERATE: 'bg-exposure-moderate/10 text-exposure-moderate',
  ELEVATED: 'bg-exposure-elevated/10 text-exposure-elevated',
  HIGH: 'bg-exposure-high/10 text-exposure-high',
};

export function RiskBadge({ tier, className = '' }: RiskBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-[11px] font-[family-name:var(--font-mono)] font-semibold uppercase tracking-[0.06em] rounded-[var(--radius-sm)] ${riskStyles[tier]} ${className}`}
    >
      {tier}
    </span>
  );
}

interface ConfidenceBadgeProps {
  confidence: 'high' | 'moderate' | 'low' | 'insufficient';
  className?: string;
}

const confidenceStyles: Record<string, string> = {
  high: 'bg-[var(--badge-property-bg)] text-[var(--badge-property-text)]',
  moderate: 'bg-[var(--badge-neighborhood-bg)] text-[var(--badge-neighborhood-text)]',
  low: 'bg-[var(--badge-area-bg)] text-[var(--badge-area-text)]',
  insufficient: 'bg-exposure-high/10 text-exposure-high',
};

export function ConfidenceBadge({ confidence, className = '' }: ConfidenceBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-[11px] font-[family-name:var(--font-mono)] font-medium rounded-[var(--radius-sm)] ${confidenceStyles[confidence]} ${className}`}
    >
      {confidence === 'insufficient' ? 'Insufficient data' : `${confidence} confidence`}
    </span>
  );
}
