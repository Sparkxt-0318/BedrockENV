import { SsurgoData, SoilComponent, SoilHorizon } from '@/types/exposure';
import { SdaRow, SURFACE_DEPTH_CM } from './usda-ssurgo-types';

export function aggregateRows(rows: SdaRow[]): SsurgoData {
  let mapUnitName = '';
  let mapUnitKey = '';

  interface CompAccumulator {
    name: string;
    percentage: number;
    compkind: string;
    drainage: string;
    hydgrp: string;
    horizons: SoilHorizon[];
    surfaceHorizons: Array<{ horizon: SoilHorizon; weightCm: number }>;
  }
  const compMap = new Map<string, CompAccumulator>();

  for (const row of rows) {
    mapUnitName = (row.muname as string) || mapUnitName;
    mapUnitKey = (row.mukey as string) || mapUnitKey;

    const compname = (row.compname as string) || 'Unknown';
    const compPct = parseNum(row.comppct_r);
    const compkind = (row.compkind as string) || '';
    const compKey = `${compname}|${compPct}|${compkind}`;

    let acc = compMap.get(compKey);
    if (!acc) {
      acc = {
        name: compname,
        percentage: compPct,
        compkind,
        drainage: (row.drainagecl as string) || '',
        hydgrp: (row.hydgrp as string) || '',
        horizons: [],
        surfaceHorizons: [],
      };
      compMap.set(compKey, acc);
    }

    if (row.hzname == null && row.hzdept_r == null && row.hzdepb_r == null) {
      continue;
    }

    const horizon: SoilHorizon = {
      name: (row.hzname as string) || '',
      sand: parseNum(row.sandtotal_r),
      silt: parseNum(row.silttotal_r),
      clay: parseNum(row.claytotal_r),
      ph: parseNum(row.ph1to1h2o_r),
      organicMatter: parseNum(row.om_r),
      cec: parseNum(row.cec7_r),
      ksat: parseNum(row.ksat_r),
    };
    acc.horizons.push(horizon);

    const top = parseNum(row.hzdept_r);
    const bot = parseNum(row.hzdepb_r);
    if (bot > top) {
      const overlapTop = Math.max(top, 0);
      const overlapBot = Math.min(bot, SURFACE_DEPTH_CM);
      if (overlapBot > overlapTop) {
        acc.surfaceHorizons.push({ horizon, weightCm: overlapBot - overlapTop });
      }
    }
  }

  const validComps = Array.from(compMap.values()).filter(
    (c) =>
      c.percentage > 0 &&
      !c.compkind.toLowerCase().includes('miscellaneous')
  );

  const totalCompWeight = validComps.reduce((s, c) => s + c.percentage, 0);

  let phMin = Number.POSITIVE_INFINITY;
  let phMax = Number.NEGATIVE_INFINITY;
  let omSum = 0;
  let cecSum = 0;
  let ksatSum = 0;
  let sandSum = 0;
  let siltSum = 0;
  let claySum = 0;
  let componentWeightContributing = 0;

  for (const comp of validComps) {
    const surface = comp.surfaceHorizons.filter(
      (s) =>
        s.horizon.ph > 0 ||
        s.horizon.organicMatter > 0 ||
        s.horizon.sand > 0 ||
        s.horizon.silt > 0 ||
        s.horizon.clay > 0
    );
    if (surface.length === 0) continue;

    const totalThickness = surface.reduce((s, h) => s + h.weightCm, 0);
    if (totalThickness <= 0) continue;

    const wAvg = (fn: (h: SoilHorizon) => number): number => {
      let num = 0;
      let den = 0;
      for (const { horizon, weightCm } of surface) {
        const v = fn(horizon);
        if (v > 0) {
          num += v * weightCm;
          den += weightCm;
        }
      }
      return den > 0 ? num / den : 0;
    };

    const compPh = wAvg((h) => h.ph);
    const compOm = wAvg((h) => h.organicMatter);
    const compCec = wAvg((h) => h.cec);
    const compKsat = wAvg((h) => h.ksat);
    const compSand = wAvg((h) => h.sand);
    const compSilt = wAvg((h) => h.silt);
    const compClay = wAvg((h) => h.clay);

    const w = comp.percentage;
    componentWeightContributing += w;

    if (compPh > 0) {
      phMin = Math.min(phMin, compPh);
      phMax = Math.max(phMax, compPh);
    }
    omSum += compOm * w;
    cecSum += compCec * w;
    ksatSum += compKsat * w;
    sandSum += compSand * w;
    siltSum += compSilt * w;
    claySum += compClay * w;
  }

  const components: SoilComponent[] = validComps.map((c) => ({
    name: c.name,
    percentage: c.percentage,
    horizons: c.horizons,
  }));

  const dominantComp = validComps[0];
  const drainageClass = dominantComp?.drainage || 'Unknown';
  const hydrologicSoilGroup = dominantComp?.hydgrp || null;

  const div = componentWeightContributing > 0 ? componentWeightContributing : 1;
  const avgOm = omSum / div;
  const avgCec = cecSum / div;
  const avgKsat = ksatSum / div;
  const avgSand = sandSum / div;
  const avgSilt = siltSum / div;
  const avgClay = claySum / div;

  const dominantTexture =
    componentWeightContributing > 0
      ? classifyTexture(avgSand, avgSilt, avgClay)
      : 'Unknown';

  const phRange: [number, number] =
    phMin <= phMax && Number.isFinite(phMin) && Number.isFinite(phMax)
      ? [round1(phMin), round1(phMax)]
      : [0, 0];

  const coverage: SsurgoData['coverage'] =
    validComps.length === 0
      ? 'partial'
      : componentWeightContributing > 0 && totalCompWeight > 0
        ? 'mapped'
        : 'partial';

  return {
    mapUnitName,
    mapUnitKey,
    components,
    dominantTexture,
    phRange,
    organicMatterPct: round1(avgOm),
    drainageClass,
    hydrologicSoilGroup,
    sandPct: round1(avgSand),
    clayPct: round1(avgClay),
    cec: round1(avgCec),
    ksat: round1(avgKsat),
    coverage,
  };
}

export function unmappedPlaceholder(): SsurgoData {
  return {
    mapUnitName: '',
    mapUnitKey: '',
    components: [],
    dominantTexture: 'Unknown',
    phRange: [0, 0],
    organicMatterPct: 0,
    drainageClass: 'Unknown',
    hydrologicSoilGroup: null,
    sandPct: 0,
    clayPct: 0,
    cec: 0,
    ksat: 0,
    coverage: 'unmapped',
  };
}

export function parseNum(val: unknown): number {
  if (val === null || val === undefined || val === '') return 0;
  const n = typeof val === 'number' ? val : parseFloat(String(val));
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * Simplified USDA soil texture classification from sand/silt/clay percentages.
 * The real USDA textural triangle has 12 classes; this is a coarse bucket.
 */
export function classifyTexture(sand: number, silt: number, clay: number): string {
  if (sand + silt + clay < 50) return 'Unknown';
  if (clay >= 40) return 'Clay';
  if (sand >= 85) return 'Sand';
  if (silt >= 80) return 'Silt';
  if (clay >= 27 && sand >= 20 && sand <= 45) return 'Clay loam';
  if (clay >= 27 && sand < 20) return 'Silty clay loam';
  if (clay >= 20 && clay < 35 && silt < 28 && sand > 45) return 'Sandy clay loam';
  if (clay < 27 && silt >= 50) return 'Silt loam';
  if (sand >= 43 && sand <= 85 && clay < 20) return 'Sandy loam';
  return 'Loam';
}
