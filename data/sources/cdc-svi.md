# CDC SVI — Social Vulnerability Index

## What it covers
Census tract-level social vulnerability scores based on 16 Census variables grouped into four themes: (1) Socioeconomic status (poverty, unemployment, income, no high school diploma), (2) Household composition and disability (elderly, children under 17, civilian disability, single-parent households), (3) Minority status and language (minority status, English language proficiency), (4) Housing type and transportation (multi-unit structures, mobile homes, crowding, no vehicle, group quarters). Scores are percentiles within each state and nationally.

## What it doesn't cover
- Environmental hazards (SVI is a social vulnerability index, not an environmental index)
- Property-level variation within a tract
- Temporal trends (published every 2 years)
- Tribal lands (limited coverage)

## How Bedrock uses it
Intended for use in the EJ layer, combined with EJScreen environmental burden data to compute a compound environmental justice score. **Currently non-functional** — EJ layer returns 0 for all addresses pending API access configuration.

## Refresh cadence
CDC SVI is published every 2 years based on ACS 5-year estimates. Current release uses 2020 Census and 2016–2020 ACS data.

## Known limitations
- 2-year publication cadence means data can be up to 4 years out of date
- Census tract-level resolution — large tracts in rural areas can mask within-tract variation
- Social vulnerability is one dimension of environmental justice burden; combining with EJScreen environmental data provides a more complete picture
- Currently blocked pending EJScreen API credentials (see epa-ejscreen.md)
