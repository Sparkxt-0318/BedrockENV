# FEMA NFHL — National Flood Hazard Layer

## What it covers
Digitized Flood Insurance Rate Maps (FIRMs) from FEMA, showing Special Flood Hazard Areas (SFHAs) at the parcel level. Zone A/AE = 1% annual chance flood (100-year); Zone X = minimal hazard; Zone V = coastal with wave action. Used for mandatory flood insurance requirements on federally-backed mortgages.

## What it doesn't cover
- Pluvial flooding (heavy rain/urban stormwater — not mapped in FIRMs)
- Dam failure inundation zones (see FEMA NID)
- Climate-adjusted projections (FIRMs are based on historical hydrology)
- Properties in unmapped/unstudied areas (~40M parcels)

## API
FEMA National Flood Hazard Layer WFS: `https://hazards.fema.gov/gis/nfhl/services/public/NFHL/MapServer/WFSServer`
Also available as bulk download from FEMA Map Service Center.

## Refresh cadence
Irregular (updated as FEMA completes map revision studies). County-by-county currency varies widely — some FIRMs are 20+ years old. Check effective date per county. FEMA NFIP Community Status Book for coverage.

## Known limitations
- Many counties have outdated FIRMs that undercount true flood risk
- First Street Foundation estimates 70% more properties are at risk than FEMA maps show
- Does not account for sea level rise or increased precipitation intensity
- SFHA determinations are binary — no probability gradients within zones
- NFIP statistics used in CFCI are at the county level, not parcel (precision loss)

## Bundled file
`data/flood-by-county.json` — NFIP residential SFHA penetration rates (residential policies in SFHA / total residential parcels) per county FIPS. Source: FEMA NFIP Policy Statistics 2024.

## Bedrock usage
Soil layer flood zone sub-score and CFCI Flood Exposure Rate (FER). See `lib/data-sources/fema-nfhl.ts`.
