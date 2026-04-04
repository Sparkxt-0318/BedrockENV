'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { RecentSearches } from '@/components/RecentSearches';

export function Hero() {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!address.trim()) return;
    setLoading(true);
    // For now, encode address and redirect to a placeholder report page
    const encoded = encodeURIComponent(address.trim());
    router.push(`/report/search?address=${encoded}`);
  }

  return (
    <section className="relative overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-accent-light/30 to-transparent pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
        <div className="mx-auto max-w-3xl text-center">
          {/* Headline */}
          <h1 className="font-[family-name:var(--font-instrument-serif)] text-4xl sm:text-5xl lg:text-6xl text-text-primary leading-[1.1] tracking-tight">
            What&apos;s really in your{' '}
            <span className="text-accent">water</span> and{' '}
            <span className="text-accent">soil</span>?
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-text-secondary leading-relaxed max-w-2xl mx-auto">
            Bedrock scans 10+ federal databases to show you exactly what contaminants
            affect your address — and what to do about it.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSubmit} className="mt-10 flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
            <div className="relative flex-1">
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter your address..."
                className="w-full pl-11 pr-4 py-3.5 rounded-[var(--radius-lg)] border border-border bg-bg-surface text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent text-base shadow-sm"
                aria-label="Property address"
              />
            </div>
            <Button type="submit" size="lg" loading={loading} className="shadow-sm whitespace-nowrap">
              Check my exposure
            </Button>
          </form>

          <p className="mt-4 text-sm text-text-tertiary">
            Free for any U.S. address. No account required.
          </p>

          {/* Recent searches */}
          <RecentSearches />
        </div>
      </div>
    </section>
  );
}
