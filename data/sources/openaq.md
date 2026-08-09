# OpenAQ — Open Air Quality Platform

## What it covers
Real-time/near-real-time air quality measurements from the nearest monitoring station within 25 km. Returns: station name, coordinates, distance from query point (km), per-parameter measurements (value, unit, last-updated timestamp), and `exceedsWhoGuideline` flag (PM2.5 > 15 µg/m³, WHO 2021 annual guideline). Parameters include PM2.5 and any other sensors at the nearest station.

## What it doesn't cover
- Multiple stations (only the single nearest station within 25 km)
- Historical trends (only the latest available reading)
- Locations with no monitor within 25 km (returns a clear "no monitors found" error)
- API key not provided — entire module returns error

## How it works
Live OpenAQ v3 API call:
`https://api.openaq.org/v3/locations?coordinates={lat},{lng}&radius=25000&limit=1&order_by=distance&sort=asc`
Requires `OPENAQ_API_KEY` env var sent as `X-API-Key` header.
Default timeout: 4 s, no retry.

## Refresh cadence
Live API calls on every request. Station measurements vary — some update hourly, some daily. `lastUpdated` is returned but not validated against a staleness threshold.

## Known limitations
- `OPENAQ_API_KEY` is mandatory — missing key returns a descriptive error, but the feature is entirely unavailable
- 4 s timeout is aggressive for a global API
- No validation of data staleness — a station last updated months ago may be returned
- `sensor.summary.avg` preferred over `sensor.summary.max`; not all stations report averages
- Coverage is highly variable — monitoring deserts exist in rural and developing-country areas
- Only one station is fetched (`limit=1`)
