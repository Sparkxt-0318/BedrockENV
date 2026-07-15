# US Census Bureau — American Community Survey (ACS)

## What it covers
Bedrock uses the Census ACS 5-year estimates for two specific purposes:
1. **Lead-risk proxy** (Table B25034 — Year Structure Built): Percentage of housing units built before 1986. Pre-1978 housing has the highest lead paint risk; the ACS provides built-year distributions at the census block group level.
2. **Water system socioeconomic context**: Median household income, poverty rate, race/ethnicity distribution for census tracts (used in Intelligence briefs and EJ layer context).

## What it doesn't cover
- Actual lead paint prevalence (ACS provides housing age as a proxy, not direct measurement)
- Air quality, water quality, or contamination data
- Individual property characteristics (assessed at block group or tract level)

## Source
Census Bureau Data API: `https://api.census.gov/data/`. Bedrock queries the ACS 5-year estimates with a Census API key (`CENSUS_API_KEY` env var). Also uses Census geocoding for address-to-FIPS resolution.

## Refresh cadence
ACS 5-year estimates are released annually in December (the most recent is the 2018–2022 5-year ACS, released December 2023). Bedrock caches for 90 days.

## Known limitations
- Block group level (~600–3,000 housing units) — a new subdivision next to a 1950s neighborhood will receive the same housing age profile.
- Military bases often lack complete ACS coverage — the Census doesn't estimate characteristics for on-base housing. This causes the lead-risk proxy to return null for military addresses.
- Pre-1986 housing as a lead proxy over-penalizes well-maintained older housing (lead paint that was never disturbed is lower risk than abated). It's a population-level screening tool, not a property-specific assessment.
- The `CENSUS_API_KEY` env var must be set; without it, the Census API applies rate limits that cause intermittent failures.
