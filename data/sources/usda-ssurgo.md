# USDA SSURGO — Soil Survey Geographic Database

## What it covers
The primary national soil survey — detailed soil characterization data for ~95% of US land area. Provides: organic matter content, soil pH, drainage class, texture (sand/silt/clay percentages), and USDA land capability class. Used as the foundation for the Soil Vulnerability Score (SVS) sub-component of SCVI.

We query via the USDA Web Soil Survey (WSS) REST API / Soil Data Access endpoint.

## What it does NOT cover
- **Urban data gap**: SSURGO has reduced or no coverage for heavily urbanized areas (mapped as "Urban land" or "Made land" with generic properties). This is the "urban blind spot" described in the SCVI methodology: cities like Newark, Detroit, and South LA — often the highest-contamination areas — receive incomplete soil data.
- Antarctic, US territories (incomplete coverage)
- Subsurface contamination: SSURGO describes natural soil properties, not contamination from dumping, spills, or industrial activity

## Refresh cadence
SSURGO is updated on a rolling basis by USDA NRCS field offices. Major national updates are released 1–2× per year. Our queries hit the live Soil Data Access API at assessment time — no bundled snapshot. The SCVI national build (`scripts/build-scvi-national.ts`) fetches from SSURGO at build time.

## How we use it
The SVS (Soil Vulnerability Score) uses SSURGO for:
- `scoreOrganicMatter`: organic matter % → soil's ability to bind/buffer contaminants
- `scorePh`: pH → contaminant mobility (acidic soils mobilize heavy metals)
- `scoreDrainage`: drainage class → leaching rate to groundwater
- `scoreTexture`: clay/sand fraction → contaminant retention vs. transport

When SSURGO returns "Urban land" or null, `scoreUrbanGap` adds a penalty (urban areas have unknown soil conditions but high contamination pressure).

## Known limitations
- **Urban blind spot**: As noted above, the largest gap in the scoring model. Urban EJ communities receive penalized soil scores, but the penalty may understate actual contamination for brownfield-dense areas.
- **API rate limits**: Soil Data Access has an informal rate limit of ~10 requests/second. We add 200ms jitter between calls in the SCVI national build.
- **Vintage**: Some SSURGO map units haven't been field-verified in decades. Soil properties can change (organic matter loss, pH drift from acid deposition).
- **Point query**: We query a single centroid for the address parcel. Large or irregular parcels may have heterogeneous soil types not captured by the centroid.
