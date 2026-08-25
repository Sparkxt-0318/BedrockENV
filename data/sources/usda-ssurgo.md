# USDA SSURGO — Soil Survey Geographic Database

## What it covers
Most detailed publicly available soil survey data for the US (~95% coverage). Provides soil properties at the map unit component level: drainage class, organic matter content, pH, texture class, flooding frequency, and ~100 other properties. The backbone of the SVS (Soil Vulnerability Score) sub-component of the SCVI.

## What it doesn't cover
- Urban impervious surfaces (many urban map units classified as "Urban land" without soil properties)
- Contamination — SSURGO describes natural soil properties, not pollutant concentrations
- Alaska (covered by STATSGO2, coarser resolution)
- Recent disturbances (construction, contamination events post-survey date)

## API
USDA Web Soil Survey API / Soil Data Access: `https://SDMDataAccess.sc.egov.usda.gov/`
Tabular queries via SOAP/REST for mukey → component → chorizon data.

## Refresh cadence
Continuous improvement; individual survey areas updated as field work is completed. Check: https://www.nrcs.usda.gov/resources/data-and-reports/web-soil-survey

## Known limitations
- **Urban blind spot**: ~18% of US counties have >40% "Urban land" or "Made land" map units with no properties — this is the primary coverage gap in the SVS model
- Survey dates vary 1950s–present; older surveys may not reflect current soil conditions
- Map unit component fractions require weighting for composite properties
- Organic matter content measured differently across survey vintages

## Bedrock usage
Soil layer and SCVI SVS sub-component. Query targets drainage, organic matter, pH, texture. Urban gap detection drives the SSURGO coverage flag. See `lib/data-sources/usda-ssurgo.ts`.
