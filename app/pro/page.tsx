'use client';

import Link from 'next/link';
import { Button, Card, CardContent } from '@/components/ui';
import { useSubscription } from '@/hooks/useSubscription';
import { useProfile } from '@/hooks/useProfile';
import { PLANS } from '@/lib/stripe/plans';

export default function ProDashboard() {
  const { loading: subLoading, error, subscribePro } = useSubscription();
  const { profile, reports, searchCount, loading: profileLoading, isPro } = useProfile();

  const loading = subLoading || profileLoading;
  const monthlyLimit = isPro ? Infinity : 10;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="font-[family-name:var(--font-instrument-serif)] text-3xl text-text-primary mb-2">
        Bedrock Pro
      </h1>
      <p className="text-text-secondary mb-8">
        {isPro
          ? 'Your professional dashboard for unlimited environmental exposure reports.'
          : 'Unlimited environmental exposure reports for real estate professionals.'}
      </p>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Plan card */}
        <Card>
          <CardContent className="py-8">
            {isPro ? (
              <div className="text-center mb-6">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium mb-3">
                  Active Subscription
                </div>
                <p className="text-sm text-text-secondary">
                  You have unlimited access to all reports and features.
                </p>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <p className="text-sm text-text-secondary mb-1">Professional Plan</p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="font-[family-name:var(--font-instrument-serif)] text-5xl text-text-primary">
                      ${PLANS.proMonthly.price}
                    </span>
                    <span className="text-text-tertiary">/month</span>
                  </div>
                  <p className="text-sm text-text-tertiary mt-1">Cancel anytime</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {PLANS.proMonthly.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-text-primary">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>

                <Button size="lg" className="w-full" loading={loading} onClick={subscribePro}>
                  Start free trial
                </Button>
                {error && (
                  <p className="text-sm text-exposure-high mt-2 text-center">{error}</p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Right column: Reports + Account */}
        <div>
          {/* Quick search */}
          <div className="mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-md)] bg-accent text-white hover:bg-accent-hover transition-colors text-sm font-medium w-full justify-center"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              Search new address
            </Link>
          </div>

          {/* Saved reports */}
          <h2 className="text-lg font-semibold text-text-primary mb-4">Saved Reports</h2>
          <Card>
            <CardContent className="py-4">
              {reports.length === 0 ? (
                <div className="py-8 text-center">
                  <svg className="mx-auto mb-3 text-text-tertiary" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <path d="M14 2v6h6" />
                  </svg>
                  <p className="text-sm text-text-secondary">
                    No saved reports yet. Search an address to generate your first report.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {reports.map((report) => (
                    <li key={report.id}>
                      <Link
                        href={`/report/${report.assessment_id}`}
                        className="flex items-center justify-between py-3 hover:bg-bg-elevated -mx-4 px-4 rounded-[var(--radius-md)] transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-text-primary truncate">
                            {report.address_normalized || 'Unknown address'}
                          </p>
                          <p className="text-xs text-text-tertiary">
                            {new Date(report.created_at).toLocaleDateString()} · {report.report_type}
                          </p>
                        </div>
                        {report.composite_score != null && (
                          <span className="ml-3 text-sm font-medium text-text-primary">
                            {report.composite_score.toFixed(0)}/100
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Account */}
          <h2 className="text-lg font-semibold text-text-primary mt-8 mb-4">Account</h2>
          <Card>
            <CardContent className="py-4">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Plan</span>
                  <span className="text-text-primary font-medium">
                    {isPro ? (
                      <span className="text-accent">Pro</span>
                    ) : 'Free'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Reports this month</span>
                  <span className="text-text-primary font-medium">
                    {searchCount} / {isPro ? '∞' : monthlyLimit}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Reports purchased</span>
                  <span className="text-text-primary font-medium">
                    {profile?.reports_purchased ?? 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Saved reports</span>
                  <span className="text-text-primary font-medium">
                    {reports.length}
                  </span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-border">
                <Link
                  href="/pro/settings"
                  className="text-sm text-accent hover:text-accent-hover font-medium"
                >
                  Manage settings →
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
