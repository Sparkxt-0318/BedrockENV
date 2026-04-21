/**
 * Compile the national CFCI dataset by merging:
 *   data/flood-by-county.json   (FEMA NFIP residential penetration)
 *   data/scvi-national.json     (SCVI CPI sub-scores + demographics)
 *
 * Output: data/cfci-national.json
 *
 * Usage: npx tsx scripts/build-cfci-national.ts
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import path from 'path';
import {
  computeCfci,
  assignCfciQuartiles,
  type CfciClassification,
} from '../lib/intelligence/cfci-scorer';

interface FloodRecord {
  fips: string;
  state: string;
  county: string;
  totalResStructures: number;
  totalResStructuresSfha: number;
  fer: number;
  resContractsInForce: number;
  resContractsInForceSfha: number;
  resPenetrationRate: number;
  resPenetrationRateSfha: number;
  adaptationGap: number;
  asOfDate: string;
}

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
  coverage?: unknown;
  samplePoints?: number;
  demographics?: {
    medianIncome: number | null;
    povertyRate: number | null;
    pctWhite: number | null;
    pctBlack: number | null;
    pctHispanic: number | null;
  } | null;
}

interface CfciRecord {
  fips: string;
  county: string;
  state: string;
  population: number;
  cfci: number;
  cfciQuartile: 1 | 2 | 3 | 4;
  classification: CfciClassification;
  floodExposureScore: number;
  fer: number;
  cpi: number;
  scvi: number;
  totalResStructures: number;
  totalResStructuresSfha: number;
  resPenetrationRateSfha: number;
  adaptationGap: number;
  cpiComponents: Record<string, number>;
  demographics: ScviRecord['demographics'];
  floodAsOfDate: string;
}

function loadJson<T>(p: string): T {
  return JSON.parse(readFileSync(p, 'utf8')) as T;
}

function main() {
  const flood = loadJson<FloodRecord[]>('data/flood-by-county.json');
  const scvi = loadJson<ScviRecord[]>('data/scvi-national.json');

  const floodByFips = new Map(flood.map((f) => [f.fips, f]));
  const scviByFips = new Map(scvi.map((s) => [s.fips, s]));

  const merged: CfciRecord[] = [];
  let missingFlood = 0;
  let missingScvi = 0;

  for (const s of scvi) {
    const f = floodByFips.get(s.fips);
    if (!f) {
      missingFlood++;
      continue;
    }
    const { cfci, floodExposureScore, cpi, classification } = computeCfci({
      fer: f.fer,
      cpi: s.cpi,
    });
    merged.push({
      fips: s.fips,
      county: s.county,
      state: s.state,
      population: s.population,
      cfci,
      cfciQuartile: 1,
      classification,
      floodExposureScore,
      fer: f.fer,
      cpi,
      scvi: s.scvi,
      totalResStructures: f.totalResStructures,
      totalResStructuresSfha: f.totalResStructuresSfha,
      resPenetrationRateSfha: f.resPenetrationRateSfha,
      adaptationGap: f.adaptationGap,
      cpiComponents: s.cpiComponents,
      demographics: s.demographics ?? null,
      floodAsOfDate: f.asOfDate,
    });
  }

  for (const f of flood) {
    if (!scviByFips.has(f.fips)) missingScvi++;
  }

  const quartiles = assignCfciQuartiles(merged.map((r) => ({ cfci: r.cfci })));
  merged.forEach((r, i) => (r.cfciQuartile = quartiles[i]));

  merged.sort((a, b) => b.cfci - a.cfci);

  const OUT_PATH = 'data/cfci-national.json';
  mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(merged, null, 2));

  const totalPop = merged.reduce((s, r) => s + r.population, 0);
  const q4 = merged.filter((r) => r.cfciQuartile === 4);
  const q4Pop = q4.reduce((s, r) => s + r.population, 0);

  console.log('');
  console.log('='.repeat(72));
  console.log(`CFCI NATIONAL — ${merged.length} counties merged`);
  console.log('='.repeat(72));
  console.log(`Missing flood data (SCVI had no FEMA match): ${missingFlood}`);
  console.log(`Missing SCVI data (flood had no SCVI match): ${missingScvi}`);
  console.log(`Total population: ${totalPop.toLocaleString()}`);
  console.log(
    `Q4 (highest compound risk): ${q4.length} counties, ${q4Pop.toLocaleString()} pop (${(
      (100 * q4Pop) / totalPop
    ).toFixed(1)}%)`
  );
  console.log('');
  console.log('TOP 25 CFCI:');
  console.log(
    '  #   County, State                 CFCI  Class       FER   CPI    SCVI  Pop'
  );
  for (let i = 0; i < Math.min(25, merged.length); i++) {
    const r = merged[i];
    const loc = `${r.county}, ${r.state}`.padEnd(30);
    console.log(
      `  ${String(i + 1).padStart(2)}  ${loc} ${String(r.cfci).padStart(4)}  ` +
        `${r.classification.padEnd(10)}  ${(r.fer * 100).toFixed(0).padStart(3)}%  ` +
        `${String(r.cpi).padStart(3)}    ${String(r.scvi).padStart(3)}   ` +
        `${r.population.toLocaleString()}`
    );
  }

  console.log('');
  console.log('CLASSIFICATION DISTRIBUTION:');
  const classCounts: Record<string, number> = {};
  for (const r of merged) {
    classCounts[r.classification] = (classCounts[r.classification] ?? 0) + 1;
  }
  for (const [k, v] of Object.entries(classCounts)) {
    console.log(`  ${k.padEnd(10)} ${v} counties (${((100 * v) / merged.length).toFixed(1)}%)`);
  }

  console.log('');
  console.log('STATES WITH MOST Q4 COUNTIES:');
  const q4ByState = new Map<string, number>();
  for (const r of q4) q4ByState.set(r.state, (q4ByState.get(r.state) ?? 0) + 1);
  const sortedStates = [...q4ByState.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15);
  for (const [state, count] of sortedStates) {
    console.log(`  ${state}: ${count}`);
  }

  console.log('');
  console.log('WEIGHTED MEAN DEMOGRAPHICS BY CFCI QUARTILE:');
  for (const q of [1, 2, 3, 4] as const) {
    const subset = merged.filter((r) => r.cfciQuartile === q);
    const demoMean = (field: keyof NonNullable<ScviRecord['demographics']>) => {
      let popSum = 0;
      let valSum = 0;
      for (const r of subset) {
        const v = r.demographics?.[field];
        if (v == null) continue;
        popSum += r.population;
        valSum += r.population * (v as number);
      }
      return popSum > 0 ? valSum / popSum : 0;
    };
    console.log(
      `  Q${q}: n=${subset.length}  income=$${Math.round(demoMean('medianIncome')).toLocaleString()}  ` +
        `poverty=${demoMean('povertyRate').toFixed(1)}%  %Black=${demoMean('pctBlack').toFixed(1)}  ` +
        `%Hispanic=${demoMean('pctHispanic').toFixed(1)}`
    );
  }

  console.log('');
  console.log(`Written to ${OUT_PATH}`);
}

main();
