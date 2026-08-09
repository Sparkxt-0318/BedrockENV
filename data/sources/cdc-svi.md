# CDC SVI — Social Vulnerability Index

## What it covers
Social Vulnerability Index (SVI) at the census tract level. National percentile ranks (0–1, higher = more vulnerable) for:
- Overall SVI (`RPL_THEMES`)
- Theme 1: Socioeconomic Status (`RPL_THEME1`)
- Theme 2: Household Characteristics & Disability (`RPL_THEME2`)
- Theme 3: Minority Status & Language (`RPL_THEME3`)
- Theme 4: Housing Type & Transportation (`RPL_THEME4`)
- Total population of the tract

## What it doesn't cover
- Sub-tract variation (tract-level aggregate only)
- Individual household data
- Environmental exposure (that is EJScreen's domain — SVI is purely socioeconomic)
- Tracts where CDC uses -999 (suppressed data) — these are coerced to 0

## How it works
Live ArcGIS Feature Service query:
`https://services1.arcgis.com/0MSEUqKaxRlEPj5g/ArcGIS/rest/services/CDC_SVI/FeatureServer/0/query`
Requires a fully qualified 11-digit census tract FIPS (state + county + tract).
Default timeout: 8 s, no retry.

## Refresh cadence
Live API calls on every request. CDC SVI is updated every 2 years. Current data may be 1–2 years stale relative to the most recent ACS release.

## Known limitations
- Requires census tract FIPS — addresses geocoded only to city/ZIP (Mapbox fallback) will fail with a descriptive error
- ArcGIS service response times of 5–8 s are common
- CDC uses -999 as a sentinel for suppressed data; these are converted to 0, which could understate vulnerability
- ArcGIS error envelopes (HTTP 200 with `{error: {message}}`) are inspected and surfaced
