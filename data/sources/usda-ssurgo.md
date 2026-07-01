# USDA SSURGO — Soil Survey Geographic Database

**Live API module:** `lib/data-sources/usda-ssurgo.ts`
**Used in:** Soil vulnerability layer (SVS sub-score of SCVI)

## What it covers
- Pedon-level soil survey data for ~95% of US land area (excludes most urban areas and some western rangelands)
- Organic matter percentage, soil pH, drainage class, texture (sand/clay/silt percentages), hydraulic conductivity (Ksat)
- Hydrologic soil group (A/B/C/D) indicating runoff and infiltration characteristics
- Map unit keys (mukey) queried via the Soil Data Access (SDA) SOAP/REST API
- Queried at a point location; returns the dominant component for the map unit at that coordinate

## What it doesn't cover
- Urban land map units (symbol "U" or "UR") — majority of urban soils are not characterized
- Made land, fill, and brownfield soils — surface soils may have been removed or buried
- Contamination state — SSURGO describes natural soil properties, not what has been spilled on it
- Subsurface soil conditions below the surveyed depth (~1.5–2m for most map units)
- Alaska north of the Arctic Circle and some Pacific island territories

## Refresh cadence
- **Annual check** — USDA NRCS releases SSURGO updates through the Web Soil Survey (WSS) and gSSURGO
- Source: https://www.nrcs.usda.gov/resources/data-and-reports/ssurgo
- API endpoint: https://sdmdataaccess.sc.egov.usda.gov/
- gSSURGO national mosaic is updated annually each September

## Known limitations
- Urban soil gap is the largest coverage limitation — SSURGO explicitly disclaims accuracy for developed land
- Some map units in rapidly developing areas are mapped as farmland but have been converted
- Survey vintage varies: some western counties use maps from the 1950s–1970s with coarse resolution
- Querying by point returns the dominant component, which may not represent minor inclusions of different soil types
- Ksat values are estimated from texture and structure — field-measured values can differ significantly
