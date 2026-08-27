# SCVI — Soil Contamination Vulnerability Index (Bedrock proprietary)

## What it covers
County-level Soil Contamination Vulnerability Index for all 3,140 US counties. Formula: SCVI = √(SVS × CPI) normalized 0–100.
- **SVS** (Soil Vulnerability Score): SSURGO organic matter, drainage, pH, texture, climate erosivity, urban data gap
- **CPI** (Contamination Pressure Index): legacy industrial sites, active industrial density, compliance violations, toxic releases

## What it doesn't cover
- Sub-county variation (census tract or parcel level)
- Site-specific contamination from point sources (use Superfund/brownfields layers for that)
- Agricultural chemical inputs (pesticides, nitrates) — not in SSURGO or TRI at the resolution needed
- 9 Connecticut planning regions unmatched to Census ACS (CT converted from counties to planning regions in 2022)

## Refresh cadence
- SSURGO: USDA refreshes continuously; full rebuild recommended annually
- TRI: Annual release (current: 2022 reporting year); rebuild when 2023/2024 TRI data is released
- Bundled as: `data/scvi-national.json` (3,131 counties matched to ACS demographics)

## Source
- USDA SSURGO: https://www.nrcs.usda.gov/resources/data-and-reports/soil-survey-geographic-database-ssurgo
- EPA TRI: https://www.epa.gov/toxics-release-inventory-tri-program
- EPA ECHO: https://echo.epa.gov/
- Build script: `scripts/build-scvi-national.ts`

## Known limitations
- Urban data gap: SSURGO lacks soil composition data for developed parcels in dense urban areas (~15% of US by area)
- CPI uses county-level aggregation — individual site risk not captured
- SCVI is a relative index (0–100 normalized across counties), not an absolute contamination measure
