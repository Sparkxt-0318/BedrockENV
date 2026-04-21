'use client';

import Link from 'next/link';
import { Headline, Body, Label, Mono } from '@/components/ui/Type';
import { Card, CardContent } from '@/components/ui/Card';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { CountUp } from '@/components/ui/CountUp';
import { RedliningGradeChart } from '@/components/charts/RedliningGradeChart';

interface GradeStats {
  grade: string;
  count: number;
  population: number;
  medianIncome: number;
  povertyRate: number;
  pctWhite: number;
  pctBlack: number;
  pctHispanic: number;
  pre1950HousingPct: number;
  scvi: number;
  cpi: number;
  cfci: number;
}

interface CityGap {
  city: string;
  state: string;
  gradeACnt: number;
  gradeDCnt: number;
  aIncome: number;
  dIncome: number;
  incomeGap: number;
  aPoverty: number;
  dPoverty: number;
  povertyGap: number;
  aPctBlack: number;
  dPctBlack: number;
  racialGap: number;
  aPre1950: number;
  dPre1950: number;
  housingAgeGap: number;
  aScvi: number;
  dScvi: number;
  scviGap: number;
}

interface Meta {
  totalHolcNeighborhoods: number;
  totalCities: number;
  totalStates: number;
  qualifyingCitiesForGap: number;
  minNeighborhoodsPerGrade: number;
}

const GRADE_COLORS: Record<string, string> = {
  A: '#4daf4a',
  B: '#377eb8',
  C: '#ffbf00',
  D: '#e41a1c',
};

const GRADE_LABELS: Record<string, string> = {
  A: 'Best',
  B: 'Still Desirable',
  C: 'Declining',
  D: 'Hazardous',
};

export function RedliningClient({
  nationalStats,
  topCitiesByPovertyGap,
  topCitiesByHousingAgeGap,
  meta,
}: {
  nationalStats: GradeStats[];
  topCitiesByPovertyGap: CityGap[];
  topCitiesByHousingAgeGap: CityGap[];
  meta: Meta;
}) {
  const gradeA = nationalStats.find((g) => g.grade === 'A')!;
  const gradeD = nationalStats.find((g) => g.grade === 'D')!;

  return (
    <div className="space-y-24 pb-24">
      {/* ── Chapter 1: Drawn in red ── */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <Label as="div" className="block mb-2">Chapter 1</Label>
          <Headline className="text-3xl mb-6">Drawn in red</Headline>
        </ScrollReveal>

        <ScrollReveal>
          <Body className="mb-6">
            Between 1935 and 1940, the Home Owners&apos; Loan Corporation — a federal agency
            created during the New Deal — sent surveyors to {meta.totalCities} American cities.
            They divided each city into neighborhoods and assigned grades from A (&ldquo;Best&rdquo;)
            to D (&ldquo;Hazardous&rdquo;). On HOLC&apos;s color-coded maps, Grade D
            neighborhoods were shaded red.
          </Body>
          <Body className="mb-6">
            The criteria were explicitly racial. HOLC surveyors noted the presence of
            &ldquo;Negro&rdquo; and &ldquo;foreign-born&rdquo; residents as
            &ldquo;detrimental influences&rdquo; in their area descriptions. Neighborhoods with
            Black residents were almost automatically graded D, regardless of housing quality
            or income levels. These maps guided federal lending policy for decades: banks
            refused mortgages in redlined neighborhoods, locking residents out of homeownership
            and the wealth accumulation it enables.
          </Body>
          <Body className="text-text-primary font-medium text-lg italic mb-8">
            &ldquo;Ninety years later, do the red lines still predict who breathes contaminated
            air, drinks from aging pipes, and lives next to industrial waste?&rdquo;
          </Body>
        </ScrollReveal>

        <ScrollReveal stagger>
          <div className="grid gap-3 sm:grid-cols-4 mt-8">
            {(['A', 'B', 'C', 'D'] as const).map((g) => {
              const stat = nationalStats.find((s) => s.grade === g)!;
              return (
                <div
                  key={g}
                  className="p-4 rounded-[var(--radius-lg)] border border-border"
                  style={{ borderLeftWidth: 4, borderLeftColor: GRADE_COLORS[g] }}
                >
                  <div className="flex items-baseline gap-2">
                    <span
                      className="text-2xl font-semibold"
                      style={{ color: GRADE_COLORS[g] }}
                    >
                      {g}
                    </span>
                    <span className="text-xs text-text-secondary">{GRADE_LABELS[g]}</span>
                  </div>
                  <Mono className="text-sm mt-2 block">
                    {stat.count.toLocaleString()} areas
                  </Mono>
                </div>
              );
            })}
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <div className="mt-8 p-5 rounded-[var(--radius-lg)] bg-bg-elevated border border-border">
            <Body className="text-sm leading-relaxed">
              This analysis uses the{' '}
              <strong className="text-text-primary">
                University of Richmond Mapping Inequality
              </strong>{' '}
              digitized HOLC boundaries, cross-walked to 2020 census tracts by the
              American Panorama project. For each of the{' '}
              {meta.totalHolcNeighborhoods.toLocaleString()} neighborhoods with a valid
              A/B/C/D grade, we pulled tract-level demographics from the Census ACS
              (2022) and county-level environmental scores from Bedrock&apos;s SCVI and
              CFCI indices.
            </Body>
          </div>
        </ScrollReveal>
      </section>

      {/* ── Chapter 2: 90 years of data ── */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <Label as="div" className="block mb-2">Chapter 2</Label>
          <Headline className="text-3xl mb-6">90 years of data</Headline>
        </ScrollReveal>

        <ScrollReveal>
          <div className="grid gap-4 sm:grid-cols-3 mb-10">
            <Card>
              <CardContent className="text-center py-6">
                <Mono className="text-3xl block">
                  $<CountUp end={Math.round(gradeA.medianIncome / 1000)} suffix="k" />
                </Mono>
                <p className="text-xs text-text-primary/65 mt-1">
                  Grade A median income
                </p>
                <p className="text-xs text-text-secondary mt-0.5">
                  vs ${Math.round(gradeD.medianIncome / 1000)}k in Grade D
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="text-center py-6">
                <Mono className="text-3xl block">
                  <CountUp
                    end={Math.round(gradeD.povertyRate / gradeA.povertyRate * 10) / 10}
                    decimals={1}
                    suffix="×"
                  />
                </Mono>
                <p className="text-xs text-text-primary/65 mt-1">
                  D-vs-A poverty rate
                </p>
                <p className="text-xs text-text-secondary mt-0.5">
                  {gradeD.povertyRate}% vs {gradeA.povertyRate}%
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="text-center py-6">
                <Mono className="text-3xl block">
                  <CountUp end={meta.qualifyingCitiesForGap} />
                </Mono>
                <p className="text-xs text-text-primary/65 mt-1">
                  cities with ≥3 A &amp; D areas
                </p>
                <p className="text-xs text-text-secondary mt-0.5">
                  for within-city comparison
                </p>
              </CardContent>
            </Card>
          </div>
        </ScrollReveal>

        <div className="grid gap-8 lg:grid-cols-2">
          <ScrollReveal>
            <Label as="h3" className="block mb-3">Median Household Income by HOLC Grade</Label>
            <Card>
              <CardContent>
                <RedliningGradeChart
                  data={nationalStats.map((g) => ({
                    label: g.grade,
                    value: g.medianIncome,
                    color: GRADE_COLORS[g.grade],
                  }))}
                  format="currency"
                  ariaLabel="Median income by HOLC grade"
                />
              </CardContent>
            </Card>
          </ScrollReveal>

          <ScrollReveal>
            <Label as="h3" className="block mb-3">Poverty Rate by HOLC Grade</Label>
            <Card>
              <CardContent>
                <RedliningGradeChart
                  data={nationalStats.map((g) => ({
                    label: g.grade,
                    value: g.povertyRate,
                    color: GRADE_COLORS[g.grade],
                  }))}
                  format="percent"
                  ariaLabel="Poverty rate by HOLC grade"
                />
              </CardContent>
            </Card>
          </ScrollReveal>
        </div>

        <ScrollReveal>
          <div className="mt-10">
            <Label as="h3" className="block mb-4">
              Largest Within-City Poverty Gaps (Grade D − Grade A)
            </Label>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="px-4 py-3 text-xs font-medium text-text-primary/65 uppercase tracking-wider">City</th>
                        <th className="px-4 py-3 text-xs font-medium text-text-primary/65 uppercase tracking-wider text-right">A Poverty</th>
                        <th className="px-4 py-3 text-xs font-medium text-text-primary/65 uppercase tracking-wider text-right">D Poverty</th>
                        <th className="px-4 py-3 text-xs font-medium text-text-primary/65 uppercase tracking-wider text-right">Gap</th>
                        <th className="px-4 py-3 text-xs font-medium text-text-primary/65 uppercase tracking-wider text-right hidden sm:table-cell">A areas</th>
                        <th className="px-4 py-3 text-xs font-medium text-text-primary/65 uppercase tracking-wider text-right hidden sm:table-cell">D areas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topCitiesByPovertyGap.map((c) => (
                        <tr
                          key={`${c.city}-${c.state}`}
                          className="border-b border-border/50 hover:bg-bg-elevated/50 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <span className="font-medium text-text-primary">{c.city}</span>
                            <span className="text-text-secondary ml-1">{c.state}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Mono className="text-sm text-[#4daf4a]">
                              {c.aPoverty.toFixed(1)}%
                            </Mono>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Mono className="text-sm text-[#e41a1c]">
                              {c.dPoverty.toFixed(1)}%
                            </Mono>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Mono className="text-sm font-medium">
                              +{c.povertyGap.toFixed(1)}pp
                            </Mono>
                          </td>
                          <td className="px-4 py-3 text-right text-text-secondary hidden sm:table-cell">
                            <Mono className="text-xs">{c.gradeACnt}</Mono>
                          </td>
                          <td className="px-4 py-3 text-right text-text-secondary hidden sm:table-cell">
                            <Mono className="text-xs">{c.gradeDCnt}</Mono>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
            <p className="text-xs text-text-primary/65 mt-2">
              Within-city comparison controls for urbanization bias.
              Only cities with ≥{meta.minNeighborhoodsPerGrade} neighborhoods per grade included
              ({meta.qualifyingCitiesForGap} qualifying cities).
            </p>
          </div>
        </ScrollReveal>
      </section>

      {/* ── Chapter 3: The contamination legacy ── */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <Label as="div" className="block mb-2">Chapter 3</Label>
          <Headline className="text-3xl mb-6">The built environment legacy</Headline>
        </ScrollReveal>

        <ScrollReveal>
          <Body className="mb-6">
            Redlined neighborhoods don&apos;t just have lower incomes — they have older
            infrastructure. Pre-1950 housing is the most direct proxy for lead exposure risk:
            lead paint was standard until 1978, lead service lines were installed until the
            1950s. When a neighborhood was systematically denied investment for decades, the
            housing stock didn&apos;t get updated. The pipes didn&apos;t get replaced.
          </Body>
          <Body className="mb-8">
            At the national level, pre-1950 housing rates are similar across HOLC grades
            because Grade A neighborhoods in older Eastern cities preserved their historic
            housing stock. But <strong className="text-text-primary">within cities</strong>,
            the pattern flips: Grade D neighborhoods consistently have more pre-1950
            housing than Grade A neighborhoods in the same city.
          </Body>
        </ScrollReveal>

        <div className="grid gap-8 lg:grid-cols-2">
          <ScrollReveal>
            <Label as="h3" className="block mb-3">% Black Residents by HOLC Grade</Label>
            <Card>
              <CardContent>
                <RedliningGradeChart
                  data={nationalStats.map((g) => ({
                    label: g.grade,
                    value: g.pctBlack,
                    color: GRADE_COLORS[g.grade],
                  }))}
                  format="percent"
                  ariaLabel="Percent Black residents by HOLC grade"
                />
              </CardContent>
            </Card>
          </ScrollReveal>

          <ScrollReveal>
            <Label as="h3" className="block mb-3">
              Contamination Pressure (CPI) by HOLC Grade
            </Label>
            <Card>
              <CardContent>
                <RedliningGradeChart
                  data={nationalStats.map((g) => ({
                    label: g.grade,
                    value: g.cpi,
                    color: GRADE_COLORS[g.grade],
                  }))}
                  format="number"
                  ariaLabel="Contamination Pressure Index by HOLC grade"
                />
              </CardContent>
            </Card>
          </ScrollReveal>
        </div>

        <ScrollReveal>
          <div className="mt-10">
            <Label as="h3" className="block mb-4">
              Largest Within-City Pre-1950 Housing Gaps (Grade D − Grade A)
            </Label>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="px-4 py-3 text-xs font-medium text-text-primary/65 uppercase tracking-wider">City</th>
                        <th className="px-4 py-3 text-xs font-medium text-text-primary/65 uppercase tracking-wider text-right">A pre-1950</th>
                        <th className="px-4 py-3 text-xs font-medium text-text-primary/65 uppercase tracking-wider text-right">D pre-1950</th>
                        <th className="px-4 py-3 text-xs font-medium text-text-primary/65 uppercase tracking-wider text-right">Gap</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topCitiesByHousingAgeGap.map((c) => (
                        <tr
                          key={`${c.city}-${c.state}-housing`}
                          className="border-b border-border/50 hover:bg-bg-elevated/50 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <span className="font-medium text-text-primary">{c.city}</span>
                            <span className="text-text-secondary ml-1">{c.state}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Mono className="text-sm text-[#4daf4a]">
                              {c.aPre1950.toFixed(1)}%
                            </Mono>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Mono className="text-sm text-[#e41a1c]">
                              {c.dPre1950.toFixed(1)}%
                            </Mono>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Mono className="text-sm font-medium">
                              +{c.housingAgeGap.toFixed(1)}pp
                            </Mono>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
            <p className="text-xs text-text-primary/65 mt-2">
              Pre-1950 housing is a direct proxy for lead paint and lead service line risk.
              Higher percentages mean more residents exposed to lead through their built environment.
            </p>
          </div>
        </ScrollReveal>
      </section>

      {/* ── Chapter 4: The compounding burden ── */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <Label as="div" className="block mb-2">Chapter 4</Label>
          <Headline className="text-3xl mb-6">The compounding burden</Headline>
        </ScrollReveal>

        <ScrollReveal>
          <Body className="mb-6">
            The data reveals a compound burden: neighborhoods redlined in the 1930s
            are today simultaneously poorer, more racially segregated, more likely to have
            aging lead-contaminated infrastructure, and — at the county level — located in
            areas with higher contamination pressure.
          </Body>
          <Body className="mb-6">
            Across {meta.qualifyingCitiesForGap} cities with enough data for within-city
            comparison, Grade D neighborhoods have a poverty rate{' '}
            <strong className="text-text-primary">
              {(gradeD.povertyRate / gradeA.povertyRate).toFixed(1)}&times;
            </strong>{' '}
            higher than Grade A neighborhoods. They have{' '}
            <strong className="text-text-primary">
              {(gradeD.pctBlack / gradeA.pctBlack).toFixed(1)}&times;
            </strong>{' '}
            the share of Black residents. And at the county level, they sit in areas with{' '}
            <strong className="text-text-primary">
              {(gradeD.cpi - gradeA.cpi).toFixed(0)}
            </strong>{' '}
            points higher contamination pressure on Bedrock&apos;s CPI scale.
          </Body>
          <Body className="mb-8">
            These are not independent factors. They compound. A family in a formerly redlined
            neighborhood is more likely to live in a pre-1950 home with lead pipes, in a county
            with more industrial contamination, with fewer financial resources to remediate either.
            The HOLC maps are gone, but their legacy is measurable in every contamination vector
            Bedrock tracks.
          </Body>
        </ScrollReveal>

        <ScrollReveal>
          <div className="p-5 rounded-[var(--radius-lg)] bg-bg-elevated border border-border">
            <Body className="text-sm leading-relaxed mb-4">
              Environmental justice policy often frames contamination burden as a
              present-tense distribution problem. This analysis suggests it is also an
              inheritance problem — that the geography of contamination was co-determined
              with the geography of race by federal policy decisions made ninety years ago.
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

      {/* ── Methodology ── */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-12 border-t border-border">
        <ScrollReveal>
          <Label as="h2" className="block mb-4">Methodology &amp; Data Sources</Label>
          <div className="grid gap-3 sm:grid-cols-2 text-xs text-text-secondary">
            <div className="space-y-2">
              <p>
                <strong className="text-text-primary">HOLC boundaries:</strong> University of
                Richmond Digital Scholarship Lab &ldquo;Mapping Inequality&rdquo; project,
                digitized from original 1935–1940 HOLC residential security maps. Census tract
                crosswalk by the American Panorama project (2020 Census tracts).
              </p>
              <p>
                <strong className="text-text-primary">Demographics:</strong> US Census Bureau
                ACS 5-Year Estimates (2022). Tract-level median income, poverty, race/ethnicity,
                and housing age. Area-weighted using intersection polygons from the crosswalk.
              </p>
              <p>
                <strong className="text-text-primary">Environmental data:</strong> Bedrock SCVI
                (Soil Contamination Vulnerability Index) and CPI (Contamination Pressure Index)
                at the county level. Pre-1950 housing percentage (ACS B25034) as a tract-level
                lead exposure proxy.
              </p>
            </div>
            <div className="space-y-2">
              <p>
                <strong className="text-text-primary">Within-city controls:</strong> To avoid
                urbanization bias (cities have more contamination than rural areas regardless of
                redlining), all A-vs-D comparisons use within-city gaps. Only cities with
                ≥{meta.minNeighborhoodsPerGrade} neighborhoods per grade are included
                ({meta.qualifyingCitiesForGap} qualifying cities).
              </p>
              <p>
                <strong className="text-text-primary">Coverage:</strong>{' '}
                {meta.totalHolcNeighborhoods.toLocaleString()} HOLC neighborhoods across{' '}
                {meta.totalCities} cities in {meta.totalStates} states. HOLC surveys were
                limited to cities; rural areas were not graded.
              </p>
              <p>
                <strong className="text-text-primary">Limitations:</strong> Environmental
                scores (SCVI/CPI) are county-level and cannot distinguish sub-county variation.
                Pre-1950 housing is a proxy, not a direct lead measurement. The HOLC-to-tract
                crosswalk uses areal intersection, which may assign a HOLC grade to a tract that
                only partially overlaps.
              </p>
            </div>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}
