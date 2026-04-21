/**
 * Build county-level flood exposure dataset from FEMA OpenFEMA API.
 *
 * Source: NfipResidentialPenetrationRates (3,158 county-level records)
 *   https://www.fema.gov/api/open/v1/NfipResidentialPenetrationRates
 *
 * FEMA derives these statistics from the NFHL — the same authoritative
 * flood maps used for individual property lookups. This is a one-time
 * bulk download, not a per-county API loop.
 *
 * Output: data/flood-by-county.json
 *   [{ fips, state, county, totalResStructures, totalResStructuresSfha,
 *      fer, resContractsInForce, resContractsInForceSfha,
 *      resPenetrationRate, resPenetrationRateSfha, adaptationGap, asOfDate }]
 *
 * Usage: npx tsx scripts/build-flood-data.ts
 */

import { writeFileSync, mkdirSync } from 'fs';
import path from 'path';

const ENDPOINT =
  'https://www.fema.gov/api/open/v1/NfipResidentialPenetrationRates';
const PAGE_SIZE = 1000;
const OUT_PATH = 'data/flood-by-county.json';

interface OpenFemaRecord {
  state: string;
  county: string;
  fipsCode: string;
  resPenetrationRateSfha: number;
  resPenetrationRate: number;
  resContractsInForceSfha: number;
  resContractsInForce: number;
  totalResStructuresSfha: number;
  totalResStructures: number;
  asOfDate: string;
}

interface FloodByCountyRecord {
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

async function fetchPage(skip: number): Promise<OpenFemaRecord[]> {
  const url = `${ENDPOINT}?$top=${PAGE_SIZE}&$skip=${skip}&$orderby=fipsCode`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`OpenFEMA returned HTTP ${res.status} for skip=${skip}`);
  }
  const body = (await res.json()) as {
    NfipResidentialPenetrationRates?: OpenFemaRecord[];
  };
  return body.NfipResidentialPenetrationRates ?? [];
}

function transform(r: OpenFemaRecord): FloodByCountyRecord {
  const fer =
    r.totalResStructures > 0
      ? r.totalResStructuresSfha / r.totalResStructures
      : 0;
  const adaptationGap = 1 - (r.resPenetrationRateSfha ?? 0);
  return {
    fips: r.fipsCode,
    state: r.state,
    county: r.county,
    totalResStructures: r.totalResStructures,
    totalResStructuresSfha: r.totalResStructuresSfha,
    fer: Math.round(fer * 10_000) / 10_000,
    resContractsInForce: r.resContractsInForce,
    resContractsInForceSfha: r.resContractsInForceSfha,
    resPenetrationRate: r.resPenetrationRate,
    resPenetrationRateSfha: r.resPenetrationRateSfha,
    adaptationGap: Math.round(adaptationGap * 10_000) / 10_000,
    asOfDate: r.asOfDate,
  };
}

async function main() {
  console.log(`Downloading FEMA NfipResidentialPenetrationRates → ${OUT_PATH}`);

  const all: OpenFemaRecord[] = [];
  let skip = 0;
  while (true) {
    const batch = await fetchPage(skip);
    if (batch.length === 0) break;
    all.push(...batch);
    console.log(`  Page skip=${skip}: ${batch.length} records (total: ${all.length})`);
    if (batch.length < PAGE_SIZE) break;
    skip += PAGE_SIZE;
  }

  const deduped = new Map<string, OpenFemaRecord>();
  for (const r of all) {
    const existing = deduped.get(r.fipsCode);
    if (!existing || r.asOfDate > existing.asOfDate) {
      deduped.set(r.fipsCode, r);
    }
  }

  const records = [...deduped.values()].map(transform);
  records.sort((a, b) => a.fips.localeCompare(b.fips));

  mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(records, null, 2));

  const fersSorted = [...records].sort((a, b) => b.fer - a.fer);
  console.log('');
  console.log(`Total counties: ${records.length}`);
  console.log(`As-of date: ${records[0]?.asOfDate ?? 'n/a'}`);
  console.log('');
  console.log('Top 10 by FER (flood exposure ratio):');
  for (const r of fersSorted.slice(0, 10)) {
    console.log(
      `  ${r.fips} ${r.county}, ${r.state}: FER=${(r.fer * 100).toFixed(1)}% ` +
        `(${r.totalResStructuresSfha.toLocaleString()} / ${r.totalResStructures.toLocaleString()} in SFHA)`
    );
  }
  console.log('');
  console.log(`Written to ${OUT_PATH}`);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
