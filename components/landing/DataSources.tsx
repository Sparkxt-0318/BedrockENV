import { ScrollReveal } from '@/components/ui/ScrollReveal';

const agencies = ['EPA', 'USDA', 'NASA', 'USGS', 'FEMA', 'CDC', 'Census'];

export function DataSources() {
  return (
    <section className="border-t border-border py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.1em] text-text-tertiary text-center">
            Data from
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            {agencies.map((a) => (
              <span
                key={a}
                className="font-[family-name:var(--font-mono)] text-sm font-medium text-text-secondary"
              >
                {a}
              </span>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-text-tertiary max-w-lg mx-auto">
            15 federal data sources. Full resolution transparency.
            No black-box scores.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
