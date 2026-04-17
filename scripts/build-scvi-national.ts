/**
 * SCVI National Run — Batch pipeline for all ~3,140 US counties.
 *
 * Reads county reference data from data/us-counties-ref.json, fetches
 * SSURGO, NASA POWER, Brownfields, Superfund, ECHO, and TRI data for each,
 * computes SVS/CPI/SCVI scores, and writes results to data/scvi-national.json.
 *
 * Includes hardened retry logic:
 *  - 5 retries with exponential backoff (2s, 4s, 8s, 16s, 32s) + jitter
 *  - Per-source circuit breaker: 3 consecutive 503s → 60s pause
 *  - Batches of 20 counties with 500ms between batches
 *  - Progress logging every 100 counties
 *  - Failed counties written to data/scvi-build/failed-counties.json
 *
 * Usage: npx tsx scripts/build-scvi-national.ts
 */

import { readFileSync, writeFileSync, appendFileSync, mkdirSync } from 'fs';
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
// Real-time logging (bypasses Node.js stdout buffering in nohup)
// ---------------------------------------------------------------------------

const LOG_FILE = '/tmp/scvi-national-run.log';
appendFileSync(LOG_FILE, '\n--- NEW RUN STARTED ---\n');

function log(msg: string): void {
  process.stdout.write(msg + '\n');
  appendFileSync(LOG_FILE, msg + '\n');
}

// ---------------------------------------------------------------------------
// County reference data
// ---------------------------------------------------------------------------

interface CountyRef {
  fips: string;
  name: string;
  stateAbbr: string;
  lat: number;
  lng: number;
  areaSqMi: number;
  population: number;
}

function loadCounties(): CountyRef[] {
  const raw = readFileSync('data/us-counties-ref.json', 'utf8');
  return JSON.parse(raw) as CountyRef[];
}

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
const BATCH_SIZE = 20;
const BATCH_DELAY_MS = 500;
const LOG_INTERVAL = 100;

type SourceName = 'SSURGO' | 'POWER' | 'Brownfields' | 'Superfund' | 'ECHO' | 'TRI';

class SourceCircuitBreaker {
  private consecutive503s = new Map<SourceName, number>();
  private pausedUntil = new Map<SourceName, number>();

  record503(source: SourceName, countyFips: string): void {
    const count = (this.consecutive503s.get(source) ?? 0) + 1;
    this.consecutive503s.set(source, count);

    if (count >= CIRCUIT_BREAKER_THRESHOLD) {
      this.pausedUntil.set(source, Date.now() + CIRCUIT_BREAKER_PAUSE_MS);
      log(`    [CIRCUIT BREAKER] ${source} paused 60s after ${count} consecutive 503s (${countyFips})`);
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
  state: string;
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
const SAMPLE_OFFSET_DEG = 0.1;

interface CountyResult {
  county: CountyRef;
  scviResult: ScviResult;
  errors: string[];
  svsInputs: SoilVulnerabilityInputs;
  cpiInputs: ContaminationPressureInputs;
  samplePoints: number;
}

function getSamplePoints(county: CountyRef): Array<{ lat: number; lng: number }> {
  const points = [{ lat: county.lat, lng: county.lng }];
  if (county.areaSqMi >= LARGE_COUNTY_THRESHOLD_SQMI) {
    points.push({ lat: county.lat + SAMPLE_OFFSET_DEG, lng: county.lng });
    points.push({ lat: county.lat, lng: county.lng + SAMPLE_OFFSET_DEG });
  }
  return points;
}

async function fetchPointData(lat: number, lng: number, county: CountyRef) {
  const errors: string[] = [];
  const sourceErrors: string[] = [];

  const [ssurgoRes, powerRes, brownfieldRes, superfundRes, echoRes, triRes] =
    await Promise.all([
      fetchWithBatchRetry('SSURGO', county.fips, () => fetchSsurgoData(lat, lng)),
      fetchWithBatchRetry('POWER', county.fips, () => fetchNasaPowerData(lat, lng)),
      fetchWithBatchRetry('Brownfields', county.fips, () => fetchBrownfieldSites(lat, lng)),
      fetchWithBatchRetry('Superfund', county.fips, () => fetchSuperfundSites(lat, lng, {})),
      fetchWithBatchRetry('ECHO', county.fips, () => fetchEchoFacilities(lat, lng, {})),
      fetchWithBatchRetry('TRI', county.fips, () =>
        fetchTriReleasesByCounty(county.stateAbbr, county.name),
      ),
    ]);

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
  county: CountyRef,
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

async function processCounty(county: CountyRef): Promise<CountyResult> {
  const samplePoints = getSamplePoints(county);
  const allErrors: string[] = [];
  const allSourceErrors: string[] = [];

  if (samplePoints.length === 1) {
    const fetchResult = await fetchPointData(samplePoints[0].lat, samplePoints[0].lng, county);
    allErrors.push(...fetchResult.errors);
    allSourceErrors.push(...fetchResult.sourceErrors);

    if (allSourceErrors.length > 0) {
      failedCounties.push({
        fips: county.fips,
        county: county.name,
        state: county.stateAbbr,
        failedSources: [...new Set(allSourceErrors)],
        errors: allErrors.slice(),
      });
    }

    const { scviResult, svsInputs, cpiInputs } = buildScviFromFetchResults(fetchResult, county);
    return { county, scviResult, errors: allErrors, svsInputs, cpiInputs, samplePoints: 1 };
  }

  // Multi-point: fetch sequentially to avoid overwhelming APIs
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
      state: county.stateAbbr,
      failedSources: [...new Set(allSourceErrors)],
      errors: allErrors.slice(),
    });
  }

  const avgSvs = Math.round(pointResults.reduce((s, r) => s + r.scviResult.svs, 0) / pointResults.length);
  const avgCpi = Math.round(pointResults.reduce((s, r) => s + r.scviResult.cpi, 0) / pointResults.length);
  const avgScvi = Math.round(Math.sqrt(avgSvs * avgCpi));

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
// Checkpoint: save progress periodically
// ---------------------------------------------------------------------------

const CHECKPOINT_PATH = 'data/scvi-build/checkpoint.json';
const CHECKPOINT_INTERVAL = 20;

interface CheckpointData {
  timestamp: string;
  processed: number;
  total: number;
  completedFips: string[];
  results: Array<{
    fips: string;
    county: string;
    state: string;
    population: number;
    areaSqMi: number;
    scvi: number;
    svs: number;
    cpi: number;
    usdaSviClass: string;
    svsComponents: ScviResult['svsComponents'];
    cpiComponents: ScviResult['cpiComponents'];
    coverage: ScviResult['coverage'];
    samplePoints: number;
    errors: string[];
  }>;
  failedCounties: FailedCounty[];
}

function saveCheckpoint(results: CountyResult[], processed: number, total: number): void {
  const checkpoint: CheckpointData = {
    timestamp: new Date().toISOString(),
    processed,
    total,
    completedFips: results.map(r => r.county.fips),
    results: results.map(r => ({
      fips: r.county.fips,
      county: r.county.name,
      state: r.county.stateAbbr,
      population: r.county.population,
      areaSqMi: r.county.areaSqMi,
      scvi: r.scviResult.scvi,
      svs: r.scviResult.svs,
      cpi: r.scviResult.cpi,
      usdaSviClass: r.scviResult.usdaSviClass,
      svsComponents: r.scviResult.svsComponents,
      cpiComponents: r.scviResult.cpiComponents,
      coverage: r.scviResult.coverage,
      samplePoints: r.samplePoints,
      errors: r.errors,
    })),
    failedCounties: [...failedCounties],
  };
  mkdirSync('data/scvi-build', { recursive: true });
  writeFileSync(CHECKPOINT_PATH, JSON.stringify(checkpoint));
}

function loadCheckpoint(): CheckpointData | null {
  try {
    const raw = readFileSync(CHECKPOINT_PATH, 'utf8');
    const data = JSON.parse(raw) as CheckpointData;
    if (data.completedFips && data.results && data.completedFips.length > 0) {
      return data;
    }
  } catch {
    // No checkpoint or invalid — start fresh
  }
  return null;
}

function restoreResultsFromCheckpoint(
  checkpoint: CheckpointData,
  counties: CountyRef[],
): CountyResult[] {
  const countyMap = new Map(counties.map(c => [c.fips, c]));
  return checkpoint.results
    .filter(r => countyMap.has(r.fips))
    .map(r => ({
      county: countyMap.get(r.fips)!,
      scviResult: {
        scvi: r.scvi,
        svs: r.svs,
        cpi: r.cpi,
        usdaSviClass: r.usdaSviClass,
        svsComponents: r.svsComponents,
        cpiComponents: r.cpiComponents,
        coverage: r.coverage,
        scviQuartile: 0,
      } as ScviResult,
      errors: r.errors,
      svsInputs: {} as SoilVulnerabilityInputs,
      cpiInputs: {} as ContaminationPressureInputs,
      samplePoints: r.samplePoints,
    }));
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const counties = loadCounties();
  const startTime = Date.now();

  log('='.repeat(80));
  log('SCVI NATIONAL RUN — Soil Contamination Vulnerability Index');
  log(`Processing ${counties.length} counties in batches of ${BATCH_SIZE}`);
  log(`Retry policy: ${BATCH_MAX_RETRIES} retries, ${BATCH_BASE_BACKOFF_MS}ms base backoff + jitter`);
  log(`Circuit breaker: ${CIRCUIT_BREAKER_THRESHOLD} consecutive 503s → ${CIRCUIT_BREAKER_PAUSE_MS / 1000}s pause`);
  log(`Multi-point sampling: counties ≥${LARGE_COUNTY_THRESHOLD_SQMI} sq mi get 3 sample points`);
  log(`Started: ${new Date().toISOString()}`);
  log('='.repeat(80));
  log('');

  const results: CountyResult[] = [];
  const multiPointCount = counties.filter(c => c.areaSqMi >= LARGE_COUNTY_THRESHOLD_SQMI).length;
  log(`${multiPointCount} counties will use multi-point sampling (≥${LARGE_COUNTY_THRESHOLD_SQMI} sq mi)`);

  // Resume from checkpoint if available
  const checkpoint = loadCheckpoint();
  const completedFips = new Set<string>();
  if (checkpoint) {
    const restored = restoreResultsFromCheckpoint(checkpoint, counties);
    results.push(...restored);
    for (const fips of checkpoint.completedFips) completedFips.add(fips);
    failedCounties.push(...(checkpoint.failedCounties ?? []));
    log(`RESUMING from checkpoint: ${restored.length} counties already processed`);
  }
  log('');

  let processed = results.length;
  for (let i = 0; i < counties.length; i++) {
    const county = counties[i];
    if (completedFips.has(county.fips)) continue;

    processed++;
    const tag = `[${processed}/${counties.length}]`;

    try {
      const result = await processCounty(county);
      results.push(result);

      // Compact single-line output for each county
      const r = result.scviResult;
      const pts = result.samplePoints > 1 ? ` ${result.samplePoints}pt` : '';
      const warns = result.errors.length > 0 ? ` [${result.errors.length}w]` : '';
      log(
        `${tag} ${county.stateAbbr}/${county.name}: SCVI=${r.scvi} SVS=${r.svs} CPI=${r.cpi}${pts}${warns}`
      );
    } catch (err) {
      log(`${tag} ${county.stateAbbr}/${county.name}: FAILED — ${err instanceof Error ? err.message : String(err)}`);
    }

    // Save checkpoint every CHECKPOINT_INTERVAL counties
    if (processed % CHECKPOINT_INTERVAL === 0) {
      saveCheckpoint(results, processed, counties.length);
    }

    // Progress summary every LOG_INTERVAL counties
    if (processed % LOG_INTERVAL === 0) {
      const elapsed = (Date.now() - startTime) / 1000;
      const newThisRun = processed - (checkpoint?.completedFips.length ?? 0);
      const rate = newThisRun > 0 ? newThisRun / elapsed : 0.05;
      const remaining = counties.length - processed;
      const eta = Math.round(remaining / rate / 60);
      const avgScvi = Math.round(results.reduce((s, r) => s + r.scviResult.scvi, 0) / results.length);
      log('');
      log(`--- PROGRESS: ${processed}/${counties.length} (${(processed / counties.length * 100).toFixed(1)}%) | ${elapsed.toFixed(0)}s elapsed | ~${eta}min remaining | avg SCVI=${avgScvi} | ${failedCounties.length} with warnings ---`);
      log('');
    }

    // Batch delay: pause between batches
    if (processed % BATCH_SIZE === 0) {
      await delay(BATCH_DELAY_MS);
    }
  }

  // Final checkpoint
  saveCheckpoint(results, results.length, counties.length);

  // Assign quartiles across all results
  const quartiles = assignQuartiles(results.map(r => ({ scvi: r.scviResult.scvi })));
  for (let i = 0; i < results.length; i++) {
    results[i].scviResult.scviQuartile = quartiles[i];
  }

  const sorted = [...results].sort((a, b) => b.scviResult.scvi - a.scviResult.scvi);
  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

  // ---------------------------------------------------------------------------
  // Report: Summary
  // ---------------------------------------------------------------------------
  log('');
  log('='.repeat(80));
  log(`NATIONAL SCVI RESULTS — ${results.length} counties processed in ${elapsed} minutes`);
  log('='.repeat(80));
  log('');

  log(`Total counties: ${results.length} / ${counties.length}`);
  log(`Counties with warnings: ${failedCounties.length}`);
  log('');

  // ---------------------------------------------------------------------------
  // Report: Top 25 highest SCVI
  // ---------------------------------------------------------------------------
  log('='.repeat(80));
  log('TOP 25 HIGHEST SCVI COUNTIES');
  log('='.repeat(80));
  log('');
  log(
    '#'.padEnd(4) +
    'County'.padEnd(28) +
    'State'.padEnd(6) +
    'SCVI'.padStart(6) +
    'Q'.padStart(4) +
    'SVS'.padStart(6) +
    'CPI'.padStart(6) +
    'SVI Class'.padStart(18) +
    'Pop'.padStart(12)
  );
  log('-'.repeat(90));

  for (let i = 0; i < Math.min(25, sorted.length); i++) {
    const r = sorted[i];
    const s = r.scviResult;
    log(
      String(i + 1).padEnd(4) +
      r.county.name.padEnd(28) +
      r.county.stateAbbr.padEnd(6) +
      String(s.scvi).padStart(6) +
      String(s.scviQuartile).padStart(4) +
      String(s.svs).padStart(6) +
      String(s.cpi).padStart(6) +
      s.usdaSviClass.padStart(18) +
      r.county.population.toLocaleString().padStart(12)
    );
  }

  // ---------------------------------------------------------------------------
  // Report: Top 25 details
  // ---------------------------------------------------------------------------
  log('');
  log('='.repeat(80));
  log('TOP 25 DETAIL');
  log('='.repeat(80));

  for (let i = 0; i < Math.min(25, sorted.length); i++) {
    const r = sorted[i];
    const s = r.scviResult;
    log('');
    log(`#${i + 1}: ${r.county.name} County, ${r.county.stateAbbr} (pop ${r.county.population.toLocaleString()})`);
    log(`  SCVI: ${s.scvi} (Q${s.scviQuartile})  |  USDA SVI: ${s.usdaSviClass}`);
    log(`  SVS: ${s.svs}  |  CPI: ${s.cpi}`);
    log(`  SVS: OM=${s.svsComponents.organicMatter} pH=${s.svsComponents.ph} drain=${s.svsComponents.drainage} texture=${s.svsComponents.texture} climate=${s.svsComponents.climate} urban=${s.svsComponents.urbanGap}`);
    log(`  CPI: legacy=${s.cpiComponents.legacy} industrial=${s.cpiComponents.industrial} compliance=${s.cpiComponents.compliance} release=${s.cpiComponents.release}`);
    log(`  Coverage: SVS ${s.coverage.svsDataPoints}/${s.coverage.svsMaxDataPoints}, CPI ${s.coverage.cpiDataPoints}/${s.coverage.cpiMaxDataPoints}`);
    if (r.errors.length > 0) {
      log(`  Warnings (${r.errors.length}): ${r.errors.slice(0, 3).join('; ')}${r.errors.length > 3 ? '...' : ''}`);
    }
  }

  // ---------------------------------------------------------------------------
  // Report: Population in top quartile
  // ---------------------------------------------------------------------------
  log('');
  log('='.repeat(80));
  log('POPULATION BY SCVI QUARTILE');
  log('='.repeat(80));
  log('');

  const popByQuartile = [0, 0, 0, 0];
  const countByQuartile = [0, 0, 0, 0];
  for (const r of results) {
    const q = r.scviResult.scviQuartile - 1;
    popByQuartile[q] += r.county.population;
    countByQuartile[q]++;
  }
  const totalPop = popByQuartile.reduce((a, b) => a + b, 0);

  for (let q = 0; q < 4; q++) {
    const pct = totalPop > 0 ? ((popByQuartile[q] / totalPop) * 100).toFixed(1) : '0.0';
    log(
      `  Q${q + 1}: ${countByQuartile[q]} counties | pop ${popByQuartile[q].toLocaleString()} (${pct}% of total)`
    );
  }
  log(`  Total population covered: ${totalPop.toLocaleString()}`);

  // ---------------------------------------------------------------------------
  // Report: USDA SVI class distribution
  // ---------------------------------------------------------------------------
  log('');
  log('='.repeat(80));
  log('USDA SVI CLASS DISTRIBUTION');
  log('='.repeat(80));
  const sviCounts: Record<string, number> = {};
  for (const r of results) {
    const cls = r.scviResult.usdaSviClass;
    sviCounts[cls] = (sviCounts[cls] || 0) + 1;
  }
  for (const [cls, count] of Object.entries(sviCounts).sort((a, b) => b[1] - a[1])) {
    log(`  ${cls}: ${count} counties (${((count / results.length) * 100).toFixed(1)}%)`);
  }

  // ---------------------------------------------------------------------------
  // Report: SCVI quartile distribution
  // ---------------------------------------------------------------------------
  log('');
  log('SCVI QUARTILE DISTRIBUTION');
  log('-'.repeat(40));
  for (let q = 1; q <= 4; q++) {
    log(`  Q${q}: ${countByQuartile[q - 1]} counties`);
  }

  // ---------------------------------------------------------------------------
  // Report: State breakdown — states with most Q4 counties
  // ---------------------------------------------------------------------------
  log('');
  log('='.repeat(80));
  log('STATES WITH MOST Q4 (HIGHEST RISK) COUNTIES');
  log('='.repeat(80));
  const q4ByState = new Map<string, number>();
  for (const r of results) {
    if (r.scviResult.scviQuartile === 4) {
      q4ByState.set(r.county.stateAbbr, (q4ByState.get(r.county.stateAbbr) ?? 0) + 1);
    }
  }
  const stateQ4Sorted = [...q4ByState.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15);
  for (const [state, count] of stateQ4Sorted) {
    log(`  ${state}: ${count} Q4 counties`);
  }

  // ---------------------------------------------------------------------------
  // Report: Data limitations and warnings
  // ---------------------------------------------------------------------------
  log('');
  log('='.repeat(80));
  log('DATA LIMITATIONS');
  log('='.repeat(80));
  log('  - ndviAnomaly: No data source; urban gap uses default score=50');
  log('  - TRI release volumes: one_time_release_qty underestimates actual annual totals');
  log('  - Income by quartile: Census ACS unavailable at build time; omitted');

  // Warning summary
  const allWarnings = results.flatMap(r => r.errors);
  if (allWarnings.length > 0) {
    log('');
    log(`API WARNINGS (${allWarnings.length} total across ${failedCounties.length} counties):`);
    const warningCounts = new Map<string, number>();
    for (const w of allWarnings) {
      const key = w.replace(/\d{5}/g, 'XXXXX').replace(/for .+$/, '...');
      warningCounts.set(key, (warningCounts.get(key) ?? 0) + 1);
    }
    const sortedWarnings = [...warningCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15);
    for (const [w, count] of sortedWarnings) {
      log(`  - ${w} (×${count})`);
    }
  }

  // ---------------------------------------------------------------------------
  // Output files
  // ---------------------------------------------------------------------------
  const jsonOutput = sorted.map(r => ({
    fips: r.county.fips,
    county: r.county.name,
    state: r.county.stateAbbr,
    population: r.county.population,
    scvi: r.scviResult.scvi,
    quartile: r.scviResult.scviQuartile,
    svs: r.scviResult.svs,
    cpi: r.scviResult.cpi,
    usdaSviClass: r.scviResult.usdaSviClass,
    svsComponents: r.scviResult.svsComponents,
    cpiComponents: r.scviResult.cpiComponents,
    coverage: r.scviResult.coverage,
    samplePoints: r.samplePoints,
  }));

  mkdirSync('data/scvi-build', { recursive: true });
  const outPath = 'data/scvi-national.json';
  writeFileSync(outPath, JSON.stringify(jsonOutput, null, 2));
  log('');
  log(`Full results written to ${outPath}`);

  if (failedCounties.length > 0) {
    const failedPath = 'data/scvi-build/failed-counties.json';
    writeFileSync(failedPath, JSON.stringify(failedCounties, null, 2));
    log(`Failed counties (${failedCounties.length}) written to ${failedPath}`);
  } else {
    log('No failed counties — all sources responded for all counties.');
  }

  log('');
  log(`Completed in ${elapsed} minutes.`);
}

main().catch((err) => {
  log(`Fatal error: ${err}`);
  console.error(err);
  process.exit(1);
});
