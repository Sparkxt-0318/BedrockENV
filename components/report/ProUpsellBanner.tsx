'use client';

import { Button } from '@/components/ui';
import { useSubscription } from '@/hooks/useSubscription';
import { PLANS } from '@/lib/stripe/plans';

interface ProUpsellBannerProps {
  assessmentId?: string;
}

export function ProUpsellBanner({ assessmentId }: ProUpsellBannerProps) {
  const { loading, error, purchaseReport } = useSubscription();

  return (
    <div className="rounded-[var(--radius-lg)] border border-accent/30 bg-accent-light/30 px-6 py-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="font-semibold text-text-primary">
            Get the full report
          </h3>
          <p className="text-sm text-text-secondary mt-1">
            Detailed findings, interactive maps, and expert-sourced action recommendations.
          </p>
          <ul className="mt-2 space-y-1">
            {PLANS.consumerReport.features.slice(0, 3).map((f) => (
              <li key={f} className="text-xs text-text-secondary flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                {f}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col items-center gap-2 sm:items-end">
          <div className="flex items-baseline gap-1">
            <span className="font-[family-name:var(--font-instrument-serif)] text-3xl text-text-primary">
              ${PLANS.consumerReport.price}
            </span>
            <span className="text-sm text-text-tertiary">one-time</span>
          </div>
          <Button
            size="lg"
            loading={loading}
            onClick={() => purchaseReport(assessmentId || '')}
          >
            Purchase full report
          </Button>
          {error && (
            <p className="text-xs text-exposure-high">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
