import { describe, it, expect } from 'vitest';
import { extractCityHint, extractZipHint } from '@/lib/data-sources/geocoding';
import type { GeocodedAddress } from '@/types/exposure';

function makeGeocodedAddress(normalized: string, source: 'census' | 'mapbox' = 'census'): GeocodedAddress {
  return {
    raw: normalized,
    normalized,
    latitude: 0,
    longitude: 0,
    fipsState: '',
    fipsCounty: '',
    censusTract: '',
    censusBlockGroup: '',
    source,
  };
}

describe('extractCityHint', () => {
  it('extracts city from Census format "street, city, state, zip"', () => {
    const g = makeGeocodedAddress('1000 OCEAN DR, MIAMI BEACH, FL, 33139');
    expect(extractCityHint(g)).toBe('MIAMI BEACH');
  });

  it('extracts city from Census format "street, city, state zip"', () => {
    const g = makeGeocodedAddress('1600 PENNSYLVANIA AVE NW, WASHINGTON, DC 20500');
    expect(extractCityHint(g)).toBe('WASHINGTON');
  });

  it('strips trailing "United States" before extracting city', () => {
    const g = makeGeocodedAddress('Water Street, Hoosick Falls, New York 12090, United States');
    expect(extractCityHint(g)).toBe('Hoosick Falls');
  });

  it('strips trailing "US" before extracting city', () => {
    const g = makeGeocodedAddress('Main St, Newark, NJ 07105, US');
    expect(extractCityHint(g)).toBe('Newark');
  });

  it('extracts city from Mapbox short format "City, State Zip"', () => {
    const g = makeGeocodedAddress('Newark, New Jersey 07105');
    expect(extractCityHint(g)).toBe('Newark');
  });

  it('returns null when first part of 2-part address starts with a digit (street number)', () => {
    const g = makeGeocodedAddress('123 Main, New Jersey');
    // First part "123 Main" starts with digit → null
    expect(extractCityHint(g)).toBeNull();
  });

  it('strips digits from city candidate (removes zip embedded in city name)', () => {
    // Census format where city field contains stray digits
    const g = makeGeocodedAddress('100 ELM ST, GARY 46402, IN, 46402');
    // parts[1] = "GARY 46402", strip digits → "GARY "
    const result = extractCityHint(g);
    expect(result).toBe('GARY');
  });

  it('falls back to raw when normalized is missing', () => {
    const g: GeocodedAddress = {
      raw: '456 Oak Ave, Flint, MI 48503',
      normalized: '',
      latitude: 0,
      longitude: 0,
      fipsState: '',
      fipsCounty: '',
      censusTract: '',
      censusBlockGroup: '',
      source: 'census',
    };
    // normalized is empty string — falls back to raw
    const result = extractCityHint(g);
    expect(result).toBe('Flint');
  });
});

describe('extractZipHint', () => {
  it('extracts 5-digit ZIP from normalized address', () => {
    const g = makeGeocodedAddress('1000 OCEAN DR, MIAMI BEACH, FL, 33139');
    expect(extractZipHint(g)).toBe('33139');
  });

  it('extracts ZIP from "State ZIP" portion (Mapbox format)', () => {
    const g = makeGeocodedAddress('Newark, New Jersey 07105, United States');
    expect(extractZipHint(g)).toBe('07105');
  });

  it('extracts first 5 digits from ZIP+4 "12345-6789"', () => {
    const g = makeGeocodedAddress('100 Main St, Anytown, NY 12345-6789');
    expect(extractZipHint(g)).toBe('12345');
  });

  it('returns null when no ZIP code is present', () => {
    const g = makeGeocodedAddress('Some Place, Somewhere');
    expect(extractZipHint(g)).toBeNull();
  });

  it('uses raw when normalized is empty', () => {
    const g: GeocodedAddress = {
      raw: '800 N Michigan Ave, Chicago, IL 60611',
      normalized: '',
      latitude: 0,
      longitude: 0,
      fipsState: '',
      fipsCounty: '',
      censusTract: '',
      censusBlockGroup: '',
      source: 'census',
    };
    expect(extractZipHint(g)).toBe('60611');
  });
});
