# FEMA NFHL — National Flood Hazard Layer

## What it covers
FEMA flood zone designation at a given property point. Returns the flood zone classification (e.g., AE, VE, X) and the associated risk tier for the queried location, along with all overlapping flood hazard polygons.

**Runtime module:** `lib/data-sources/fema-nfhl.ts`  
**API:** FEMA ArcGIS REST  
`https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28/query`

## Flood zone categories
| Zone | Risk | Description |
|------|------|-------------|
| VE / V | critical | Coastal high-velocity wave action zone (1% annual chance + wave height) |
| AE / A / AH / AO | high | Special Flood Hazard Area (1% annual chance flood) |
| AE (floodway) | critical | Active floodway within AE zone |
| X (shaded) | moderate | 0.2% annual chance (500-year flood) |
| X (unshaded) | low | Minimal flood hazard |
| Not mapped | unmapped | County not digitized or no FEMA study |

## What it doesn't cover
- Unregulated fills and informal drainage channels not captured in NFHL
- Future flood risk from climate change (NFHL is based on historical/current conditions)
- Sea level rise projections
- Pluvial flooding (inland urban flooding from rainfall intensity, not river/coastal)
- Post-Harvey or post-Ida areas not yet remapped (remapping takes 5–7 years after major events)

## Refresh cadence
FEMA continuously updates the NFHL as Flood Insurance Rate Maps (FIRMs) are revised. The ArcGIS service reflects the current effective FIRM for each county. No local bundle needed — live API.

## Known limitations
- **Unmapped ambiguity**: When `features: []` is returned, it could mean Zone X (low risk) OR the county has never been digitized. There is no way to distinguish these from a single-point query. The runtime client reports `coverage: 'unmapped'` in both cases.
- **Out-of-date maps**: Many FIRMs are 20–30 years old and do not reflect current development, subsidence, or rainfall intensification. A Zone X designation on an old map may be misleading.
- **Property-level vs. parcel**: The NFHL flood zone at a lat/lng point does not guarantee the entire property is in that zone; large parcels may straddle zone boundaries.
- **NFHL API service path**: FEMA's ArcGIS services are at `/arcgis/rest/services/public/NFHL/MapServer/` — the legacy `/gis/nfhl/rest` path returns a 404 HTML page. Do not change this path without verifying.
- **ArcGIS error envelopes**: The API returns HTTP 200 with an `{error: {code, message}}` body for invalid parameters. The runtime client inspects the response body, not just the HTTP status.

## Scoring integration
NFHL flood zone feeds the soil sub-score (flood-risk component). VE/AE zones are primary risk signals. Coastal properties are additionally scored on distance to shoreline (CFCI national dataset).
