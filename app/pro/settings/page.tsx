'use client';

import { Card, CardContent, Button } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';

export default function ProSettingsPage() {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="font-[family-name:var(--font-instrument-serif)] text-3xl text-text-primary mb-8">
        Settings
      </h1>

      <div className="space-y-6">
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
