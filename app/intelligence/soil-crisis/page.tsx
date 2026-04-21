import type { Metadata } from 'next';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { Display, Body } from '@/components/ui/Type';
import { SoilCrisisClient } from './SoilCrisisClient';
import { BriefHero } from '@/components/intelligence/BriefHero';

export const metadata: Metadata = {
  title: 'National Soil Contamination Vulnerability Index | Bedrock Intelligence',
  description:
    'An independent analysis of soil contamination vulnerability across all 3,140 US counties, integrating USDA soil data with EPA contamination records.',
};

interface ScviRecord {
  fips: string;
  county: string;
  state: string;
  population: number;
  scvi: number;
  svs: number;
  cpi: number;
  quartile: number;
  usdaSviClass: string;
  svsComponents: Record<string, number>;
  cpiComponents: Record<string, number>;
  demographics?: {
    medianIncome: number | null;
    povertyRate: number | null;
    pctWhite: number | null;
    pctBlack: number | null;
    pctHispanic: number | null;
  } | null;
}

function loadData(): ScviRecord[] | null {
  const p = path.join(process.cwd(), 'data', 'scvi-national.json');
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, 'utf-8'));
}

function computeStats(data: ScviRecord[]) {
  const q = (n: 1 | 2 | 3 | 4) => data.filter((d) => d.quartile === n);
  const totalPop = data.reduce((s, d) => s + d.population, 0);

  function weightedMean(records: ScviRecord[], field: keyof NonNullable<ScviRecord['demographics']>) {
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
    };
  });

  const isVaIndependentCity = (d: ScviRecord) =>
    d.state === 'VA' && d.county.endsWith('city');

  const top10 = [...data]
    .sort((a, b) => b.scvi - a.scvi)
    .filter((d) => !isVaIndependentCity(d))
    .slice(0, 10);

  const urbanGapCount = data.filter(
    (d) => d.svsComponents?.urbanGap > 0
  ).length;
  const urbanGapQ4 = data.filter(
    (d) => d.svsComponents?.urbanGap > 0 && d.quartile === 4
  ).length;

  const blackRatio = quartileStats[3].pctBlack / (quartileStats[0].pctBlack || 1);

  return {
    totalCounties: data.length,
    totalPop,
    q4Pop: quartileStats[3].population,
    q4PopPct: quartileStats[3].popPct,
    quartileStats,
    top10,
    urbanGapCount,
    urbanGapQ4,
    blackRatio,
  };
}

export default function SoilCrisisPage() {
  const data = loadData();

  if (!data) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <Display className="text-4xl mb-4">Data Processing</Display>
        <Body>The national SCVI dataset is still being compiled.</Body>
      </div>
    );
  }

  const stats = computeStats(data);

  return (
    <div className="min-h-screen">
      <BriefHero
        image="chapter-soil"
        label="Bedrock Research Brief · April 2026"
        title="The Soil Contamination Vulnerability Index"
        description={`An independent analysis of soil contamination vulnerability across ${stats.totalCounties.toLocaleString()} US counties, bridging the gap between federal soil science and environmental compliance data.`}
        stats={[
          { value: stats.totalCounties.toLocaleString(), label: 'Counties scored' },
          { value: `${Math.round(stats.totalPop / 1e6)}M`, label: 'Population covered' },
          { value: '15+', label: 'Federal data sources' },
        ]}
      />

      {/* Client-rendered interactive sections */}
      <SoilCrisisClient
        data={data.map((d) => ({
          fips: d.fips,
          county: d.county,
          state: d.state,
          population: d.population,
          scvi: d.scvi,
          svs: d.svs,
          cpi: d.cpi,
          quartile: d.quartile,
          usdaSviClass: d.usdaSviClass,
        }))}
        stats={stats}
      />
    </div>
  );
}
