# University of Richmond HOLC Crosswalk — Historical Redlining

## What it covers
- 1930s Home Owners' Loan Corporation (HOLC) neighborhood grade maps (A/B/C/D) digitized for 239 cities
- 9,036 HOLC-graded neighborhoods linked to modern census tracts via the University of Richmond Mapping Inequality project
- Census ACS demographics overlaid: income, poverty rate, racial composition, pre-1950 housing
- County-level SCVI/CFCI/CPI scores merged for environmental burden analysis
- Used in Bedrock for two purposes: (1) `/intelligence/redlining` national research brief, (2) HOLC grade context panel in the EJ layer of individual reports

## What it doesn't cover
- Cities not covered by the original HOLC mapping program (smaller cities, rural areas, much of the South and Midwest)
- HOLC maps for neighborhoods that were not graded (predominantly Black or Hispanic neighborhoods that HOLC refused to map)
- Causal attribution — the crosswalk shows correlation between historical grade and present-day conditions, not proof of causation
- Current discrimination (HOLC maps are historical documents; present-day lending discrimination is not captured here)

## Refresh cadence
- The University of Richmond crosswalk (Mapping Inequality) is a static historical dataset; HOLC maps do not change
- Bedrock bundle: `/data/redlining-analysis.json` and `/data/holc-crosswalk.json`
- ACS demographic overlays should be refreshed annually as new ACS estimates are published
- Source: `https://dsl.richmond.edu/panorama/redlining/`

## Known limitations
- Coverage gap: ~239 cities have HOLC maps; hundreds of US cities (and all rural areas) have no HOLC data
- Many predominantly Black neighborhoods were not given HOLC grades at all — the dataset systematically underrepresents the most severely redlined communities
- Census tract boundaries have changed since the 1930s; the tract-to-HOLC crosswalk uses areal interpolation with associated uncertainty
- Environmental outcomes at the tract level are correlated with HOLC grade, but other confounders (proximity to industrial areas, municipal disinvestment, highway construction) also contribute
- The `/api/intelligence/holc` endpoint returns null for addresses outside the 239-city coverage area
