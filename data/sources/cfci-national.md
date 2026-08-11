# CFCI — Compound Flood-Contamination Index (Bedrock Original)

## What it covers
Bedrock-computed composite index identifying US counties where flood exposure and contamination pressure compound. Formula: `CFCI = √(FES × CPI)` normalized 0–100.

- **FES** (Flood Exposure Score): FEMA NFIP residential structures in Special Flood Hazard Areas (SFHA) as a fraction of total residential structures, by county
- **CPI** (Contamination Pressure Index): same as SCVI (see `scvi-national.md`)

Identifies ~783 Q4 counties (~73M residents) where both flood exposure and contamination pressure are in the top quartile.

- **Bundle files**: `data/cfci-national.json`, `data/flood-by-county.json`
- **Bundle generated**: 2026-04-20

## What it doesn't cover
- Fluvial vs. coastal flood type distinction — NFIP SFHA penetration rate captures both
- Private flood insurance policies (NFIP only)
- Future flood risk under climate change scenarios — current FEMA maps reflect historical flood frequency, not projected changes
- Property-level flood-contamination interaction — county-level resolution only

## Refresh cadence
- FEMA NFIP data: FEMA publishes updated policy and claims data quarterly. Structural flood exposure rates change slowly.
- CPI: see `scvi-national.md`

FEMA NFIP source: https://www.fema.gov/flood-insurance/work-with-nfip/statistics

## Known limitations
- FEMA flood maps are notoriously out of date in many jurisdictions — some date to the 1970s–1980s. Actual flood risk may exceed SFHA designation in many areas.
- Counties with zero NFIP residential policies (e.g., areas where flood insurance isn't purchased) score FES=0, potentially underrepresenting actual flood exposure
- The compound metric multiplies flood and contamination — a county with extremely high contamination but no mapped floodplain scores low on CFCI, even if informal flooding occurs
