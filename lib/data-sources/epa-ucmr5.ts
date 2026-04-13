import { PfasData, PfasAnalyte } from '@/types/exposure';
import { DataSourceResult } from './types';

/**
 * EPA UCMR 5 — PFAS occurrence in public drinking-water systems.
 *
 * UCMR 5 results are NOT exposed through the Envirofacts REST API. EPA only
 * publishes them as quarterly ZIP bundles on
 *   https://www.epa.gov/dwucmr/occurrence-data-unregulated-contaminant-monitoring-rule
 *
 * We preprocess the latest bundle (UCMR5_All.txt, ~300 MB, ~1.9 M rows) into
 * a compact PWSID → PFAS-analytes lookup file checked into the repo at
 * `data/ucmr5-by-pwsid.json`. See `scripts/build-ucmr5-data.ts`.
 *
 * The JSON bundle keeps max concentrations per analyte (ppt), the first and
 * last detection dates, and a precomputed `exceedsMcl` flag. The client reads
 * the bundle once per process and then answers queries in O(1).
 *
 * Data resolution: AREA-LEVEL (water system, not tap-level)
 * Cache: baked into build — rebuilt whenever EPA publishes a new quarterly
 *        release (currently Jan 2026).
 */

// EPA final PFAS MCLs (April 2024, 89 FR 32532) in ppt (ng/L). These match
// the values precomputed into the bundle by scripts/build-ucmr5-data.ts —
// re-exported here so callers (e.g. the water scorer) can reason about them.
export const PFAS_MCLS: Record<string, number> = {
  PFOA: 4,
  PFOS: 4,
  PFHxS: 10,
  PFNA: 10,
  'HFPO-DA': 10,
};

// Bundle entry shape (mirrors scripts/build-ucmr5-data.ts).
export interface UcmrBundleEntry {
  systemName: string;
  state: string;
  size: string;
  analytes: PfasAnalyte[];
  maxIndividual: number;
  totalPfas: number;
  exceedsMcl: boolean;
  firstSampleDate: string;
  lastSampleDate: string;
}

export interface UcmrBundle {
  generatedAt: string;
  source: string;
  sourceUrl: string;
  rowCount: number;
  pwsidCount: number;
  systems: Record<string, UcmrBundleEntry>;
}

// ---------------------------------------------------------------------------
// Lazy bundle loader (server-side only — Node fs).
// ---------------------------------------------------------------------------

let cachedBundle: UcmrBundle | null = null;
let loadError: string | null = null;

function resolveBundlePath(): string {
  // Resolved relative to process.cwd() so it works under `next dev`, `next
  // start`, and standalone tsx runs.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('node:path') as typeof import('node:path');
  return path.resolve(process.cwd(), 'data/ucmr5-by-pwsid.json');
}

function loadBundle(): UcmrBundle | null {
  if (cachedBundle) return cachedBundle;
  if (loadError) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('node:fs') as typeof import('node:fs');
    const raw = fs.readFileSync(resolveBundlePath(), 'utf8');
    const parsed = JSON.parse(raw) as UcmrBundle;
    if (!parsed || typeof parsed !== 'object' || !parsed.systems) {
      loadError = 'UCMR 5 bundle is malformed';
      return null;
    }
    cachedBundle = parsed;
    return cachedBundle;
  } catch (err) {
    loadError = err instanceof Error ? err.message : 'Failed to load UCMR 5 bundle';
    return null;
  }
}

/** Test-only hook: override the cached bundle without touching the filesystem. */
export function __setUcmr5BundleForTests(bundle: UcmrBundle | null): void {
  cachedBundle = bundle;
  loadError = bundle ? null : 'test: bundle unset';
}

/** Test-only hook: reset both the cache and the error memo. */
export function __resetUcmr5BundleCache(): void {
  cachedBundle = null;
  loadError = null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function fetchUcmr5PfasData(
  pwsid: string,
  systemName: string
): Promise<DataSourceResult<PfasData>> {
  const fetchedAt = new Date().toISOString();

  if (!pwsid) {
    return {
      data: null,
      error: 'PWSID is required',
      source: 'EPA UCMR 5',
      cached: false,
      fetchedAt,
    };
  }

  const bundle = loadBundle();
  if (!bundle) {
    return {
      data: null,
      error: loadError ?? 'UCMR 5 bundle is not available',
      source: 'EPA UCMR 5',
      cached: false,
      fetchedAt,
    };
  }

  const entry = bundle.systems[pwsid];
  if (!entry) {
    // Not an error — plenty of small systems were never required to test
    // under UCMR 5.
    return {
      data: null,
      error: null,
      source: `EPA UCMR 5 (${bundle.source})`,
      cached: true,
      fetchedAt,
    };
  }

  const data: PfasData = {
    systemId: pwsid,
    systemName: entry.systemName || systemName,
    analytes: entry.analytes,
    maxIndividual: entry.maxIndividual,
    totalPfas: entry.totalPfas,
    exceedsMcl: entry.exceedsMcl,
    testingPeriod:
      entry.firstSampleDate && entry.lastSampleDate
        ? `${entry.firstSampleDate} – ${entry.lastSampleDate}`
        : 'UCMR 5 (2023–2025)',
  };

  return {
    data,
    error: null,
    source: `EPA UCMR 5 (${bundle.source})`,
    cached: true,
    fetchedAt,
  };
}
