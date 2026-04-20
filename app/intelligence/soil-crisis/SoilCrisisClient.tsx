'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Headline, Body, Label, Mono } from '@/components/ui/Type';
import { Card, CardContent } from '@/components/ui/Card';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { CountUp } from '@/components/ui/CountUp';
import { QuartileBarChart } from '@/components/charts/QuartileBarChart';

const ScviChoropleth = dynamic(
  () => import('@/components/charts/ScviChoropleth').then((m) => ({ default: m.ScviChoropleth })),
  { ssr: false, loading: () => <div className="h-[400px] bg-bg-elevated rounded-[var(--radius-lg)] animate-pulse" /> }
);

const SvsVsCpiScatter = dynamic(
  () => import('@/components/charts/SvsVsCpiScatter').then((m) => ({ default: m.SvsVsCpiScatter })),
  { ssr: false, loading: () => <div className="h-[300px] bg-bg-elevated rounded-[var(--radius-lg)] animate-pulse" /> }
);

interface CountySlim {
  fips: string;
  county: string;
  state: string;
  population: number;
  scvi: number;
  svs: number;
  cpi: number;
  quartile: number;
  usdaSviClass: string;
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
}

interface Stats {
  totalCounties: number;
  totalPop: number;
  q4Pop: number;
  q4PopPct: number;
  quartileStats: QuartileStat[];
  top10: CountySlim[];
  urbanGapCount: number;
  urbanGapQ4: number;
  blackRatio: number;
}

export function SoilCrisisClient({ data, stats }: { data: CountySlim[]; stats: Stats }) {
  return (
    <div className="space-y-24 pb-24">
      {/* ── Map ── */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <ScviChoropleth data={data} />
        </ScrollReveal>
      </section>

      {/* ── Chapter 1: The gap between frameworks ── */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <Label as="div" className="block mb-2">Chapter 1</Label>
          <Headline className="text-3xl mb-6">
            The gap between two federal frameworks
          </Headline>
        </ScrollReveal>

        <ScrollReveal>
          <Body className="mb-6">
            The USDA Soil Vulnerability Index classifies soils by their inherent physical properties —
            drainage, texture, organic matter, pH — to assess agricultural vulnerability. Separately,
            the EPA maintains contamination records through TRI, Superfund, Brownfields, and ECHO
            databases. Neither framework asks the question that matters most for communities:
          </Body>
          <Body className="text-text-primary font-medium text-lg italic mb-8">
            &ldquo;Where do vulnerable soils intersect with actual contamination pressure?&rdquo;
          </Body>
        </ScrollReveal>

        <ScrollReveal stagger>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardContent>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[#40916C]/10 flex items-center justify-center shrink-0">
                    <Mono className="text-sm text-[#40916C]">SVS</Mono>
                  </div>
                  <div>
                    <p className="font-medium text-text-primary text-sm mb-1">
                      Soil Vulnerability Score
                    </p>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      USDA SSURGO properties: organic matter (25%), drainage (25%),
                      pH (20%), texture (15%), climate (10%), urban coverage (5%).
                      Measures how readily soil absorbs, retains, or transports contaminants.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[#C23B22]/10 flex items-center justify-center shrink-0">
                    <Mono className="text-sm text-[#C23B22]">CPI</Mono>
                  </div>
                  <div>
                    <p className="font-medium text-text-primary text-sm mb-1">
                      Contamination Pressure Index
                    </p>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      EPA sources: brownfield/superfund legacy (35%), ECHO/TRI industrial
                      density (35%), compliance violations (15%), TRI release volumes (15%).
                      Measures active and historic contamination pressure.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <div className="mt-8 p-4 rounded-[var(--radius-lg)] bg-bg-elevated border border-border">
            <div className="flex items-center justify-center gap-3 text-center">
              <div className="px-3 py-2 rounded-[var(--radius-md)] bg-bg-surface border border-border">
                <Mono className="text-lg">SVS</Mono>
              </div>
              <span className="text-text-tertiary text-lg">&times;</span>
              <div className="px-3 py-2 rounded-[var(--radius-md)] bg-bg-surface border border-border">
                <Mono className="text-lg">CPI</Mono>
              </div>
              <span className="text-text-tertiary text-lg">&rarr;</span>
              <div className="px-3 py-2 rounded-[var(--radius-md)] bg-accent/10 border border-accent/20">
                <Mono className="text-lg text-accent">SCVI</Mono>
              </div>
            </div>
            <p className="text-xs text-text-tertiary text-center mt-2">
              SCVI = &radic;(SVS &times; CPI), normalized to 0&ndash;100. Geometric mean ensures both
              dimensions must be elevated for a high composite score.
            </p>
          </div>
        </ScrollReveal>
      </section>

      {/* ── Chapter 2: Where vulnerability meets contamination ── */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <Label as="div" className="block mb-2">Chapter 2</Label>
          <Headline className="text-3xl mb-6">
            Where vulnerable soil meets contamination
          </Headline>
        </ScrollReveal>

        <ScrollReveal>
          <div className="rounded-[var(--radius-lg)] border border-border bg-bg-surface p-4 sm:p-6">
            <SvsVsCpiScatter data={data} />
          </div>
          <p className="text-xs text-text-tertiary mt-2">
            Each dot is a US county. Size = population. Color = SCVI score (green → red).
            Counties in the upper-right quadrant have both vulnerable soil and high contamination pressure.
          </p>
        </ScrollReveal>

        <ScrollReveal>
          <div className="mt-10">
            <Label as="h3" className="block mb-4">Highest SCVI Counties</Label>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="px-4 py-3 text-xs font-medium text-text-tertiary uppercase tracking-wider">#</th>
                        <th className="px-4 py-3 text-xs font-medium text-text-tertiary uppercase tracking-wider">County</th>
                        <th className="px-4 py-3 text-xs font-medium text-text-tertiary uppercase tracking-wider text-right">SCVI</th>
                        <th className="px-4 py-3 text-xs font-medium text-text-tertiary uppercase tracking-wider text-right">SVS</th>
                        <th className="px-4 py-3 text-xs font-medium text-text-tertiary uppercase tracking-wider text-right">CPI</th>
                        <th className="px-4 py-3 text-xs font-medium text-text-tertiary uppercase tracking-wider hidden sm:table-cell">USDA SVI</th>
                        <th className="px-4 py-3 text-xs font-medium text-text-tertiary uppercase tracking-wider text-right hidden md:table-cell">Pop</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.top10.map((r, i) => (
                        <tr key={r.fips} className="border-b border-border/50 hover:bg-bg-elevated/50 transition-colors">
                          <td className="px-4 py-3 text-text-tertiary">{i + 1}</td>
                          <td className="px-4 py-3">
                            <span className="font-medium text-text-primary">{r.county}</span>
                            <span className="text-text-tertiary ml-1">{r.state}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Mono className="text-sm">{r.scvi}</Mono>
                          </td>
                          <td className="px-4 py-3 text-right text-text-secondary">
                            <Mono className="text-sm">{r.svs}</Mono>
                          </td>
                          <td className="px-4 py-3 text-right text-text-secondary">
                            <Mono className="text-sm">{r.cpi}</Mono>
                          </td>
                          <td className="px-4 py-3 text-text-secondary hidden sm:table-cell text-xs">
                            {r.usdaSviClass}
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
            <p className="text-xs text-text-tertiary mt-2">
              Virginia independent cities under 50 sq mi excluded from headline ranking due to
              geographic scale artifacts. Their concentrated industrial legacy within compact
              boundaries inflates CPI scores. See appendix for full list.
            </p>
          </div>
        </ScrollReveal>
      </section>

      {/* ── Chapter 3: Who lives in the highest-risk counties ── */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <Label as="div" className="block mb-2">Chapter 3</Label>
          <Headline className="text-3xl mb-6">
            Who lives in the highest-risk counties
          </Headline>
        </ScrollReveal>

        <ScrollReveal>
          <div className="grid gap-4 sm:grid-cols-3 mb-10">
            <Card>
              <CardContent className="text-center py-6">
                <Mono className="text-3xl block">
                  <CountUp end={Math.round(stats.q4Pop / 1e6)} suffix="M" />
                </Mono>
                <p className="text-xs text-text-tertiary mt-1">
                  people live in Q4 counties
                </p>
                <p className="text-xs text-text-secondary mt-0.5">
                  <CountUp end={Math.round(stats.q4PopPct * 10) / 10} decimals={1} suffix="%" />
                  {' '}of US population
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="text-center py-6">
                <Mono className="text-3xl block">
                  <CountUp end={Math.round(stats.blackRatio * 10) / 10} decimals={1} suffix="×" />
                </Mono>
                <p className="text-xs text-text-tertiary mt-1">
                  Black population share in Q4 vs Q1
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="text-center py-6">
                <Mono className="text-3xl block">
                  $<CountUp end={Math.round((stats.quartileStats[0].medianIncome - stats.quartileStats[3].medianIncome) / 1000)} suffix="k" />
                </Mono>
                <p className="text-xs text-text-tertiary mt-1">
                  income gap Q1 → Q4
                </p>
              </CardContent>
            </Card>
          </div>
        </ScrollReveal>

        <div className="grid gap-8 lg:grid-cols-2">
          <ScrollReveal>
            <Label as="h3" className="block mb-3">Median Household Income by SCVI Quartile</Label>
            <Card>
              <CardContent>
                <QuartileBarChart
                  data={stats.quartileStats.map((q) => ({
                    label: `Q${q.quartile}`,
                    value: q.medianIncome,
                  }))}
                  format="currency"
                  gradientStart="#40916C"
                  gradientEnd="#C23B22"
                  ariaLabel="Median household income by SCVI quartile"
                />
              </CardContent>
            </Card>
          </ScrollReveal>

          <ScrollReveal>
            <Label as="h3" className="block mb-3">Black Population Share by SCVI Quartile</Label>
            <Card>
              <CardContent>
                <QuartileBarChart
                  data={stats.quartileStats.map((q) => ({
                    label: `Q${q.quartile}`,
                    value: q.pctBlack,
                  }))}
                  format="percent"
                  gradientStart="#40916C"
                  gradientEnd="#C23B22"
                  ariaLabel="Black population percentage by SCVI quartile"
                />
              </CardContent>
            </Card>
          </ScrollReveal>
        </div>

        <ScrollReveal>
          <div className="mt-8 p-5 rounded-[var(--radius-lg)] bg-bg-elevated border border-border">
            <Body className="text-sm leading-relaxed">
              Communities in the highest SCVI quartile have{' '}
              <strong className="text-text-primary">{stats.blackRatio.toFixed(1)}&times;</strong>{' '}
              the Black population share of the lowest quartile ({stats.quartileStats[3].pctBlack.toFixed(1)}% vs{' '}
              {stats.quartileStats[0].pctBlack.toFixed(1)}%). The top quartile also holds a disproportionate{' '}
              <strong className="text-text-primary">{stats.q4PopPct.toFixed(1)}%</strong> of the US population —
              this is a finding, not a statistical artifact. Dense, historically industrial counties cluster
              in Q4 because both contamination pressure and population concentrate in the same places.
            </Body>
          </div>
        </ScrollReveal>
      </section>

      {/* ── Chapter 4: The urban blind spot ── */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <Label as="div" className="block mb-2">Chapter 4</Label>
          <Headline className="text-3xl mb-6">
            The urban blind spot
          </Headline>
        </ScrollReveal>

        <ScrollReveal>
          <div className="grid gap-4 sm:grid-cols-2 mb-8">
            <Card>
              <CardContent className="py-6 text-center">
                <Mono className="text-3xl block">
                  <CountUp end={stats.urbanGapCount} />
                </Mono>
                <p className="text-xs text-text-tertiary mt-1">
                  counties with SSURGO coverage gaps
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-6 text-center">
                <Mono className="text-3xl block">
                  <CountUp end={stats.urbanGapQ4} />
                </Mono>
                <p className="text-xs text-text-tertiary mt-1">
                  of those in the highest-risk quartile
                </p>
                <p className="text-xs text-text-secondary">
                  ({Math.round((100 * stats.urbanGapQ4) / stats.urbanGapCount)}% of all gap counties)
                </p>
              </CardContent>
            </Card>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <Body className="mb-4">
            The USDA&apos;s Soil Survey Geographic Database — the most comprehensive public soil dataset
            in the world — was designed for agricultural land. Beneath pavement, buildings, and
            infrastructure, SSURGO data thins out or disappears entirely. This creates a systematic
            blind spot in precisely the places where contamination risk is highest: urban counties.
          </Body>
          <Body className="mb-6">
            Of the {stats.urbanGapCount} counties with SSURGO urban coverage gaps, {stats.urbanGapQ4} fall
            in the highest SCVI quartile. These are the counties where soil vulnerability scores may be{' '}
            <em>understated</em> — the true risk is likely higher than our index reports because we can
            only measure what we can see.
          </Body>
        </ScrollReveal>

        <ScrollReveal>
          <div className="p-5 rounded-[var(--radius-lg)] bg-bg-elevated border border-border">
            <Body className="text-sm leading-relaxed">
              This monitoring gap is what Bedrock&apos;s Environmental Assessment Bridge was designed to
              address. Where federal databases stop at the county line, the EAB combines property-level
              geocoding with multi-source federal data to produce site-specific exposure estimates —
              filling the gap between national datasets and the ground truth beneath a specific address.
            </Body>
            <div className="mt-4">
              <Link
                href="/report/search"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-accent text-white rounded-[var(--radius-md)] hover:bg-accent-hover transition-colors"
              >
                Search an address
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
              <p><strong className="text-text-primary">Soil data:</strong> USDA SSURGO via Soil Data Access API. Multi-point sampling for counties ≥1,000 sq mi.</p>
              <p><strong className="text-text-primary">Contamination data:</strong> EPA TRI (Toxics Release Inventory), ECHO (compliance), FRS (Superfund), Brownfields.</p>
              <p><strong className="text-text-primary">Demographics:</strong> US Census Bureau ACS 5-Year Estimates (2022).</p>
            </div>
            <div className="space-y-2">
              <p><strong className="text-text-primary">Index formula:</strong> SCVI = √(SVS × CPI), normalized 0–100. Geometric mean requires both dimensions to be elevated.</p>
              <p><strong className="text-text-primary">Coverage:</strong> {stats.totalCounties} counties scored. 187 counties had partial source failures; scored from available data.</p>
              <p><strong className="text-text-primary">Limitations:</strong> County-level resolution. SSURGO gaps in urban areas. CPI may undercount legacy contamination pre-dating EPA databases.</p>
            </div>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}
