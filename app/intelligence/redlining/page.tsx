import type { Metadata } from 'next';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { Display, Body } from '@/components/ui/Type';
import { RedliningClient } from './RedliningClient';
import { BriefHero } from '@/components/intelligence/BriefHero';

export const metadata: Metadata = {
  title: 'Redlining & Environmental Contamination | Bedrock Intelligence',
  description:
    'A national analysis of how 1930s HOLC redlining maps predict present-day environmental contamination, demographic inequality, and lead exposure risk across 300 US cities.',
};

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

interface AnalysisData {
  meta: {
    totalHolcNeighborhoods: number;
    totalCities: number;
    totalStates: number;
    qualifyingCitiesForGap: number;
    minNeighborhoodsPerGrade: number;
  };
  nationalStats: GradeStats[];
  cityGaps: CityGap[];
  topCitiesByPovertyGap: CityGap[];
  topCitiesByHousingAgeGap: CityGap[];
  topCitiesByRacialGap: CityGap[];
  neighborhoods: Array<{
    areaId: number;
    grade: string;
    city: string;
    state: string;
    population: number;
    medianIncome: number | null;
    povertyRate: number | null;
    pctBlack: number | null;
    pre1950HousingPct: number | null;
    scvi: number | null;
    cpi: number | null;
  }>;
}

function loadData(): AnalysisData | null {
  const p = path.join(process.cwd(), 'data', 'redlining-analysis.json');
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, 'utf-8'));
}

export default function RedliningPage() {
  const data = loadData();

  if (!data) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <Display className="text-4xl mb-4">Data Processing</Display>
        <Body>The redlining analysis dataset is still being compiled.</Body>
      </div>
    );
  }

  const { meta, nationalStats } = data;
  const gradeA = nationalStats.find((g) => g.grade === 'A')!;
  const gradeD = nationalStats.find((g) => g.grade === 'D')!;
  const povertyRatio = (gradeD.povertyRate / gradeA.povertyRate).toFixed(1);
  const incomeGap = Math.round((1 - gradeD.medianIncome / gradeA.medianIncome) * 100);

  return (
    <div className="min-h-screen">
      <BriefHero
        image="chapter-air"
        label="Bedrock Research Brief · April 2026"
        title="Drawn in Red, Measured in Parts Per Billion"
        description={`A national analysis of how 1930s federal redlining maps predict present-day environmental contamination, demographic inequality, and lead exposure risk across ${meta.totalCities} US cities.`}
        stats={[
          { value: meta.totalHolcNeighborhoods.toLocaleString(), label: 'HOLC neighborhoods analyzed' },
          { value: `${povertyRatio}×`, label: 'D-vs-A poverty rate nationally' },
          { value: `${incomeGap}%`, label: 'income gap, Grade D vs A' },
        ]}
      />

      <RedliningClient
        nationalStats={nationalStats}
        topCitiesByPovertyGap={data.topCitiesByPovertyGap.slice(0, 10)}
        topCitiesByHousingAgeGap={data.topCitiesByHousingAgeGap.slice(0, 10)}
        meta={meta}
      />
    </div>
  );
}
