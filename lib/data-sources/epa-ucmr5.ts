import { PfasData, PfasAnalyte } from '@/types/exposure';
import { DataSourceResult, fetchWithRetry } from './types';

/**
 * EPA UCMR 5 — PFAS in drinking water.
 *
 * Queries EPA Envirofacts for UCMR 5 analytical results for a given PWSID.
 * Returns all 29 PFAS analytes tested and whether any exceed EPA MCLs.
 *
 * Data resolution: AREA-LEVEL (water system, not tap-level)
 * Cache: 90 days (updates quarterly)
 */

// EPA MCLs established April 2024 (89 FR 32532)
const PFAS_MCLS: Record<string, number> = {
  PFOS: 4,      // ppt
  PFOA: 4,      // ppt
  PFHxS: 10,    // ppt
  PFNA: 10,     // ppt
  'HFPO-DA': 10, // GenX
  PFBS: 2000,   // Health advisory (no enforceable MCL yet, but listed)
};

// UCMR 5 contaminant codes to readable names
const UCMR5_CONTAMINANT_MAP: Record<string, string> = {
  '7550': 'PFOS',
  '7551': 'PFOA',
  '7552': 'PFHxS',
  '7553': 'PFNA',
  '7554': 'HFPO-DA',
  '7555': 'PFBS',
  '7556': 'ADONA',
  '7557': '9Cl-PF3ONS',
  '7558': '11Cl-PF3OUdS',
  '7559': 'NEtFOSAA',
  '7560': 'NMeFOSAA',
  '7561': 'PFDA',
  '7562': 'PFDoA',
  '7563': 'PFDS',
  '7564': 'PFHpA',
  '7565': 'PFHxA',
  '7566': 'PFMBA',
  '7567': 'PFMPA',
  '7568': 'PFO2HxA',
  '7569': 'PFO3OA',
  '7570': 'PFO4DA',
  '7571': 'PFO5DoA',
  '7572': 'PFTA',
  '7573': 'PFTrDA',
  '7574': 'PFUnA',
  '7575': 'PEPA',
  '7576': '4:2 FTS',
  '7577': '6:2 FTS',
  '7578': '8:2 FTS',
};

export async function fetchUcmr5PfasData(
  pwsid: string,
  systemName: string
): Promise<DataSourceResult<PfasData>> {
  const url = `https://data.epa.gov/efservice/UCM_RESULTS/PWSID/${pwsid}/JSON`;

  try {
    const response = await fetchWithRetry(url, { timeoutMs: 20_000 });

    if (!response.ok) {
      return {
        data: null,
        error: `EPA UCMR 5 API returned HTTP ${response.status}`,
        source: 'EPA UCMR 5',
        cached: false,
        fetchedAt: new Date().toISOString(),
      };
    }

    const results = await response.json();

    if (!Array.isArray(results) || results.length === 0) {
      return {
        data: null,
        error: null, // Not an error — system simply wasn't in UCMR 5
        source: 'EPA UCMR 5',
        cached: false,
        fetchedAt: new Date().toISOString(),
      };
    }

    // Parse analyte results
    const analytes: PfasAnalyte[] = [];
    let maxIndividual = 0;
    let totalPfas = 0;
    let exceedsMcl = false;
    let testingPeriod = '';

    for (const result of results) {
      const contaminantCode = String(result.CONTAMINANT_CODE || '');
      const analyteName =
        UCMR5_CONTAMINANT_MAP[contaminantCode] || result.CONTAMINANT || contaminantCode;
      const concentration = parseFloat(result.ANALYTICAL_RESULT_VALUE || '0');

      // Skip non-detects or invalid values
      if (isNaN(concentration) || concentration <= 0) continue;

      const mcl = PFAS_MCLS[analyteName] ?? Infinity;
      const exceeds = concentration > mcl;

      if (exceeds) exceedsMcl = true;
      if (concentration > maxIndividual) maxIndividual = concentration;
      totalPfas += concentration;

      analytes.push({
        name: analyteName,
        concentration,
        mcl: mcl === Infinity ? 0 : mcl,
        exceedsMcl: exceeds,
      });

      // Track testing period from the first result with a date
      if (!testingPeriod && result.SAMPLE_COLLECTION_DATE) {
        testingPeriod = result.SAMPLE_COLLECTION_DATE;
      }
    }

    // Sort by concentration descending
    analytes.sort((a, b) => b.concentration - a.concentration);

    return {
      data: {
        systemId: pwsid,
        systemName,
        analytes,
        maxIndividual,
        totalPfas,
        exceedsMcl,
        testingPeriod: testingPeriod || 'UCMR 5 testing period (2023-2025)',
      },
      error: null,
      source: 'EPA UCMR 5',
      cached: false,
      fetchedAt: new Date().toISOString(),
    };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Unknown error fetching UCMR 5 data',
      source: 'EPA UCMR 5',
      cached: false,
      fetchedAt: new Date().toISOString(),
    };
  }
}
