import { Card, CardContent } from '@/components/ui';

interface NarrativeSummaryProps {
  narrative: string;
  loading?: boolean;
}

export function NarrativeSummary({ narrative, loading }: NarrativeSummaryProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-4 w-4 rounded-full bg-accent animate-pulse" />
            <p className="text-sm text-text-secondary">Generating summary...</p>
          </div>
          <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-bg-elevated rounded w-full" />
            <div className="h-4 bg-bg-elevated rounded w-11/12" />
            <div className="h-4 bg-bg-elevated rounded w-10/12" />
            <div className="h-4 bg-bg-elevated rounded w-0" />
            <div className="h-4 bg-bg-elevated rounded w-full" />
            <div className="h-4 bg-bg-elevated rounded w-9/12" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!narrative) return null;

  const paragraphs = narrative.split('\n\n').filter(Boolean);

  return (
    <Card>
      <CardContent className="py-6">
        <div className="flex items-center gap-2 mb-4">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <path d="M14 2v6h6" />
            <path d="M16 13H8" />
            <path d="M16 17H8" />
            <path d="M10 9H8" />
          </svg>
          <h3 className="text-sm font-medium text-text-secondary">
            AI-Generated Summary
          </h3>
        </div>
        <div className="space-y-4">
          {paragraphs.map((p, i) => (
            <p key={i} className="text-text-primary leading-relaxed text-[15px]">
              {p}
            </p>
          ))}
        </div>
        <p className="mt-4 text-xs text-text-tertiary">
          This summary describes the data. Recommendations below are expert-sourced, not AI-generated.
        </p>
      </CardContent>
    </Card>
  );
}
