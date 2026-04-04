import { WaterViolation } from '@/types/exposure';
import { DataSourceResult, fetchWithRetry } from './types';

/**
 * EPA SDWIS — Safe Drinking Water Information System violations.
 *
 * Queries violation history for a given public water system (PWSID).
 *
 * Data resolution: AREA-LEVEL (water system level)
 * Cache: 7 days (violations can update frequently)
 */

// Health-based violation type codes (MCL violations are more severe than monitoring)
const HEALTH_BASED_TYPES = new Set([
  'MCL',   // Maximum Contaminant Level
  'MRDL',  // Maximum Residual Disinfectant Level
  'TT',    // Treatment Technique
]);

export async function fetchSdwisViolations(
  pwsid: string
): Promise<DataSourceResult<WaterViolation[]>> {
  const url = `https://data.epa.gov/efservice/VIOLATION/PWSID/${pwsid}/ROWS/0:100/JSON`;

  try {
    const response = await fetchWithRetry(url, { timeoutMs: 15_000 });

    if (!response.ok) {
      return {
        data: null,
        error: `EPA SDWIS API returned HTTP ${response.status}`,
        source: 'EPA SDWIS',
        cached: false,
        fetchedAt: new Date().toISOString(),
      };
    }

    const results = await response.json();

    if (!Array.isArray(results) || results.length === 0) {
      return {
        data: [],
        error: null,
        source: 'EPA SDWIS',
        cached: false,
        fetchedAt: new Date().toISOString(),
      };
    }

    const violations: WaterViolation[] = results.map(
      (v: Record<string, string>) => ({
        type: v.VIOLATION_TYPE_CODE || 'Unknown',
        contaminant: v.CONTAMINANT_NAME || v.CONTAMINANT_CODE || 'Unknown',
        beginDate: v.COMPL_PER_BEGIN_DATE || '',
        endDate: v.COMPL_PER_END_DATE || undefined,
        status: v.COMPLIANCE_STATUS_CODE || 'Unknown',
        isHealthBased: HEALTH_BASED_TYPES.has(v.VIOLATION_TYPE_CODE || ''),
      })
    );

    // Sort newest first
    violations.sort(
      (a, b) => new Date(b.beginDate).getTime() - new Date(a.beginDate).getTime()
    );

    return {
      data: violations,
      error: null,
      source: 'EPA SDWIS',
      cached: false,
      fetchedAt: new Date().toISOString(),
    };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Unknown error fetching SDWIS data',
      source: 'EPA SDWIS',
      cached: false,
      fetchedAt: new Date().toISOString(),
    };
  }
}

/**
 * Compute violation summary statistics for scoring.
 */
export function computeViolationStats(violations: WaterViolation[]) {
  const now = new Date();
  const fiveYearsAgo = new Date(now.getFullYear() - 5, now.getMonth(), now.getDate());
  const tenYearsAgo = new Date(now.getFullYear() - 10, now.getMonth(), now.getDate());

  const recent5yr = violations.filter(
    (v) => new Date(v.beginDate) >= fiveYearsAgo
  );
  const recent10yr = violations.filter(
    (v) => new Date(v.beginDate) >= tenYearsAgo
  );

  const healthBased5yr = recent5yr.filter((v) => v.isHealthBased);
  const activeViolations = violations.filter(
    (v) => !v.endDate || v.status === 'O' || v.status === 'Open'
  );

  // Unique contaminants in health-based violations
  const contaminantSet = new Set(
    healthBased5yr.map((v) => v.contaminant)
  );

  return {
    total: violations.length,
    last5Years: recent5yr.length,
    last10Years: recent10yr.length,
    healthBased5yr: healthBased5yr.length,
    activeCount: activeViolations.length,
    violationContaminants: Array.from(contaminantSet),
  };
}
