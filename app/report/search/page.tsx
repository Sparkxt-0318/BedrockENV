'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import { useExposureAssessment } from '@/hooks/useExposureAssessment';
import { Card, CardContent } from '@/components/ui';
import { Skeleton } from '@/components/ui';
import { ExposureReportView } from '@/components/report/ExposureReportView';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function ReportSearchContent() {
  const searchParams = useSearchParams();
  const address = searchParams.get('address') || '';
  const { assessment, loading, error, warnings, fetchAssessment } =
    useExposureAssessment();

  useEffect(() => {
    if (address) {
      fetchAssessment(address);
    }
  }, [address, fetchAssessment]);

  if (!address) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold text-text-primary mb-4">
          No address provided
        </h1>
        <p className="text-text-secondary">
          Please enter an address on the home page to generate an exposure report.
        </p>
      </div>
    );
  }

  if (loading) {
    return <LoadingSkeleton address={address} />;
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16">
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-exposure-high text-4xl mb-4">!</div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">
              Could not generate report
            </h2>
            <p className="text-text-secondary mb-4">{error}</p>
            {warnings.length > 0 && (
              <ul className="text-sm text-text-tertiary space-y-1">
                {warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (assessment) {
    return <ExposureReportView assessment={assessment} warnings={warnings} />;
  }

  return null;
}

function LoadingSkeleton({ address }: { address: string }) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="font-[family-name:var(--font-instrument-serif)] text-3xl text-text-primary mb-2">
          Scanning federal databases...
        </h1>
        <p className="text-text-secondary">
          Analyzing environmental exposure for: <strong>{address}</strong>
        </p>
      </div>
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}

export default function ReportSearchPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingSkeleton address="..." />}>
        <ReportSearchContent />
      </Suspense>
    </ErrorBoundary>
  );
}
