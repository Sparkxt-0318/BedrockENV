# OpenAQ / EPA AQS — Ambient Air Quality Monitoring

## What it covers
PM2.5 (fine particulate matter) and other criteria pollutant concentrations from regulatory monitoring networks. Two parallel sources used in the air layer:

- **OpenAQ v3** (`api.openaq.org`): aggregates global monitoring data including EPA AQS and other networks; provides recent (24–48h) readings near an address
- **EPA AQS** (`aqs.epa.gov/data/api`): authoritative EPA regulatory monitoring data, used for annual averages

Coverage is geographic — only addresses within range of an active monitor receive a real-time PM2.5 score. Rural and remote areas often have no monitor within the query radius.

## What it doesn't cover
- Indoor air quality
- PM10, NO2, ozone, SO2 individual readings (only PM2.5 used in current scoring)
- Areas with no monitoring stations within the configured radius (~50km default)
- Private monitoring networks (PurpleAir etc. are not used — regulatory monitors only)

## Refresh cadence
Live API — queries at assessment time. No local bundle.

OpenAQ API key required: register at https://api.openaq.org
EPA AQS API key required: register at https://aqs.epa.gov/data/api/signup

## Known limitations
- **Air layer runs at ~50% coverage without API keys** — TRI emitter proximity and nonattainment status score without keys, but PM2.5 sub-component returns `fetch-failed` or `unmapped` without a valid key, reducing air layer coverage substantially
- Monitoring network density is uneven: dense in urban areas, sparse in rural. High-exposure rural areas near industrial sources (CAFOs, refineries, mines) often have no nearby monitor
- OpenAQ readings can be hours or days delayed; real-time readings are not guaranteed
- PM2.5 averages can mask acute spike events (wildfire smoke, industrial accidents) that don't show in annual averages
