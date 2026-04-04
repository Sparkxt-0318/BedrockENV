'use client';

import { Button, Card, CardContent } from '@/components/ui';
import { useSubscription } from '@/hooks/useSubscription';
import { PLANS } from '@/lib/stripe/plans';

export default function ProDashboard() {
  const { loading, error, subscribePro } = useSubscription();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="font-[family-name:var(--font-instrument-serif)] text-3xl text-text-primary mb-2">
        Bedrock Pro
      </h1>
      <p className="text-text-secondary mb-8">
        Unlimited environmental exposure reports for real estate professionals.
      </p>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Plan card */}
        <Card>
          <CardContent className="py-8">
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
          </CardContent>
        </Card>

        {/* Saved reports */}
        <div>
          <h2 className="text-lg font-semibold text-text-primary mb-4">Saved Reports</h2>
          <Card>
            <CardContent className="py-12 text-center">
              <svg className="mx-auto mb-3 text-text-tertiary" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <path d="M14 2v6h6" />
              </svg>
              <p className="text-sm text-text-secondary">
                No saved reports yet. Search an address to generate your first report.
              </p>
              <a
                href="/"
                className="inline-flex items-center mt-4 px-4 py-2 rounded-[var(--radius-md)] bg-accent text-white hover:bg-accent-hover transition-colors text-sm font-medium"
              >
                Search an address
              </a>
            </CardContent>
          </Card>

          <h2 className="text-lg font-semibold text-text-primary mt-8 mb-4">Account</h2>
          <Card>
            <CardContent className="py-4">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Plan</span>
                  <span className="text-text-primary font-medium">Free</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Reports this month</span>
                  <span className="text-text-primary font-medium">0 / 10</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Reports purchased</span>
                  <span className="text-text-primary font-medium">0</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
