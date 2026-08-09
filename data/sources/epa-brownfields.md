# EPA Brownfields (NEPAssist / ACRES)

## What it covers
Brownfield sites (contaminated or formerly contaminated land) within a 2-mile radius of a point. Per-site data: site name, registry/program ID, coordinates, distance and cardinal direction from query point, EPA program acronym (typically `ACRES`). Max 50 results per query.

## What it doesn't cover
- Contaminant type or contamination severity — metadata lives in the ACRES database which is not publicly queryable
- Current cleanup status (uniformly returned as `'Status unknown'`)
- Sites outside the NEPAssist layer (some brownfields exist only in state databases)

## How it works
Live ArcGIS REST calls to EPA NEPAssist, layer 13:
`https://geopub.epa.gov/arcgis/rest/services/NEPAssist/NEPAVELayersPublic_fgdb/MapServer/13/query`
Uses a rectangular bounding box envelope, then filters results to the true circle.

## Refresh cadence
Live API calls on every request. Intended cache policy: 30 days (not yet implemented in this module).

## Known limitations
- Cleanup status is universally unavailable — always `'Status unknown'`
- Un-geocoded records (lat/lon null or 0,0) are silently dropped
- EPA Envirofacts FRS_PROGRAM_FACILITY was explicitly abandoned because lat/lon columns were removed and bounding-box filters returned cross-state/cross-country rows
- ArcGIS returns HTTP 200 with an error envelope on bad params; code inspects response body
- The 50-result cap may miss sites in dense brownfield corridors (e.g. older industrial cities)
