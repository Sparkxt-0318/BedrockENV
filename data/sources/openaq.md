# OpenAQ — Open Air Quality Data

## What it covers
Near-real-time air quality measurements from global monitoring networks aggregated
by OpenAQ. Queries the nearest monitoring station within 25 km for PM2.5 (and
optionally other pollutants). Returns sensor-level average concentrations and
last-updated timestamps.

API: OpenAQ v3 (`/v3/locations` + `/v3/locations/{id}/latest`). Requires
API key: `OPENAQ_API_KEY` environment variable.

## What it does NOT cover
- Areas with no monitor within 25 km (rural US, tribal lands)
- Regulatory-grade monitoring (OpenAQ aggregates both reference and low-cost sensors)
- Annual summary statistics with the same rigor as EPA AQS
- Air toxics / hazardous air pollutants (HAPs)
- Indoor air quality

## Refresh cadence
OpenAQ ingests data in near-real-time from contributing networks.
Data freshness varies by monitor — some update hourly, others daily or less.
Queried live at assessment time. `lastUpdated` field indicates sensor freshness.

## Known limitations
- **Requires API key** — without `OPENAQ_API_KEY`, the data source returns an error
  and the air layer degrades to AQS + nonattainment only
- OpenAQ v3 changed the API schema from v2 (breaking change in 2024); the client
  uses v3 endpoints exclusively
- Low-cost sensor data mixed with reference monitors — accuracy varies significantly
- Monitor density in the US is lower than EPA AQS; rural areas often have no
  nearby station
- API rate limits apply; no retry on rate limit errors
- 4-second timeout means slow or distant API responses return null (not an error)

## Layer assignment
Air layer — near-real-time PM2.5 signal, supplementing EPA AQS.
