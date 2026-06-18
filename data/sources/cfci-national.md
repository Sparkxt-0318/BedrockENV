# Data Source: CFCI National County Scores (`cfci-national.json`)

## What it covers
Compound Flood-Contamination Index (CFCI) scores for 3,131 US counties, computed as
CFCI = √(FloodExposureScore × CPI) normalized 0–100. Fuses FEMA NFIP residential
Special Flood Hazard Area (SFHA) penetration rates (FloodExposureScore) with the
SCVI Contamination Pressure Index (CPI). Identifies counties where flood exposure and
contamination risk compound, creating elevated risk of contaminated floodwater contact.

Each record includes: CFCI, FER (Flood Exposure Rate), CPI, quartile classification,
and Census ACS demographics (income, poverty rate).

Used by the `/intelligence/flood-contamination` page and the soil chapter of individual
reports (flood-contamination risk overlay).

## What it does NOT cover
- Future flood risk projections (based on current NFIP participation, not climate models)
- Non-residential flood exposure (commercial, industrial buildings)
- Compound risk from storm surge or coastal erosion (NFIP data is primarily riverine)
- Contamination from industrial flooding events specifically — CPI is a static
  contamination pressure score, not an event-response dataset

## Refresh cadence
- FEMA NFIP flood participation data: Updated by FEMA quarterly
- CPI component: Same as SCVI-national (annual)

**Recommended rebuild**: Annually, aligned with SCVI rebuild.

## Known limitations
- NFIP participation is a proxy for flood exposure — counties with low participation
  rates but high uninsured flood risk will be under-scored.
- 9 Connecticut planning regions receive no CFCI score (same as SCVI).
- CPI is county-level; within-county variation is not captured.

## Build script
Generated as part of the intelligence data pipeline.
CFCI = √(FER × CPI), where FER is computed from FEMA NFIP data.
