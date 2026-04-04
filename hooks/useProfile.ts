'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './useAuth';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  user_type: string;
  subscription_tier: 'free' | 'pro';
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  reports_purchased: number;
  created_at: string;
  updated_at: string;
}

export interface SavedReport {
  id: string;
  assessment_id: string;
  report_type: string;
  created_at: string;
  // Joined from exposure_assessments
  address_normalized?: string;
  composite_score?: number;
}

export function useProfile() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [searchCount, setSearchCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setReports([]);
      setSearchCount(0);
      setLoading(false);
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData as UserProfile);
      }

      // Fetch saved reports (with assessment address via join)
      const { data: reportData } = await supabase
        .from('reports')
        .select(`
          id,
          assessment_id,
          report_type,
          created_at,
          exposure_assessments (
            address_normalized,
            composite_score
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (reportData) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setReports(reportData.map((r: any) => ({
          id: r.id,
          assessment_id: r.assessment_id,
          report_type: r.report_type,
          created_at: r.created_at,
          address_normalized: r.exposure_assessments?.address_normalized,
          composite_score: r.exposure_assessments?.composite_score
            ? Number(r.exposure_assessments.composite_score)
            : undefined,
        })));
      }

      // Fetch search count this month
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const { count } = await supabase
        .from('search_log')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('searched_at', monthStart.toISOString());

      setSearchCount(count || 0);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      fetchProfile();
    }
  }, [authLoading, fetchProfile]);

  return {
    profile,
    reports,
    searchCount,
    loading: authLoading || loading,
    refetch: fetchProfile,
    isPro: profile?.subscription_tier === 'pro',
  };
}
