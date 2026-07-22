# Geocoding — Census Bureau Geocoder + Mapbox Fallback

## What it covers
Address resolution to coordinates (lat/lng), FIPS codes (state, county, census tract, block group), and water system identification (PWSID). Bedrock uses a two-step fallback:

1. **Primary: Census Bureau Geocoder** (https://geocoding.geo.census.gov) — free, no key required. Returns coordinates, census tract FIPS, block group FIPS, county FIPS, and state FIPS for successfully matched addresses.

2. **Fallback: Mapbox Geocoding API** — requires `NEXT_PUBLIC_MAPBOX_TOKEN`. When the Census Geocoder fails, Mapbox provides coordinates and basic address parsing. Mapbox doesn't provide census tract or block group FIPS, so a second Census reverse-geocode call fills those in.

After geocoding, a third call resolves the water system: SDWIS is queried with the (state FIPS, county FIPS) pair to identify the PWSID for the area.

## What it doesn't cover
- **International addresses**: Census Geocoder is US-only. Bedrock is a US-only platform currently.
- **Rural routes and PO Boxes**: Match rates drop significantly for non-standard addressing.
- **Military addresses (APO/FPO)**: Not geocodable via Census Geocoder.
- **Water system at parcel level**: PWSID resolution is county-level only. Multi-service-provider counties get the dominant PWSID.

## Refresh cadence
The Census Geocoder API is maintained by the Census Bureau and updated as address databases are refreshed (roughly annually). No bundle — live queries only.

## Known limitations
1. **Dissolved towns fail completely**: Addresses in municipalities that no longer legally exist (e.g., Picher, OK — merged into a county road district) fail Census Geocoder geocoding. These are among the most contaminated places in the US and cannot currently be assessed.
2. **Match rate ~85%**: The Census Geocoder returns no match for ~15% of US addresses (unusual address formats, new construction, rural routes). Mapbox fallback recovers some of these.
3. **Block group latency**: The census coordinate reverse-geocode (used after Mapbox fallback) adds ~500ms to geocoding time.
4. **No parcel-level geocoding**: Census Geocoder snaps to street centerlines; actual parcel centroids may be 10-50 meters off, which doesn't matter for most scoring but can affect flood zone edge cases.
