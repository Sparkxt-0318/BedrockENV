# EPA EJScreen — Environmental Justice Screening Tool

## What it covers
Census-tract-level environmental justice indicators combining environmental burden (air toxics, proximity to waste/Superfund/RMP sites, traffic, lead paint) with demographic vulnerability (low income, minority population, low literacy, linguistic isolation). Returns 12 environmental indicators and 6 demographic indicators as percentile rankings relative to state and national benchmarks.

## What it doesn't cover
- Block-level or parcel-level variation within a census tract
- Chemical-specific contamination (EJScreen is a relative burden index, not an absolute measurement)
- Site-specific enforcement data (use ECHO for that)

## Source
EPA EJScreen API: `https://ejscreen.epa.gov/mapper/ejscreenRESTbroker2.aspx`. Query by census tract FIPS or lat/lng.

## Refresh cadence
EPA releases updated EJScreen data annually, typically in Q4. The 2024 dataset (based on 2022 ACS) is the current version as of July 2026.

## Known limitations
- **Currently non-functional in Bedrock**: EJScreen API requires external API access credentials that have not been configured. The EJ layer returns 0 for all addresses, which causes the composite score to undercount burden at disadvantaged locations by an estimated 5–20 points.
- EJScreen percentiles are relative to a baseline (state or national), not absolute risk levels. A location at the 80th percentile means it's worse than 80% of other locations, not that it has 80% of some maximum risk.
- Census tracts vary widely in population (often 2,000–8,000 people). A tract containing an industrial corridor and a quiet neighborhood will show average burden that under-represents the corridor.
- EJScreen does not include military bases in its census tract coverage.
