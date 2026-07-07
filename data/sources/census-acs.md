# Census Bureau ACS — American Community Survey

## What it covers
Bedrock uses two Census ACS tables:
1. **ACS B25034** (year structure built): Used to compute housing age as a proxy for lead paint and lead pipe risk. Pre-1940 and pre-1986 housing percentages indicate higher probability of lead plumbing and lead paint exposure.
2. **ACS demographics** (income, poverty, race/ethnicity, tract-level): Used in the SCVI, CFCI, and redlining intelligence pages, and as inputs to the EJ layer demographic burden sub-score.

## What it doesn't cover
- Actual lead testing results — housing age is a proxy only
- Commercial or industrial properties
- Mobile homes or non-traditional housing

## How Bedrock uses it
Housing age data is fetched via the Census API by state FIPS + county FIPS in `lib/data-sources/epa-lead.ts`. Census tract demographics are bundled in `data/census-tract-demographics.json` for national intelligence analyses.

## Refresh cadence
ACS 5-year estimates updated annually. The bundled data uses 2022 5-year estimates. Refresh the national bundle when 2023 5-year data is released (expected late 2024/early 2025).

## Known limitations
- Housing age is a proxy, not a direct lead measurement
- Military bases and group quarters (dorms, prisons) have no or sparse ACS data — this causes lead-risk scores to undercount for these address types
- 9 Connecticut planning regions were unmatched in the 2022 data (CT reorganized its county equivalents in 2022)

## Source
Census Bureau ACS: https://www.census.gov/programs-surveys/acs.html
Census API B25034: https://api.census.gov/data/2022/acs/acs5/groups/B25034.html
