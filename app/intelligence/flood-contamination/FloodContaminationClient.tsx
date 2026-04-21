'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Headline, Body, Label, Mono } from '@/components/ui/Type';
import { Card, CardContent } from '@/components/ui/Card';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { CountUp } from '@/components/ui/CountUp';
import { QuartileBarChart } from '@/components/charts/QuartileBarChart';

const CfciChoropleth = dynamic(
  () => import('@/components/charts/CfciChoropleth').then((m) => ({ default: m.CfciChoropleth })),
  { ssr: false, loading: () => <div className="h-[400px] bg-bg-elevated rounded-[var(--radius-lg)] animate-pulse" /> }
);

const FloodVsCpiScatter = dynamic(
  () => import('@/components/charts/FloodVsCpiScatter').then((m) => ({ default: m.FloodVsCpiScatter })),
  { ssr: false, loading: () => <div className="h-[300px] bg-bg-elevated rounded-[var(--radius-lg)] animate-pulse" /> }
);

interface CountySlim {
  fips: string;
  county: string;
  state: string;
  population: number;
  cfci: number;
  cfciQuartile: number;
  classification: string;
  floodExposureScore: number;
  fer: number;
  cpi: number;
  scvi: number;
  totalResStructures: number;
  totalResStructuresSfha: number;
  resPenetrationRateSfha: number;
  adaptationGap: number;
}

interface QuartileStat {
  quartile: number;
  counties: number;
  population: number;
  popPct: number;
  medianIncome: number;
  povertyRate: number;
  pctBlack: number;
  pctHispanic: number;
  pctWhite: number;
  meanAdaptationGap: number;
}

interface RegionalLeader {
  region: string;
  label: string;
  q4Count: number;
}

interface Stats {
  totalCounties: number;
  totalPop: number;
  q4Pop: number;
  q4PopPct: number;
  quartileStats: QuartileStat[];
  top25: CountySlim[];
  severeOrHighCount: number;
  severeOrHighPop: number;
  q4UninsuredStructures: number;
  povertyRatio: number;
  regionalLeaders: RegionalLeader[];
  floodAsOfDate: string | null;
}

export function FloodContaminationClient({
  data,
  stats,
}: {
  data: CountySlim[];
  stats: Stats;
}) {
  return (
    <div className="space-y-24 pb-24">
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <CfciChoropleth data={data} />
        </ScrollReveal>
      </section>

      {/* ── Chapter 1: When flooding meets contamination ── */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <Label as="div" className="block mb-2">Chapter 1</Label>
          <Headline className="text-3xl mb-6">When flooding meets contamination</Headline>
        </ScrollReveal>

        <ScrollReveal>
          <Body className="mb-6">
            FEMA maps which neighborhoods flood. EPA catalogs which neighborhoods are contaminated.
            Neither agency publishes a map of the places where those two things overlap — the
            counties where every major storm mobilizes a century of industrial residue from soil
            into basements, drinking water, and downstream waterways.
          </Body>
          <Body className="text-text-primary font-medium text-lg italic mb-8">
            &ldquo;Where does the flood water pick up the contamination?&rdquo;
          </Body>
          <Body>
            This brief combines FEMA&apos;s National Flood Insurance Program county statistics (derived
            from the same NFHL flood maps used in individual property lookups) with Bedrock&apos;s
            Contamination Pressure Index — a measure of brownfield, Superfund, industrial, and TRI
            release density — to identify counties where flood water has the most stored
            contamination to carry.
          </Body>
        </ScrollReveal>

        <ScrollReveal stagger>
          <div className="grid gap-4 sm:grid-cols-2 mt-8">
            <Card>
              <CardContent>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[#40916C]/10 flex items-center justify-center shrink-0">
                    <Mono className="text-xs text-[#40916C]">FLOOD</Mono>
                  </div>
                  <div>
                    <p className="font-medium text-text-primary text-sm mb-1">
                      Flood Exposure Ratio (FER)
                    </p>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      Share of each county&apos;s residential structures inside the 1% annual
                      Special Flood Hazard Area. Derived by FEMA from the NFHL — the same authoritative
                      flood maps used by insurers and lenders.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[#C23B22]/10 flex items-center justify-center shrink-0">
                    <Mono className="text-xs text-[#C23B22]">CPI</Mono>
                  </div>
                  <div>
                    <p className="font-medium text-text-primary text-sm mb-1">
                      Contamination Pressure Index
                    </p>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      Brownfield and Superfund legacy, ECHO/TRI industrial density, compliance
                      violations, and release volumes — condensed to a 0–100 county score.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <div className="mt-8 p-4 rounded-[var(--radius-lg)] bg-bg-elevated border border-border">
            <div className="flex items-center justify-center gap-3 text-center flex-wrap">
              <div className="px-3 py-2 rounded-[var(--radius-md)] bg-bg-surface border border-border">
                <Mono className="text-lg">FER</Mono>
              </div>
              <span className="text-text-secondary text-lg">&times;</span>
              <div className="px-3 py-2 rounded-[var(--radius-md)] bg-bg-surface border border-border">
                <Mono className="text-lg">CPI</Mono>
              </div>
              <span className="text-text-secondary text-lg">&rarr;</span>
              <div className="px-3 py-2 rounded-[var(--radius-md)] bg-accent/10 border border-accent/20">
                <Mono className="text-lg text-accent">CFCI</Mono>
              </div>
            </div>
            <p className="text-xs text-text-primary/65 text-center mt-2">
              CFCI = &radic;(FER&times;100 &times; CPI), normalized to 0&ndash;100. The geometric mean
              ensures a county needs both flood exposure <em>and</em> contamination pressure to score
              high — neither alone is sufficient.
            </p>
          </div>
        </ScrollReveal>
      </section>

      {/* ── Chapter 2: America's most vulnerable corridors ── */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <Label as="div" className="block mb-2">Chapter 2</Label>
          <Headline className="text-3xl mb-6">America&apos;s most vulnerable corridors</Headline>
        </ScrollReveal>

        <ScrollReveal>
          <div className="rounded-[var(--radius-lg)] border border-border bg-bg-surface p-4 sm:p-6">
            <FloodVsCpiScatter data={data} />
          </div>
          <p className="text-xs text-text-primary/65 mt-2">
            Each dot is a US county. Size = population. Color = CFCI (green → red).
            Counties in the upper-right — where a high share of homes sit in the flood zone and
            contamination pressure is elevated — represent the compound risk.
          </p>
        </ScrollReveal>

        <ScrollReveal>
          <div className="mt-10">
            <Label as="h3" className="block mb-4">Highest CFCI Counties</Label>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="px-4 py-3 text-xs font-medium text-text-primary/65 uppercase tracking-wider">#</th>
                        <th className="px-4 py-3 text-xs font-medium text-text-primary/65 uppercase tracking-wider">County</th>
                        <th className="px-4 py-3 text-xs font-medium text-text-primary/65 uppercase tracking-wider text-right">CFCI</th>
                        <th className="px-4 py-3 text-xs font-medium text-text-primary/65 uppercase tracking-wider text-right">FER</th>
                        <th className="px-4 py-3 text-xs font-medium text-text-primary/65 uppercase tracking-wider text-right">CPI</th>
                        <th className="px-4 py-3 text-xs font-medium text-text-primary/65 uppercase tracking-wider hidden sm:table-cell">Class</th>
                        <th className="px-4 py-3 text-xs font-medium text-text-primary/65 uppercase tracking-wider text-right hidden md:table-cell">Pop</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.top25.slice(0, 15).map((r, i) => (
                        <tr
                          key={r.fips}
                          className="border-b border-border/50 hover:bg-bg-elevated/50 transition-colors"
                        >
                          <td className="px-4 py-3 text-text-secondary">{i + 1}</td>
                          <td className="px-4 py-3">
                            <span className="font-medium text-text-primary">{r.county}</span>
                            <span className="text-text-secondary ml-1">{r.state}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Mono className="text-sm">{r.cfci}</Mono>
                          </td>
                          <td className="px-4 py-3 text-right text-text-secondary">
                            <Mono className="text-sm">{(r.fer * 100).toFixed(0)}%</Mono>
                          </td>
                          <td className="px-4 py-3 text-right text-text-secondary">
                            <Mono className="text-sm">{r.cpi}</Mono>
                          </td>
                          <td className="px-4 py-3 text-text-secondary hidden sm:table-cell text-xs">
                            {r.classification}
                          </td>
                          <td className="px-4 py-3 text-right text-text-secondary hidden md:table-cell">
                            <Mono className="text-xs">{r.population.toLocaleString()}</Mono>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <div className="mt-10">
            <Label as="h3" className="block mb-4">Q4 Counties by Regional Cluster</Label>
            <div className="grid gap-3 sm:grid-cols-2">
              {stats.regionalLeaders.map((r) => (
                <div
                  key={r.region}
                  className="flex items-center justify-between p-4 rounded-[var(--radius-lg)] bg-bg-surface border border-border"
                >
                  <div>
                    <p className="text-sm font-medium text-text-primary">{r.label}</p>
                    <p className="text-xs text-text-secondary mt-0.5">Highest-quartile counties</p>
                  </div>
                  <Mono className="text-2xl">{r.q4Count}</Mono>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ── Chapter 3: Who lives in the flood-contamination zone ── */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <Label as="div" className="block mb-2">Chapter 3</Label>
          <Headline className="text-3xl mb-6">Who lives in the flood-contamination zone</Headline>
        </ScrollReveal>

        <ScrollReveal>
          <div className="grid gap-4 sm:grid-cols-3 mb-10">
            <Card>
              <CardContent className="text-center py-6">
                <Mono className="text-3xl block">
                  <CountUp end={Math.round(stats.q4Pop / 1e6)} suffix="M" />
                </Mono>
                <p className="text-xs text-text-primary/65 mt-1">people live in Q4 counties</p>
                <p className="text-xs text-text-secondary mt-0.5">
                  <CountUp end={Math.round(stats.q4PopPct * 10) / 10} decimals={1} suffix="%" />{' '}
                  of US population
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="text-center py-6">
                <Mono className="text-3xl block">
                  <CountUp end={Math.round(stats.povertyRatio * 10) / 10} decimals={1} suffix="×" />
                </Mono>
                <p className="text-xs text-text-primary/65 mt-1">Q4 poverty rate vs Q1</p>
                <p className="text-xs text-text-secondary mt-0.5">
                  {stats.quartileStats[3].povertyRate.toFixed(1)}% vs{' '}
                  {stats.quartileStats[0].povertyRate.toFixed(1)}%
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="text-center py-6">
                <Mono className="text-3xl block">
                  <CountUp
                    end={Math.round(stats.quartileStats[3].meanAdaptationGap * 100)}
                    suffix="%"
                  />
                </Mono>
                <p className="text-xs text-text-primary/65 mt-1">
                  of Q4 SFHA homes lack flood insurance
                </p>
              </CardContent>
            </Card>
          </div>
        </ScrollReveal>

        <div className="grid gap-8 lg:grid-cols-2">
          <ScrollReveal>
            <Label as="h3" className="block mb-3">Poverty Rate by CFCI Quartile</Label>
            <Card>
              <CardContent>
                <QuartileBarChart
                  data={stats.quartileStats.map((q) => ({
                    label: `Q${q.quartile}`,
                    value: q.povertyRate,
                  }))}
                  format="percent"
                  gradientStart="#40916C"
                  gradientEnd="#C23B22"
                  ariaLabel="Poverty rate by CFCI quartile"
                />
              </CardContent>
            </Card>
          </ScrollReveal>

          <ScrollReveal>
            <Label as="h3" className="block mb-3">
              Uninsured SFHA Homes (% gap) by CFCI Quartile
            </Label>
            <Card>
              <CardContent>
                <QuartileBarChart
                  data={stats.quartileStats.map((q) => ({
                    label: `Q${q.quartile}`,
                    value: q.meanAdaptationGap * 100,
                  }))}
                  format="percent"
                  gradientStart="#40916C"
                  gradientEnd="#C23B22"
                  ariaLabel="Adaptation gap by CFCI quartile"
                />
              </CardContent>
            </Card>
          </ScrollReveal>
        </div>

        <ScrollReveal>
          <div className="mt-8 p-5 rounded-[var(--radius-lg)] bg-bg-elevated border border-border">
            <Body className="text-sm leading-relaxed">
              Counties in the highest CFCI quartile have a poverty rate{' '}
              <strong className="text-text-primary">
                {stats.povertyRatio.toFixed(1)}&times;
              </strong>{' '}
              the lowest quartile ({stats.quartileStats[3].povertyRate.toFixed(1)}% vs{' '}
              {stats.quartileStats[0].povertyRate.toFixed(1)}%), and{' '}
              <strong className="text-text-primary">
                {Math.round(stats.quartileStats[3].meanAdaptationGap * 100)}%
              </strong>{' '}
              of at-risk homes lack flood insurance. This is where the compound risk matters most:
              the places that will be flooded are also the places with contamination to mobilize,
              and the households least able to recover from a single event — let alone repeated ones.
            </Body>
          </div>
        </ScrollReveal>
      </section>

      {/* ── Chapter 4: The hidden cost ── */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <Label as="div" className="block mb-2">Chapter 4</Label>
          <Headline className="text-3xl mb-6">The hidden cost</Headline>
        </ScrollReveal>

        <ScrollReveal>
          <Body className="mb-6">
            Flood insurance premiums price flood risk. Environmental assessments price contamination
            risk. Neither prices the interaction. A disclosure packet for a home in Galveston
            County, Texas, might cite its Zone AE designation and its proximity to a single
            Superfund site — but not the fact that the county holds {' '}
            <strong className="text-text-primary">
              {Math.round(stats.top25.find((r) => r.fips === '48167')?.totalResStructuresSfha ?? 0).toLocaleString()}
            </strong>{' '}
            residential structures in the flood zone, with contamination pressure above the 75th
            percentile nationally.
          </Body>
          <Body className="mb-6">
            Across the {stats.totalCounties.toLocaleString()} counties in this analysis, roughly{' '}
            <strong className="text-text-primary">
              {Math.round(stats.q4UninsuredStructures / 1e6).toFixed(1)} million
            </strong>{' '}
            residential structures in Q4 counties sit inside the 1% annual flood zone without
            flood insurance. Every one of those homes carries both physical flood risk and an
            uncatalogued contamination exposure — the sediment pulled into the crawlspace, the
            soil residue in the yard, the downstream water intake pulling from a flooded industrial
            parcel.
          </Body>
        </ScrollReveal>

        <ScrollReveal>
          <div className="p-5 rounded-[var(--radius-lg)] bg-bg-elevated border border-border">
            <Body className="text-sm leading-relaxed">
              Bedrock&apos;s Environmental Assessment Bridge was designed to surface this compound
              risk at the address level. Where federal agencies stop at their respective mandates,
              the EAB cross-references flood zone geometry, Superfund proximity, TRI emitter
              density, and brownfield adjacency to produce a property-specific exposure profile
              that captures the interaction — not just the components.
            </Body>
            <div className="mt-4">
              <Link
                href="/report/search"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-accent text-white rounded-[var(--radius-md)] hover:bg-accent-hover transition-colors"
              >
                Search an address
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M6 4L10 8L6 12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ── Methodology footer ── */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-12 border-t border-border">
        <ScrollReveal>
          <Label as="h2" className="block mb-4">Methodology &amp; Data Sources</Label>
          <div className="grid gap-3 sm:grid-cols-2 text-xs text-text-secondary">
            <div className="space-y-2">
              <p>
                <strong className="text-text-primary">Flood data:</strong> FEMA OpenFEMA
                &ldquo;NfipResidentialPenetrationRates&rdquo; county statistics, derived from the
                National Flood Hazard Layer (NFHL). As of{' '}
                {stats.floodAsOfDate
                  ? new Date(stats.floodAsOfDate).toISOString().slice(0, 10)
                  : '2025'}.
              </p>
              <p>
                <strong className="text-text-primary">Contamination data:</strong> Bedrock
                Contamination Pressure Index (CPI) from the SCVI national dataset. Underlying
                sources: EPA TRI, ECHO, FRS/SEMS (Superfund), Brownfields.
              </p>
              <p>
                <strong className="text-text-primary">Demographics:</strong> US Census Bureau ACS
                5-Year Estimates (2022).
              </p>
            </div>
            <div className="space-y-2">
              <p>
                <strong className="text-text-primary">Index formula:</strong> CFCI =
                &radic;(FER &times; 100 &times; CPI), normalized 0&ndash;100. Geometric mean
                requires both flood exposure and contamination pressure to be elevated.
              </p>
              <p>
                <strong className="text-text-primary">Coverage:</strong> {stats.totalCounties}{' '}
                counties scored from 3,140 national county set. CT planning regions and territories
                excluded where FEMA/Census FIPS do not align.
              </p>
              <p>
                <strong className="text-text-primary">Limitations:</strong> FER is a
                residential-structure-weighted measure; commercial and industrial structures in
                SFHA are not counted. CPI inherits SCVI&apos;s limitations (county-level
                resolution, FRS coverage gaps, SSURGO urban blind spot).
              </p>
            </div>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}
