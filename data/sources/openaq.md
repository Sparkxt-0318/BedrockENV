# OpenAQ — Open Air Quality

## What it covers
Near-real-time PM2.5 and other air pollutant measurements from ground-level monitoring stations worldwide, aggregated by OpenAQ from national and local monitoring networks. Bedrock queries the OpenAQ v3 API for the nearest station within 25 km of the query address, returning the latest PM2.5 reading and summary statistics.

**Requires API key**: `OPENAQ_API_KEY` environment variable. Without a key, this source gracefully skips and the Air layer runs at reduced coverage (~50%).

## What it doesn't cover
- Remote areas without monitoring stations (significant gaps in rural US, tribal land)
- Indoor air quality
- Non-PM2.5 pollutants in the Bedrock scoring pipeline (ozone, NO2, etc. are fetched but not currently scored)
- Historical trends beyond what the station's `summary` field provides

## Refresh cadence
OpenAQ data is near-real-time (updated as monitors upload). Station availability changes as monitors go online/offline. Bedrock caches OpenAQ responses for **1 hour** per coordinate.

## Known limitations
- The 25 km radius can pull a monitor across a mountain range or airshed boundary, attributing air quality from a different environment.
- Station coverage in the US is good in urban areas and near industrial corridors, poor in rural areas. EPA AQS (the other air source) partially compensates with county-level historical data.
- Stale monitors: a monitor that stopped uploading will still appear in the station list with its last-reported reading. The client includes `lastUpdated` so the scorer can flag stale readings, but this is not currently enforced.
- The WHO annual PM2.5 guideline (15 µg/m³, 2021 update) differs from EPA's NAAQS (9 µg/m³ annual, 35 µg/m³ 24-hour). Bedrock uses EPA standards for scoring.
