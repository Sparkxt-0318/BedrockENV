# University of Richmond / HOLC — Home Owners' Loan Corporation Redlining Maps

**Bedrock adapter**: part of EJ layer via `/api/intelligence/holc` endpoint
**Data file**: `data/holc-national.json` (bundled static)
**Scoring layer**: EJ (context panel in individual reports; primary data for `/intelligence/redlining`)
**Source**: Mapping Inequality project, University of Richmond (https://dsl.richmond.edu/panorama/redlining/)

## What it covers
- Digitized HOLC "Residential Security" maps from the 1930s for 239 US cities
- 9,036 neighborhood polygons graded A (green/best), B (blue/still desirable), C (yellow/declining), D (red/hazardous)
- HOLC grade crosswalked to census tract FIPS via University of Richmond methodology
- Merged with Census ACS 5-year (2022) demographics: median income, poverty rate, race/ethnicity
- Merged with Bedrock's own SCVI, CFCI, and CPI scores at the county level
- 111 cities with sufficient A–D grade representation for within-city comparison analysis

## What it does NOT cover
- The ~10,000+ US cities with no digitized HOLC maps — rural America, small towns, cities HOLC did not survey
- Post-WWII discriminatory lending practices (FHA racial covenants, blockbusting, contract selling) — HOLC is one piece of the redlining story
- Current lending discrimination — HOLC maps describe historical policy, not current practice

## Refresh cadence
- Historical dataset; underlying HOLC boundaries do not change
- University of Richmond releases updated editions as new cities are digitized
- Bedrock's demographic overlay uses ACS 5-year estimates; refresh when ACS updates (annually)
- Check https://dsl.richmond.edu/panorama/redlining/ for new city additions
- Census tract crosswalk: check https://github.com/americanpanorama/holc-census-crosswalk for updates

## Known limitations
- **9 CT planning regions unmatched**: Connecticut reorganized from counties to planning regions after the 2020 Census; 9 CT HOLC neighborhoods could not be matched to the new tract structure. These are excluded from Bedrock's analysis
- **County-level contamination data**: Bedrock matches HOLC neighborhoods to county-level SCVI/CFCI data (not tract-level). This is a coarse proxy — a D-grade neighborhood in a low-SCVI county may have locally severe contamination not captured at county resolution
- **Ecological fallacy risk**: HOLC-grade correlations describe aggregate trends across 9,036 neighborhoods; individual neighborhoods deviate significantly from grade-level averages
- **City selection bias**: The 239 surveyed cities were chosen by HOLC based on mortgage market activity — they skew toward larger cities with active real estate markets in the 1930s. Small cities and the rural South are underrepresented
