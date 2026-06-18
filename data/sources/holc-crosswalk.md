# Data Source: HOLC-Census Crosswalk (`holc-crosswalk.json`)

## What it covers
University of Richmond Mapping Inequality crosswalk joining 1930s Home Owners'
Loan Corporation (HOLC) redlining maps to 2010 census tracts. Contains 9,036
neighborhood-level records across 300+ cities, each with:
- HOLC grade (A = "Best", B = "Still Desirable", C = "Definitely Declining", D = "Hazardous")
- City and state
- Census tract FIPS codes
- Tract overlap percentages

Used by the `/intelligence/redlining` page and the EJ layer of individual reports
(HOLC grade context panel via `/api/intelligence/holc`).

## What it does NOT cover
- Cities without HOLC surveys (~1930s coverage was mostly cities over 40,000 population)
- Suburban and rural areas (HOLC graded urban neighborhoods only)
- Post-1940 development (new suburbs, urban renewal, demolition)
- Real estate market dynamics after the HOLC period (1930s–1950s)

## Refresh cadence
The HOLC maps are historical (1930s) and do not change. The crosswalk is a research
dataset maintained by the University of Richmond's Digital Scholarship Lab.

**Last verified**: April 2026  
**Source**: https://dsl.richmond.edu/panorama/redlining/  
Academic citation: Nelson, Winling, Marciano, Connolly, et al., "Mapping Inequality,"
American Panorama, ed. Robert K. Nelson and Edward L. Ayers.

## Known limitations
- Geographic precision is limited by the 2010 census tract boundary resolution.
- HOLC grades were subjective assessments by local real estate industry actors —
  not objective contamination or environmental measurements.
- The crosswalk uses 2010 tract boundaries; the redlining analysis joins to
  2020 ACS data, which uses updated (but largely similar) tract boundaries.
- 9,036 neighborhoods covers approximately 74% of the original HOLC-surveyed areas;
  some city maps are partially digitized.

## Build script
No build script — the HOLC crosswalk is a research dataset downloaded directly from
the University of Richmond. The redlining analysis pipeline joins it to ACS data
via `scripts/build-redlining-data.ts`.
