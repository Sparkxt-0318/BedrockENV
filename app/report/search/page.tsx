'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { useExposureAssessment } from '@/hooks/useExposureAssessment';
import { useReportAccess } from '@/hooks/useReportAccess';
import { Card, CardContent, Skeleton } from '@/components/ui';
import { ExposureReportView } from '@/components/report/ExposureReportView';
import { ShowcaseReport } from '@/components/report/showcase/ShowcaseReport';
import { ShowcaseIntro } from '@/components/report/showcase/ShowcaseIntro';
import { FreePreviewOverlay } from '@/components/report/FreePreviewOverlay';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import type { TriggeredRecommendation } from '@/lib/recommendations/types';

function ReportSearchContent() {
  const searchParams = useSearchParams();
  const address = searchParams.get('address') || '';
  const mode = searchParams.get('mode') || 'showcase';
  const { assessment, loading, error, warnings, fetchAssessment } =
    useExposureAssessment();
  const [recommendations, setRecommendations] = useState<TriggeredRecommendation[]>([]);
  const { unlocked, loading: accessLoading } = useReportAccess(assessment?.id);

  useEffect(() => {
    if (address) {
      fetchAssessment(address);
    }
  }, [address, fetchAssessment]);

  useEffect(() => {
    if (!assessment || !unlocked) return;
    fetch('/api/generate-narrative', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assessment }),
    })
      .then((res) => res.json())
      .then((data) => setRecommendations(data.recommendations || []))
      .catch(() => setRecommendations([]));
  }, [assessment, unlocked]);

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

  if (loading || accessLoading) {
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

  if (!assessment) return null;

  if (!unlocked) {
    const topFinding = getTopFinding(assessment);
    return (
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <ShowcaseIntro assessment={assessment} />
        <FreePreviewOverlay assessmentId={assessment.id} topFinding={topFinding} />
      </div>
    );
  }

  if (mode === 'doc') {
    return <ExposureReportView assessment={assessment} warnings={warnings} />;
  }

  return (
    <ShowcaseReport assessment={assessment} recommendations={recommendations} />
  );
}

function getTopFinding(assessment: import('@/types/exposure').ExposureAssessment): string | undefined {
  const { compositeScore } = assessment;
  const layers = compositeScore.layersIncluded;
  let highestLayer = layers[0];
  let highestScore = 0;
  for (const layer of layers) {
    const ls = compositeScore.layerScores[layer];
    if (ls && ls.available && ls.score > highestScore) {
      highestScore = ls.score;
      highestLayer = layer;
    }
  }
  const labels: Record<string, string> = {
    water: 'Water contamination',
    air: 'Air quality concerns',
    proximity: 'Toxic facility proximity',
    soil: 'Soil & land risks',
    ej: 'Environmental justice burden',
  };
  if (highestScore > 0) {
    return `${labels[highestLayer] || highestLayer} scored ${highestScore}/100 — highest risk layer detected.`;
  }
  return undefined;
}

function LoadingSkeleton({ address }: { address: string }) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-text-primary mb-2">
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
