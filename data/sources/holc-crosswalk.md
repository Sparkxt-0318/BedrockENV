# HOLC Crosswalk — University of Richmond Mapping Inequality

**What it covers**: 1930s Home Owners' Loan Corporation (HOLC) neighborhood security maps for 239 US cities, crossed with modern Census tract boundaries. Assigns each HOLC-graded neighborhood (A=Best, B=Still Desirable, C=Declining, D=Hazardous) to corresponding 2020 Census tracts. The "Hazardous" D-grade areas (colloquially "redlined") represent neighborhoods where HOLC rated mortgage lending as too risky, typically corresponding to majority-Black and immigrant neighborhoods.

**What it doesn't cover**: Cities without a surviving HOLC survey map (most smaller cities and rural areas have no data). The 239 surveyed cities represent approximately 40% of the 1930s urban population. Suburban areas generally have no HOLC coverage. The crosswalk is spatial (polygon intersection) and does not account for historical boundary changes.

**Used for**: `/intelligence/redlining` page — 300-city analysis linking HOLC grades to present-day income, poverty, race, housing age, and SCVI/CFCI scores. Also used in the EJ layer of individual address reports via `/api/intelligence/holc` to show whether the target address falls in a formerly redlined neighborhood.

**Refresh cadence**: The University of Richmond HOLC dataset is a historical archive — the HOLC maps themselves are from the 1930s and do not change. The crosswalk to modern Census tracts may be updated when Census revises tract boundaries (post-decennial census). Current crosswalk uses 2020 Census tract boundaries. Check the Mapping Inequality project for updates after the 2030 Census.

**Known limitations**:
- HOLC maps only exist for cities that participated in the federal home lending program and for which maps survive in archives. Coverage is uneven — Southern and Western cities are underrepresented.
- The A-D grading system reflects 1930s federal assessments, which were explicitly racist. Using this data requires acknowledging that HOLC grades are not measures of actual property quality — they are measures of who lived there.
- Census tract boundary mismatches: the crosswalk uses polygon intersection, so a modern tract may straddle multiple HOLC grade zones. The dominant grade (largest intersection area) is assigned.
- The dataset does not capture all mechanisms of racial residential segregation beyond HOLC — restrictive covenants, exclusionary zoning, and blockbusting are not encoded.

**Source**: University of Richmond Digital Scholarship Lab, Mapping Inequality: Redlining in New Deal America — https://dsl.richmond.edu/panorama/redlining/
Bundled as: `data/holc-crosswalk.json`
