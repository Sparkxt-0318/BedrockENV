# FEMA NFHL — National Flood Hazard Layer

## What it covers
Flood insurance rate map (FIRM) designations for every digitized location in the US. Bedrock queries the FEMA NFHL ArcGIS REST service (MapServer layer 28 — Flood Hazard Zones) for all flood-hazard polygons that intersect the query point. Returns the headline zone (most hazardous) and all intersecting zones.

Zone hierarchy (highest to lowest risk): VE (coastal wave action) → AE (riverine 1% annual chance) → AH/AO/A → X Shaded (0.2% annual chance) → X Unshaded → not mapped.

## What it doesn't cover
- Areas not yet digitized by FEMA (primarily rural counties, tribal land, some Alaskan areas)
- Future flood risk under climate change (NFHL reflects historical hydrology)
- Pluvial flooding (heavy rain / stormwater) — NFHL covers riverine and coastal sources
- Dam failure inundation zones

## Refresh cadence
FEMA updates NFHL county by county as FIRM revisions are completed. The ArcGIS service reflects the current official FIRM. Bedrock caches NFHL queries for **90 days**.

## Known limitations
- Empty `features` array from the API is ambiguous: it can mean Zone X (low risk) or not-yet-digitized. Bedrock reports `coverage: 'unmapped'` in both cases and scores conservatively.
- NFHL reflects FEMA-modeled 1% annual chance flood; actual flood risk in many areas (particularly coastal) is higher due to sea level rise and intensifying rainfall not yet incorporated into FIRMs.
- A property on the boundary of a SFHA (Special Flood Hazard Area) may be in or out depending on parcel centroid vs. actual building footprint.
- The FEMA ArcGIS service URL path is `/arcgis/rest/`, not `/gis/nfhl/rest/` (the latter returns IBM WebSEAL 404). This is a documented gotcha.
