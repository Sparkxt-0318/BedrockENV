# EPA AQS — Air Quality System

## What it covers
Regulatory ambient air quality monitoring data from state and local air agencies. The authoritative US regulatory network for NAAQS compliance monitoring. Provides annual PM2.5 average, daily readings, and design values (the metric used for NAAQS attainment determination).

**Primary use**: Annual PM2.5 average (µg/m³) for scoring. AQS is the regulatory backup to OpenAQ for US monitoring stations.

## What it doesn't cover
- Air toxics / HAPs (covered separately under NATA)
- Continuous real-time data (AQS posts validated data quarterly/annually)

## Refresh cadence
Quarterly validated data releases; annual design values posted in spring.

**API**: EPA AQS API (`https://aqs.epa.gov/data/api/`) — requires registration at `https://aqs.epa.gov/data/api/signup`
**Live API**: `lib/data-sources/epa-aqs.ts`
**API key env var**: `EPA_AQS_EMAIL` + `EPA_AQS_KEY` (not `OPENAQ_API_KEY`)

## Known limitations
1. **Registration required**: AQS API requires an email registration. Without it, the air layer falls back to OpenAQ only.
2. **Quarterly data lag**: AQS validated data is published quarterly; the most recent 2-3 months are unavailable.
3. **Station density**: Similar to OpenAQ — dense in urban areas, sparse in rural.

## Scoring integration
Layer: Air (25% weight). Used when OpenAQ is unavailable or returns sparse results. Formula in `lib/scoring/air-scorer.ts`.
