# EPA AQS — Air Quality System

## What it covers
Ambient air quality monitoring data from EPA's national network of ~4,000 monitoring stations. Covers criteria pollutants (PM2.5, PM10, ozone, NO2, SO2, CO, lead) and some air toxics. Provides daily and annual average concentrations, NAAQS attainment status indicators, and statistical summaries.

## What it doesn't cover
- Areas without monitoring stations (significant rural coverage gaps)
- Indoor air quality
- Hyperlocal variation (monitors are typically 1–30 miles apart)
- Non-criteria pollutants (VOCs, PFAS in air, dioxins)
- Real-time data (data is typically 2–24 hours delayed)

## How Bedrock uses it
Queried via EPA AQS API. **Currently requires API registration** (AQS API key). Without a registered API key, the AQS sub-component returns null and air coverage drops to ~50%. The nonattainment bundle (`data/nonattainment.json`) provides county-level attainment classification as a partial substitute.

## Refresh cadence
Live API updated continuously. Annual summary files published several months after the reference year.

## Known limitations
- Coverage gap: many rural areas have no AQS monitors within query radius
- API key required (EPA registration): https://aqs.epa.gov/aqsweb/documents/AQS_API.html
- Station proximity does not guarantee data relevance — wind patterns and local geography affect how representative a monitor is for a given address
- Recent data has quality assurance flags that may indicate preliminary status
