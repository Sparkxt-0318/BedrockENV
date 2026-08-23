# OpenAQ — Open Air Quality

## What it covers
Near-real-time and recent air quality measurements aggregated from government-operated monitoring networks worldwide. For US use, includes many EPA, state, and tribal network stations. Key parameters: PM2.5, PM10, ozone, NO2, CO, SO2.

Returns the nearest monitoring station within 25 km and its most recent measurements.

## What it doesn't cover
- Areas with no monitoring stations within 25 km (common in rural US)
- Indoor air quality
- Long-term historical trends at full depth (use EPA AQS for that)
- Modeled/interpolated air quality (station data only)

## How we use it
OpenAQ v3 API (`https://api.openaq.org/v3/`) — two calls:
1. `locations` with lat/lng/radius → find nearest station
2. `locations/{id}/latest` → get most recent measurements

Used in the Air layer as a complement to EPA AQS. Provides more current data but less historical depth.

**API key required.** Set `OPENAQ_API_KEY` environment variable. Free registration at https://api.openaq.org. Without credentials, returns a clear error and the Air layer degrades gracefully.

## Refresh cadence
Live API — measurements are ingested from source networks in near-real-time (typically within hours). No local bundle.

## Known limitations
- **Requires free API credentials** — not available in all deployments.
- Station coverage is uneven — dense in urban areas, sparse or absent in rural areas.
- 25 km search radius may return a monitor measuring a different urban airshed than the query point.
- Data freshness varies by station — `lastUpdated` timestamp is returned and should be checked.
- Rate limits apply; 4-second timeout is used to avoid blocking assessments.
- OpenAQ aggregates what governments publish — data quality varies by country/agency (US data is generally high quality).
