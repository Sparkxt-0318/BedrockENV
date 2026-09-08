# FEMA NFHL — National Flood Hazard Layer

## What it covers
Flood hazard zone designations for the query point. Returns the most hazardous intersecting zone (AE, VE, AO, AH, X, etc.) plus all overlapping flood zone features. Used in the Soil layer as a compound hazard indicator. AE and VE zones indicate 100-year floodplain (1% annual chance); Zone X indicates low flood risk.

## What it does NOT cover
- Flash flood risk outside of mapped Special Flood Hazard Areas (SFHAs)
- Future flood risk due to climate change or sea level rise (this is historical/current mapping only)
- Compound flooding (storm surge + riverine + groundwater not always modeled together)
- Areas that have never been mapped (many rural counties lack NFHL coverage)

## Resolution
Property-level — parcel scale via ArcGIS REST point-in-polygon query.

## Refresh cadence
Static (no bundle) — live ArcGIS REST query. FEMA updates NFHL county-by-county on an ongoing basis as communities complete Flood Map modernization projects. Major updates occur after federally declared flood disasters.

## Known limitations
1. When the ArcGIS query returns `features: []`, it is impossible to distinguish "low-risk Zone X" from "county never digitized." The client reports `coverage: 'unmapped'` conservatively in both cases.
2. NFHL reflects FEMA's engineering models, which are often 10–20 years out of date in many counties. Actual flood risk may be higher than the map indicates.
3. Coastal areas can legitimately sit in multiple overlapping zones (e.g., both VE wave-action and AE stillwater). The scorer uses the most hazardous headline zone.
4. The ArcGIS service URL has changed historically; the current path is `/arcgis/rest/` (not `/gis/nfhl/rest/`, which returns an IBM WebSEAL 404).

## Authoritative source
https://www.fema.gov/flood-maps — ArcGIS REST: https://hazards.fema.gov/arcgis/rest/services/FIRMette/NFHLREST_FIRMette/MapServer/
