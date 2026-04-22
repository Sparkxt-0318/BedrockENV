'use client';

// All reports are free. This hook always returns unlocked.
export function useReportAccess(_assessmentId: string | undefined) {
  return { unlocked: true, reason: 'free' as const, loading: false };
}
