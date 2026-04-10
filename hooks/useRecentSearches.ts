'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface RecentSearch {
  id: string;
  address_searched: string;
  assessment_id: string | null;
  searched_at: string;
}

/**
 * Hook to fetch and manage the current user's recent searches.
 * Falls back to localStorage for anonymous users.
 */
export function useRecentSearches(limit = 5) {
  const [searches, setSearches] = useState<RecentSearch[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSearches = useCallback(async () => {
    setLoading(true);

    const supabase = createClient();
    if (supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from('search_log')
            .select('id, address_searched, assessment_id, searched_at')
            .eq('user_id', user.id)
            .order('searched_at', { ascending: false })
            .limit(limit);

          if (data && data.length > 0) {
            setSearches(data);
            setLoading(false);
            return;
          }
        }
      } catch {
        // Fall through to localStorage
      }
    }

    // Anonymous fallback: read from localStorage
    try {
      const stored = localStorage.getItem('bedrock_recent_searches');
      if (stored) {
        const parsed = JSON.parse(stored) as RecentSearch[];
        setSearches(parsed.slice(0, limit));
      }
    } catch {
      // Ignore parse errors
    }

    setLoading(false);
  }, [limit]);

  useEffect(() => {
    // Defer to a microtask so we don't trigger setState synchronously
    // inside the effect body (fetchSearches starts with setLoading(true)).
    queueMicrotask(() => {
      void fetchSearches();
    });
  }, [fetchSearches]);

  const addSearch = useCallback((address: string, assessmentId?: string) => {
    const entry: RecentSearch = {
      id: crypto.randomUUID(),
      address_searched: address,
      assessment_id: assessmentId || null,
      searched_at: new Date().toISOString(),
    };

    // Update localStorage for anonymous users
    try {
      const stored = localStorage.getItem('bedrock_recent_searches');
      const existing = stored ? JSON.parse(stored) as RecentSearch[] : [];
      // Deduplicate by address
      const filtered = existing.filter(
        s => s.address_searched.toLowerCase() !== address.toLowerCase()
      );
      const updated = [entry, ...filtered].slice(0, 10);
      localStorage.setItem('bedrock_recent_searches', JSON.stringify(updated));
      setSearches(updated.slice(0, limit));
    } catch {
      // localStorage unavailable
    }
  }, [limit]);

  const clearSearches = useCallback(async () => {
    try {
      localStorage.removeItem('bedrock_recent_searches');
    } catch {
      // Ignore
    }

    const supabase = createClient();
    if (supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('search_log')
            .delete()
            .eq('user_id', user.id);
        }
      } catch {
        // Non-fatal
      }
    }

    setSearches([]);
  }, []);

  return { searches, loading, addSearch, clearSearches, refetch: fetchSearches };
}
