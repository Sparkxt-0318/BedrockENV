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

    // Mapbox doesn't provide county FIPS. Use the FCC Census API to fill
    // in county FIPS from lat/lng so downstream water system lookup works.
    if (!mapboxResult.fipsCounty && mapboxResult.latitude && mapboxResult.longitude) {
      const fcc = await enrichWithFccCensus(mapboxResult.latitude, mapboxResult.longitude);
      if (fcc) {
        if (fcc.fipsCounty) mapboxResult.fipsCounty = fcc.fipsCounty;
        if (fcc.fipsState && !mapboxResult.fipsState) mapboxResult.fipsState = fcc.fipsState;
      }
    }

    return mapboxResult;
  }

  return null;
}

/**
 * Extract a city name from a geocoded address for PWSID lookup.
 *
 * Supports two address formats:
 *   Census: "1000 OCEAN DR, MIAMI BEACH, FL, 33139"
 *   Mapbox: "Newark, New Jersey 07105, United States"
 *           "Water Street, Hoosick Falls, New York 12090, United States"
 */
export function extractCityHint(geocoded: GeocodedAddress): string | null {
  const normalized = geocoded.normalized || geocoded.raw;
  const parts = normalized.split(',').map((p) => p.trim());

  // Drop trailing "United States" / "US" if present
  if (parts.length > 2) {
    const last = parts[parts.length - 1].toUpperCase();
    if (last === 'UNITED STATES' || last === 'US' || last === 'USA') {
      parts.pop();
    }
  }

  if (parts.length >= 3) {
    // Census format: "street, city, state, zip" or "street, city, state zip"
    // City is second element (index 1)
    const candidate = parts[1].replace(/\d+/g, '').trim();
    if (candidate) return candidate;
  }

  if (parts.length === 2) {
    // Mapbox short format: "City, State Zip" — take the first part
    // Only if it doesn't start with a digit (street number)
    const candidate = parts[0].replace(/\d+/g, '').trim();
    if (candidate && !/^\d/.test(parts[0])) return candidate;
  }

  return null;
}

/**
 * Extract a ZIP code from a geocoded address for PWSID lookup.
 * Looks for a 5-digit number in the normalized address.
 */
export function extractZipHint(geocoded: GeocodedAddress): string | null {
  const text = geocoded.normalized || geocoded.raw;
  const match = text.match(/\b(\d{5})(?:-\d{4})?\b/);
  return match ? match[1] : null;
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

    // Extract census geography — some addresses lack tract data.
    // BLKGRP lives on the "2020 Census Blocks" layer, not "Census Tracts".
    const censusTract = geo?.['Census Tracts']?.[0];
    const censusBlock = geo?.['2020 Census Blocks']?.[0];
    const countyData = geo?.['Counties']?.[0];

    const fipsState = censusTract?.STATE || censusBlock?.STATE || countyData?.STATE || '';
    const fipsCounty = censusTract?.COUNTY || censusBlock?.COUNTY || countyData?.COUNTY || '';
    const tract = censusTract?.TRACT || censusBlock?.TRACT || '';
    const blockGroup = censusBlock?.BLKGRP || '';

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
 * County FIPS is enriched post-hoc via `enrichWithFccCensus()`.
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

    // County FIPS not reliably available from Mapbox — enriched post-hoc
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

/**
 * FCC Census Block API — converts lat/lng to county FIPS.
 *
 * This is a free, no-auth API run by the FCC. The response includes
 * state and county FIPS codes, which Mapbox doesn't provide.
 *
 * URL: https://geo.fcc.gov/api/census/area?lat={lat}&lon={lon}&format=json
 *
 * Non-fatal: returns null if the API fails or returns unexpected data.
 */
async function enrichWithFccCensus(
  lat: number,
  lng: number
): Promise<{ fipsState: string; fipsCounty: string } | null> {
  const url = `https://geo.fcc.gov/api/census/area?lat=${lat}&lon=${lng}&format=json`;

  try {
    const response = await fetchWithRetry(url, { timeoutMs: 8_000, retries: 1 });
    if (!response.ok) return null;

    const data = await response.json();
    const results = data?.results;
    if (!Array.isArray(results) || results.length === 0) return null;

    const block = results[0];
    const fips: string = block?.county_fips || '';

    if (fips.length >= 5) {
      return {
        fipsState: fips.substring(0, 2),
        fipsCounty: fips.substring(2, 5),
      };
    }

    return null;
  } catch {
    // Non-fatal — county FIPS enrichment is best-effort
    return null;
  }
}
