import type { Metadata } from 'next';

interface ReportPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ReportPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Exposure Report ${id}`,
    description: 'Environmental exposure report powered by Bedrock.',
  };
}

/**
 * /report/[id] — Saved report page.
 *
 * In production, this would fetch a saved report from Supabase by ID.
 * For MVP, reports are generated live via /report/search.
 * This page serves as the placeholder for persistent report URLs.
 */
export default async function ReportPage({ params }: ReportPageProps) {
  const { id } = await params;

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 text-center">
      <h1 className="font-[family-name:var(--font-instrument-serif)] text-3xl text-text-primary mb-4">
        Report {id}
      </h1>
      <p className="text-text-secondary mb-6">
        Saved report viewing will be available when Supabase is connected.
        For now, generate a live report by searching an address on the home page.
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
