import type { Metadata } from 'next';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import Link from 'next/link';
import { Display, Body, Label, Mono } from '@/components/ui/Type';
import { FloodContaminationClient } from './FloodContaminationClient';

export const metadata: Metadata = {
  title: 'National Flood-Contamination Compound Risk Map | Bedrock Intelligence',
  description:
    'An independent analysis identifying US counties where flood exposure intersects with soil and industrial contamination — mapping the compound risk that neither FEMA nor EPA publishes.',
};

interface CfciRecord {
  fips: string;
  county: string;
  state: string;
  population: number;
  cfci: number;
  cfciQuartile: 1 | 2 | 3 | 4;
  classification: 'Low' | 'Elevated' | 'High' | 'Severe';
  floodExposureScore: number;
  fer: number;
  cpi: number;
  scvi: number;
  totalResStructures: number;
  totalResStructuresSfha: number;
  resPenetrationRateSfha: number;
  adaptationGap: number;
  cpiComponents: Record<string, number>;
  demographics: {
    medianIncome: number | null;
    povertyRate: number | null;
    pctWhite: number | null;
    pctBlack: number | null;
    pctHispanic: number | null;
  } | null;
  floodAsOfDate: string;
}

function loadData(): CfciRecord[] | null {
  const p = path.join(process.cwd(), 'data', 'cfci-national.json');
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, 'utf-8'));
}

function computeStats(data: CfciRecord[]) {
  const q = (n: 1 | 2 | 3 | 4) => data.filter((d) => d.cfciQuartile === n);
  const totalPop = data.reduce((s, d) => s + d.population, 0);

  function weightedMean(
    records: CfciRecord[],
    field: keyof NonNullable<CfciRecord['demographics']>
  ) {
    let popSum = 0;
    let valSum = 0;
    for (const r of records) {
      const v = r.demographics?.[field];
      if (v == null) continue;
      popSum += r.population;
      valSum += r.population * (v as number);
    }
    return popSum > 0 ? valSum / popSum : 0;
  }

  function weightedMeanField(records: CfciRecord[], accessor: (r: CfciRecord) => number | null) {
    let popSum = 0;
    let valSum = 0;
    for (const r of records) {
      const v = accessor(r);
      if (v == null || !Number.isFinite(v)) continue;
      popSum += r.population;
      valSum += r.population * v;
    }
    return popSum > 0 ? valSum / popSum : 0;
  }

  const quartileStats = ([1, 2, 3, 4] as const).map((n) => {
    const subset = q(n);
    const pop = subset.reduce((s, d) => s + d.population, 0);
    return {
      quartile: n,
      counties: subset.length,
      population: pop,
      popPct: (100 * pop) / totalPop,
      medianIncome: weightedMean(subset, 'medianIncome'),
      povertyRate: weightedMean(subset, 'povertyRate'),
      pctBlack: weightedMean(subset, 'pctBlack'),
      pctHispanic: weightedMean(subset, 'pctHispanic'),
      pctWhite: weightedMean(subset, 'pctWhite'),
      meanAdaptationGap: weightedMeanField(subset, (r) =>
        Math.max(0, Math.min(1, r.adaptationGap))
      ),
    };
  });

  const top25 = [...data].sort((a, b) => b.cfci - a.cfci).slice(0, 25);

  const severeOrHighCount = data.filter(
    (d) => d.classification === 'Severe' || d.classification === 'High'
  ).length;
  const severeOrHighPop = data
    .filter((d) => d.classification === 'Severe' || d.classification === 'High')
    .reduce((s, d) => s + d.population, 0);

  const q4 = q(4);
  const q4UninsuredStructures = q4.reduce((s, r) => {
    const gap = Math.max(0, Math.min(1, r.adaptationGap));
    return s + r.totalResStructuresSfha * gap;
  }, 0);

  const povertyRatio = quartileStats[3].povertyRate / (quartileStats[0].povertyRate || 1);

  const regionalLeaders = [
    { region: 'Gulf Coast', fipsPrefixes: ['12', '22', '48', '28'], label: 'Gulf Coast (FL/LA/TX/MS)' },
    { region: 'Mid-Atlantic', fipsPrefixes: ['34', '36', '42'], label: 'NJ/NY/PA industrial corridor' },
    { region: 'Mississippi Delta', fipsPrefixes: ['28', '05', '22'], label: 'MS/AR/LA Delta' },
    { region: 'Appalachian', fipsPrefixes: ['54', '21', '51'], label: 'WV/KY/VA Appalachia' },
  ].map((r) => {
    const counties = data.filter((d) =>
      r.fipsPrefixes.some((p) => d.fips.startsWith(p)) && d.cfciQuartile === 4
    );
    return { ...r, q4Count: counties.length };
  });

  return {
    totalCounties: data.length,
    totalPop,
    q4Pop: quartileStats[3].population,
    q4PopPct: quartileStats[3].popPct,
    quartileStats,
    top25,
    severeOrHighCount,
    severeOrHighPop,
    q4UninsuredStructures,
    povertyRatio,
    regionalLeaders,
    floodAsOfDate: data[0]?.floodAsOfDate ?? null,
  };
}

export default function FloodContaminationPage() {
  const data = loadData();

  if (!data) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <Display className="text-4xl mb-4">Data Processing</Display>
        <Body>The national CFCI dataset is still being compiled.</Body>
      </div>
    );
  }

  const stats = computeStats(data);

  return (
    <div className="min-h-screen">
      <header className="mx-auto max-w-6xl px-4 pt-12 pb-8 sm:px-6 lg:px-8">
        <Link
          href="/intelligence"
          className="inline-flex items-center gap-1 text-sm text-text-tertiary hover:text-text-secondary transition-colors mb-8"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
            <path
              d="M10 12L6 8L10 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back to Intelligence
        </Link>

        <Label as="div" className="block mb-3">
          Bedrock Research Brief · April 2026
        </Label>
        <Display className="text-4xl sm:text-5xl mb-4 max-w-3xl">
          The Flood-Contamination Compound Map
        </Display>
        <Body className="text-lg max-w-2xl">
          An independent analysis of where FEMA flood exposure intersects with EPA contamination
          pressure across {stats.totalCounties.toLocaleString()} US counties — mapping the compound
          risk that neither agency publishes on its own.
        </Body>

        <div className="flex flex-wrap gap-6 mt-8 text-sm">
          <div>
            <Mono className="text-2xl block">{stats.totalCounties.toLocaleString()}</Mono>
            <span className="text-text-secondary text-xs">Counties scored</span>
          </div>
          <div>
            <Mono className="text-2xl block">
              {Math.round(stats.severeOrHighPop / 1e6)}M
            </Mono>
            <span className="text-text-secondary text-xs">People in high-CFCI counties</span>
          </div>
          <div>
            <Mono className="text-2xl block">
              {Math.round(stats.q4UninsuredStructures / 1e6).toFixed(1)}M
            </Mono>
            <span className="text-text-secondary text-xs">
              Uninsured SFHA homes in Q4 counties
            </span>
          </div>
        </div>
      </header>

      <FloodContaminationClient
        data={data.map((d) => ({
          fips: d.fips,
          county: d.county,
          state: d.state,
          population: d.population,
          cfci: d.cfci,
          cfciQuartile: d.cfciQuartile,
          classification: d.classification,
          floodExposureScore: d.floodExposureScore,
          fer: d.fer,
          cpi: d.cpi,
          scvi: d.scvi,
          totalResStructures: d.totalResStructures,
          totalResStructuresSfha: d.totalResStructuresSfha,
          resPenetrationRateSfha: d.resPenetrationRateSfha,
          adaptationGap: d.adaptationGap,
        }))}
        stats={stats}
      />
    </div>
  );
}
