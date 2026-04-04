import { GeocodedAddress } from '@/types/exposure';
import { fetchWithRetry } from './types';

/**
 * Geocode a U.S. address using the Census Bureau Geocoder API (free, no key).
 * Returns lat/lng, FIPS codes, census tract, and block group.
 */
export async function geocodeAddress(address: string): Promise<GeocodedAddress | null> {
  const encoded = encodeURIComponent(address);
  const url = `https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress?address=${encoded}&benchmark=Public_AR_Current&vintage=Current_Current&format=json`;

  try {
    const response = await fetchWithRetry(url, { timeoutMs: 20_000, retries: 2 });
    if (!response.ok) {
      console.error(`Census geocoder HTTP ${response.status}`);
      return null;
    }

    const data = await response.json();
    const matches = data?.result?.addressMatches;
    if (!matches || matches.length === 0) {
      console.warn('No geocoding matches for:', address);
      return null;
    }

    const match = matches[0];
    const coords = match.coordinates;
    const geo = match.geographies;

    // Extract census geography
    const censusTract = geo?.['Census Tracts']?.[0];
    const countyData = geo?.['Counties']?.[0];

    const fipsState = censusTract?.STATE || countyData?.STATE || '';
    const fipsCounty = censusTract?.COUNTY || countyData?.COUNTY || '';
    const tract = censusTract?.TRACT || '';
    const blockGroup = censusTract?.BLKGRP || '';

    return {
      raw: address,
      normalized: match.matchedAddress || address,
      latitude: coords.y,
      longitude: coords.x,
      fipsState,
      fipsCounty,
      censusTract: tract,
      censusBlockGroup: blockGroup,
    };
  } catch (err) {
    console.error('Geocoding error:', err);
    return null;
  }
}

/**
 * Look up the serving public water system (PWSID) for a given location.
 * Uses EPA SDWIS data via Envirofacts to find the nearest water system.
 */
export async function lookupWaterSystem(
  fipsState: string,
  fipsCounty: string
): Promise<{ pwsid: string; name: string } | null> {
  // Query EPA SDWIS for water systems serving this county
  // State code in SDWIS is the 2-letter abbreviation; we have FIPS.
  // We'll use the EPA Envirofacts WATER_SYSTEM table filtered by state + county FIPS.
  const url = `https://data.epa.gov/efservice/WATER_SYSTEM/STATE_CODE/${fipsState}/COUNTY_SERVED/${fipsCounty}/ROWS/0:5/JSON`;

  try {
    const response = await fetchWithRetry(url, { timeoutMs: 15_000 });
    if (!response.ok) {
      console.error(`SDWIS water system lookup HTTP ${response.status}`);
      return null;
    }

    const systems = await response.json();
    if (!Array.isArray(systems) || systems.length === 0) {
      return null;
    }

    // Prefer community water systems (CWS) over others
    const cws = systems.find(
      (s: Record<string, string>) => s.PWS_TYPE_CODE === 'CWS'
    );
    const system = cws || systems[0];

    return {
      pwsid: system.PWSID || '',
      name: system.PWS_NAME || 'Unknown Water System',
    };
  } catch (err) {
    console.error('Water system lookup error:', err);
    return null;
  }
}

/**
 * FIPS state code (2-digit) to state abbreviation mapping.
 * Used because Census returns FIPS but some EPA APIs need abbreviations.
 */
export const FIPS_TO_STATE: Record<string, string> = {
  '01': 'AL', '02': 'AK', '04': 'AZ', '05': 'AR', '06': 'CA',
  '08': 'CO', '09': 'CT', '10': 'DE', '11': 'DC', '12': 'FL',
  '13': 'GA', '15': 'HI', '16': 'ID', '17': 'IL', '18': 'IN',
  '19': 'IA', '20': 'KS', '21': 'KY', '22': 'LA', '23': 'ME',
  '24': 'MD', '25': 'MA', '26': 'MI', '27': 'MN', '28': 'MS',
  '29': 'MO', '30': 'MT', '31': 'NE', '32': 'NV', '33': 'NH',
  '34': 'NJ', '35': 'NM', '36': 'NY', '37': 'NC', '38': 'ND',
  '39': 'OH', '40': 'OK', '41': 'OR', '42': 'PA', '44': 'RI',
  '45': 'SC', '46': 'SD', '47': 'TN', '48': 'TX', '49': 'UT',
  '50': 'VT', '51': 'VA', '53': 'WA', '54': 'WV', '55': 'WI',
  '56': 'WY',
};
