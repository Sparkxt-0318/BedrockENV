import type { Metadata } from 'next';

interface ReportPageProps {
  params: Promise<{ id: string }>;
}

// ISR: revalidate cached reports every hour
export const revalidate = 3600;

export async function generateMetadata({ params }: ReportPageProps): Promise<Metadata> {
  const { id } = await params;

  // Try to fetch assessment from Supabase for richer metadata
  let title = `Exposure Report ${id.slice(0, 8)}`;
  let description = 'Environmental exposure report powered by Bedrock.';

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/exposure_assessments?id=eq.${id}&select=address_normalized,composite_score`,
        {
          headers: {
            apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          },
          next: { revalidate: 3600 },
        }
      );
      const data = await res.json();
      if (data?.[0]) {
        title = `Exposure Report — ${data[0].address_normalized}`;
        description = `Environmental exposure score: ${data[0].composite_score}/100. Powered by EPA, USDA, NASA, FEMA, and Census data.`;
      }
    } catch {
      // Use default metadata
    }
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
    },
  };
}

/**
 * /report/[id] — Saved report page.
 *
 * Fetches a cached assessment from Supabase by ID.
 * Uses ISR (revalidate every hour) for cached reports.
 */
export default async function ReportPage({ params }: ReportPageProps) {
  const { id } = await params;

  // Attempt to load cached assessment from Supabase via REST API
  let assessment = null;
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/exposure_assessments?id=eq.${id}&select=*`,
        {
          headers: {
            apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          },
          next: { revalidate: 3600 },
        }
      );
      const data = await res.json();
      if (data?.[0]) {
        assessment = data[0];
      }
    } catch {
      // Will show fallback
    }
  }

  if (!assessment) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 text-center">
        <h1 className="font-[family-name:var(--font-instrument-serif)] text-3xl text-text-primary mb-4">
          Report not found
        </h1>
        <p className="text-text-secondary mb-6">
          This report may have expired or does not exist.
          Generate a new report by searching an address.
        </p>
        <a
          href="/"
          className="inline-flex items-center px-4 py-2 rounded-[var(--radius-md)] bg-accent text-white hover:bg-accent-hover transition-colors text-sm font-medium"
        >
          Search an address
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <p className="text-sm text-text-tertiary mb-1">Saved Report</p>
      <h1 className="font-[family-name:var(--font-instrument-serif)] text-2xl sm:text-3xl text-text-primary mb-2">
        {assessment.address_normalized}
      </h1>
      <div className="flex items-center gap-4 text-sm text-text-secondary mb-8">
        <span>{assessment.latitude.toFixed(4)}, {assessment.longitude.toFixed(4)}</span>
        <span>Score: <strong className="text-text-primary">{assessment.composite_score}/100</strong></span>
        <span>Generated: {new Date(assessment.created_at).toLocaleDateString()}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {assessment.water_score != null && (
          <div className="p-4 rounded-[var(--radius-md)] border border-border bg-bg-surface">
            <p className="text-sm text-text-secondary mb-1">Water Contamination</p>
            <p className="text-2xl font-semibold text-text-primary">{Number(assessment.water_score).toFixed(0)}/100</p>
            <p className="text-xs text-text-tertiary mt-1">Confidence: {assessment.water_confidence}</p>
          </div>
        )}
        {assessment.soil_score != null && (
          <div className="p-4 rounded-[var(--radius-md)] border border-border bg-bg-surface">
            <p className="text-sm text-text-secondary mb-1">Soil Health</p>
            <p className="text-2xl font-semibold text-text-primary">{Number(assessment.soil_score).toFixed(0)}/100</p>
            <p className="text-xs text-text-tertiary mt-1">Confidence: {assessment.soil_confidence}</p>
          </div>
        )}
      </div>

      <p className="text-sm text-text-secondary">
        For the full interactive report with AI narrative, recommendations, and map, {' '}
        <a
          href={`/report/search?address=${encodeURIComponent(assessment.address_raw)}`}
          className="text-accent hover:text-accent-hover font-medium"
        >
          generate a live report
        </a>.
      </p>
    </div>
  );
}
