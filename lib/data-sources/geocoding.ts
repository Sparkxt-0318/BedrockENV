import { GeocodedAddress } from '@/types/exposure';
import { fetchWithRetry } from './types';
import { FIPS_TO_STATE, STATE_ABBREV_TO_FIPS } from './fips';
import { lookupWaterSystem } from './epa-sdwis';

// Re-export so existing callers (index.ts, tests) don't need to change imports.
export { FIPS_TO_STATE, lookupWaterSystem };

/**
 * Geocode a U.S. address using the Census Bureau Geocoder API (free, no key).
 * Falls back to Mapbox if Census fails and NEXT_PUBLIC_MAPBOX_TOKEN is set.
 * Returns lat/lng, FIPS codes, census tract, block group, and geocoding source.
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
 * Returns source: 'census' on success.
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

    // Extract census geography — some addresses lack tract data
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
      source: 'census',
    };
  } catch (err) {
    console.error('Census geocoding error:', err);
    return null;
  }
}

/**
 * Fallback geocoder: Mapbox Geocoding API v6.
 * Requires NEXT_PUBLIC_MAPBOX_TOKEN.
 *
 * Returns source: 'mapbox'. Census tract / block group are not available
 * via Mapbox — those fields are set to empty strings.
 *
 * County FIPS (fipsCounty) is also unavailable; Mapbox returns an opaque
 * internal district ID, not a FIPS code. Set to empty string.
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

    // Mapbox region_code can be "US-CA" or just "CA" — normalize to abbreviation
    const rawRegionCode: string = context?.region?.region_code || '';
    const abbrev = rawRegionCode.includes('-')
      ? rawRegionCode.split('-').pop()!.toUpperCase()
      : rawRegionCode.toUpperCase();
    const fipsState = STATE_ABBREV_TO_FIPS[abbrev] || '';

    // County FIPS not reliably available from Mapbox context IDs
    const fipsCounty = '';

    return {
      raw: address,
      normalized: props?.full_address || props?.name || address,
      latitude: lat,
      longitude: lng,
      fipsState,
      fipsCounty,
      censusTract: '',
      censusBlockGroup: '',
      source: 'mapbox',
    };
  } catch (err) {
    console.error('Mapbox geocoding error:', err);
    return null;
  }
}

