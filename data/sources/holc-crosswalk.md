# HOLC Redlining — University of Richmond / NCRC Crosswalk

**Bundled file:** `data/holc-crosswalk.json`
**Source:** University of Richmond Digital Scholarship Lab — Mapping Inequality project

## What it covers
- 9,036 historical Home Owners' Loan Corporation (HOLC) neighborhood polygons from 1935–1940
- 300+ US cities where HOLC produced "residential security" maps
- HOLC grades: A (Best), B (Still Desirable), C (Declining), D (Hazardous / "redlined")
- Crosswalk to 2020 Census tract FIPs codes via areal interpolation
- Area-weighted overlap between HOLC polygon and census tract (overlap_pct field)

## What it doesn't cover
- Cities not mapped by HOLC (most cities under ~40,000 population in 1940)
- Rural areas — HOLC maps covered urban residential neighborhoods only
- Deed restrictions and other discriminatory instruments not captured by HOLC maps
- Changes in neighborhood boundaries since 1940 (annexations, rezonings)

## Refresh cadence
- **Annual check** — University of Richmond periodically adds newly digitized cities
- Source: https://dsl.richmond.edu/panorama/redlining/
- Check release notes at Mapping Inequality for newly available cities or boundary corrections
- NCRC occasionally publishes updated crosswalks with improved census tract alignment

## Known limitations
- Overlap-weighted attribution assigns partial HOLC grades to tracts straddling multiple zones — the dominant grade is used for visualization but tracts near grade boundaries may be mislabeled
- 9 CT planning regions (Connecticut reorganization) are not in 2020 Census tract data — these appear as unmatched in the demographics join
- HOLC grade meanings differed by city and appraiser — "D" in a small Southern city differs from "D" in Chicago
- Causal claims require care: redlining correlates with present-day outcomes but the crosswalk alone does not establish causation
