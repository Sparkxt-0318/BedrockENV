# OpenAQ — Open Air Quality

## What it covers
Aggregated air quality measurements from government monitoring networks worldwide, including EPA AirNow, state networks, and international agencies. Covers PM2.5, PM10, ozone, NO2, SO2, CO. Provides recent sensor readings from monitoring stations near a given coordinate.

## What it doesn't cover
- Areas without monitoring stations (coverage gaps, especially rural US)
- Low-cost sensor networks (OpenAQ v3 focuses on regulatory monitors)
- Air toxics beyond criteria pollutants
- Indoor air quality
- Historical data beyond what the API returns (recent readings only in the free tier)

## How Bedrock uses it
Queried via OpenAQ v3 API by coordinates with radius search (50 km). Returns most recent PM2.5 readings from nearby stations. Used as the primary air quality sub-component when AQS API is unavailable. Provides a real-time complement to the bundled nonattainment data.

## Refresh cadence
Live API — readings are updated hourly as monitoring stations report. Requires OpenAQ API key for higher rate limits (free tier: 60 requests/min).

## Known limitations
- Station availability is highly variable — many rural areas have no OpenAQ stations within 50 km
- OpenAQ v3 API access requires registration; without a key, rate limits are very low
- Most recent reading may be hours or days old for infrequently updated stations
- PM2.5 readings are point measurements that may not represent conditions at the assessment address (wind, local sources)
- Does not distinguish air quality variation within a metro area (a single downtown monitor serves as proxy for the whole city)
