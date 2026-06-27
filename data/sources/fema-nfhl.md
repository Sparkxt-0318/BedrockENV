# FEMA NFHL — National Flood Hazard Layer

## What it covers
Flood hazard zone designation at a query point. Returns:
- Zone designation (AE, VE, X, etc.) with SFHA (Special Flood Hazard Area) flag
- Risk tier (HIGH / ELEVATED / MODERATE / LOW)
- All intersecting flood zone features (a coastal parcel can sit in VE + AE)
- Base Flood Elevation (BFE) where available

Queries FEMA's ArcGIS REST service (layer 28 — S_FLD_HAZ_AR).
Data resolution: parcel scale (digitized county-by-county).

## What it does NOT cover
- Pluvial flooding (overland stormwater) — NFHL only covers fluvial/coastal FEMA zones
- Inland flooding risk from infrastructure failure (dam breaks, etc.)
- Future flood risk under climate change (current FEMA maps are often decades old)
- Undigitized counties: ~300 counties, mostly rural/tribal, have never been mapped;
  these return empty results that are indistinguishable from Zone X (low-risk)
- Flood frequency beyond 1% annual chance (100-year) — 0.2% events not scored here

## Refresh cadence
FEMA NFHL is updated county-by-county on a rolling basis. The ArcGIS service
serves the current FIRM (Flood Insurance Rate Map) effective date per county.
Some FIRM maps are 20–30 years old; coastal areas have been remapped but many
inland counties use pre-1990 maps.
Query at assessment time — no bundle needed. Cache: 90 days.

## Known limitations
- ArcGIS returns HTTP 200 with an `{error:{code,message}}` envelope on invalid
  parameters; must check body, not just status
- Empty `features: []` is ambiguous: could be Zone X (fine) or undigitized county
  (data gap) — both return `coverage: 'unmapped'`
- FEMA maps significantly underestimate true flood risk in many areas (first-generation
  maps predate modern LiDAR; many communities have expanded impervious surfaces)
- Community-acknowledged flood risk (repetitive loss properties) is not reflected
  in zone designation

## Layer assignment
Soil layer — flood zone component.
Also used in CFCI (Compound Flood-Contamination Index) national map.
