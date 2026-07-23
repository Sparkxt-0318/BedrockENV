# FEMA NFHL — National Flood Hazard Layer

## What it covers
Authoritative flood zone maps used for the National Flood Insurance Program (NFIP). Defines Special Flood Hazard Areas (SFHA) — areas with ≥1% annual chance of flooding (100-year floodplain). Also covers 500-year floodplain, regulatory floodways, and coastal high-hazard areas.

## What it does NOT cover
- Unmapped areas (many rural communities lack current flood maps — FEMA estimates >30% of flood losses occur outside mapped SFHAs)
- Flash flooding, storm surge beyond mapped extents
- Inland flooding from poor drainage not modeled in the hydraulic study
- Future flood risk from climate change (maps reflect historical hydrology)
- Areas with outdated maps (some counties have maps that are 20+ years old)

## API used
FEMA Map Service Center NFHL REST API:
`https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/28/query`
- Returns flood zone polygon at a given lat/lng point
- Zone codes: A, AE, AO, AH, X (500-yr), X (outside), V/VE (coastal)

## Refresh cadence
Real-time API. FEMA continuously updates flood maps via Letter of Map Amendment (LOMA) and Letter of Map Revision (LOMR) processes. Large-scale remapping efforts (Risk MAP program) update entire counties.

## NFIP penetration rates (CFCI)
For the Compound Flood-Contamination Index (CFCI), Bedrock uses county-level NFIP residential structure penetration rates (fraction of residential structures in SFHA that have NFIP policies) as a proxy for flood exposure. This is bundled from FEMA NFIP policy data.

## Known limitations
- **Map age**: Many FEMA maps are significantly outdated and don't reflect current conditions, infrastructure changes, or sea level rise
- **Point query**: A single lat/lng may fall in a different zone than the actual structure footprint; slab-on-grade homes may straddle zone boundaries
- **Zone X (shaded)**: 500-year floodplain is coded as "moderate risk" but FEMA maps are not always precise at this boundary
- **Coastal retreat**: Maps do not account for shoreline erosion; coastal properties may be more exposed than shown
- **Levee-protected areas**: FEMA maps often show areas behind levees as Zone X (protected), but levee failure risk is not reflected in the map
