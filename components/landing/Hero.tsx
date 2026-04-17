'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export function Hero() {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!address.trim()) return;
    setLoading(true);
    router.push(`/report/search?address=${encodeURIComponent(address.trim())}`);
  }

  return (
    <section className="relative flex flex-col justify-end min-h-[90vh] px-4 sm:px-6 lg:px-8 pb-16 sm:pb-24">
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="font-[family-name:var(--font-display)] text-[clamp(2.5rem,6vw,5rem)] leading-[1.08] tracking-[-0.02em] text-text-primary">
          Know what you&rsquo;re breathing, drinking, and standing on.
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-text-secondary leading-relaxed max-w-xl">
          Bedrock scans 15 federal databases and scores the environmental
          exposure at any U.S. address.
        </p>

        <form onSubmit={handleSubmit} className="mt-10">
          <div className="relative">
            <svg
              className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter any U.S. address"
              className="w-full pl-12 sm:pl-14 pr-36 sm:pr-44 py-4 sm:py-5 rounded-[var(--radius-lg)] border border-border bg-bg-surface text-text-primary text-base sm:text-lg placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
              aria-label="Property address"
              autoComplete="street-address"
            />
            <button
              type="submit"
              disabled={loading || !address.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-[var(--radius-md)] bg-accent text-white text-sm sm:text-base font-medium hover:bg-accent-hover disabled:opacity-40 transition-colors"
            >
              {loading ? 'Scanning…' : 'Check exposure'}
            </button>
          </div>
          <p className="mt-3 text-sm text-text-tertiary">
            Free for any U.S. address. No account required.
          </p>
        </form>
      </div>
    </section>
  );
}
