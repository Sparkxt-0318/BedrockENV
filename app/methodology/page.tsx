import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Methodology',
  description: 'How Bedrock computes environmental exposure scores — data sources, resolution transparency, and scoring methodology.',
};

const dataSources = [
  {
    source: 'EPA UCMR 5',
    agency: 'EPA',
    measures: 'PFAS (29 analytes) in public water systems',
    resolution: 'Area-level (water system)',
    updateFrequency: 'Quarterly',
    layer: 'Water',
  },
  {
    source: 'EPA SDWIS',
    agency: 'EPA',
    measures: 'Drinking water violations (MCL, treatment, monitoring)',
    resolution: 'Area-level (water system)',
    updateFrequency: 'Monthly',
    layer: 'Water',
  },
  {
    source: 'USGS WQP',
    agency: 'USGS',
    measures: 'Ambient PFAS monitoring from surface/groundwater',
    resolution: 'Neighborhood-level (bbox query)',
    updateFrequency: 'As reported',
    layer: 'Water',
  },
  {
    source: 'Census ACS (B25034)',
    agency: 'U.S. Census',
    measures: 'Housing age as lead pipe risk proxy',
    resolution: 'Neighborhood-level (block group)',
    updateFrequency: 'Annually',
    layer: 'Water',
  },
  {
    source: 'USDA SSURGO',
    agency: 'USDA',
    measures: 'Soil texture, pH, organic matter, drainage, CEC',
    resolution: 'Neighborhood-level (soil map unit)',
    updateFrequency: 'Annually',
    layer: 'Soil',
  },
  {
    source: 'EPA Brownfields',
    agency: 'EPA',
    measures: 'Contaminated land sites, contaminant types, cleanup status',
    resolution: 'Property-level (distance computed)',
    updateFrequency: 'Quarterly',
    layer: 'Soil',
  },
  {
    source: 'FEMA NFHL',
    agency: 'FEMA',
    measures: 'Flood zone designation (SFHA, Zone A/V/X)',
    resolution: 'Property-level (parcel boundary)',
    updateFrequency: 'As revised',
    layer: 'Soil',
  },
  {
    source: 'NASA POWER',
    agency: 'NASA',
    measures: 'Precipitation and temperature (soil moisture proxy)',
    resolution: 'Area-level (~50km)',
    updateFrequency: 'Monthly',
    layer: 'Soil',
  },
  {
    source: 'EPA ECHO',
    agency: 'EPA',
    measures: 'Regulated facilities, compliance status, TRI/RCRA/CAA programs',
    resolution: 'Property-level (within radius)',
    updateFrequency: 'Quarterly',
    layer: 'Soil / Air / Proximity',
  },
  {
    source: 'OpenAQ',
    agency: 'OpenAQ',
    measures: 'Real-time PM2.5, ozone, and other pollutant measurements',
    resolution: 'Area-level (nearest station)',
    updateFrequency: 'Hourly',
    layer: 'Air',
  },
  {
    source: 'EPA AQS',
    agency: 'EPA',
    measures: 'Annual PM2.5 and ozone summaries from monitoring stations',
    resolution: 'Area-level (nearest monitor)',
    updateFrequency: 'Annually',
    layer: 'Air',
  },
  {
    source: 'EPA Green Book',
    agency: 'EPA',
    measures: 'Nonattainment area designations (Clean Air Act)',
    resolution: 'Area-level (county)',
    updateFrequency: 'As revised',
    layer: 'Air',
  },
  {
    source: 'EPA FRS (Superfund)',
    agency: 'EPA',
    measures: 'National Priorities List (NPL) Superfund site proximity',
    resolution: 'Property-level (distance computed)',
    updateFrequency: 'Quarterly',
    layer: 'Proximity',
  },
  {
    source: 'EPA EJScreen',
    agency: 'EPA',
    measures: 'Environmental justice indices and demographic indicators',
    resolution: 'Neighborhood-level (block group)',
    updateFrequency: 'Annually',
    layer: 'EJ',
  },
  {
    source: 'CDC SVI',
    agency: 'CDC/ATSDR',
    measures: 'Social vulnerability index (4 themes, national percentile)',
    resolution: 'Neighborhood-level (census tract)',
    updateFrequency: 'Biennially',
    layer: 'EJ',
  },
];

export default function MethodologyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-[family-name:var(--font-instrument-serif)] text-4xl text-text-primary mb-4">
        Methodology
      </h1>
      <p className="text-text-secondary text-lg leading-relaxed mb-12">
        Bedrock aggregates publicly available data from U.S. federal agencies to compute
        address-level environmental exposure assessments. This page explains our data sources,
        spatial resolution transparency, scoring methodology, and limitations.
      </p>

      {/* Data sources */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold text-text-primary mb-6">Data sources</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 pr-4 font-medium text-text-secondary">Source</th>
                <th className="text-left py-3 pr-4 font-medium text-text-secondary">Layer</th>
                <th className="text-left py-3 pr-4 font-medium text-text-secondary">Measures</th>
                <th className="text-left py-3 pr-4 font-medium text-text-secondary">Resolution</th>
                <th className="text-left py-3 font-medium text-text-secondary">Updates</th>
              </tr>
            </thead>
            <tbody>
              {dataSources.map((ds) => (
                <tr key={ds.source} className="border-b border-border">
                  <td className="py-3 pr-4 font-medium text-text-primary">{ds.source}</td>
                  <td className="py-3 pr-4 text-text-secondary">{ds.layer}</td>
                  <td className="py-3 pr-4 text-text-secondary">{ds.measures}</td>
                  <td className="py-3 pr-4 text-text-secondary">{ds.resolution}</td>
                  <td className="py-3 text-text-secondary">{ds.updateFrequency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Resolution transparency */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold text-text-primary mb-4">Resolution transparency</h2>
        <p className="text-text-secondary leading-relaxed mb-6">
          Federal environmental data has varying spatial resolution. Bedrock never presents
          low-resolution data as property-level certainty. Every data point in our reports is
          tagged with one of three confidence tiers:
        </p>
        <div className="grid gap-4">
          <div className="p-4 rounded-[var(--radius-md)] border border-border bg-bg-surface">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-[var(--badge-property-bg)] text-[var(--badge-property-text)]">
                Property-level
              </span>
              <span className="text-sm text-text-secondary">High confidence</span>
            </div>
            <p className="text-sm text-text-secondary">
              Derived from exact coordinates or parcel-level boundaries. Examples: distance to specific
              contamination sites, FEMA flood zone designation, regulated facility proximity.
            </p>
          </div>
          <div className="p-4 rounded-[var(--radius-md)] border border-border bg-bg-surface">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-[var(--badge-neighborhood-bg)] text-[var(--badge-neighborhood-text)]">
                Neighborhood-level
              </span>
              <span className="text-sm text-text-secondary">Moderate confidence</span>
            </div>
            <p className="text-sm text-text-secondary">
              Based on census block group or soil survey map unit data. Examples: SSURGO soil properties,
              housing age distributions, EJScreen environmental justice indices, CDC SVI percentiles.
            </p>
          </div>
          <div className="p-4 rounded-[var(--radius-md)] border border-border bg-bg-surface">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-[var(--badge-area-bg)] text-[var(--badge-area-text)]">
                Area-level
              </span>
              <span className="text-sm text-text-secondary">Directional</span>
            </div>
            <p className="text-sm text-text-secondary">
              Based on county, water system, or regional data. Examples: water utility PFAS testing,
              drinking water violations, nonattainment designations, regional climate trends.
            </p>
          </div>
        </div>
      </section>

      {/* Scoring methodology */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold text-text-primary mb-4">Scoring methodology</h2>
        <p className="text-text-secondary leading-relaxed mb-4">
          Bedrock computes a composite Environmental Exposure Score (0-100) as a weighted
          average of individual layer sub-scores. Higher scores indicate greater cumulative
          exposure burden.
        </p>
        <div className="p-4 rounded-[var(--radius-md)] border border-border bg-bg-surface">
          <h3 className="font-medium text-text-primary mb-2">Layer weights (five-layer composite)</h3>
          <ul className="text-sm text-text-secondary space-y-1">
            <li>Water contamination: <strong className="text-text-primary">25%</strong> — PFAS, lead risk, utility violations, ambient water quality</li>
            <li>Air quality: <strong className="text-text-primary">25%</strong> — PM2.5, ozone, TRI emissions, nonattainment status</li>
            <li>Toxic proximity: <strong className="text-text-primary">20%</strong> — Superfund NPL sites, RCRA hazardous waste, TRI facilities, compliance violations</li>
            <li>Soil &amp; land: <strong className="text-text-primary">15%</strong> — SSURGO properties, brownfields, flood zones, soil moisture</li>
            <li>Environmental justice: <strong className="text-text-primary">15%</strong> — EJScreen indices, CDC Social Vulnerability Index, demographic burden</li>
          </ul>
          <p className="mt-3 text-xs text-text-tertiary">
            When a data layer is unavailable, remaining layers are re-weighted proportionally to
            maintain a sum of 100%. Composite confidence reflects the lowest confidence among
            included layers and overall data coverage.
          </p>
        </div>
      </section>

      {/* Recommendations */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold text-text-primary mb-4">Recommendation methodology</h2>
        <p className="text-text-secondary leading-relaxed">
          All recommendations in Bedrock reports are deterministic — they come from pre-written,
          expert-sourced decision tree templates, not from AI generation. The AI component of Bedrock
          is used exclusively to describe data in plain English. It never prescribes actions, makes
          safety claims, or generates novel health advice. Every recommendation cites its regulatory
          source and includes appropriate disclaimers.
        </p>
      </section>

      {/* Limitations */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold text-text-primary mb-4">Limitations</h2>
        <ul className="text-text-secondary space-y-3 text-sm leading-relaxed">
          <li>
            Bedrock aggregates publicly available federal data. It cannot account for contamination
            that has not been tested for, reported, or included in federal databases.
          </li>
          <li>
            Water system data reflects utility-level testing, not tap-level conditions at individual
            properties. Actual contaminant levels at your tap may differ.
          </li>
          <li>
            Soil survey data represents dominant soil types within map units (typically 1-100 acres)
            and may not reflect exact conditions at a specific property.
          </li>
          <li>
            Bedrock is an informational tool, not a substitute for professional environmental testing,
            inspection, or medical advice.
          </li>
        </ul>
      </section>
    </div>
  );
}
