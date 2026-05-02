# USDA SSURGO — Soil Survey Geographic Database

## What it covers
Detailed soil properties at the map-unit level, queried via the USDA Soil Data Access (SDA) Tabular service. For each address, Bedrock retrieves: soil texture (sand/silt/clay %), pH, organic matter %, cation exchange capacity (CEC), saturated hydraulic conductivity (Ksat), and drainage class. Coverage is reported as `mapped`, `partial` (intersection found but all-null chemistry), or `unmapped`.

The query aggregates horizon data for the 0–25 cm surface layer (residential-exposure-relevant depth), averaged across components weighted by their map-unit percentage (`comppct_r`).

## What it doesn't cover
- Actual contamination: SSURGO measures natural soil properties, not industrial pollutants
- Subsurface contamination below the 25 cm surface layer (important for LUST/brownfield sites)
- Urban fill or disturbed soils accurately — urban map units are often classified as "Urban land" with null chemistry
- Soils in unmapped areas (some tribal land, some Alaskan areas, some very recent survey areas)
- Dynamic changes: SSURGO is a survey snapshot, not real-time monitoring

## Refresh cadence
SSURGO is updated annually as new or revised soil surveys are released by NRCS. The SDA API reflects the current release. Bedrock caches SDA responses for **90 days**.

## Known limitations
- Map units are typically 1–100 acres. Soil properties can vary substantially within a single unit; the result is representative of the unit, not the specific parcel.
- WKT coordinate order in the SDA query is `POINT(lon lat)` (not lat/lon). Swapping them silently returns zero rows — this is a documented footgun in the SDA API.
- Miscellaneous area components (rock outcrops, water, urban land) are excluded from averaging. In heavily urbanized areas, the result may reflect only a small fraction of the actual surface.
- The SDA API can be slow (4–10s) and has occasional downtime during NRCS maintenance windows.
