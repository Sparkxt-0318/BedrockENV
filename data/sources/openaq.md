# OpenAQ — Open Air Quality Data

## What it covers
Real-time and recent air quality measurements from thousands of monitoring stations
worldwide, primarily PM2.5 and PM10 (and some NO2, O3, CO, SO2):
- Ground-level monitoring station readings
- Regulatory monitor network data (AQS, provincial agencies)
- Low-cost sensor data (lower accuracy)

## What it doesn't cover
- All locations — station density is highly variable (dense in cities, absent in rural areas)
- Air toxics (benzene, formaldehyde, HAPs) — not measured by standard PM monitors

## Refresh cadence
Live API: `https://api.openaq.org/v3/` (requires free API key registration)
Data is near real-time, updated hourly or more frequently.

## Current status in Bedrock
**REQUIRES API KEY** — Air layer at ~50% coverage without OpenAQ v3 credentials.
Without PM2.5 data from OpenAQ (and AQS), the air layer only scores from:
- Nonattainment status (bundled)
- TRI air emitters via ECHO

Tracked in ROADMAP.md as "In Progress: Air API keys".

## Known limitations
- Station availability varies dramatically — rural areas often have zero nearby stations
- Low-cost sensors can have accuracy issues
- Seasonal variation in PM2.5 is not captured in point-in-time readings

## Bedrock usage
Air layer sub-component. PM2.5 nearest-station reading within configurable radius.
Resolution: NEIGHBORHOOD-LEVEL (nearest monitoring station). Cache: 1-hour TTL.
