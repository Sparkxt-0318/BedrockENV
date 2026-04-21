import type { Metadata } from 'next';
import Link from 'next/link';
import { Display, Body, Label } from '@/components/ui/Type';
import { Card, CardContent } from '@/components/ui/Card';

export const metadata: Metadata = {
  title: 'Environmental Intelligence | Bedrock',
  description:
    "Research briefs and analysis from Bedrock's environmental data platform.",
};

const briefs = [
  {
    title: 'Soil Contamination Vulnerability Index',
    description:
      'County-level soil contamination vulnerability scores across all 3,140+ US counties, combining soil vulnerability with contamination pressure indicators.',
    status: 'Published' as const,
    href: '/intelligence/soil-crisis',
  },
  {
    title: 'Flood-Contamination Compound Risk Map',
    description:
      'National map of counties where FEMA flood exposure intersects with EPA contamination pressure — the compound risk neither agency publishes.',
    status: 'Published' as const,
    href: '/intelligence/flood-contamination',
  },
  {
    title: 'Water System Risk Atlas',
    description:
      'Nationwide assessment of public water system risk factors including PFAS detection, violation history, and infrastructure age.',
    status: 'Coming Soon' as const,
    href: null,
  },
  {
    title: 'Air Quality Trends',
    description:
      'Multi-year analysis of PM2.5, ozone, and nonattainment trends at the county level using EPA AQS and OpenAQ monitoring data.',
    status: 'Coming Soon' as const,
    href: null,
  },
];

function StatusIndicator({ status }: { status: 'Published' | 'Processing' | 'Coming Soon' }) {
  if (status === 'Published') {
    return (
      <span className="inline-flex items-center px-2.5 py-1 text-[11px] font-[family-name:var(--font-mono)] font-medium rounded-[var(--radius-sm)] bg-accent/10 text-accent">
        {status}
      </span>
    );
  }

  if (status === 'Processing') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-[family-name:var(--font-mono)] font-medium rounded-[var(--radius-sm)] bg-accent/10 text-accent">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
        </span>
        {status}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2.5 py-1 text-[11px] font-[family-name:var(--font-mono)] font-medium rounded-[var(--radius-sm)] bg-bg-elevated text-text-secondary">
      {status}
    </span>
  );
}

export default function IntelligencePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <Display className="text-4xl mb-4">Environmental Intelligence</Display>
      <Body className="text-lg mb-12">
        Research briefs derived from national environmental datasets. Each brief
        synthesizes federal data sources into actionable county-level and
        regional analysis, updated as new data becomes available.
      </Body>

      <section>
        <Label as="h2" className="mb-4 block">Research Briefs</Label>
        <div className="grid gap-4">
          {briefs.map((brief) => {
            const content = (
              <Card key={brief.title} className="transition-colors hover:border-border-strong">
                <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-text-primary mb-1">
                      {brief.title}
                    </h3>
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {brief.description}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <StatusIndicator status={brief.status} />
                  </div>
                </CardContent>
              </Card>
            );

            if (brief.href) {
              return (
                <Link key={brief.title} href={brief.href} className="block">
                  {content}
                </Link>
              );
            }

            return content;
          })}
        </div>
      </section>
    </div>
  );
}
