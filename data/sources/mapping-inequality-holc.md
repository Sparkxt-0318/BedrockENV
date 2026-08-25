# Mapping Inequality — HOLC Residential Security Maps

## What it covers
Digitized Home Owners' Loan Corporation (HOLC) "residential security maps" created 1935–1940 for 239 US cities. Maps assign letter grades A–D (green/blue/yellow/red) to neighborhoods based on HOLC appraisers' assessments of investment risk — assessments heavily influenced by race and ethnicity of residents.

## What it doesn't cover
- Rural areas or smaller cities (HOLC maps only exist for ~239 metro areas)
- Post-1940 development (all subsequent suburban growth outside mapped zones)
- Direct causation — maps capture but did not solely cause disinvestment patterns

## Data source
University of Richmond Digital Scholarship Lab: https://dsl.richmond.edu/panorama/redlining/
HOLC to census tract crosswalk based on geometric intersection: 9,036 neighborhoods mapped to modern Census tracts.

## Refresh cadence
Static historical data — no updates expected. The crosswalk to current census tracts may need rebuilding when Census publishes new tract boundaries (decennial census, typically).

## Known limitations
- Geographic coverage limited to ~239 cities; national analysis is only possible where maps exist
- Grade assignments reflect HOLC appraiser bias, not purely financial risk — grades are not directly comparable across cities
- Census tract boundaries have changed since 1940; crosswalk uses area-weighted intersection which introduces some geographic error
- "Redlining" is often used colloquially to describe broader discriminatory practices; Bedrock's analysis is specifically about HOLC map grades

## Bundled file
`data/holc-crosswalk.json` — maps HOLC neighborhood IDs to 2020 Census tract FIPS codes with intersection weights.
`data/redlining-analysis.json` — pre-computed statistics by HOLC grade across 300 cities.

## Bedrock usage
Environmental Justice layer HOLC grade context; `/intelligence/redlining` research brief. See `app/api/intelligence/holc/route.ts`.
