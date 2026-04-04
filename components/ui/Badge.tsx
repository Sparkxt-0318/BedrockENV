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
      className={`
        inline-flex items-center px-2 py-0.5 text-xs font-medium
        rounded-[var(--radius-full)]
        ${resolutionStyles[resolution]}
        ${className}
      `}
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
  LOW: 'bg-exposure-low/15 text-exposure-low',
  MODERATE: 'bg-exposure-moderate/15 text-[#9A7B1A]',
  ELEVATED: 'bg-exposure-elevated/15 text-[#C47A30]',
  HIGH: 'bg-exposure-high/15 text-exposure-high',
};

export function RiskBadge({ tier, className = '' }: RiskBadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide
        rounded-[var(--radius-full)]
        ${riskStyles[tier]}
        ${className}
      `}
    >
      {tier}
    </span>
  );
}
