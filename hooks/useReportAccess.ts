'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './useAuth';

interface ReportAccess {
  unlocked: boolean;
  reason: 'pro' | 'purchased' | 'locked';
  loading: boolean;
}

export function useReportAccess(assessmentId: string | undefined): ReportAccess {
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<ReportAccess>({
    unlocked: false,
    reason: 'locked',
    loading: true,
  });

  useEffect(() => {
    if (authLoading) return;

    async function check() {
      if (!user || !assessmentId) {
        setState({ unlocked: false, reason: 'locked', loading: false });
        return;
      }

      const supabase = createClient();
      if (!supabase) {
        setState({ unlocked: false, reason: 'locked', loading: false });
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', user.id)
        .single();

      if (profile?.subscription_tier === 'pro') {
        setState({ unlocked: true, reason: 'pro', loading: false });
        return;
      }

      const { data: report } = await supabase
        .from('reports')
        .select('id')
        .eq('user_id', user.id)
        .eq('assessment_id', assessmentId)
        .in('report_type', ['consumer', 'pro'])
        .limit(1)
        .maybeSingle();

      if (report) {
        setState({ unlocked: true, reason: 'purchased', loading: false });
        return;
      }

      setState({ unlocked: false, reason: 'locked', loading: false });
    }

    check();
  }, [user, authLoading, assessmentId]);

  return state;
}
