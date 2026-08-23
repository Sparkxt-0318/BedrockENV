# EPA AQS — Air Quality System

## What it covers
Historical annual summary data from EPA's nationwide network of ambient air quality monitors. Key pollutants:
- PM2.5 (fine particulate matter) — annual mean concentration (µg/m³)
- Ozone — annual 4th-highest daily maximum 8-hour average (ppb)

Returns data from the nearest monitors to a query point, typically aggregated at county scale.

## What it doesn't cover
- Real-time or near-real-time measurements (use OpenAQ for that)
- Areas without monitors (rural and many suburban areas have no nearby AQS station)
- Indoor air quality
- Air toxics (VOCs, HAPs) — separate NATTS network

## How we use it
EPA AQS Data Mart API (`https://aqs.epa.gov/data/api/annualData/byLatLng`) queried with lat/lng for PM2.5 and ozone annual summaries. Used in the Air layer. Falls back to the prior year if the current year has no data yet (data is published ~18 months after the monitoring year ends).

**API key required.** Set `EPA_AQS_EMAIL` and `EPA_AQS_KEY` environment variables. Free registration at https://aqs.epa.gov/aqsweb/documents/data_api.html. Without credentials, this source is skipped and the Air layer runs on nonattainment + TRI data only (~50% coverage).

## Refresh cadence
Annual summaries are finalized ~18 months after the monitoring year. The API is live and queries the most recent finalized data. No local bundle.

## Known limitations
- **Requires free API credentials** — not available in all deployments.
- Rural areas often have no monitor within reasonable distance — sparse coverage.
- Rate limited to 5 requests/minute — no retry on 429.
- Annual summaries lag the calendar year by ~18 months.
- Monitor distance from query point varies; the adapter uses nearest monitor, which may be many miles away.
