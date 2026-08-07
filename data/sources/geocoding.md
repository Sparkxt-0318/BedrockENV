# Census Bureau Geocoder + Mapbox Geocoding API

## What it covers
Address-to-coordinates resolution (geocoding) and coordinate-to-census-geography enrichment (census tract, block group, county FIPS, state FIPS). This is the foundational step for all data source queries — every layer depends on accurate geocoding output.

**Primary**: Census Bureau Geocoder (`https://geocoding.geo.census.gov/geocoder/`) — free, no API key, returns lat/lng, normalized address, census tract, block group, county/state FIPS.

**Fallback**: Mapbox Geocoding API (`https://api.mapbox.com/geocoding/v5/mapbox.places/`) — requires `NEXT_PUBLIC_MAPBOX_TOKEN`. Returns lat/lng and normalized address but NOT census tract/block group/county FIPS. These are filled via a second Census coordinate-based lookup.

**Secondary enrichment**: When Mapbox is used, a coordinate-based Census geocoder call fills in tract + block group FIPS. If that fails, FCC Census API (`https://geo.fcc.gov/api/census/block/find`) fills county FIPS as a final fallback.

## What it doesn't cover
- Addresses outside the US
- PO boxes (not geocodable to a coordinate)
- Ambiguous addresses with multiple matches (returns the first match)

## Refresh cadence
Not a data source with cadence — this is a live API dependency. Census Geocoder is continuously available (free, public). Mapbox requires a valid token.

**Live API**: `lib/data-sources/geocoding.ts`
**Timeout**: 8 seconds per attempt.

## Known limitations
1. **Dissolved municipalities**: Picher, OK was dissolved in 2009. Census Geocoder returns null for this address. No fallback covers dissolved towns — this is a hard limitation.
2. **Military base addresses**: Base addresses (e.g., "1 Camp Lejeune Drive") often fail Census geocoding; Mapbox may return coordinates but Census enrichment fails → no census tract/block group → EJScreen and lead risk are unavailable.
3. **Coverage: 61.5% statement coverage in tests** (as of 2026-08-07): The enrichment branches (FCC fallback, Mapbox coordinate enrichment) have low test coverage. See `tests/unit/data-sources/geocoding.test.ts`.
4. **PWSID resolution**: Address → PWSID resolution (`lookupWaterSystem`) is a 3-step chain (geocode → county FIPS → SDWIS lookup). Any break in this chain means no UCMR 5 or SDWIS data.

## Scoring integration
Not a scored layer — geocoding is infrastructure. Geocoding failure causes all layer scores to return 0 or coverage=`unmapped`. It is the highest single point of failure in the assessment pipeline.
