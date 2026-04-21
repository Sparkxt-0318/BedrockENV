import type { Metadata } from 'next';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import Link from 'next/link';
import { Display, Body, Label, Mono } from '@/components/ui/Type';
import { RedliningClient } from './RedliningClient';

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
          Drawn in Red, Measured in Parts Per Billion
        </Display>
        <Body className="text-lg max-w-2xl">
          A national analysis of how 1930s federal redlining maps predict present-day
          environmental contamination, demographic inequality, and lead exposure risk
          across {meta.totalCities} US cities.
        </Body>

        <div className="flex flex-wrap gap-6 mt-8 text-sm">
          <div>
            <Mono className="text-2xl block">
              {meta.totalHolcNeighborhoods.toLocaleString()}
            </Mono>
            <span className="text-text-secondary text-xs">HOLC neighborhoods analyzed</span>
          </div>
          <div>
            <Mono className="text-2xl block">{povertyRatio}&times;</Mono>
            <span className="text-text-secondary text-xs">
              D-vs-A poverty rate nationally
            </span>
          </div>
          <div>
            <Mono className="text-2xl block">{incomeGap}%</Mono>
            <span className="text-text-secondary text-xs">income gap, Grade D vs A</span>
          </div>
        </div>
      </header>

      <RedliningClient
        nationalStats={nationalStats}
        topCitiesByPovertyGap={data.topCitiesByPovertyGap.slice(0, 10)}
        topCitiesByHousingAgeGap={data.topCitiesByHousingAgeGap.slice(0, 10)}
        meta={meta}
      />
    </div>
  );
}
