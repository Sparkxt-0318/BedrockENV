import Link from 'next/link';

const dataSourceLogos = [
  { name: 'EPA', alt: 'U.S. Environmental Protection Agency' },
  { name: 'USDA', alt: 'U.S. Department of Agriculture' },
  { name: 'NASA', alt: 'National Aeronautics and Space Administration' },
  { name: 'USGS', alt: 'U.S. Geological Survey' },
  { name: 'FEMA', alt: 'Federal Emergency Management Agency' },
  { name: 'Census', alt: 'U.S. Census Bureau' },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Data sources */}
        <div className="mb-8 text-center">
          <p className="text-xs text-text-tertiary uppercase tracking-widest mb-4">
            Powered by federal data from
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            {dataSourceLogos.map((source) => (
              <span
                key={source.name}
                className="text-sm font-medium text-text-secondary"
                title={source.alt}
              >
                {source.name}
              </span>
            ))}
          </div>
        </div>

        <div className="h-px bg-border mb-8" />

        {/* Links */}
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-accent">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 22L12 2l10 20H2z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-text-primary">Bedrock</span>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-sm text-text-secondary">
            <Link href="/methodology" className="hover:text-text-primary transition-colors">
              Methodology
            </Link>
            <Link href="/about" className="hover:text-text-primary transition-colors">
              About
            </Link>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="mt-8 text-center text-xs text-text-tertiary leading-5">
          Bedrock aggregates publicly available environmental data for informational purposes.
          This is not a substitute for professional environmental testing or medical advice.
          Data sourced from EPA, USDA, NASA, USGS, FEMA, and U.S. Census Bureau.
        </p>
      </div>
    </footer>
  );
}
