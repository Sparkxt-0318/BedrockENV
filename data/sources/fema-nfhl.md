# FEMA NFHL — National Flood Hazard Layer

## What it covers
Authoritative federal flood maps used for NFIP (National Flood Insurance Program) rating. Defines Special Flood Hazard Areas (SFHA) — zones with ≥1% annual chance of flooding (100-year floodplain). Also covers 500-year floodplain (0.2% annual chance) and minimal-risk zones.

Zone classifications used in our scoring:
- **AE, A, AH, AO, VE**: High-risk SFHA (100-year); our primary flood flag
- **X (shaded)**: Moderate risk (500-year)
- **X (unshaded)**: Minimal risk

## What it does NOT cover
- Pluvial flooding (surface runoff, overwhelmed storm drains) — NFHL is riverine/coastal only
- Post-2022 flood events that haven't triggered a map revision
- Urban stormwater flooding patterns
- Future flood risk under climate change (see First Street for projections)

## Refresh cadence
FEMA updates NFHL continuously via Letter of Map Revision (LOMR) and Letter of Map Amendment (LOMA) processes. Major map updates are published as Flood Insurance Rate Map (FIRM) revisions. Queried live via the FEMA Flood Map Service Center API at assessment time.

## How we use it
Two uses:
1. **Soil scorer**: SFHA designation adds flood-exposure penalty to the soil vulnerability score
2. **CFCI national dataset**: FER (Flood Exposure Rate = fraction of residential structures in SFHA) derived from NFIP policy penetration rates per county, used in `data/cfci-national.json`

## Known limitations
- **Map currency**: Many NFHL panels are decades old and don't reflect current floodplain conditions. Climate-driven changes (sea-level rise, increased precipitation intensity) may render 100-year floodplain designations inaccurate.
- **Urban gap**: Dense urban areas with complex drainage infrastructure are poorly modeled by standard NFHL. FEMA's "Residual Risk" zones capture some of this but aren't used here.
- **API latency**: The FEMA Flood Map Service Center API can be slow (2–5s per query). We timeout at 8s and treat failures as coverage='partial'.
- **Levee-impacted areas**: Areas behind levees are sometimes classified as Zone X despite meaningful flood risk if the levee fails (NFHL shows "protected" zones as lower risk).
