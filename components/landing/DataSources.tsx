const sources = [
  { abbr: 'EPA', name: 'Environmental Protection Agency', data: 'PFAS, water violations, Superfund, brownfields, TRI, EJScreen' },
  { abbr: 'USDA', name: 'Dept. of Agriculture', data: 'SSURGO soil survey, NRCS soil health data' },
  { abbr: 'NASA', name: 'NASA Earth Science', data: 'SMAP soil moisture, Landsat vegetation indices, POWER climate' },
  { abbr: 'USGS', name: 'Geological Survey', data: 'Groundwater quality, hydrological data' },
  { abbr: 'FEMA', name: 'Emergency Management Agency', data: 'Flood zones (NFHL), Natural Risk Index' },
  { abbr: 'Census', name: 'U.S. Census Bureau', data: 'Housing age, demographics, geocoding' },
];

export function DataSources() {
  return (
    <section className="border-t border-border bg-bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-xs text-text-tertiary uppercase tracking-widest mb-3">
            Data sources
          </p>
          <h2 className="font-[family-name:var(--font-instrument-serif)] text-3xl sm:text-4xl text-text-primary">
            Built on authoritative federal data
          </h2>
          <p className="mt-3 text-text-secondary text-lg max-w-2xl mx-auto">
            Every data point is sourced from a U.S. federal agency, with full
            transparency about resolution and methodology.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sources.map((source) => (
            <div
              key={source.abbr}
              className="flex items-start gap-4 p-5 rounded-[var(--radius-lg)] border border-border bg-bg-primary"
            >
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-accent-light">
                <span className="text-xs font-bold text-accent">{source.abbr}</span>
              </div>
              <div>
                <p className="font-medium text-text-primary text-sm">{source.name}</p>
                <p className="mt-0.5 text-xs text-text-secondary leading-relaxed">{source.data}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
