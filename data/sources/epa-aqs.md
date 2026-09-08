# EPA AQS — Air Quality System

## What it covers
Hourly and daily air quality measurements from EPA's national ambient air monitoring network. Covers criteria pollutants (PM2.5, PM10, ozone, SO2, NO2, CO, lead) plus some air toxics at NATA (National Air Toxics Assessment) monitoring sites. Used in the Air layer for station-based PM2.5 and ozone measurements.

## What it does NOT cover
- Real-time data (AQS data is uploaded with a 24-hour to 7-day delay)
- Air toxics not in the monitoring network (VOCs, PFAS in air)
- Indoor air quality
- Areas without monitoring stations (significant rural gaps)

## Resolution
Station-level — monitoring stations are geolocated; Bedrock queries nearest stations.

## Refresh cadence
Frequent — stations upload data daily to AQS. The AQS API provides daily averages and annual summaries.

## Known limitations
1. **API registration required** — AQS requires a free EPA account and API key. Without it, the Air layer falls back to OpenAQ and nonattainment data only (approximately 50% coverage).
2. Monitoring station siting follows EPA siting criteria that may not capture localized pollution from specific point sources.
3. Annual averages smooth out episodic events (wildfire smoke, industrial accidents).
4. Station network density is lower in rural areas, particularly the Southeast and Great Plains.

## Authoritative source
https://www.epa.gov/aqs — API: https://aqs.epa.gov/data/api/
