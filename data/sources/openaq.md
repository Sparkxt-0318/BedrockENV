# OpenAQ — Open Air Quality Platform

## What it covers
Real-time and historical PM2.5, PM10, ozone, NO2, SO2, and CO measurements from government monitoring stations worldwide, aggregated and standardized into a single API. Bedrock uses OpenAQ as the primary real-time air quality source when EPA AQS credentials are unavailable.

## What it doesn't cover
- Air toxics (benzene, formaldehyde, 1,3-butadiene) — criteria pollutants only
- Indoor air quality
- Areas with no nearby monitoring stations — rural coverage is extremely sparse

## Source
OpenAQ v3 API: `https://api.openaq.org/v3/`. Queries nearest monitoring stations within a radius of the query point, then returns average recent PM2.5 and O3 readings.

## Refresh cadence
Live API with near-real-time data from partner monitoring networks (EPA, state agencies, international networks). Station density determines freshness — active stations update hourly or more frequently.

## Known limitations
- **API key required (OpenAQ v3)**: Without `OPENAQ_API_KEY`, the v3 API rate-limits aggressively, returning 429 errors. Bedrock treats this as `coverage: 'unmapped'` for the air layer's real-time sub-score.
- Station coverage is highly uneven. Dense in California, Northeast, and major metros; almost absent in rural Great Plains, Mountain West, and Alaska. A rural address may have no OpenAQ station within 50 miles.
- Monitoring station data represents a single geographic point. Air quality can vary substantially within a few miles due to local sources, topography, and wind patterns.
- OpenAQ data are from ground monitors. Satellite-based PM2.5 estimates (MODIS, VIIRS) could fill rural gaps but are not currently integrated.
