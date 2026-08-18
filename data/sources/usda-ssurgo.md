# USDA SSURGO — Soil Survey Geographic Database

## What it covers
Soil properties for the map unit at a geographic point:
- Texture (sand, silt, clay percentages, texture class)
- pH (water 1:1)
- Organic matter percentage
- Cation Exchange Capacity (CEC, meq/100g)
- Saturated hydraulic conductivity (Ksat)
- Drainage class
- Hydrologic soil group (A/B/C/D)

Data is aggregated from the 0–25 cm surface horizon band (residential exposure relevant).
Components weighted by their map unit percentage (comppct_r).

## What it doesn't cover
- Chemical contamination (heavy metals, PFAS, pesticides) — SSURGO measures physical
  and chemical properties of naturally occurring soils, not anthropogenic contamination
- Urban fill and anthropogenic soils are classified as "miscellaneous areas" with no
  chemistry — these are excluded from aggregation
- Subsurface conditions below ~25 cm (relevant for foundation risk but not residential exposure)

## Refresh cadence
SSURGO is updated by USDA NRCS on an ongoing basis as county surveys are revised.
Major releases approximately annually. API is live (Soil Data Access, SDA).
Cache: 90 days per point.

API: `https://SDMDataAccess.sc.egov.usda.gov/Tabular/SDMTabularService/post.rest`

## Known limitations
- Urban areas often return "partial" coverage because urban land, fill, and developed
  areas are classified as miscellaneous without chemistry data
- WKT coordinate order is (longitude, latitude) — swapping returns zero rows silently
- Map unit resolution is typically 1–100 acres, not parcel-level

## Bedrock usage
Soil layer primary source. Contributes to Soil Vulnerability Score (SVS) in the SCVI
national dataset. Resolution: NEIGHBORHOOD-LEVEL (map unit polygon).
Cache: 90-day TTL.
