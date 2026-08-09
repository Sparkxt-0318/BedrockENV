# EPA EJScreen — Environmental Justice Screening and Mapping Tool

## What it covers
Environmental Justice screening metrics at the census block-group level. National percentile ranks (0–100) for: overall EJ index, supplemental EJ index, PM2.5, ozone, diesel PM, traffic proximity, lead paint indicator, Superfund proximity, RMP facility proximity, hazardous waste proximity, wastewater discharge, and demographic index. Raw percentages for minority, low-income, linguistic isolation, less-than-HS-education, under-5, and over-64 populations. Block group FIPS code.

## What it doesn't cover
- Property-level assessments (data is block-group resolution)
- Percentile ranks are relative to the national distribution — absolute pollution levels require separate data sources
- Historical EJ trends (only the current release year)

## How it works
Live API call to EPA EJScreen REST broker:
`https://ejscreen.epa.gov/mapper/ejscreenRESTbroker.aspx`
Parameters: GeoJSON point geometry, `distance=0`, `unit=9035`, `f=json`.
Default timeout: 10 s, no retry. No API key required.

## Refresh cadence
Live API calls on every request. EJScreen data is updated annually by EPA. The underlying indicators draw from ACS, NATA, and other datasets on their own release schedules.

## Known limitations
- Response times of 5–10 s are common
- Rural/unmapped areas may return null for all indicators
- Percentile ranks are relative — national 50th percentile in a polluted region is still high absolute pollution
- API field names differ across EJScreen versions; code uses primary and fallback field name pairs to handle schema changes
- `aession` parameter (deliberate API typo) is passed as an empty string — matches the API's own parameter name
- Currently non-functional without API response (EJ scores return 0 for all addresses when the API is down)
