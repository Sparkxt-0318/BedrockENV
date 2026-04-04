'use client';

import { useState } from 'react';
import { Card, CardContent, Button } from '@/components/ui';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';

export default function ProSettingsPage() {
  const { profile, loading, isPro } = useProfile();
  const { user, signOut } = useAuth();
  const [manageLoading, setManageLoading] = useState(false);

  async function handleManageSubscription() {
    if (!profile?.stripe_customer_id) return;
    setManageLoading(true);
    try {
      const res = await fetch('/api/billing-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      // Non-fatal
    } finally {
      setManageLoading(false);
    }
  }

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
                <span className="text-text-primary font-medium">
                  {loading ? '...' : isPro ? (
                    <span className="text-accent">Pro ($99/mo)</span>
                  ) : 'Free'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Billing</span>
                <span className="text-text-tertiary">
                  {loading ? '...' : isPro ? 'Active — managed via Stripe' : 'No active subscription'}
                </span>
              </div>
              {profile?.reports_purchased != null && profile.reports_purchased > 0 && (
                <div className="flex justify-between">
                  <span className="text-text-secondary">Reports purchased</span>
                  <span className="text-text-primary font-medium">{profile.reports_purchased}</span>
                </div>
              )}
            </div>
            <div className="mt-4 flex gap-3">
              {isPro && profile?.stripe_customer_id ? (
                <Button
                  variant="secondary"
                  loading={manageLoading}
                  onClick={handleManageSubscription}
                >
                  Manage subscription
                </Button>
              ) : (
                <a
                  href="/pro"
                  className="inline-flex items-center px-4 py-2 rounded-[var(--radius-md)] bg-accent text-white hover:bg-accent-hover transition-colors text-sm font-medium"
                >
                  Upgrade to Pro
                </a>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Profile */}
        <Card>
          <CardContent className="py-5">
            <h2 className="font-semibold text-text-primary mb-3">Profile</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Email</span>
                <span className="text-text-primary">{user?.email || 'Not signed in'}</span>
              </div>
              {profile?.full_name && (
                <div className="flex justify-between">
                  <span className="text-text-secondary">Name</span>
                  <span className="text-text-primary">{profile.full_name}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-text-secondary">Account type</span>
                <span className="text-text-primary capitalize">{profile?.user_type || 'consumer'}</span>
              </div>
              {profile?.created_at && (
                <div className="flex justify-between">
                  <span className="text-text-secondary">Member since</span>
                  <span className="text-text-primary">
                    {new Date(profile.created_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
            {user && (
              <div className="mt-4 pt-3 border-t border-border">
                <Button variant="ghost" onClick={signOut}>
                  Sign out
                </Button>
              </div>
            )}
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
