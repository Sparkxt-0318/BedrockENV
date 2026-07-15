# Geocoding — Census Bureau + Mapbox (Fallback)

## What it covers
Address → latitude/longitude + census geography (FIPS state, FIPS county, census tract, census block group). Bedrock uses a two-stage geocoding pipeline: (1) Census Bureau Geocoder (primary, free), (2) Mapbox Geocoding API (fallback when Census fails).

Census geocoder also returns the FIPS state + county codes needed to look up the water system (PWSID) and nonattainment status.

## What it doesn't cover
- PO Boxes (no coordinates)
- Rural route addresses without a street number
- International addresses

## Sources
1. Census Bureau Geocoder: `https://geocoding.geo.census.gov/geocoder/locations/address`
2. Mapbox Geocoding API: `https://api.mapbox.com/geocoding/v5/mapbox.places/`. Requires `NEXT_PUBLIC_MAPBOX_TOKEN`.

## Refresh cadence
Live APIs. Census geocoder is updated quarterly. Mapbox is continuously updated from HERE, OpenStreetMap, and proprietary sources.

## Known limitations
- The Census geocoder fails for ~5–10% of valid US addresses, particularly in rural areas, new construction, and address formats that don't match TIGER road network records.
- Mapbox fallback improves coverage but does not return census geography (FIPS codes) — a secondary Census tract API call is required to get FIPS from coordinates.
- Dissolved towns (Picher, OK) have no current Census geocoder record — the address geocodes fail entirely, preventing any assessment.
- Military bases, tribal lands, and rural routes frequently fail both geocoders.
- Mapbox token is required for the fallback; if `NEXT_PUBLIC_MAPBOX_TOKEN` is not set, the pipeline has no fallback and some addresses will fail to resolve.
