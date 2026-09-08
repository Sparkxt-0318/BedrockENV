# OpenAQ — Open Air Quality Data

## What it covers
Real-time and recent PM2.5, PM10, O3, NO2, SO2, and CO measurements from monitoring stations near the query point. Aggregates data from government monitoring networks worldwide. Used in the Air layer for station-level air quality data.

## What it does NOT cover
- Air toxics (VOCs, PFAS in air, formaldehyde, benzene) — these require EPA AQS with specific monitoring networks
- Stations with data gaps of more than a few days
- Rural areas with no monitoring stations nearby

## Resolution
Station-level — queries nearest stations within a configurable radius and computes a distance-weighted average.

## Refresh cadence
Live API. OpenAQ v3 aggregates near-real-time feeds from global monitoring networks. No local bundle.

## Known limitations
1. Monitoring station coverage in the US is dense in urban areas and almost nonexistent in rural areas (especially the South and Great Plains).
2. OpenAQ API keys are required for production use; without them, only a small number of unkeyed requests per day are allowed. Air layer coverage is approximately 50% without API credentials.
3. Station calibration and data quality varies significantly between contributing networks. Some low-cost sensors have high noise.
4. Real-time data may not reflect seasonal averages; a query in January will miss summer ozone peaks.

## Authoritative source
https://openaq.org — API v3: https://api.openaq.org/v3/
