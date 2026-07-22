# EPA AQS — Air Quality System

## What it covers
Historical annual PM2.5 and ozone concentration summaries from EPA's national air monitoring network (~5,000 monitoring stations). Bedrock queries the AQS Data Mart API for the nearest monitors to a query point, returning annual design values (the concentration averages used to determine NAAQS compliance) for PM2.5 and ozone.

Key value: AQS provides actual measured concentrations (µg/m³ for PM2.5, ppb for ozone), not just compliance status. This enables nuanced scoring — a monitor reading 9.5 µg/m³ scores differently than one at 12 µg/m³, even though both are nominally "attainment."

## What it doesn't cover
- **Air toxics** — AQS monitors criteria pollutants (PM2.5, ozone, NO2, CO, SO2, lead). Hazardous air pollutants require the National Air Toxics Assessment (NATA) or TRI data.
- **Real-time readings** — AQS annual summaries are published 6-12 months after the monitoring year ends.
- **Areas with no monitors** — Rural areas, small towns, and tribal lands often have no nearby AQS monitor. Bedrock falls back to nonattainment status and TRI data in these cases.
- **Indoor air quality** — AQS is outdoor ambient monitoring only.

## Refresh cadence
The AQS Data Mart API (https://aqs.epa.gov/data/api) is updated by EPA as monitoring data is finalized (typically Q3 of the following year — 2024 data becomes available ~Q3 2025). Bedrock queries live per assessment; falls back to the prior year if current-year data is not yet available.

**Requires credentials**: `EPA_AQS_EMAIL` and `EPA_AQS_KEY` environment variables (free registration at https://aqs.epa.gov/aqsweb/documents/data_api.html). Without credentials, AQS is skipped and the air layer relies on OpenAQ and nonattainment status only.

## Known limitations
1. **Credentials required**: Without `EPA_AQS_EMAIL` / `EPA_AQS_KEY`, this source is completely unavailable. Air coverage drops to ~50%.
2. **Monitor sparsity**: Rural and suburban areas may have no AQS monitor within a reasonable radius. The API returns the nearest monitor regardless of distance — a monitor 50 miles away is not a meaningful proxy for a specific address.
3. **Rate limit**: 5 requests per minute on free API keys. Does not support parallel assessments.
4. **Annual granularity**: AQS reports annual summary values. A wildfire smoke event or an industrial accident shows up in the annual average but isn't distinguishable from background.
