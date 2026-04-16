import { NonattainmentStatus } from '@/types/exposure';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * EPA Green Book — Nonattainment area designations.
 *
 * Loaded from a static JSON bundle at data/nonattainment.json.
 * The bundle maps county FIPS codes (5-digit state+county) to
 * pollutants for which the county has been designated nonattainment
 * under the Clean Air Act.
 *
 * Build script: scripts/build-nonattainment-data.ts
 *
 * Failure modes:
 *  - Bundle not found or corrupt → returns null
 *  - County not in bundle → returns attainment (clean)
 *  - Bundle stale → generatedAt field for staleness checks
 *
 * Data resolution: AREA-LEVEL (county-level designation)
 */

interface NonattainmentEntry {
  pollutants: string[];
  classification: string;
}

interface NonattainmentBundle {
  generatedAt: string;
  source: string;
  countyCount: number;
  counties: Record<string, NonattainmentEntry>;
}

let cachedBundle: NonattainmentBundle | null = null;
let loadAttempted = false;

function loadBundle(): NonattainmentBundle | null {
  if (loadAttempted) return cachedBundle;
  loadAttempted = true;

  try {
    const filePath = join(process.cwd(), 'data', 'nonattainment.json');
    const raw = readFileSync(filePath, 'utf-8');
    cachedBundle = JSON.parse(raw) as NonattainmentBundle;
    return cachedBundle;
  } catch {
    return null;
  }
}

export function lookupNonattainment(
  fipsState: string,
  fipsCounty: string
): NonattainmentStatus | null {
  if (!fipsState || !fipsCounty) return null;

  const bundle = loadBundle();
  if (!bundle) return null;

  const countyFips = `${fipsState}${fipsCounty}`;
  const entry = bundle.counties[countyFips];

  if (!entry) {
    return {
      isNonattainment: false,
      pollutants: [],
      classification: 'attainment',
      countyFips,
    };
  }

  return {
    isNonattainment: true,
    pollutants: entry.pollutants,
    classification: entry.classification,
    countyFips,
  };
}

// For testing: reset the cache
export function _resetNonattainmentCache(): void {
  cachedBundle = null;
  loadAttempted = false;
}
