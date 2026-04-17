'use client';

import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { PLANS } from '@/lib/stripe/plans';
import Link from 'next/link';

interface FreePreviewOverlayProps {
  assessmentId: string;
  topFinding?: string;
}

export function FreePreviewOverlay({ assessmentId, topFinding }: FreePreviewOverlayProps) {
  const { purchaseReport, loading } = useSubscription();
  const { user } = useAuth();

  return (
    <div className="relative mt-12">
      <div className="absolute inset-0 z-10 flex items-start justify-center pt-16">
        <div className="w-full max-w-md mx-4">
          <div
            className="rounded-[var(--radius-lg)] border border-border p-8 text-center"
            style={{ background: 'var(--bg-surface)', boxShadow: '0 24px 48px -12px rgba(0,0,0,.12)' }}
          >
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full" style={{ background: 'var(--accent)', color: 'white' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>

            <h3 className="font-[family-name:var(--font-display)] text-2xl text-text-primary mb-2">
              Unlock full report
            </h3>
            <p className="text-sm text-text-secondary mb-6 max-w-xs mx-auto">
              See all layer details, data sources, expert recommendations, and download options.
            </p>

            {topFinding && (
              <div className="mb-6 rounded-[var(--radius-md)] border border-border p-3 text-left" style={{ background: 'var(--bg-elevated)' }}>
                <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.08em] text-text-tertiary">
                  Top finding
                </span>
                <p className="mt-1 text-sm text-text-primary">{topFinding}</p>
              </div>
            )}

            <button
              onClick={() => purchaseReport(assessmentId)}
              disabled={loading}
              className="w-full rounded-[var(--radius-md)] px-6 py-3 text-sm font-medium text-white transition-colors disabled:opacity-50"
              style={{ background: 'var(--accent)' }}
            >
              {loading ? 'Redirecting to checkout...' : `Unlock full report — $${PLANS.consumerReport.price}`}
            </button>

            <div className="mt-4 flex items-center justify-center gap-4 text-xs text-text-tertiary">
              <span>One-time purchase</span>
              <span aria-hidden="true">·</span>
              <Link href="/pro" className="underline underline-offset-2 hover:text-text-secondary transition-colors">
                Or go Pro for ${PLANS.proMonthly.price}/mo
              </Link>
            </div>

            {!user && (
              <p className="mt-4 text-xs text-text-tertiary">
                <Link href="/auth/login" className="underline underline-offset-2 hover:text-text-secondary transition-colors">
                  Sign in
                </Link>
                {' '}to save reports and manage purchases.
              </p>
            )}
          </div>
        </div>
      </div>

      <div
        className="pointer-events-none select-none"
        aria-hidden="true"
        style={{
          maskImage: 'linear-gradient(to bottom, black 0%, transparent 40%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 40%)',
          filter: 'blur(6px)',
          opacity: 0.6,
        }}
      >
        <div className="space-y-8 px-4">
          <div className="h-48 rounded-[var(--radius-lg)]" style={{ background: 'var(--bg-surface)' }} />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-32 rounded-[var(--radius-lg)]" style={{ background: 'var(--bg-surface)' }} />
            <div className="h-32 rounded-[var(--radius-lg)]" style={{ background: 'var(--bg-surface)' }} />
          </div>
          <div className="h-64 rounded-[var(--radius-lg)]" style={{ background: 'var(--bg-surface)' }} />
          <div className="h-48 rounded-[var(--radius-lg)]" style={{ background: 'var(--bg-surface)' }} />
          <div className="h-32 rounded-[var(--radius-lg)]" style={{ background: 'var(--bg-surface)' }} />
        </div>
      </div>

      <div className="h-[200px]" />
    </div>
  );
}
