# OpenAQ — Open Air Quality Data (Real-Time PM2.5)

## What it covers
- Real-time and recent air quality measurements from government monitoring networks worldwide
- Primary use in Bedrock: PM2.5 (fine particulate matter, µg/m³) — highest-confidence air quality signal
- Station distance tracked for confidence tier: <5km → property-level, <15km → neighborhood-level, >15km → area-level
- Aggregates data from EPA AQS, state/local agencies, CARB, and international networks

## What it doesn't cover
- Areas with no monitoring stations (large rural swaths of the US have no OpenAQ coverage)
- Indoor air quality
- Ultrafine particles (PM0.1), black carbon, or speciated PM2.5 components
- Real-time ozone (ozone is sourced from AQS annual summaries, not OpenAQ)

## Refresh cadence
- OpenAQ aggregates data with ~1–2 hour latency from monitoring networks
- Bedrock uses 24-hour average for PM2.5 at assessment time
- API: OpenAQ v3 REST API (`https://api.openaq.org/v3/`) — requires API key

## Known limitations
- **Requires API key** — without credentials, the OpenAQ sub-component is unavailable; air layer coverage drops to ~50% (nonattainment + TRI only)
- Station network is uneven: dense in CA, TX, OH, PA; sparse in rural Mountain West, Great Plains
- OpenAQ aggregates from third-party networks; data quality varies by contributing agency
- Annual AQS data (from EPA) is the fallback when OpenAQ is unavailable; AQS provides annual summaries rather than real-time readings
- Low-cost sensor data (PurpleAir, etc.) is available in OpenAQ but not currently used by Bedrock (quality uncertain)
