# OpenAQ — Open Air Quality

## What it covers
OpenAQ aggregates real-time and historical air quality measurements from government monitoring networks and low-cost sensors worldwide. Bedrock uses it to obtain PM2.5 (fine particulate matter) readings from the nearest monitoring station to an address. PM2.5 is the primary air quality metric correlated with respiratory and cardiovascular health impacts.

## What it doesn't cover
- Ozone (O3) — use AQS for ozone
- NO2, SO2, CO — available in OpenAQ but not currently used by Bedrock
- Indoor air quality
- Areas with no nearby monitoring stations (many rural areas)

## How Bedrock uses it
Live query in `lib/data-sources/openaq.ts`. Returns the nearest station's PM2.5 reading. Contributes to the air layer score alongside EPA AQS data.

**Requires API key**: OpenAQ v3 requires a free API key for production access. Without a key, air coverage is ~50%.

## Refresh cadence
Live API — readings updated as stations report (typically hourly to daily).

## Known limitations
- Coverage is sparse in rural areas; many addresses return no nearby station
- Low-cost sensor readings are less accurate than reference-grade EPA monitors
- Station availability changes as networks are added or retired
- API key required for production volume; without it, requests may be rate-limited to zero

## Source
OpenAQ: https://openaq.org/
OpenAQ v3 API: https://api.openaq.org/docs
