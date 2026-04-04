import type { Metadata } from 'next';
import { Card, CardContent } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Settings',
};

export default function ProSettingsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="font-[family-name:var(--font-instrument-serif)] text-3xl text-text-primary mb-8">
        Settings
      </h1>

      <div className="space-y-6">
        {/* Subscription */}
        <Card>
          <CardContent className="py-5">
            <h2 className="font-semibold text-text-primary mb-3">Subscription</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Current plan</span>
                <span className="text-text-primary font-medium">Free</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Billing</span>
                <span className="text-text-tertiary">No active subscription</span>
              </div>
            </div>
            <a
              href="/pro"
              className="inline-flex items-center mt-4 px-4 py-2 rounded-[var(--radius-md)] bg-accent text-white hover:bg-accent-hover transition-colors text-sm font-medium"
            >
              Upgrade to Pro
            </a>
          </CardContent>
        </Card>

        {/* Profile */}
        <Card>
          <CardContent className="py-5">
            <h2 className="font-semibold text-text-primary mb-3">Profile</h2>
            <p className="text-sm text-text-tertiary">
              Profile management will be available when Supabase authentication is connected.
            </p>
          </CardContent>
        </Card>

        {/* Data & Privacy */}
        <Card>
          <CardContent className="py-5">
            <h2 className="font-semibold text-text-primary mb-3">Data &amp; Privacy</h2>
            <ul className="text-sm text-text-secondary space-y-2">
              <li>Bedrock does not store or transmit health information.</li>
              <li>Search history is stored only for authenticated users and can be deleted.</li>
              <li>Anonymous searches are tracked by IP hash for rate limiting only.</li>
              <li>Environmental data is sourced exclusively from public federal databases.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
