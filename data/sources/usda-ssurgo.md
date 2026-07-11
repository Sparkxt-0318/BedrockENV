# USDA SSURGO — Soil Survey Geographic Database

## What it covers
Soil survey data for the contiguous United States, compiled by the USDA Natural Resources Conservation Service (NRCS). Covers soil series, organic matter content, drainage class, pH, texture, and other physical/chemical properties at the polygon level (map unit level). Used to estimate baseline soil vulnerability to contamination.

## What it doesn't cover
- Actual contamination measurements (SSURGO measures intrinsic soil properties, not pollution levels)
- Urban fill soils (SSURGO frequently classifies urban/developed areas as "Urban land" with limited property data)
- Alaska, Hawaii, and US territories (partial coverage)
- Private brownfield contamination (covered by EPA Brownfields API)

## How we use it
Live REST API call to the USDA Soil Data Access web service (SOAP/REST). Query by lat/lng to get the map unit at the location, then fetch properties: organic carbon, drainage class, pH, and texture class. These are normalized into a soil vulnerability sub-score. High organic matter + poor drainage = higher contamination retention risk.

## Refresh cadence
SSURGO is updated annually as NRCS completes new surveys and revises existing ones. The REST API always returns the current dataset — no bundled copy. Last major update: fiscal year 2025 release.

## Known limitations
1. **Urban land gap**: SSURGO classifies developed urban areas as "Urban land" or "Udorthents" with no measured soil properties. This affects scoring for the majority of US addresses (cities, suburbs). We handle this by falling back to regional averages, but it reduces data resolution.
2. **Intrinsic vs. contaminated**: SSURGO measures what the soil is like naturally, not whether it's contaminated. A pristine clay soil will score as "high vulnerability" because clay retains contaminants — even if no contaminants are present. This is intentional (we're scoring risk potential, not measured contamination), but it can confuse interpretation.
3. **API latency**: USDA Soil Data Access can be slow (1–3s) and occasionally unavailable. We cache per-assessment.
4. **Depth of data**: SSURGO surface-layer data (0–30cm) may not reflect subsurface contamination from historical industrial use.

## Source
USDA NRCS Soil Data Access: https://sdmdataaccess.nrcs.usda.gov/
SSURGO documentation: https://www.nrcs.usda.gov/resources/data-and-reports/ssurgo
