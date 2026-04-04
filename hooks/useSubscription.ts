'use client';

import { useState, useCallback } from 'react';

interface UseSubscriptionResult {
  loading: boolean;
  error: string | null;
  purchaseReport: (assessmentId: string) => Promise<void>;
  subscribePro: () => Promise<void>;
}

export function useSubscription(): UseSubscriptionResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const purchaseReport = useCallback(async (assessmentId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'consumerReport', assessmentId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Could not create checkout session');
      }
    } catch {
      setError('Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  }, []);

  const subscribePro = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'proMonthly' }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Could not create checkout session');
      }
    } catch {
      setError('Failed to initiate subscription');
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, purchaseReport, subscribePro };
}
