# USDA SSURGO — Soil Survey Geographic Database

**Bedrock adapter**: `lib/data-sources/usda-ssurgo.ts`
**Scoring layer**: Soil
**API**: USDA Web Soil Survey REST API (`https://SDMDataAccess.sc.egov.usda.gov/`)

## What it covers
- Soil series, texture, drainage class, pH, organic matter, hydrologic group
- Coverage for agricultural and non-urban land throughout the US
- Soil component data used in SCVI (Soil Contamination Vulnerability Index)
- Also covers erodibility (K factor), available water capacity, flood frequency class

## What it does NOT cover
- **Urban soils**: SSURGO maps are marked "Urban Land" for dense cities — no soil properties are returned. This is the "urban blind spot" documented in the SCVI research brief
- **Contamination measurements**: SSURGO measures soil type/quality, not contamination levels. It tells you whether a soil CAN hold contaminants (vulnerability), not whether it IS contaminated
- **Alaska and territories**: SSURGO coverage is incomplete for Alaska, Hawaii, and US territories
- **Deep subsurface**: SSURGO covers the top ~60 inches of soil. Contamination plumes at depth are not reflected

## Refresh cadence
- SSURGO is updated continuously as USDA completes new soil surveys; major refreshes are infrequent (years)
- Check https://www.nrcs.usda.gov/resources/data-and-reports/ssurgo/stats2go for release dates
- Bedrock makes live API calls; no static bundle
- Changes to SSURGO data structure would require updates to `lib/data-sources/usda-ssurgo.ts`

## Known limitations
- **Urban data gap**: ~15-20% of US addresses (dense urban areas) return "Urban Land" from SSURGO, causing soil vulnerability sub-score to default to 0. This systematically undercounts soil risk for urban addresses
- **No contamination detection**: SSURGO indicates soil porosity and contamination mobility potential. A highly permeable sandy soil will score as "vulnerable" even if uncontaminated, and an impermeable clay soil will score "low vulnerability" even if contaminated
- **API response size**: SSURGO tabular queries can return large XML payloads; adapter includes timeout and parsing logic. Complex polygon queries occasionally fail for small rural parcels
- **NJ pilot notes**: During the SCVI NJ pilot, "Urban Land" maps to Middlesex, Union, Essex, Hudson counties — the most contaminated counties in the state. Urban soil scores understate actual contamination risk
