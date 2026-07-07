# USDA SSURGO — Soil Survey Geographic Database

## What it covers
USDA's most detailed national soil data product. Provides soil properties at the map unit level including: organic matter content, drainage class, soil pH, texture (clay/sand/silt percentages), available water capacity, and erodibility (K factor). Bedrock queries by latitude/longitude to retrieve the dominant soil map unit and its properties.

## What it doesn't cover
- Urban areas with disturbed soils (SSURGO marks these as "urban land" with null properties — one of its biggest limitations)
- Soil contamination — SSURGO describes natural soil properties, not anthropogenic contamination
- Soil at depths below the standard survey horizon (typically 0–150cm)
- Bedrock/rock outcrops in mountainous areas

## How Bedrock uses it
Queried live via the USDA Soil Data Access REST API in `lib/data-sources/usda-ssurgo.ts`. Soil properties (organic matter, drainage, pH, texture) contribute to the soil vulnerability component of the SCVI score, and indirectly to the soil layer score for individual address assessments.

## Refresh cadence
SSURGO updates are released quarterly as individual surveys are completed. The SSURGO national layer is available via SoilWeb. No local bundle — queried live.

## Known limitations
- **Urban data gap**: Dense urban areas return "urban land" map units with null soil properties. This affects all urban addresses and is a known SSURGO limitation. Bedrock's SCVI notes this as an explicit gap.
- API reliability has been inconsistent; apply graceful degradation
- SSURGO measures soil vulnerability, not contamination — a contaminated Superfund site may show low SSURGO vulnerability if the soil texture is favorable

## Source
USDA SSURGO: https://www.nrcs.usda.gov/resources/data-and-reports/ssurgo
USDA Soil Data Access API: https://sdmdataaccess.nrcs.usda.gov/
