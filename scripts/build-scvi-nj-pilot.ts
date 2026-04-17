/**
 * SCVI NJ Pilot — Batch pipeline for New Jersey's 21 counties.
 *
 * For each county, fetches SSURGO, NASA POWER, Brownfields, Superfund, ECHO,
 * and TRI data at the county seat coordinates, maps results to SCVI inputs,
 * and reports SVS/CPI/SCVI scores with USDA SVI classification.
 *
 * Includes hardened retry logic for batch runs:
 *  - 5 retries with exponential backoff (2s, 4s, 8s, 16s, 32s) + jitter
 *  - Per-source circuit breaker: 3 consecutive 503s → 60s pause
 *  - Failed counties written to data/scvi-build/failed-counties.json
 *
 * Usage: npx tsx scripts/build-scvi-nj-pilot.ts
 */

import { fetchSsurgoData } from '../lib/data-sources/usda-ssurgo';
import { fetchNasaPowerData } from '../lib/data-sources/nasa-smap';
import { fetchBrownfieldSites } from '../lib/data-sources/epa-brownfields';
import { fetchSuperfundSites } from '../lib/data-sources/epa-superfund';
import { fetchEchoFacilities } from '../lib/data-sources/epa-echo';
import { fetchTriReleasesByCounty } from '../lib/data-sources/epa-tri';
import type { DataSourceResult } from '../lib/data-sources/types';
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
// Batch retry infrastructure
// ---------------------------------------------------------------------------

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

const BATCH_MAX_RETRIES = 5;
const BATCH_BASE_BACKOFF_MS = 2000;
const CIRCUIT_BREAKER_THRESHOLD = 3;
const CIRCUIT_BREAKER_PAUSE_MS = 60_000;

type SourceName = 'SSURGO' | 'POWER' | 'Brownfields' | 'Superfund' | 'ECHO' | 'TRI';

class SourceCircuitBreaker {
  private consecutive503s = new Map<SourceName, number>();
  private pausedUntil = new Map<SourceName, number>();

  record503(source: SourceName, countyFips: string): void {
    const count = (this.consecutive503s.get(source) ?? 0) + 1;
    this.consecutive503s.set(source, count);
    console.log(`    [503] ${source} failed for ${countyFips} (${count} consecutive)`);

    if (count >= CIRCUIT_BREAKER_THRESHOLD) {
      const pauseUntil = Date.now() + CIRCUIT_BREAKER_PAUSE_MS;
      this.pausedUntil.set(source, pauseUntil);
      console.log(`    [CIRCUIT BREAKER] ${source} paused for 60s after ${count} consecutive 503s`);
    }
  }

  recordSuccess(source: SourceName): void {
    this.consecutive503s.set(source, 0);
  }

  async waitIfPaused(source: SourceName): Promise<boolean> {
    const until = this.pausedUntil.get(source);
    if (!until) return false;
    const remaining = until - Date.now();
    if (remaining <= 0) {
      this.pausedUntil.delete(source);
      this.consecutive503s.set(source, 0);
      return false;
    }
    console.log(`    [WAIT] ${source} paused, waiting ${Math.ceil(remaining / 1000)}s...`);
    await delay(remaining);
    this.pausedUntil.delete(source);
    this.consecutive503s.set(source, 0);
    return true;
  }
}

const breaker = new SourceCircuitBreaker();

interface FailedCounty {
  fips: string;
  county: string;
  failedSources: string[];
  errors: string[];
}

const failedCounties: FailedCounty[] = [];

async function fetchWithBatchRetry<T>(
  source: SourceName,
  countyFips: string,
  fetcher: () => Promise<DataSourceResult<T>>,
): Promise<DataSourceResult<T> | null> {
  await breaker.waitIfPaused(source);

  for (let attempt = 0; attempt <= BATCH_MAX_RETRIES; attempt++) {
    try {
      const result = await fetcher();

      if (result.error && /50[0-9]|503/.test(result.error)) {
        breaker.record503(source, countyFips);
        if (attempt < BATCH_MAX_RETRIES) {
          const backoff = BATCH_BASE_BACKOFF_MS * Math.pow(2, attempt) + Math.random() * 1000;
          await delay(backoff);
          await breaker.waitIfPaused(source);
          continue;
        }
        return result;
      }

      if (result.error && /timed out/i.test(result.error)) {
        if (attempt < BATCH_MAX_RETRIES) {
          const backoff = BATCH_BASE_BACKOFF_MS * Math.pow(2, attempt) + Math.random() * 1000;
          await delay(backoff);
          continue;
        }
        return result;
      }

      breaker.recordSuccess(source);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/50[0-9]|503/.test(msg)) {
        breaker.record503(source, countyFips);
      }
      if (attempt < BATCH_MAX_RETRIES) {
        const backoff = BATCH_BASE_BACKOFF_MS * Math.pow(2, attempt) + Math.random() * 1000;
        await delay(backoff);
        await breaker.waitIfPaused(source);
        continue;
      }
      return null;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Per-county data fetching + SCVI computation
// ---------------------------------------------------------------------------

const LARGE_COUNTY_THRESHOLD_SQMI = 1000;
const SAMPLE_OFFSET_DEG = 0.1; // ~11km offset for additional sample points

interface CountyResult {
  county: NjCounty;
  scviResult: ScviResult;
  errors: string[];
  svsInputs: SoilVulnerabilityInputs;
  cpiInputs: ContaminationPressureInputs;
  samplePoints: number;
}

function getSamplePoints(county: NjCounty): Array<{ lat: number; lng: number }> {
  const points = [{ lat: county.lat, lng: county.lng }];
  if (county.areaSqMi >= LARGE_COUNTY_THRESHOLD_SQMI) {
    points.push({ lat: county.lat + SAMPLE_OFFSET_DEG, lng: county.lng });
    points.push({ lat: county.lat, lng: county.lng + SAMPLE_OFFSET_DEG });
  }
  return points;
}

async function fetchPointData(lat: number, lng: number, county: NjCounty) {
  const fipsState = county.fips.substring(0, 2);
  const fipsCounty = county.fips.substring(2, 5);
  const errors: string[] = [];

  const [ssurgoRes, powerRes, brownfieldRes, superfundRes, echoRes, triRes] =
    await Promise.all([
      fetchWithBatchRetry('SSURGO', county.fips, () => fetchSsurgoData(lat, lng)),
      fetchWithBatchRetry('POWER', county.fips, () => fetchNasaPowerData(lat, lng)),
      fetchWithBatchRetry('Brownfields', county.fips, () => fetchBrownfieldSites(lat, lng)),
      fetchWithBatchRetry('Superfund', county.fips, () => fetchSuperfundSites(lat, lng, {})),
      fetchWithBatchRetry('ECHO', county.fips, () => fetchEchoFacilities(lat, lng, {})),
      fetchWithBatchRetry('TRI', county.fips, () => fetchTriReleasesByCounty(fipsState, fipsCounty)),
    ]);

  const sourceErrors: string[] = [];
  if (ssurgoRes?.error) { errors.push(`SSURGO: ${ssurgoRes.error}`); sourceErrors.push('SSURGO'); }
  if (powerRes?.error) { errors.push(`POWER: ${powerRes.error}`); sourceErrors.push('POWER'); }
  if (brownfieldRes?.error) { errors.push(`Brownfields: ${brownfieldRes.error}`); sourceErrors.push('Brownfields'); }
  if (superfundRes?.error) { errors.push(`Superfund: ${superfundRes.error}`); sourceErrors.push('Superfund'); }
  if (echoRes?.error) { errors.push(`ECHO: ${echoRes.error}`); sourceErrors.push('ECHO'); }
  if (triRes?.error) { errors.push(`TRI: ${triRes.error}`); sourceErrors.push('TRI'); }
  if (!ssurgoRes) { errors.push('SSURGO: fetch failed'); sourceErrors.push('SSURGO'); }
  if (!powerRes) { errors.push('POWER: fetch failed'); sourceErrors.push('POWER'); }
  if (!brownfieldRes) { errors.push('Brownfields: fetch failed'); sourceErrors.push('Brownfields'); }
  if (!superfundRes) { errors.push('Superfund: fetch failed'); sourceErrors.push('Superfund'); }
  if (!echoRes) { errors.push('ECHO: fetch failed'); sourceErrors.push('ECHO'); }
  if (!triRes) { errors.push('TRI: fetch failed'); sourceErrors.push('TRI'); }

  return { ssurgoRes, powerRes, brownfieldRes, superfundRes, echoRes, triRes, errors, sourceErrors };
}

function buildScviFromFetchResults(
  fetchResult: Awaited<ReturnType<typeof fetchPointData>>,
  county: NjCounty,
): { scviResult: ScviResult; svsInputs: SoilVulnerabilityInputs; cpiInputs: ContaminationPressureInputs } {
  const { ssurgoRes, powerRes, brownfieldRes, superfundRes, echoRes, triRes } = fetchResult;

  const ssurgo = ssurgoRes?.data ?? null;
  const power = powerRes?.data ?? null;
  const brownfields = brownfieldRes?.data ?? [];
  const superfundSites = superfundRes?.data ?? [];
  const echo = echoRes?.data ?? null;
  const tri = triRes?.data ?? null;

  const isUrbanLandMapUnit = ssurgo?.coverage === 'partial' ||
    (ssurgo?.mapUnitName?.toLowerCase().includes('urban') ?? false);

  const phMid = ssurgo && ssurgo.phRange[0] > 0 && ssurgo.phRange[1] > 0
    ? (ssurgo.phRange[0] + ssurgo.phRange[1]) / 2
    : null;

  const triFacilityCount = echo?.facilities.filter(f => f.programs.includes('TRI')).length ?? 0;

  const brownfieldNearestMiles = brownfields.length > 0
    ? Math.min(...brownfields.map(b => b.distance))
    : null;
  const superfundNearestMiles = superfundSites.length > 0
    ? Math.min(...superfundSites.map(s => s.distanceKm * 0.621371))
    : null;

  const svsInputs: SoilVulnerabilityInputs = {
    organicMatterPct: ssurgo && ssurgo.organicMatterPct > 0 ? ssurgo.organicMatterPct : null,
    ph: phMid,
    drainageClass: ssurgo?.drainageClass !== 'Unknown' ? ssurgo?.drainageClass ?? null : null,
    clayPct: ssurgo && ssurgo.clayPct > 0 ? ssurgo.clayPct : null,
    sandPct: ssurgo && ssurgo.sandPct > 0 ? ssurgo.sandPct : null,
    ksat: ssurgo && ssurgo.ksat > 0 ? ssurgo.ksat : null,
    hydrologicSoilGroup: ssurgo?.hydrologicSoilGroup ?? null,
    meanAnnualPrecipMm: power?.precipitationAvgMm ?? null,
    aridityIndex: power?.aridityIndex ?? null,
    ndviAnomaly: null,
    isUrbanLandMapUnit,
  };

  const cpiInputs: ContaminationPressureInputs = {
    brownfieldCount: brownfields.length,
    brownfieldNearestMiles,
    superfundCount: superfundSites.length,
    superfundNearestMiles,
    echoFacilityCount: echo?.totalCount ?? 0,
    echoSncCount: echo?.significantViolationCount ?? 0,
    triFacilityCount: tri?.facilityCount ?? triFacilityCount,
    triTotalReleasesLbs: tri?.totalOnSiteReleaseLbs ?? 0,
    countyAreaSqMi: county.areaSqMi,
  };

  const scviResult = computeScvi(svsInputs, cpiInputs);
  return { scviResult, svsInputs, cpiInputs };
}

async function processCounty(county: NjCounty): Promise<CountyResult> {
  const samplePoints = getSamplePoints(county);
  const allErrors: string[] = [];
  const allSourceErrors: string[] = [];

  // For single-point counties, use original flow
  if (samplePoints.length === 1) {
    const fetchResult = await fetchPointData(samplePoints[0].lat, samplePoints[0].lng, county);
    allErrors.push(...fetchResult.errors);
    allSourceErrors.push(...fetchResult.sourceErrors);

    if (allSourceErrors.length > 0) {
      failedCounties.push({
        fips: county.fips,
        county: county.name,
        failedSources: [...new Set(allSourceErrors)],
        errors: allErrors.slice(),
      });
    }

    const { scviResult, svsInputs, cpiInputs } = buildScviFromFetchResults(fetchResult, county);
    return { county, scviResult, errors: allErrors, svsInputs, cpiInputs, samplePoints: 1 };
  }

  // Multi-point: fetch each point sequentially (to avoid overwhelming APIs)
  const pointResults: Array<ReturnType<typeof buildScviFromFetchResults>> = [];
  for (let p = 0; p < samplePoints.length; p++) {
    const pt = samplePoints[p];
    const fetchResult = await fetchPointData(pt.lat, pt.lng, county);
    allErrors.push(...fetchResult.errors);
    allSourceErrors.push(...fetchResult.sourceErrors);
    pointResults.push(buildScviFromFetchResults(fetchResult, county));
    if (p < samplePoints.length - 1) await delay(1000);
  }

  if (allSourceErrors.length > 0) {
    failedCounties.push({
      fips: county.fips,
      county: county.name,
      failedSources: [...new Set(allSourceErrors)],
      errors: allErrors.slice(),
    });
  }

  // Average SVS and CPI across sample points, recompute SCVI from averages
  const avgSvs = Math.round(pointResults.reduce((s, r) => s + r.scviResult.svs, 0) / pointResults.length);
  const avgCpi = Math.round(pointResults.reduce((s, r) => s + r.scviResult.cpi, 0) / pointResults.length);
  const avgScvi = Math.round(Math.sqrt(avgSvs * avgCpi));

  // Use the centroid point's result as the base, override with averaged scores
  const baseResult = pointResults[0];
  const averaged: ScviResult = {
    ...baseResult.scviResult,
    scvi: avgScvi,
    svs: avgSvs,
    cpi: avgCpi,
  };

  return {
    county,
    scviResult: averaged,
    errors: allErrors,
    svsInputs: baseResult.svsInputs,
    cpiInputs: baseResult.cpiInputs,
    samplePoints: samplePoints.length,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('='.repeat(80));
  console.log('SCVI NJ PILOT — Soil Contamination Vulnerability Index');
  console.log(`Processing ${NJ_COUNTIES.length} counties...`);
  console.log(`Retry policy: ${BATCH_MAX_RETRIES} retries, ${BATCH_BASE_BACKOFF_MS}ms base backoff + jitter`);
  console.log(`Circuit breaker: ${CIRCUIT_BREAKER_THRESHOLD} consecutive 503s → ${CIRCUIT_BREAKER_PAUSE_MS / 1000}s pause`);
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
      const pts = result.samplePoints > 1 ? ` (${result.samplePoints}pt avg)` : '';
      console.log(
        `SCVI=${r.scvi} SVS=${r.svs} CPI=${r.cpi} SVI=${r.usdaSviClass}${pts}` +
        (result.errors.length > 0 ? ` [${result.errors.length} warnings]` : '')
      );
    } catch (err) {
      console.log(`FAILED: ${err instanceof Error ? err.message : String(err)}`);
    }

    if (i < NJ_COUNTIES.length - 1) await delay(2000);
  }

  // Assign quartiles across all results
  const quartiles = assignQuartiles(results.map(r => ({ scvi: r.scviResult.scvi })));
  for (let i = 0; i < results.length; i++) {
    results[i].scviResult.scviQuartile = quartiles[i];
  }

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
  console.log('  - ndviAnomaly: No data source available; urban gap uses default score=50 when applicable');

  // All warnings
  const allWarnings = results.flatMap(r => r.errors);
  if (allWarnings.length > 0) {
    console.log('');
    console.log(`API WARNINGS (${allWarnings.length} total):`);
    const uniqueWarnings = [...new Set(allWarnings)];
    for (const w of uniqueWarnings) {
      const count = allWarnings.filter(x => x === w).length;
      console.log(`  - ${w}${count > 1 ? ` (×${count})` : ''}`);
    }
  }

  // ---------------------------------------------------------------------------
  // Output files
  // ---------------------------------------------------------------------------
  const fs = await import('fs');

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

  fs.mkdirSync('data/scvi-build', { recursive: true });
  const outPath = 'data/scvi-nj-pilot.json';
  fs.writeFileSync(outPath, JSON.stringify(jsonOutput, null, 2));
  console.log('');
  console.log(`Full results written to ${outPath}`);

  // Write failed counties for re-run targeting
  if (failedCounties.length > 0) {
    const failedPath = 'data/scvi-build/failed-counties.json';
    fs.writeFileSync(failedPath, JSON.stringify(failedCounties, null, 2));
    console.log(`Failed counties (${failedCounties.length}) written to ${failedPath}`);
  } else {
    console.log('No failed counties — all sources responded for all counties.');
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
