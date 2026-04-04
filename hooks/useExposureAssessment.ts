'use client';

import { useState, useCallback } from 'react';
import { ExposureAssessment } from '@/types/exposure';

interface UseExposureAssessmentResult {
  assessment: ExposureAssessment | null;
  loading: boolean;
  error: string | null;
  warnings: string[];
  fetchAssessment: (address: string) => Promise<void>;
}

export function useExposureAssessment(): UseExposureAssessmentResult {
  const [assessment, setAssessment] = useState<ExposureAssessment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const fetchAssessment = useCallback(async (address: string) => {
    setLoading(true);
    setError(null);
    setWarnings([]);
    setAssessment(null);

    try {
      const encoded = encodeURIComponent(address);
      const response = await fetch(`/api/exposure-assessment?address=${encoded}`);
      const json = await response.json();

      if (!response.ok) {
        setError(json.error || 'Failed to fetch exposure assessment.');
        if (json.details) setWarnings(json.details);
        return;
      }

      setAssessment(json.data);
      if (json.warnings) setWarnings(json.warnings);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An unexpected error occurred.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  return { assessment, loading, error, warnings, fetchAssessment };
}
