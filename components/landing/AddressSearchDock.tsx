'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

interface AddressSearchDockProps {
  variant?: 'hero' | 'cta';
}

export function AddressSearchDock({ variant = 'hero' }: AddressSearchDockProps) {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!address.trim()) return;
    setLoading(true);
    router.push(`/report/search?address=${encodeURIComponent(address.trim())}`);
  }

  const onDark = variant === 'hero';

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative">
        <svg
          className={`absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 pointer-events-none ${onDark ? 'text-white/70' : 'text-text-tertiary'}`}
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
          className={`w-full pl-12 sm:pl-14 pr-36 sm:pr-44 py-4 sm:py-5 rounded-[var(--radius-lg)] border text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-accent transition-shadow ${
            onDark
              ? 'border-white/30 bg-white/10 text-white placeholder:text-white/60 backdrop-blur-sm'
              : 'border-border bg-bg-surface text-text-primary placeholder:text-text-tertiary'
          }`}
          aria-label="Property address"
          autoComplete="street-address"
        />
        <button
          type="submit"
          disabled={loading || !address.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-[var(--radius-md)] bg-accent text-white text-sm sm:text-base font-medium hover:bg-accent-hover disabled:opacity-40 transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
        >
          {loading ? 'Scanning…' : 'Check exposure'}
        </button>
      </div>
      <p className={`mt-3 text-sm ${onDark ? 'text-white/70' : 'text-text-tertiary'}`}>
        Free for any U.S. address. No account required.
      </p>
    </form>
  );
}
