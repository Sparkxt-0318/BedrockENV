import { NextRequest, NextResponse } from 'next/server';
import { geocodeAddress, lookupWaterSystem } from '@/lib/data-sources/geocoding';

/**
 * GET /api/geocode?address=...
 *
 * Geocodes a U.S. address and returns lat/lng, FIPS codes,
 * census geography, and serving water system.
 */
export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get('address');

  if (!address || address.trim().length < 5) {
    return NextResponse.json(
      { error: 'Please provide a valid U.S. address.' },
      { status: 400 }
    );
  }

  const geocoded = await geocodeAddress(address);

  if (!geocoded) {
    return NextResponse.json(
      { error: 'Could not geocode this address. Please check the address and try again.' },
      { status: 404 }
    );
  }

  // Look up water system
  const waterSystem = await lookupWaterSystem(
    geocoded.fipsState,
    geocoded.fipsCounty
  );

  if (waterSystem) {
    geocoded.waterSystemId = waterSystem.pwsid;
    geocoded.waterSystemName = waterSystem.name;
  }

  return NextResponse.json({ data: geocoded });
}
