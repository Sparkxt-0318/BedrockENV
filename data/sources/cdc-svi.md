# CDC SVI — Social Vulnerability Index

## What it covers
CDC's Social Vulnerability Index ranks every census tract on four themes of social vulnerability:
1. **Socioeconomic status** (poverty, unemployment, income, no high school diploma)
2. **Household characteristics** (age extremes, disability, single-parent households, English proficiency)
3. **Racial and ethnic minority status**
4. **Housing type and transportation** (multi-unit structures, mobile homes, crowding, no vehicle, group quarters)

Each theme and an overall SVI are expressed as national percentile ranks (0–1, where higher = more vulnerable). The SVI is published at the census tract level.

## What it doesn't cover
- Environmental hazard data (SVI is purely socioeconomic/demographic)
- Block-group level data (tract only)
- Populations not captured by Census (undocumented, homeless)

## How Bedrock uses it
Queried live by state FIPS + county FIPS + census tract in `lib/data-sources/cdc-svi.ts`. The overall SVI percentile and theme scores contribute to the EJ layer's social vulnerability sub-score.

**Current status**: SVI API access is not configured in the current deployment. The EJ layer's social vulnerability component returns null for all addresses. See ROADMAP.md "In Progress."

## Refresh cadence
CDC SVI is updated every 2 years using ACS 5-year data. Current version uses 2020 ACS 5-year data. 2022 ACS version expected mid-2024; check for updates.

## Known limitations
- Tract-level granularity only — intra-tract variation not captured
- Military base tracts have no residential Census data → SVI returns null
- SVI measures vulnerability to external shocks, not environmental exposure directly
- Requires knowing the census tract FIPS for the queried address (depends on geocoding quality)

## Source
CDC SVI: https://www.atsdr.cdc.gov/placeandhealth/svi/index.html
CDC SVI Data: https://www.atsdr.cdc.gov/placeandhealth/svi/data_documentation_download.html
