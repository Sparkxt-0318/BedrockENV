const stats = [
  {
    value: '176M',
    label: 'Americans in communities with PFAS-positive water',
    source: 'USGS, 2023',
  },
  {
    value: '9,728',
    label: 'Contamination sites across 50 states',
    source: 'EPA Superfund & Brownfields',
  },
  {
    value: '10+',
    label: 'Federal databases — none connected until now',
    source: 'EPA, USDA, NASA, USGS, FEMA, Census',
  },
];

export function ProblemStatement() {
  return (
    <section className="border-t border-border bg-bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center mb-14">
          <h2 className="font-[family-name:var(--font-instrument-serif)] text-3xl sm:text-4xl text-text-primary">
            The data exists. Nobody connects it.
          </h2>
          <p className="mt-4 text-text-secondary text-lg leading-relaxed">
            EPA tracks toxic releases. USDA maps your soil. FEMA knows your flood risk.
            But the data is scattered across 10+ separate databases that no consumer
            platform connects together — until Bedrock.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.value}
              className="text-center p-6 rounded-[var(--radius-lg)] bg-bg-primary border border-border"
            >
              <p className="font-[family-name:var(--font-instrument-serif)] text-4xl sm:text-5xl text-accent font-normal">
                {stat.value}
              </p>
              <p className="mt-3 text-text-primary font-medium">{stat.label}</p>
              <p className="mt-1 text-xs text-text-tertiary">{stat.source}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
