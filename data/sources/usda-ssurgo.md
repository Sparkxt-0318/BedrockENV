# USDA SSURGO — Soil Survey Geographic Database

## What it covers
USDA NRCS soil survey data for the continental US. Provides soil physical and chemical properties at the map unit level (typically 1-10 acres resolution). Key properties used in scoring:

- Organic matter content (% by weight)
- Soil pH
- Drainage class (excessively drained → very poorly drained)
- Texture class (sand/silt/clay percentages → Sandy/Loamy/Clayey/Organic)
- K-factor (erodibility)
- Depth to water table

**API**: USDA Web Soil Survey SOAP service (SoilDataAccess)

## What it doesn't cover
- Urban fill areas (many urban soils are mapped as "Urban land" or "Made land" — SSURGO has no physical properties for these)
- Contamination data (SSURGO measures soil *properties*, not contamination *levels*)
- Subsurface contamination below the typical survey depth (~150cm)
- Post-1990 soil disturbances (SSURGO surveys were conducted over decades; urban areas remapped infrequently)

## Refresh cadence
SSURGO is updated irregularly (county-by-county resurveys). No centralized release schedule. Most surveys are 15-30 years old; some urban areas have never been resurveyed since initial mapping.

**Live API**: `lib/data-sources/usda-ssurgo.ts`
**Timeout**: 15 seconds.

## Known limitations
1. **Urban land gap**: Highly urbanized addresses return "Urban land" for most soil map units — SSURGO has no chemical properties for urban fill. This triggers the `urban_gap` flag in the soil layer, which reduces SVS score reliability.
2. **Survey age**: Many SSURGO surveys date to the 1960s-1980s. Soil conditions in industrialized areas have changed significantly.
3. **SOAP API complexity**: The SoilDataAccess SOAP interface is complex; `usda-ssurgo.ts` is the largest data-source file (436 lines) due to response parsing.
4. **No contamination data**: SSURGO tells us if soil is sandy (high permeability → faster contaminant migration) but not whether it is contaminated.

## Scoring integration
Layer: Soil (15% weight). Sub-component: soil vulnerability (organic matter, pH, drainage, texture). Used in both individual address scoring and SCVI national dataset. Formula in `lib/scoring/soil-scorer.ts` and `lib/intelligence/scvi-scorer.ts`.
