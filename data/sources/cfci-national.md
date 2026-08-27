# CFCI — Compound Flood-Contamination Index (Bedrock proprietary)

## What it covers
County-level Compound Flood-Contamination Index for 3,131 US counties. Formula: CFCI = √(FloodExposureScore × CPI) normalized 0–100.
- **FES** (Flood Exposure Score): FEMA NFIP residential Special Flood Hazard Area (SFHA) penetration rate
- **CPI**: Same contamination pressure layer as SCVI

Identifies counties where flood events are likely to mobilize contaminants — the compound risk scenario where toxic sites and flood zones overlap.

## What it doesn't cover
- Coastal storm surge (NFIP SFHA captures riverine and some coastal, not all surge scenarios)
- Future climate projections (current FEMA maps are static, not forward-looking)
- Sub-county flood risk variation
- Inland flood risk from extreme precipitation not yet mapped by FEMA

## Refresh cadence
- FEMA NFIP data: Updated as counties update their Flood Insurance Rate Maps (FIRMs); rebuild annually
- CPI: Same cadence as SCVI (annual with TRI release)
- Bundled as: `data/cfci-national.json` and `data/flood-by-county.json`

## Source
- FEMA NFIP: https://www.fema.gov/flood-insurance/work-with-nfip/data-downloads
- Build script: derived from SCVI CPI layer + FEMA SFHA data
- `/intelligence/flood-contamination` page

## Known limitations
- FEMA flood maps are notoriously out of date in many jurisdictions — 30-40% of US flood damage occurs outside mapped SFHA
- SFHA penetration rate measures properties *in* flood zones, not the severity of flooding
- Does not model contaminant transport pathways — proximity is used as a proxy for compound risk
