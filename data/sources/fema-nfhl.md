# FEMA NFHL — National Flood Hazard Layer

## What it covers
Flood zone designations for a precise lat/lng point. Returns: headline flood zone code (e.g. `AE`, `VE`, `X`), zone description, SFHA (Special Flood Hazard Area) flag, risk tier (`HIGH`/`MODERATE`/`LOW`), static Base Flood Elevation (BFE) in feet, and all intersecting zone features. Multiple overlapping zones (e.g. coastal VE + AE) are all returned; the most hazardous is selected as the headline using a defined ranking table.

## What it doesn't cover
- Future climate projections (NFHL reflects current official FIRMs, not updated risk models)
- Levee-protected areas (these can show as Zone X despite real flood risk)
- Coastal wave action zones beyond FEMA's current studies
- Flood velocity or depth (BFE only, not depth above grade)

## How it works
Live ArcGIS REST query to FEMA NFHL, layer 28:
`https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28/query`
Parameters: point geometry (WKID 4326), `spatialRel=esriSpatialRelIntersects`, `outFields=FLD_ZONE,ZONE_SUBTY,SFHA_TF,STATIC_BFE`.
Timeout: 15 s with retries.

## Refresh cadence
Live API calls on every request. NFHL is updated as counties are re-studied (continuously rolling basis). Intended cache: 90 days (not yet implemented in this module).

## Known limitations
- Empty feature arrays are ambiguous — could be Zone X (low hazard) or an un-digitized county; cannot be distinguished from a single point query. Both reported as `coverage: 'unmapped'` with `LOW` risk tier
- STATIC_BFE sentinels -9999 and 9999 are filtered out; 0 and negative values are also dropped
- Shaded Zone X (`ZONE_SUBTY` matching "0.2 PCT ANNUAL CHANCE FLOOD HAZARD") is remapped to Zone B for risk-tier lookup
- ArcGIS error envelopes (HTTP 200 with `{error: {code, message}}`) are handled
- The `/gis/nfhl/` path returns an IBM WebSEAL 404; only the `/arcgis/rest/` path works
- Does not account for first-floor elevation relative to BFE
