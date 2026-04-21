/**
 * Build the redlining → environmental contamination dataset.
 *
 * Pipeline:
 *   1. Download HOLC crosswalk (strip geometry)
 *   2. Pull Census ACS tract-level demographics
 *   3. Join to county SCVI/CFCI
 *   4. Compute national + within-city analyses
 *   5. Write data/redlining-analysis.json
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';

// ── Types ──────────────────────────────────────────────────────────────────

interface HolcRecord {
  area_id: number;
  grade: string;
  city: string;
  state: string;
  GEOID: string;
  pct_tract: number;
  calc_area: number;
}

interface TractDemographics {
  geoid: string;
  population: number;
  medianIncome: number | null;
  povertyPop: number;
  povertyUniverse: number;
  white: number;
  black: number;
  hispanic: number;
  totalRacePop: number;
  totalHispanicPop: number;
  totalHousingUnits: number;
  pre1950Units: number;
}

interface CountyEnv {
  scvi: number;
  cpi: number;
  cfci: number | null;
}

interface NeighborhoodResult {
  areaId: number;
  grade: string;
  city: string;
  state: string;
  tracts: string[];
  population: number;
  medianIncome: number | null;
  povertyRate: number | null;
  pctWhite: number | null;
  pctBlack: number | null;
  pctHispanic: number | null;
  pre1950HousingPct: number | null;
  countyFips: string;
  scvi: number | null;
  cpi: number | null;
  cfci: number | null;
}

// ── Constants ──────────────────────────────────────────────────────────────

const CROSSWALK_URL =
  'https://raw.githubusercontent.com/americanpanorama/mapping-inequality-census-crosswalk/main/MIv3Areas_2020TractCrosswalk.geojson';

const VALID_GRADES = new Set(['A', 'B', 'C', 'D']);

const STATE_ABBR_TO_FIPS: Record<string, string> = {
  AL: '01', AZ: '04', AR: '05', CA: '06', CO: '08', CT: '09',
  FL: '12', GA: '13', IA: '19', IL: '17', IN: '18', KS: '20',
  KY: '21', LA: '22', MA: '25', MD: '24', ME: '23', MI: '26',
  MN: '27', MO: '29', MS: '28', NC: '37', ND: '38', NE: '31',
  NH: '33', NJ: '34', NY: '36', OH: '39', OK: '40', OR: '41',
  PA: '42', RI: '44', SC: '45', SD: '46', TN: '47', TX: '48',
  UT: '49', VA: '51', VT: '50', WA: '53', WI: '55', WV: '54',
};

const CENSUS_FIELDS = [
  'B01003_001E', // total pop
  'B19013_001E', // median income
  'B17001_002E', // poverty pop
  'B17001_001E', // poverty universe
  'B02001_002E', // white
  'B02001_003E', // black
  'B02001_001E', // total race pop
  'B03003_003E', // hispanic
  'B03003_001E', // total hispanic universe
  'B25034_001E', // total housing units
  'B25034_010E', // built 1940-1949
  'B25034_011E', // built 1939 or earlier
].join(',');

const MIN_NEIGHBORHOODS_PER_GRADE = 3;

const DATA_DIR = path.join(process.cwd(), 'data');

// ── Helpers ────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchWithRetry(url: string, retries = 3, delayMs = 2000): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    try {
      const r = await fetch(url);
      if (r.ok) return r;
      if (r.status === 429 || r.status >= 500) {
        console.log(`  HTTP ${r.status}, retry ${i + 1}/${retries}...`);
        await sleep(delayMs * (i + 1));
        continue;
      }
      throw new Error(`HTTP ${r.status} for ${url}`);
    } catch (err) {
      if (i === retries) throw err;
      console.log(`  Fetch error, retry ${i + 1}/${retries}...`);
      await sleep(delayMs * (i + 1));
    }
  }
  throw new Error(`Failed after ${retries} retries: ${url}`);
}

function safeNum(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < -600000000) return null; // Census suppressed = -666666666
  return n;
}

// ── Step 1: Download + strip HOLC crosswalk ────────────────────────────────

async function downloadCrosswalk(): Promise<HolcRecord[]> {
  const cachePath = path.join(DATA_DIR, 'holc-crosswalk.json');
  if (existsSync(cachePath)) {
    console.log('Using cached holc-crosswalk.json');
    return JSON.parse(readFileSync(cachePath, 'utf-8'));
  }

  console.log('Downloading HOLC crosswalk (72 MB)...');
  const resp = await fetchWithRetry(CROSSWALK_URL, 2, 5000);
  const text = await resp.text();
  console.log(`  Downloaded ${(text.length / 1e6).toFixed(1)} MB`);

  const gj = JSON.parse(text);
  const features: unknown[] = gj.features;
  console.log(`  ${features.length} features total`);

  const records: HolcRecord[] = [];
  for (const f of features as Array<{ properties: Record<string, unknown> }>) {
    const p = f.properties;
    const grade = String(p.grade ?? '').trim();
    if (!VALID_GRADES.has(grade)) continue;

    records.push({
      area_id: Number(p.area_id),
      grade,
      city: String(p.city),
      state: String(p.state),
      GEOID: String(p.GEOID),
      pct_tract: Number(p.pct_tract),
      calc_area: Number(p.calc_area),
    });
  }

  console.log(`  ${records.length} records with valid A/B/C/D grades`);
  writeFileSync(cachePath, JSON.stringify(records));
  console.log(`  Saved holc-crosswalk.json (${(readFileSync(cachePath).length / 1e6).toFixed(1)} MB)`);
  return records;
}

// ── Step 2: Census ACS tract demographics ──────────────────────────────────

async function downloadCensusTracts(
  neededStates: Set<string>,
  neededTracts: Set<string>
): Promise<Map<string, TractDemographics>> {
  const cachePath = path.join(DATA_DIR, 'census-tract-demographics.json');
  if (existsSync(cachePath)) {
    console.log('Using cached census-tract-demographics.json');
    const arr: TractDemographics[] = JSON.parse(readFileSync(cachePath, 'utf-8'));
    return new Map(arr.map((t) => [t.geoid, t]));
  }

  const stateFips = [...neededStates]
    .map((abbr) => STATE_ABBR_TO_FIPS[abbr])
    .filter(Boolean)
    .sort();

  console.log(`Fetching Census ACS for ${stateFips.length} states...`);
  const allTracts = new Map<string, TractDemographics>();
  let fetched = 0;

  for (const sf of stateFips) {
    const url = `https://api.census.gov/data/2022/acs/acs5?get=${CENSUS_FIELDS}&for=tract:*&in=state:${sf}`;
    try {
      const resp = await fetchWithRetry(url, 3, 2000);
      const rows: string[][] = await resp.json();
      const header = rows[0];
      const stateIdx = header.indexOf('state');
      const countyIdx = header.indexOf('county');
      const tractIdx = header.indexOf('tract');

      for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        const geoid = r[stateIdx] + r[countyIdx] + r[tractIdx];
        if (!neededTracts.has(geoid)) continue;

        const pop = safeNum(r[header.indexOf('B01003_001E')]) ?? 0;
        const income = safeNum(r[header.indexOf('B19013_001E')]);
        const povPop = safeNum(r[header.indexOf('B17001_002E')]) ?? 0;
        const povUni = safeNum(r[header.indexOf('B17001_001E')]) ?? 0;
        const white = safeNum(r[header.indexOf('B02001_002E')]) ?? 0;
        const black = safeNum(r[header.indexOf('B02001_003E')]) ?? 0;
        const racePop = safeNum(r[header.indexOf('B02001_001E')]) ?? 0;
        const hisp = safeNum(r[header.indexOf('B03003_003E')]) ?? 0;
        const hispUni = safeNum(r[header.indexOf('B03003_001E')]) ?? 0;
        const totalHU = safeNum(r[header.indexOf('B25034_001E')]) ?? 0;
        const built4049 = safeNum(r[header.indexOf('B25034_010E')]) ?? 0;
        const builtPre39 = safeNum(r[header.indexOf('B25034_011E')]) ?? 0;

        allTracts.set(geoid, {
          geoid,
          population: pop,
          medianIncome: income,
          povertyPop: povPop,
          povertyUniverse: povUni,
          white,
          black,
          hispanic: hisp,
          totalRacePop: racePop,
          totalHispanicPop: hispUni,
          totalHousingUnits: totalHU,
          pre1950Units: built4049 + builtPre39,
        });
      }
      fetched++;
      if (fetched % 10 === 0) console.log(`  ${fetched}/${stateFips.length} states done`);
    } catch (err) {
      console.warn(`  Failed for state ${sf}:`, (err as Error).message);
    }
    await sleep(500);
  }

  console.log(`  ${allTracts.size} tracts matched from ${fetched} states`);
  const arr = [...allTracts.values()];
  writeFileSync(cachePath, JSON.stringify(arr));
  console.log(`  Saved census-tract-demographics.json`);
  return allTracts;
}

// ── Step 3: Build county env lookup ────────────────────────────────────────

function buildCountyEnvLookup(): Map<string, CountyEnv> {
  const scviData: Array<{ fips: string; scvi: number; cpi: number }> = JSON.parse(
    readFileSync(path.join(DATA_DIR, 'scvi-national.json'), 'utf-8')
  );
  const cfciData: Array<{ fips: string; cfci: number }> = JSON.parse(
    readFileSync(path.join(DATA_DIR, 'cfci-national.json'), 'utf-8')
  );

  const cfciMap = new Map(cfciData.map((r) => [r.fips, r.cfci]));
  const result = new Map<string, CountyEnv>();

  for (const r of scviData) {
    result.set(r.fips, {
      scvi: r.scvi,
      cpi: r.cpi,
      cfci: cfciMap.get(r.fips) ?? null,
    });
  }
  return result;
}

// ── Step 4: Compute neighborhood-level results ─────────────────────────────

function computeNeighborhoods(
  crosswalk: HolcRecord[],
  tractDemo: Map<string, TractDemographics>,
  countyEnv: Map<string, CountyEnv>
): NeighborhoodResult[] {
  // Group crosswalk by area_id
  const byArea = new Map<number, HolcRecord[]>();
  for (const r of crosswalk) {
    let arr = byArea.get(r.area_id);
    if (!arr) {
      arr = [];
      byArea.set(r.area_id, arr);
    }
    arr.push(r);
  }

  const results: NeighborhoodResult[] = [];

  for (const [areaId, records] of byArea) {
    const first = records[0];

    // Area-weighted aggregation across tracts
    let totalArea = 0;
    let wPop = 0;
    let wIncome = 0;
    let wIncomeArea = 0;
    let wPovPop = 0;
    let wPovUni = 0;
    let wWhite = 0;
    let wBlack = 0;
    let wHisp = 0;
    let wRacePop = 0;
    let wHispPop = 0;
    let wHU = 0;
    let wPre50 = 0;
    const tracts: string[] = [];

    for (const rec of records) {
      const td = tractDemo.get(rec.GEOID);
      if (!td) continue;

      const w = rec.calc_area;
      totalArea += w;
      tracts.push(rec.GEOID);

      // Weight by intersection area, then scale by tract pop share
      const tractFrac = rec.pct_tract;
      wPop += td.population * tractFrac;

      if (td.medianIncome != null) {
        wIncome += td.medianIncome * w;
        wIncomeArea += w;
      }

      wPovPop += td.povertyPop * tractFrac;
      wPovUni += td.povertyUniverse * tractFrac;
      wWhite += td.white * tractFrac;
      wBlack += td.black * tractFrac;
      wHisp += td.hispanic * tractFrac;
      wRacePop += td.totalRacePop * tractFrac;
      wHispPop += td.totalHispanicPop * tractFrac;
      wHU += td.totalHousingUnits * tractFrac;
      wPre50 += td.pre1950Units * tractFrac;
    }

    if (totalArea === 0) continue;

    const countyFips = tracts[0]?.slice(0, 5) ?? '';
    const env = countyEnv.get(countyFips);

    results.push({
      areaId,
      grade: first.grade,
      city: first.city,
      state: first.state,
      tracts: [...new Set(tracts)],
      population: Math.round(wPop),
      medianIncome: wIncomeArea > 0 ? Math.round(wIncome / wIncomeArea) : null,
      povertyRate: wPovUni > 0 ? round2(100 * wPovPop / wPovUni) : null,
      pctWhite: wRacePop > 0 ? round2(100 * wWhite / wRacePop) : null,
      pctBlack: wRacePop > 0 ? round2(100 * wBlack / wRacePop) : null,
      pctHispanic: wHispPop > 0 ? round2(100 * wHisp / wHispPop) : null,
      pre1950HousingPct: wHU > 0 ? round2(100 * wPre50 / wHU) : null,
      countyFips,
      scvi: env?.scvi ?? null,
      cpi: env?.cpi ?? null,
      cfci: env?.cfci ?? null,
    });
  }

  return results;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ── Step 5: Compute analyses ───────────────────────────────────────────────

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

function gradeAvg(records: NeighborhoodResult[], field: keyof NeighborhoodResult): number {
  let sum = 0;
  let count = 0;
  for (const r of records) {
    const v = r[field];
    if (typeof v === 'number' && Number.isFinite(v)) {
      sum += v;
      count++;
    }
  }
  return count > 0 ? round2(sum / count) : 0;
}

function computeNationalGradeStats(neighborhoods: NeighborhoodResult[]): GradeStats[] {
  return (['A', 'B', 'C', 'D'] as const).map((grade) => {
    const subset = neighborhoods.filter((n) => n.grade === grade);
    return {
      grade,
      count: subset.length,
      population: subset.reduce((s, n) => s + n.population, 0),
      medianIncome: gradeAvg(subset, 'medianIncome'),
      povertyRate: gradeAvg(subset, 'povertyRate'),
      pctWhite: gradeAvg(subset, 'pctWhite'),
      pctBlack: gradeAvg(subset, 'pctBlack'),
      pctHispanic: gradeAvg(subset, 'pctHispanic'),
      pre1950HousingPct: gradeAvg(subset, 'pre1950HousingPct'),
      scvi: gradeAvg(subset, 'scvi'),
      cpi: gradeAvg(subset, 'cpi'),
      cfci: gradeAvg(subset, 'cfci'),
    };
  });
}

function computeCityGaps(neighborhoods: NeighborhoodResult[]): CityGap[] {
  const byCity = new Map<string, NeighborhoodResult[]>();
  for (const n of neighborhoods) {
    const key = `${n.city}|${n.state}`;
    let arr = byCity.get(key);
    if (!arr) {
      arr = [];
      byCity.set(key, arr);
    }
    arr.push(n);
  }

  const gaps: CityGap[] = [];

  for (const [key, records] of byCity) {
    const [city, state] = key.split('|');
    const gradeA = records.filter((r) => r.grade === 'A');
    const gradeD = records.filter((r) => r.grade === 'D');

    if (gradeA.length < MIN_NEIGHBORHOODS_PER_GRADE) continue;
    if (gradeD.length < MIN_NEIGHBORHOODS_PER_GRADE) continue;

    const aIncome = gradeAvg(gradeA, 'medianIncome');
    const dIncome = gradeAvg(gradeD, 'medianIncome');
    const aPov = gradeAvg(gradeA, 'povertyRate');
    const dPov = gradeAvg(gradeD, 'povertyRate');
    const aBlack = gradeAvg(gradeA, 'pctBlack');
    const dBlack = gradeAvg(gradeD, 'pctBlack');
    const aPre = gradeAvg(gradeA, 'pre1950HousingPct');
    const dPre = gradeAvg(gradeD, 'pre1950HousingPct');
    const aScvi = gradeAvg(gradeA, 'scvi');
    const dScvi = gradeAvg(gradeD, 'scvi');

    gaps.push({
      city,
      state,
      gradeACnt: gradeA.length,
      gradeDCnt: gradeD.length,
      aIncome,
      dIncome,
      incomeGap: round2(aIncome - dIncome),
      aPoverty: aPov,
      dPoverty: dPov,
      povertyGap: round2(dPov - aPov),
      aPctBlack: aBlack,
      dPctBlack: dBlack,
      racialGap: round2(dBlack - aBlack),
      aPre1950: aPre,
      dPre1950: dPre,
      housingAgeGap: round2(dPre - aPre),
      aScvi,
      dScvi,
      scviGap: round2(dScvi - aScvi),
    });
  }

  return gaps;
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Building Redlining → Contamination Dataset ===\n');

  // Step 1: HOLC crosswalk
  const crosswalk = await downloadCrosswalk();

  // Identify needed states and tracts
  const neededStates = new Set(crosswalk.map((r) => r.state));
  const neededTracts = new Set(crosswalk.map((r) => r.GEOID));
  console.log(`\nHOLC crosswalk: ${neededStates.size} states, ${neededTracts.size} unique tracts\n`);

  // Step 2: Census demographics
  const tractDemo = await downloadCensusTracts(neededStates, neededTracts);

  // Step 3: County env lookup
  const countyEnv = buildCountyEnvLookup();
  console.log(`\nCounty env lookup: ${countyEnv.size} counties\n`);

  // Step 4: Neighborhood-level results
  const neighborhoods = computeNeighborhoods(crosswalk, tractDemo, countyEnv);
  console.log(`Computed ${neighborhoods.length} HOLC neighborhoods with data`);

  const byGrade = { A: 0, B: 0, C: 0, D: 0 };
  for (const n of neighborhoods) {
    if (n.grade in byGrade) byGrade[n.grade as keyof typeof byGrade]++;
  }
  console.log(`  By grade: A=${byGrade.A} B=${byGrade.B} C=${byGrade.C} D=${byGrade.D}`);

  // Step 5: Analyses
  const nationalStats = computeNationalGradeStats(neighborhoods);
  const cityGaps = computeCityGaps(neighborhoods);

  console.log(`\n=== National Grade Averages ===`);
  for (const gs of nationalStats) {
    console.log(
      `  Grade ${gs.grade}: income=$${Math.round(gs.medianIncome).toLocaleString()}, ` +
        `poverty=${gs.povertyRate}%, Black=${gs.pctBlack}%, ` +
        `pre-1950=${gs.pre1950HousingPct}%, SCVI=${gs.scvi}, CPI=${gs.cpi}`
    );
  }

  const topByPoverty = [...cityGaps].sort((a, b) => b.povertyGap - a.povertyGap).slice(0, 15);
  const topByHousing = [...cityGaps].sort((a, b) => b.housingAgeGap - a.housingAgeGap).slice(0, 15);
  const topByRace = [...cityGaps].sort((a, b) => b.racialGap - a.racialGap).slice(0, 15);

  console.log(`\n=== Within-City Gaps (${cityGaps.length} qualifying cities, ≥${MIN_NEIGHBORHOODS_PER_GRADE} per grade) ===`);
  console.log('\nTop 10 by Poverty Gap (D - A):');
  for (const c of topByPoverty.slice(0, 10)) {
    console.log(`  ${c.city}, ${c.state}: D=${c.dPoverty}% vs A=${c.aPoverty}% (gap=${c.povertyGap}pp)`);
  }
  console.log('\nTop 10 by Pre-1950 Housing Gap (D - A):');
  for (const c of topByHousing.slice(0, 10)) {
    console.log(`  ${c.city}, ${c.state}: D=${c.dPre1950}% vs A=${c.aPre1950}% (gap=${c.housingAgeGap}pp)`);
  }

  // Build output
  const output = {
    meta: {
      builtAt: new Date().toISOString(),
      crosswalkSource: 'americanpanorama/mapping-inequality-census-crosswalk',
      censusYear: 2022,
      totalHolcNeighborhoods: neighborhoods.length,
      totalCities: new Set(neighborhoods.map((n) => `${n.city}|${n.state}`)).size,
      totalStates: new Set(neighborhoods.map((n) => n.state)).size,
      qualifyingCitiesForGap: cityGaps.length,
      minNeighborhoodsPerGrade: MIN_NEIGHBORHOODS_PER_GRADE,
    },
    nationalStats,
    cityGaps: cityGaps.sort((a, b) => b.povertyGap - a.povertyGap),
    topCitiesByPovertyGap: topByPoverty,
    topCitiesByHousingAgeGap: topByHousing,
    topCitiesByRacialGap: topByRace,
    neighborhoods: neighborhoods.map((n) => ({
      areaId: n.areaId,
      grade: n.grade,
      city: n.city,
      state: n.state,
      population: n.population,
      medianIncome: n.medianIncome,
      povertyRate: n.povertyRate,
      pctWhite: n.pctWhite,
      pctBlack: n.pctBlack,
      pctHispanic: n.pctHispanic,
      pre1950HousingPct: n.pre1950HousingPct,
      countyFips: n.countyFips,
      scvi: n.scvi,
      cpi: n.cpi,
      cfci: n.cfci,
    })),
  };

  const outPath = path.join(DATA_DIR, 'redlining-analysis.json');
  writeFileSync(outPath, JSON.stringify(output));
  const sizeMb = (readFileSync(outPath).length / 1e6).toFixed(1);
  console.log(`\nWrote ${outPath} (${sizeMb} MB)`);
  console.log('Done.');
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
