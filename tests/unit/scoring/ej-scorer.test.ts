import { describe, it, expect } from 'vitest';
import { scoreEjLayer } from '@/lib/scoring/ej-scorer';
import { EjLayerData, EjScreenIndices, SviIndices } from '@/types/exposure';

function makeEjScreen(ejIndex: number, demographicIndex: number): EjScreenIndices {
  return {
    ejIndex,
    ejIndexSupplemental: ejIndex - 5,
    demographicIndex,
    pm25Pctile: 50,
    ozonePctile: 40,
    trafficPctile: 55,
    leadPaintPctile: 45,
    superfundPctile: 30,
    hazWastePctile: 40,
    minorityPct: 45,
    lowIncomePct: 30,
    linguisticIsolationPct: 5,
    lessHsEducationPct: 12,
    blockGroup: '340130001001',
  };
}

function makeSvi(overall: number): SviIndices {
  return {
    overallSvi: overall,
    socioeconomicSvi: overall * 0.9,
    householdSvi: overall * 0.8,
    minoritySvi: overall * 1.1,
    housingSvi: overall * 0.7,
    tractFips: '34013000100',
    totalPopulation: 4000,
  };
}

describe('scoreEjLayer', () => {
  it('scores low-burden area near zero', () => {
    const data: EjLayerData = {
      ejscreen: makeEjScreen(15, 20),
      svi: makeSvi(0.15),
    };

    const result = scoreEjLayer(data);

    expect(result.available).toBe(true);
    expect(result.score).toBeLessThan(15);
    expect(result.confidence).toBe('property');
    expect(result.coverage).toBeGreaterThan(0.9);
  });

  it('scores high-burden area high', () => {
    const data: EjLayerData = {
      ejscreen: makeEjScreen(92, 88),
      svi: makeSvi(0.90),
    };

    const result = scoreEjLayer(data);

    expect(result.available).toBe(true);
    expect(result.score).toBeGreaterThan(80);
    expect(result.confidence).toBe('property');
  });

  it('scores moderate burden mid-range', () => {
    const data: EjLayerData = {
      ejscreen: makeEjScreen(55, 60),
      svi: makeSvi(0.50),
    };

    const result = scoreEjLayer(data);

    expect(result.available).toBe(true);
    expect(result.score).toBeGreaterThan(25);
    expect(result.score).toBeLessThan(55);
  });

  it('works with only EJScreen data', () => {
    const data: EjLayerData = {
      ejscreen: makeEjScreen(75, 70),
      svi: null,
    };

    const result = scoreEjLayer(data);

    expect(result.available).toBe(true);
    expect(result.score).toBeGreaterThan(40);
    expect(result.confidence).toBe('neighborhood');
  });

  it('works with only SVI data', () => {
    const data: EjLayerData = {
      ejscreen: null,
      svi: makeSvi(0.80),
    };

    const result = scoreEjLayer(data);

    expect(result.available).toBe(true);
    expect(result.score).toBeGreaterThan(50);
    expect(result.confidence).toBe('neighborhood');
  });

  it('returns unavailable when both sources fail', () => {
    const data: EjLayerData = {
      ejscreen: null,
      svi: null,
    };

    const result = scoreEjLayer(data);

    expect(result.available).toBe(false);
    expect(result.score).toBe(0);
    expect(result.coverage).toBe(0);
  });

  it('higher EJ index produces higher score', () => {
    const low: EjLayerData = {
      ejscreen: makeEjScreen(30, 35),
      svi: makeSvi(0.30),
    };
    const high: EjLayerData = {
      ejscreen: makeEjScreen(85, 80),
      svi: makeSvi(0.85),
    };

    const lowResult = scoreEjLayer(low);
    const highResult = scoreEjLayer(high);

    expect(highResult.score).toBeGreaterThan(lowResult.score);
  });

  it('includes rawData with indices', () => {
    const data: EjLayerData = {
      ejscreen: makeEjScreen(72, 65),
      svi: makeSvi(0.68),
    };

    const result = scoreEjLayer(data);

    expect(result.rawData.ejIndex).toBe(72);
    expect(result.rawData.demographicIndex).toBe(65);
    expect(result.rawData.sviOverall).toBe(0.68);
    expect(result.rawData.coverageBreakdown).toHaveLength(3);
  });
});
