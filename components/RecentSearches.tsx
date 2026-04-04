'use client';

import Link from 'next/link';
import { useRecentSearches } from '@/hooks/useRecentSearches';

/**
 * Displays recent address searches for the current user.
 * Shows authenticated search history from Supabase or localStorage for anon users.
 */
export function RecentSearches() {
  const { searches, loading, clearSearches } = useRecentSearches(5);

  if (loading || searches.length === 0) return null;

  return (
    <div className="w-full max-w-xl mx-auto mt-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
          Recent Searches
        </h3>
        <button
          onClick={clearSearches}
          className="text-xs text-text-tertiary hover:text-text-secondary transition-colors"
        >
          Clear
        </button>
      </div>
      <ul className="space-y-1">
        {searches.map((s) => (
          <li key={s.id}>
            <Link
              href={`/report/search?address=${encodeURIComponent(s.address_searched)}`}
              className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] hover:bg-bg-elevated transition-colors group"
            >
              <svg
                className="flex-shrink-0 text-text-tertiary group-hover:text-accent transition-colors"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors truncate">
                {s.address_searched}
              </span>
              <span className="ml-auto text-xs text-text-tertiary flex-shrink-0">
                {formatRelativeDate(s.searched_at)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatRelativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}
