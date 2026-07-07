# University of Richmond — HOLC Redlining Maps

## What it covers
The University of Richmond's Digital Scholarship Lab (Mapping Inequality project) has digitized the Home Owners' Loan Corporation (HOLC) residential security maps from the 1930s. These maps assigned letter grades (A="Best", B="Still Desirable", C="Declining", D="Hazardous") to neighborhoods in 239 US cities. The grades were used by lenders to deny mortgages in minority and working-class neighborhoods ("redlining"). The URichmond dataset provides a crosswalk from HOLC neighborhood polygons to 2010 census tracts.

## What it covers for Bedrock
- HOLC grade for each neighborhood polygon
- Census tract crosswalk (which 2010 tracts overlap with which HOLC zones)
- City name, state, and area description metadata

Bedrock uses this to link 1930s HOLC grades to present-day contamination exposure and demographic data in the Redlining & Environmental Contamination intelligence brief.

## What it doesn't cover
- Cities not mapped by HOLC (~1,000 smaller cities never received HOLC maps)
- Rural areas (HOLC only mapped urban residential neighborhoods)
- Native American lands

## How Bedrock uses it
Bundled as `data/holc-crosswalk.json`. Used in the `scripts/build-redlining-data.ts` pipeline to join HOLC grades with ACS demographics and SCVI/CFCI/CPI scores. Also used in the EJ layer of individual reports via `/api/intelligence/holc` to show whether an address is in a historically redlined neighborhood.

## Refresh cadence
The Mapping Inequality dataset is a historical digitization — it does not need regular updates. Check annually for expanded city coverage. Current version includes 239 cities, 9,036 neighborhoods.

## Known limitations
- 2010 census tract crosswalk may not perfectly align with 2020 tract boundaries (some tracts were split/merged)
- HOLC grades reflect 1930s assessments — the neighborhood character may have changed substantially
- Only large cities were mapped — smaller cities have no HOLC data

## Source
University of Richmond Mapping Inequality: https://dsl.richmond.edu/panorama/redlining/
Robert K. Nelson et al., Mapping Inequality (2023)
