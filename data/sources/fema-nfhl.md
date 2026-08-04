# FEMA NFHL — National Flood Hazard Layer

## What it covers
Official FEMA flood zone designations for parcels and addresses, derived from Flood Insurance Rate Maps (FIRMs). Designations include Special Flood Hazard Areas (SFHA: Zone A, AE, AH, AO, V, VE) which represent the 1% annual chance (100-year) flood plain, and moderate-to-low risk zones (Zone X, B, C). Also covers FEMA National Flood Insurance Program (NFIP) county-level data on flood insurance penetration rates (used in CFCI national intelligence brief).

## What it doesn't cover
- Flooding from sources not modeled in the FIRM (unmapped streams, urban stormwater)
- Areas with outdated FIRMs (maps are updated on a rolling basis, many are 10–20 years old)
- Climate change projections (FIRMs use historical data)
- Compound flooding (pluvial + fluvial + coastal simultaneously)
- Areas without FIRM coverage (some rural counties are not mapped)

## How Bedrock uses it
Queried via FEMA Flood Map Service Center REST API (NFHL WFS endpoint) by lat/lng to identify the flood zone designation for a parcel. Zone classification is used in the soil layer as a flood risk sub-component. Special Flood Hazard Area designation (Zone AE, A, V, VE) increases soil/land risk score.

## Refresh cadence
FEMA updates FIRMs on a rolling basis by county; new maps become effective after a 90-day comment period. Live API reflects the current effective FIRM for each county.

## Known limitations
- Many FIRMs are outdated — areas affected by post-storm development or climate-driven changes may have incorrect designations
- Properties near Zone X/AE boundaries are highly sensitive to small geocoding errors
- Does not capture stormwater flooding (pluvial), which has become a major urban flood risk not well captured by FIRMs
- NFIP penetration rate data (used in CFCI) is at county level and doesn't reflect distribution within the county
