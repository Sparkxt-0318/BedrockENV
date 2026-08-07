# OpenAQ / EPA AQS — Air Quality Monitoring Networks

## What it covers
Ambient air quality measurements (PM2.5, PM10, ozone, NO2, CO, SO2) from ground-level monitoring stations. Bedrock queries both OpenAQ (aggregator of global monitoring networks) and EPA AQS (the US regulatory air quality network).

**Primary pollutant scored**: PM2.5 (particulate matter ≤2.5 microns) — the strongest link to respiratory and cardiovascular health outcomes.

**Data points**: Station coordinates, pollutant readings, measurement period, value (µg/m³ for PM2.5).

## What it doesn't cover
- Indoor air quality (monitoring is outdoor ambient only)
- Air toxics / NATA (cancer risk from air toxics is in EJScreen)
- Point-source industrial emissions during off-peak monitoring
- Wildfire smoke specifically (captured as elevated PM2.5 but not distinguished from industrial pollution)

## Refresh cadence
OpenAQ v3 provides near-real-time data (hourly updates). Bedrock averages recent readings for a 24-48h window around the query time.

**API**: OpenAQ v3 (`https://api.openaq.org/v3/`) requires API key (`OPENAQ_API_KEY`). EPA AQS requires separate registration.
**Live API**: `lib/data-sources/openaq.ts`
**Timeout**: 10 seconds.

## Known limitations
1. **API key required**: Without `OPENAQ_API_KEY`, the air layer falls back to TRI + nonattainment status only (~50% coverage). Users must register and configure the key.
2. **Station density gap**: Air monitoring is heavily concentrated in urban areas. Many rural addresses have no monitoring station within 50km; air layer returns `unmapped` coverage for these.
3. **PM2.5 alone ≠ full air risk**: Ozone, NO2, and air toxics are not scored from OpenAQ data (EJScreen captures some of these via NATA, but EJ layer is currently broken).
4. **Temporal averaging**: A single 24-48h average can miss seasonal pollution peaks (summer ozone, wildfire events) or understate chronic exposure.

## Scoring integration
Layer: Air (25% weight). Primary sub-component: PM2.5 annual average estimate. Combined with TRI emitter count and nonattainment status. Formula in `lib/scoring/air-scorer.ts`.
