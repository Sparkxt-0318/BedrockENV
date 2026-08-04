# USDA SSURGO — Soil Survey Geographic Database

## What it covers
Physical and chemical soil properties at the map unit level across the contiguous United States and Hawaii. Includes texture (sand/silt/clay percentages), pH, organic matter content, cation exchange capacity (CEC), saturated hydraulic conductivity (Ksat), drainage class, hydrologic soil group, and more. Survey is conducted at the county level by USDA NRCS.

## What it doesn't cover
- Anthropogenic contamination (SSURGO surveys natural soil properties, not pollution)
- Urban-filled areas coded as "Urban land" (no chemistry data)
- Rock outcrops, water bodies, and miscellaneous areas
- Subsurface contamination at depth (surveys 0–25 cm surface horizon)
- Alaska (different STATSGO coverage)
- Areas not yet surveyed (coverage is ~95% of US land area)

## How Bedrock uses it
Queried via USDA Soil Data Access (SDA) tabular web service. Query uses `SDA_Get_Mukey_from_intersection_with_WktWgs84('POINT(lon lat)')` to resolve the map unit at a given point — **WKT coordinates must be (lon, lat) order**, not (lat, lon). Aggregates soil properties across components weighted by component percentage (comppct_r), averaging the 0–25 cm surface band.

## Refresh cadence
SSURGO updates annually as county surveys are completed or revised. Live API queries reflect the current database state. Soil properties change slowly — updates are infrequent for surveyed areas.

## Known limitations
- Map unit resolution (typically 1–100 acres) — property-level variation is not captured
- Urban land components return null chemistry in all fields (the scorer marks these as 'partial' coverage)
- The SDA API occasionally returns zero rows for valid coordinates due to geometry precision issues — the scorer handles this as 'unmapped'
- Does not capture soil contamination from industrial activity (that requires EJScreen, brownfields, TRI sources)
- Hydrologic soil group (A/B/C/D) influences infiltration and runoff risk but is only available for surveyed areas
