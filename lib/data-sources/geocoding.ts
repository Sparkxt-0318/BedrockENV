import { GeocodedAddress } from '@/types/exposure';
import { fetchWithRetry } from './types';

/**
 * Geocode a U.S. address using the Census Bureau Geocoder API (free, no key).
 * Falls back to Mapbox if Census fails and NEXT_PUBLIC_MAPBOX_TOKEN is set.
 * Returns lat/lng, FIPS codes, census tract, and block group.
 */
export async function geocodeAddress(address: string): Promise<GeocodedAddress | null> {
  // Try Census Bureau first (free, no key required)
  const censusResult = await geocodeWithCensus(address);
  if (censusResult) return censusResult;

  // Fallback to Mapbox if token is available
  const mapboxResult = await geocodeWithMapbox(address);
  if (mapboxResult) {
    console.info('Geocoded via Mapbox fallback for:', address);
    return mapboxResult;
  }

  return null;
}

/**
 * Primary geocoder: Census Bureau Geocoder API (free, no key).
 */
async function geocodeWithCensus(address: string): Promise<GeocodedAddress | null> {
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
      console.warn('No Census geocoding matches for:', address);
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
    console.error('Census geocoding error:', err);
    return null;
  }
}

/**
 * Fallback geocoder: Mapbox Geocoding API.
 * Requires NEXT_PUBLIC_MAPBOX_TOKEN. Returns coordinates with FIPS derived
 * from Mapbox context. Census tract/block group unavailable via Mapbox.
 */
async function geocodeWithMapbox(address: string): Promise<GeocodedAddress | null> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) return null;

  const encoded = encodeURIComponent(address);
  const url = `https://api.mapbox.com/search/geocode/v6/forward?q=${encoded}&country=us&limit=1&access_token=${token}`;

  try {
    const response = await fetchWithRetry(url, { timeoutMs: 15_000, retries: 1 });
    if (!response.ok) {
      console.error(`Mapbox geocoder HTTP ${response.status}`);
      return null;
    }

    const data = await response.json();
    const features = data?.features;
    if (!features || features.length === 0) {
      console.warn('No Mapbox geocoding matches for:', address);
      return null;
    }

    const feature = features[0];
    const [lng, lat] = feature.geometry.coordinates;
    const props = feature.properties;
    const context = props?.context || {};

    // Extract FIPS from Mapbox context
    // Mapbox provides region (state) and district (county) context objects
    const regionCode = context?.region?.region_code || '';
    const fipsState = STATE_ABBREV_TO_FIPS[regionCode] || '';
    const fipsCounty = context?.district?.id
      ? String(context.district.id).replace(/^district\./, '').slice(-3)
      : '';

    return {
      raw: address,
      normalized: props?.full_address || props?.name || address,
      latitude: lat,
      longitude: lng,
      fipsState,
      fipsCounty,
      censusTract: '', // Not available from Mapbox
      censusBlockGroup: '', // Not available from Mapbox
    };
  } catch (err) {
    console.error('Mapbox geocoding error:', err);
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

/**
 * Reverse mapping: state abbreviation to FIPS code (used by Mapbox fallback).
 */
const STATE_ABBREV_TO_FIPS: Record<string, string> = Object.fromEntries(
  Object.entries(FIPS_TO_STATE).map(([fips, abbrev]) => [abbrev, fips])
);
