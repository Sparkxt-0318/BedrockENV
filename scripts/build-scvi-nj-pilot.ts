/**
 * SCVI NJ Pilot — Batch pipeline for New Jersey's 21 counties.
 *
 * For each county, fetches SSURGO, NASA POWER, Brownfields, Superfund, and
 * ECHO data at the county seat coordinates, maps results to SCVI inputs,
 * and reports SVS/CPI/SCVI scores with USDA SVI classification.
 *
 * Usage: npx tsx scripts/build-scvi-nj-pilot.ts
 */

import { fetchSsurgoData } from '../lib/data-sources/usda-ssurgo';
import { fetchNasaPowerData } from '../lib/data-sources/nasa-smap';
import { fetchBrownfieldSites } from '../lib/data-sources/epa-brownfields';
import { fetchSuperfundSites } from '../lib/data-sources/epa-superfund';
import { fetchEchoFacilities } from '../lib/data-sources/epa-echo';
import {
  computeScvi,
  assignQuartiles,
  type SoilVulnerabilityInputs,
  type ContaminationPressureInputs,
  type ScviResult,
} from '../lib/intelligence/scvi-scorer';

// ---------------------------------------------------------------------------
// NJ county reference data
// ---------------------------------------------------------------------------

interface NjCounty {
  fips: string;
  name: string;
  seat: string;
  lat: number;
  lng: number;
  areaSqMi: number;
}

const NJ_COUNTIES: NjCounty[] = [
  { fips: '34001', name: 'Atlantic',    seat: 'Mays Landing',           lat: 39.4527, lng: -74.7276, areaSqMi: 561 },
  { fips: '34003', name: 'Bergen',      seat: 'Hackensack',             lat: 40.8859, lng: -74.0435, areaSqMi: 234 },
  { fips: '34005', name: 'Burlington',  seat: 'Mount Holly',            lat: 39.9929, lng: -74.7874, areaSqMi: 819 },
  { fips: '34007', name: 'Camden',      seat: 'Camden',                 lat: 39.9259, lng: -75.1196, areaSqMi: 222 },
  { fips: '34009', name: 'Cape May',    seat: 'Cape May Court House',   lat: 39.0826, lng: -74.8234, areaSqMi: 255 },
  { fips: '34011', name: 'Cumberland',  seat: 'Bridgeton',              lat: 39.4273, lng: -75.2340, areaSqMi: 489 },
  { fips: '34013', name: 'Essex',       seat: 'Newark',                 lat: 40.7357, lng: -74.1724, areaSqMi: 126 },
  { fips: '34015', name: 'Gloucester',  seat: 'Woodbury',               lat: 39.8382, lng: -75.1527, areaSqMi: 325 },
  { fips: '34017', name: 'Hudson',      seat: 'Jersey City',            lat: 40.7282, lng: -74.0776, areaSqMi: 47 },
  { fips: '34019', name: 'Hunterdon',   seat: 'Flemington',             lat: 40.5123, lng: -74.8594, areaSqMi: 430 },
  { fips: '34021', name: 'Mercer',      seat: 'Trenton',                lat: 40.2171, lng: -74.7429, areaSqMi: 226 },
  { fips: '34023', name: 'Middlesex',   seat: 'New Brunswick',          lat: 40.4862, lng: -74.4518, areaSqMi: 312 },
  { fips: '34025', name: 'Monmouth',    seat: 'Freehold',               lat: 40.2598, lng: -74.2737, areaSqMi: 472 },
  { fips: '34027', name: 'Morris',      seat: 'Morristown',             lat: 40.7968, lng: -74.4815, areaSqMi: 469 },
  { fips: '34029', name: 'Ocean',       seat: 'Toms River',             lat: 39.9537, lng: -74.1979, areaSqMi: 636 },
  { fips: '34031', name: 'Passaic',     seat: 'Paterson',               lat: 40.9168, lng: -74.1718, areaSqMi: 185 },
  { fips: '34033', name: 'Salem',       seat: 'Salem',                  lat: 39.5717, lng: -75.4674, areaSqMi: 338 },
  { fips: '34035', name: 'Somerset',    seat: 'Somerville',             lat: 40.5740, lng: -74.6099, areaSqMi: 305 },
  { fips: '34037', name: 'Sussex',      seat: 'Newton',                 lat: 41.0582, lng: -74.7524, areaSqMi: 521 },
  { fips: '34039', name: 'Union',       seat: 'Elizabeth',              lat: 40.6640, lng: -74.2107, areaSqMi: 103 },
  { fips: '34041', name: 'Warren',      seat: 'Belvidere',              lat: 40.8298, lng: -75.0779, areaSqMi: 358 },
];

// ---------------------------------------------------------------------------
// Helper: delay between API batches to be kind to EPA endpoints
// ---------------------------------------------------------------------------

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ---------------------------------------------------------------------------
// Per-county data fetching + SCVI computation
// ---------------------------------------------------------------------------

interface CountyResult {
  county: NjCounty;
  scviResult: ScviResult;
  errors: string[];
  svsInputs: SoilVulnerabilityInputs;
  cpiInputs: ContaminationPressureInputs;
}

async function processCounty(county: NjCounty): Promise<CountyResult> {
  const errors: string[] = [];
  const { lat, lng } = county;

  // Fetch all data sources in parallel
  const [ssurgoRes, powerRes, brownfieldRes, superfundRes, echoRes] =
    await Promise.all([
      fetchSsurgoData(lat, lng).catch((e: Error) => { errors.push(`SSURGO: ${e.message}`); return null; }),
      fetchNasaPowerData(lat, lng).catch((e: Error) => { errors.push(`POWER: ${e.message}`); return null; }),
      fetchBrownfieldSites(lat, lng).catch((e: Error) => { errors.push(`Brownfields: ${e.message}`); return null; }),
      fetchSuperfundSites(lat, lng, {}).catch((e: Error) => { errors.push(`Superfund: ${e.message}`); return null; }),
      fetchEchoFacilities(lat, lng, {}).catch((e: Error) => { errors.push(`ECHO: ${e.message}`); return null; }),
    ]);

  // Track non-fatal errors from data source results
  if (ssurgoRes?.error) errors.push(`SSURGO: ${ssurgoRes.error}`);
  if (powerRes?.error) errors.push(`POWER: ${powerRes.error}`);
  if (brownfieldRes?.error) errors.push(`Brownfields: ${brownfieldRes.error}`);
  if (superfundRes?.error) errors.push(`Superfund: ${superfundRes.error}`);
  if (echoRes?.error) errors.push(`ECHO: ${echoRes.error}`);

  const ssurgo = ssurgoRes?.data ?? null;
  const power = powerRes?.data ?? null;
  const brownfields = brownfieldRes?.data ?? [];
  const superfundSites = superfundRes?.data ?? [];
  const echo = echoRes?.data ?? null;

  // Determine if urban land map unit (SSURGO coverage='partial' often means urban land)
  const isUrbanLandMapUnit = ssurgo?.coverage === 'partial' ||
    (ssurgo?.mapUnitName?.toLowerCase().includes('urban') ?? false);

  // Extract pH midpoint from phRange
  const phMid = ssurgo && ssurgo.phRange[0] > 0 && ssurgo.phRange[1] > 0
    ? (ssurgo.phRange[0] + ssurgo.phRange[1]) / 2
    : null;

  // Count TRI facilities from ECHO data
  const triFacilityCount = echo?.facilities.filter(f => f.programs.includes('TRI')).length ?? 0;

  // Nearest brownfield and superfund distances
  const brownfieldNearestMiles = brownfields.length > 0
    ? Math.min(...brownfields.map(b => b.distance))
    : null;
  const superfundNearestMiles = superfundSites.length > 0
    ? Math.min(...superfundSites.map(s => s.distanceKm * 0.621371))
    : null;

  // Build SCVI inputs
  const svsInputs: SoilVulnerabilityInputs = {
    organicMatterPct: ssurgo && ssurgo.organicMatterPct > 0 ? ssurgo.organicMatterPct : null,
    ph: phMid,
    drainageClass: ssurgo?.drainageClass !== 'Unknown' ? ssurgo?.drainageClass ?? null : null,
    clayPct: null, // not exposed as top-level SSURGO field
    sandPct: null, // not exposed as top-level SSURGO field
    ksat: ssurgo && ssurgo.ksat > 0 ? ssurgo.ksat : null,
    hydrologicSoilGroup: null, // not in current SSURGO query
    meanAnnualPrecipMm: power?.precipitationAvgMm ?? null,
    aridityIndex: power?.aridityIndex ?? null,
    ndviAnomaly: null, // not available from current data sources
    isUrbanLandMapUnit,
  };

  const cpiInputs: ContaminationPressureInputs = {
    brownfieldCount: brownfields.length,
    brownfieldNearestMiles,
    superfundCount: superfundSites.length,
    superfundNearestMiles,
    echoFacilityCount: echo?.totalCount ?? 0,
    echoSncCount: echo?.significantViolationCount ?? 0,
    triFacilityCount,
    triTotalReleasesLbs: 0, // not available from ECHO API
    countyAreaSqMi: county.areaSqMi,
  };

  const scviResult = computeScvi(svsInputs, cpiInputs);

  return { county, scviResult, errors, svsInputs, cpiInputs };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('='.repeat(80));
  console.log('SCVI NJ PILOT — Soil Contamination Vulnerability Index');
  console.log(`Processing ${NJ_COUNTIES.length} counties...`);
  console.log('='.repeat(80));
  console.log('');

  const results: CountyResult[] = [];

  for (let i = 0; i < NJ_COUNTIES.length; i++) {
    const county = NJ_COUNTIES[i];
    const tag = `[${i + 1}/${NJ_COUNTIES.length}]`;
    process.stdout.write(`${tag} ${county.name} (${county.seat})... `);

    try {
      const result = await processCounty(county);
      results.push(result);
      const r = result.scviResult;
      console.log(
        `SCVI=${r.scvi} SVS=${r.svs} CPI=${r.cpi} SVI=${r.usdaSviClass}` +
        (result.errors.length > 0 ? ` [${result.errors.length} warnings]` : '')
      );
    } catch (err) {
      console.log(`FAILED: ${err instanceof Error ? err.message : String(err)}`);
    }

    // Gentle rate limiting between counties
    if (i < NJ_COUNTIES.length - 1) await delay(1500);
  }

  // Assign quartiles across all results
  const quartiles = assignQuartiles(results.map(r => ({ scvi: r.scviResult.scvi })));
  for (let i = 0; i < results.length; i++) {
    results[i].scviResult.scviQuartile = quartiles[i];
  }

  // Sort by SCVI descending for the report
  const sorted = [...results].sort((a, b) => b.scviResult.scvi - a.scviResult.scvi);

  // ---------------------------------------------------------------------------
  // Report: Full results table
  // ---------------------------------------------------------------------------
  console.log('');
  console.log('='.repeat(80));
  console.log('RESULTS — ALL NJ COUNTIES (sorted by SCVI descending)');
  console.log('='.repeat(80));
  console.log('');
  console.log(
    'County'.padEnd(14) +
    'SCVI'.padStart(6) +
    'Q'.padStart(4) +
    'SVS'.padStart(6) +
    'CPI'.padStart(6) +
    'SVI Class'.padStart(18) +
    '  SVS Coverage  CPI Coverage'
  );
  console.log('-'.repeat(80));

  for (const r of sorted) {
    const s = r.scviResult;
    console.log(
      r.county.name.padEnd(14) +
      String(s.scvi).padStart(6) +
      String(s.scviQuartile).padStart(4) +
      String(s.svs).padStart(6) +
      String(s.cpi).padStart(6) +
      s.usdaSviClass.padStart(18) +
      `  ${s.coverage.svsDataPoints}/${s.coverage.svsMaxDataPoints}`.padStart(14) +
      `  ${s.coverage.cpiDataPoints}/${s.coverage.cpiMaxDataPoints}`.padStart(12)
    );
  }

  // ---------------------------------------------------------------------------
  // Report: Top 5 highest SCVI counties
  // ---------------------------------------------------------------------------
  console.log('');
  console.log('='.repeat(80));
  console.log('TOP 5 HIGHEST SCVI COUNTIES');
  console.log('='.repeat(80));

  for (let i = 0; i < Math.min(5, sorted.length); i++) {
    const r = sorted[i];
    const s = r.scviResult;
    console.log('');
    console.log(`#${i + 1}: ${r.county.name} County (${r.county.seat})`);
    console.log(`  SCVI: ${s.scvi} (Q${s.scviQuartile})  |  USDA SVI: ${s.usdaSviClass}`);
    console.log(`  SVS: ${s.svs}  |  CPI: ${s.cpi}`);
    console.log(`  SVS components: OM=${s.svsComponents.organicMatter} pH=${s.svsComponents.ph} drain=${s.svsComponents.drainage} texture=${s.svsComponents.texture} climate=${s.svsComponents.climate} urban=${s.svsComponents.urbanGap}`);
    console.log(`  CPI components: legacy=${s.cpiComponents.legacy} industrial=${s.cpiComponents.industrial} compliance=${s.cpiComponents.compliance} release=${s.cpiComponents.release}`);
    console.log(`  Coverage: SVS ${s.coverage.svsDataPoints}/${s.coverage.svsMaxDataPoints}, CPI ${s.coverage.cpiDataPoints}/${s.coverage.cpiMaxDataPoints}`);
    if (r.errors.length > 0) {
      console.log(`  Warnings: ${r.errors.join('; ')}`);
    }
  }

  // ---------------------------------------------------------------------------
  // Report: USDA SVI distribution
  // ---------------------------------------------------------------------------
  console.log('');
  console.log('='.repeat(80));
  console.log('USDA SVI CLASS DISTRIBUTION');
  console.log('='.repeat(80));
  const sviCounts: Record<string, number> = {};
  for (const r of results) {
    const cls = r.scviResult.usdaSviClass;
    sviCounts[cls] = (sviCounts[cls] || 0) + 1;
  }
  for (const [cls, count] of Object.entries(sviCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cls}: ${count} counties`);
  }

  // ---------------------------------------------------------------------------
  // Report: Quartile distribution
  // ---------------------------------------------------------------------------
  console.log('');
  console.log('SCVI QUARTILE DISTRIBUTION');
  console.log('-'.repeat(40));
  const qCounts = [0, 0, 0, 0];
  for (const r of results) qCounts[r.scviResult.scviQuartile - 1]++;
  for (let q = 1; q <= 4; q++) {
    console.log(`  Q${q}: ${qCounts[q - 1]} counties`);
  }

  // ---------------------------------------------------------------------------
  // Report: Data limitations
  // ---------------------------------------------------------------------------
  console.log('');
  console.log('='.repeat(80));
  console.log('DATA LIMITATIONS');
  console.log('='.repeat(80));
  console.log('  - sandPct/clayPct: Not exposed as top-level SSURGO fields; scoreTexture falls back to Ksat');
  console.log('  - hydrologicSoilGroup: Not in current SSURGO query; USDA SVI uses default group risk=2');
  console.log('  - triTotalReleasesLbs: Not available from ECHO API; set to 0 (scoreRelease=0 for all)');
  console.log('  - ndviAnomaly: No data source available; urban gap uses default score=50 when applicable');
  console.log('  - County seat as proxy: Scores represent one point per county, not spatial average');

  // All warnings
  const allWarnings = results.flatMap(r => r.errors);
  if (allWarnings.length > 0) {
    console.log('');
    console.log(`API WARNINGS (${allWarnings.length} total):`);
    for (const w of allWarnings) {
      console.log(`  - ${w}`);
    }
  }

  // Output JSON for further analysis
  const jsonOutput = sorted.map(r => ({
    fips: r.county.fips,
    county: r.county.name,
    seat: r.county.seat,
    scvi: r.scviResult.scvi,
    quartile: r.scviResult.scviQuartile,
    svs: r.scviResult.svs,
    cpi: r.scviResult.cpi,
    usdaSviClass: r.scviResult.usdaSviClass,
    svsComponents: r.scviResult.svsComponents,
    cpiComponents: r.scviResult.cpiComponents,
    coverage: r.scviResult.coverage,
  }));

  const fs = await import('fs');
  const outPath = 'data/scvi-nj-pilot.json';
  fs.mkdirSync('data', { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(jsonOutput, null, 2));
  console.log('');
  console.log(`Full results written to ${outPath}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
