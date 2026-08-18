# University of Richmond — Mapping Inequality (HOLC Redlining Maps)

## What it covers
1930s Home Owners' Loan Corporation (HOLC) neighborhood security maps digitized by
the University of Richmond's Digital Scholarship Lab. Covers ~240 US cities.
HOLC grades:
- A (green): "Best" — desirable, new, homogeneous
- B (blue): "Still Desirable"
- C (yellow): "Declining"
- D (red): "Hazardous" — systematically denied mortgage access

The crosswalk in `data/holc-crosswalk.json` joins HOLC polygons to 2020 Census
tracts for demographic overlay.

## What it doesn't cover
- Cities not mapped by HOLC (primarily smaller cities and rural areas)
- The period from 1940 to present (HOLC maps are a 1930s snapshot)
- Individual parcel HOLC grades (polygon coverage, not point-level)

## Refresh cadence
**Bundled** — static historical dataset. The Mapping Inequality dataset is version-controlled
and updated only when the University of Richmond publishes a new release.

Current data: Version 3 (2023). Check: https://dsl.richmond.edu/panorama/redlining/

## Known limitations
- Historical boundary drawing by HOLC appraisers may not align precisely with
  modern Census geographies — the crosswalk is a spatial join with imperfect alignment
- 9 Connecticut planning regions (reorganized after 2020 Census) don't match standard
  county-based FIPS — these 9 are unmatched in the demographics overlay
- HOLC grade for an address is not causal — it is a correlate of historical disinvestment,
  not a direct measure of current contamination

## Bedrock usage
EJ layer sub-component (historical context). Also primary input to the Redlining &
Environmental Contamination intelligence brief. Resolution: POLYGON-LEVEL (HOLC neighborhood).
Linked to individual reports via `/api/intelligence/holc` endpoint.
