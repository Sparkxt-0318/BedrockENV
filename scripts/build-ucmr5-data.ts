/**
 * Pre-process the EPA UCMR 5 occurrence dataset into a compact
 * PWSID → PFAS-analytes JSON bundle used by the live app.
 *
 * EPA does NOT expose UCMR 5 results via the Envirofacts REST API.
 * The only authoritative source is the quarterly ZIP on
 *   https://www.epa.gov/dwucmr/occurrence-data-unregulated-contaminant-monitoring-rule
 *
 * Usage:
 *   pnpm tsx scripts/build-ucmr5-data.ts \
 *     [path/to/UCMR5_All.txt] [--release-date YYYY-MM-DD]
 *
 * If no path is given the script looks for the tab-delimited dump at
 * /tmp/ucmr5_work/UCMR5_All.txt (the location used when bootstrapping).
 *
 * The release date is captured from the source ZIP's `Last-Modified` HTTP
 * header (HEAD request) so the runtime client can warn when the bundle is
 * more than one EPA quarterly cycle stale. Pass `--release-date` to override
 * when the HEAD request is unavailable.
 *
 * Output: data/ucmr5-by-pwsid.json
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const SOURCE_ZIP_URL =
  'https://www.epa.gov/system/files/other-files/2023-08/ucmr5-occurrence-data.zip';

// Only PFAS analytes are scored — lithium is a separate UCMR 5 contaminant
// that we do not yet surface.
const PFAS_ANALYTES = new Set([
  'PFOA', 'PFOS', 'PFHxS', 'PFNA', 'PFBS', 'HFPO-DA',
  'PFBA', 'PFDA', 'PFDoA', 'PFHpA', 'PFHpS', 'PFHxA',
  'PFMBA', 'PFMPA', 'PFPeA', 'PFPeS', 'PFUnA',
  'ADONA', '9Cl-PF3ONS', '11Cl-PF3OUdS',
  'NEtFOSAA', 'NMeFOSAA', 'NFDHA',
  '4:2 FTS', '6:2 FTS', '8:2 FTS',
]);

// EPA final MCLs (April 2024, 89 FR 32532) — values in ppt (ng/L).
const PFAS_MCLS: Record<string, number> = {
  PFOA: 4,
  PFOS: 4,
  PFHxS: 10,
  PFNA: 10,
  'HFPO-DA': 10,
};

interface AnalyteAgg {
  name: string;
  maxConcentration: number; // ppt
  firstSampleDate: string;
  lastSampleDate: string;
  sampleCount: number;
}

interface PwsAgg {
  systemName: string;
  state: string;
  size: string;
  analytes: Map<string, AnalyteAgg>;
}

interface BundleAnalyte {
  name: string;
  concentration: number;
  mcl: number;
  exceedsMcl: boolean;
}

interface BundleEntry {
  systemName: string;
  state: string;
  size: string;
  analytes: BundleAnalyte[];
  maxIndividual: number;
  totalPfas: number;
  exceedsMcl: boolean;
  firstSampleDate: string;
  lastSampleDate: string;
}

interface Bundle {
  generatedAt: string;
  /** ISO date (YYYY-MM-DD) the EPA published the source ZIP. */
  epaReleaseDate: string;
  source: string;
  sourceUrl: string;
  rowCount: number;
  pwsidCount: number;
  systems: Record<string, BundleEntry>;
}

async function fetchEpaReleaseDate(): Promise<string | null> {
  try {
    const res = await fetch(SOURCE_ZIP_URL, {
      method: 'HEAD',
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    const lm = res.headers.get('last-modified');
    if (!lm) return null;
    const d = new Date(lm);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString().slice(0, 10);
  } catch {
    return null;
  }
}

// Convert "9/27/2023" → "2023-09-27" for lexical sortability.
function normalizeDate(raw: string): string {
  const m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return raw;
  const [, mo, d, y] = m;
  return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

// Convert μg/L → ppt (ng/L). 1 μg/L = 1000 ng/L.
function toPpt(value: number, units: string): number {
  const u = units.toLowerCase();
  if (u.includes('ng/l') || u.includes('ppt')) return value;
  // The UCMR5 file uses μg/L (may appear as "ug/L" or with a mis-encoded μ).
  return value * 1000;
}

function parse(path: string, epaReleaseDate: string): Bundle {
  console.log(`Reading ${path} …`);
  const txt = readFileSync(path, 'utf8');
  const lines = txt.split('\n');
  if (lines.length < 2) throw new Error('UCMR5 file is empty or malformed');

  const header = lines[0].split('\t');
  const idx = (col: string): number => {
    const i = header.indexOf(col);
    if (i === -1) throw new Error(`UCMR5 file missing required column: ${col}`);
    return i;
  };
  const iPwsid = idx('PWSID');
  const iPwsName = idx('PWSName');
  const iSize = idx('Size');
  const iState = idx('State');
  const iCollection = idx('CollectionDate');
  const iContaminant = idx('Contaminant');
  const iUnits = idx('Units');
  const iSign = idx('AnalyticalResultsSign');
  const iValue = idx('AnalyticalResultValue');

  const pwsMap = new Map<string, PwsAgg>();
  let totalRows = 0;
  let detectedRows = 0;

  for (let li = 1; li < lines.length; li++) {
    const row = lines[li];
    if (!row) continue;
    const cols = row.split('\t');
    totalRows++;

    const sign = cols[iSign];
    if (sign !== '=') continue; // skip non-detects
    const contaminant = cols[iContaminant];
    if (!PFAS_ANALYTES.has(contaminant)) continue;

    const rawValue = parseFloat(cols[iValue]);
    if (!Number.isFinite(rawValue) || rawValue <= 0) continue;
    const concentrationPpt = toPpt(rawValue, cols[iUnits]);

    const pwsid = cols[iPwsid];
    const date = normalizeDate(cols[iCollection]);

    let agg = pwsMap.get(pwsid);
    if (!agg) {
      agg = {
        systemName: cols[iPwsName],
        state: cols[iState],
        size: cols[iSize],
        analytes: new Map(),
      };
      pwsMap.set(pwsid, agg);
    }

    let a = agg.analytes.get(contaminant);
    if (!a) {
      a = {
        name: contaminant,
        maxConcentration: 0,
        firstSampleDate: date,
        lastSampleDate: date,
        sampleCount: 0,
      };
      agg.analytes.set(contaminant, a);
    }
    if (concentrationPpt > a.maxConcentration) a.maxConcentration = concentrationPpt;
    if (date < a.firstSampleDate) a.firstSampleDate = date;
    if (date > a.lastSampleDate) a.lastSampleDate = date;
    a.sampleCount++;
    detectedRows++;
  }

  console.log(
    `Parsed ${totalRows.toLocaleString()} rows, ${detectedRows.toLocaleString()} PFAS detections, ${pwsMap.size.toLocaleString()} unique PWSIDs.`
  );

  const systems: Record<string, BundleEntry> = {};
  for (const [pwsid, agg] of pwsMap) {
    const analytes: BundleAnalyte[] = [];
    let maxIndividual = 0;
    let totalPfas = 0;
    let exceedsMcl = false;
    let firstSampleDate = '';
    let lastSampleDate = '';

    for (const a of agg.analytes.values()) {
      const mcl = PFAS_MCLS[a.name] ?? 0;
      const exceeds = mcl > 0 && a.maxConcentration > mcl;
      if (exceeds) exceedsMcl = true;
      if (a.maxConcentration > maxIndividual) maxIndividual = a.maxConcentration;
      totalPfas += a.maxConcentration;
      if (!firstSampleDate || a.firstSampleDate < firstSampleDate) firstSampleDate = a.firstSampleDate;
      if (!lastSampleDate || a.lastSampleDate > lastSampleDate) lastSampleDate = a.lastSampleDate;
      analytes.push({
        name: a.name,
        concentration: Math.round(a.maxConcentration * 1000) / 1000,
        mcl,
        exceedsMcl: exceeds,
      });
    }
    analytes.sort((x, y) => y.concentration - x.concentration);

    systems[pwsid] = {
      systemName: agg.systemName,
      state: agg.state,
      size: agg.size,
      analytes,
      maxIndividual: Math.round(maxIndividual * 1000) / 1000,
      totalPfas: Math.round(totalPfas * 1000) / 1000,
      exceedsMcl,
      firstSampleDate,
      lastSampleDate,
    };
  }

  return {
    generatedAt: new Date().toISOString(),
    epaReleaseDate,
    source: 'EPA UCMR 5 Occurrence Data',
    sourceUrl: SOURCE_ZIP_URL,
    rowCount: detectedRows,
    pwsidCount: pwsMap.size,
    systems,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const releaseFlagIdx = args.indexOf('--release-date');
  const explicitReleaseDate =
    releaseFlagIdx !== -1 ? args[releaseFlagIdx + 1] : undefined;
  const positional = args.filter((a, i) => {
    if (a === '--release-date') return false;
    if (i > 0 && args[i - 1] === '--release-date') return false;
    return true;
  });

  const defaultPath = '/tmp/ucmr5_work/UCMR5_All.txt';
  const path = resolve(positional[0] ?? defaultPath);
  if (!existsSync(path)) {
    console.error(`UCMR5 source file not found: ${path}`);
    console.error(
      'Download the UCMR 5 zip from https://www.epa.gov/dwucmr/occurrence-data-unregulated-contaminant-monitoring-rule,'
    );
    console.error('unzip UCMR5_All.txt into /tmp/ucmr5_work/, then re-run.');
    process.exit(1);
  }

  let epaReleaseDate = explicitReleaseDate ?? '';
  if (!epaReleaseDate) {
    console.log(`HEAD ${SOURCE_ZIP_URL} for release date …`);
    const fetched = await fetchEpaReleaseDate();
    if (fetched) {
      epaReleaseDate = fetched;
      console.log(`EPA release date (from Last-Modified): ${epaReleaseDate}`);
    } else {
      epaReleaseDate = new Date().toISOString().slice(0, 10);
      console.warn(
        `Could not read EPA Last-Modified header. Falling back to today's date (${epaReleaseDate}).`
      );
      console.warn('Pass --release-date YYYY-MM-DD to override explicitly.');
    }
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(epaReleaseDate)) {
    console.error(`--release-date must be YYYY-MM-DD, got: ${epaReleaseDate}`);
    process.exit(1);
  }

  const bundle = parse(path, epaReleaseDate);
  const out = resolve(process.cwd(), 'data/ucmr5-by-pwsid.json');
  writeFileSync(out, JSON.stringify(bundle));
  console.log(
    `Wrote ${out} (${bundle.pwsidCount} systems, ${bundle.rowCount} detections, EPA release ${bundle.epaReleaseDate}).`
  );
}

main();
