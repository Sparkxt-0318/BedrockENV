# OpenAQ — Open Air Quality Data

## What it covers
Near-real-time and recent historical air quality measurements from a global network of ground-level monitors, crowdsourced government data providers, and low-cost sensor networks. Bedrock queries the OpenAQ v3 API for the nearest station within 25 km of a query point, returning the latest measurements for PM2.5, PM10, NO2, SO2, ozone, and CO.

Key advantages over AQS:
- More recent data (days/weeks rather than annual summaries)
- Better urban/suburban coverage (includes Purple Air–type low-cost sensors)
- Global coverage (useful if the platform ever expands internationally)
- No need to know monitoring station IDs in advance

## What it doesn't cover
- **Air toxics** — like AQS, OpenAQ covers criteria pollutants, not hazardous air pollutants.
- **Rural areas without nearby sensors** — same monitor sparsity issue as AQS.
- **Low-cost sensor accuracy** — some OpenAQ stations use low-cost sensors with ±30-50% uncertainty. Reference-grade monitor data is more reliable but less dense.
- **Historical trends** — Bedrock only queries the latest available measurements; multi-year trend analysis isn't implemented.

## Refresh cadence
The OpenAQ v3 API (https://api.openaq.org/v3/) is a live data feed updated continuously as monitors report. Bedrock fetches live per assessment.

**Requires API key**: `OPENAQ_API_KEY` environment variable (free at https://openaq.org/#/register). Without it, OpenAQ is skipped entirely (returns clear error, not a crash).

## Known limitations
1. **Credentials required**: Without `OPENAQ_API_KEY`, this source is unavailable. Combined with AQS credentials absent, the air layer loses its ambient concentration component entirely.
2. **Low-cost sensor noise**: Urban areas often have good coverage but from unregulated sensors. Measured PM2.5 can be 30-50% higher or lower than reference-grade instruments.
3. **Station freshness**: `lastUpdated` can be weeks old in some locations; Bedrock includes this in scoring confidence but doesn't hard-exclude stale readings.
4. **No indoor monitoring**: All measurements are outdoor ambient; indoor exposure (relevant for PFAS-contaminated dust, radon) is not captured.
