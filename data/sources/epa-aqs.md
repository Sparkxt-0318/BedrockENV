# EPA AQS — Air Quality System

## What it covers
Historical and near-real-time air quality measurements from EPA's national network of ~4,000 monitoring stations. Covers all six NAAQS criteria pollutants (PM2.5, PM10, ozone, CO, NO2, SO2) plus air toxics (if monitored). AQS is the authoritative source used by EPA to make NAAQS attainment decisions.

## What it doesn't cover
- Indoor air quality
- Areas without monitoring stations — AQS network is designed to be representative of broad regions, not every neighborhood
- Real-time data (AQS has a ~24-hour reporting lag for most parameters; AirNow is the real-time supplement)

## Source
EPA AQS Data Mart API: `https://aqs.epa.gov/data/api/`. Requires `AQS_EMAIL` and `AQS_KEY` credentials from EPA (free registration). Query endpoints: `dailyData/bySite`, `annualData/byCounty`.

## Refresh cadence
Daily data available with ~24-hour lag. Annual summary data released Q1 of the following year. Bedrock would cache daily readings for 7 days and annual summaries for 90 days.

## Known limitations
- **API credentials not configured in Bedrock**. `AQS_EMAIL` and `AQS_KEY` must be registered with EPA at `https://aqs.epa.gov/data/api/signup` and set in `.env.local`. Without these, AQS is unavailable and the air layer falls back to nonattainment status + TRI emitter count only (~50% coverage).
- AQS monitoring network was designed for NAAQS compliance, not health risk at the neighborhood level. Urban monitoring stations may be placed away from the worst-pollution micro-zones to avoid "hot spot" bias.
- AirNow (the real-time API) uses AQS data for historical queries but has a simpler API for forecasting.
