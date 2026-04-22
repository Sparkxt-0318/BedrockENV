'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, loading, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg-surface/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-accent">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 22L12 2l10 20H2z" />
              <path d="M12 18v-6" />
              <path d="M8 14h8" />
            </svg>
          </div>
          <span className="text-lg font-semibold text-text-primary font-[family-name:var(--font-display)]">
            Bedrock
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 md:flex">
          <Link href="/intelligence" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
            Intelligence
          </Link>
          <Link href="/methodology" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
            Methodology
          </Link>
          <Link href="/about" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
            About
          </Link>
          <div className="h-5 w-px bg-border" />
          {!loading && (
            user ? (
              <>
                <span className="text-sm text-text-secondary truncate max-w-[160px]">
                  {user.email}
                </span>
                <Button variant="ghost" size="sm" onClick={signOut}>
                  Log out
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">Log in</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm">Get started</Button>
                </Link>
              </>
            )
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 text-text-secondary"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {mobileOpen ? (
              <>
                <path d="M6 6l12 12" />
                <path d="M6 18L18 6" />
              </>
            ) : (
              <>
                <path d="M3 12h18" />
                <path d="M3 6h18" />
                <path d="M3 18h18" />
              </>
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border bg-bg-surface px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            <Link href="/intelligence" className="text-sm text-text-secondary py-2" onClick={() => setMobileOpen(false)}>
              Intelligence
            </Link>
            <Link href="/methodology" className="text-sm text-text-secondary py-2" onClick={() => setMobileOpen(false)}>
              Methodology
            </Link>
            <Link href="/about" className="text-sm text-text-secondary py-2" onClick={() => setMobileOpen(false)}>
              About
            </Link>
            <div className="h-px bg-border my-1" />
            {user ? (
              <>
                <p className="text-sm text-text-secondary py-1 truncate">{user.email}</p>
                <Button variant="secondary" size="sm" className="w-full" onClick={() => { signOut(); setMobileOpen(false); }}>
                  Log out
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/login" onClick={() => setMobileOpen(false)}>
                  <Button variant="secondary" size="sm" className="w-full">Log in</Button>
                </Link>
                <Link href="/auth/signup" onClick={() => setMobileOpen(false)}>
                  <Button size="sm" className="w-full">Get started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
