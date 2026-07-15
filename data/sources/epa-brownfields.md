# EPA Brownfields — NEPAssist ArcGIS Layer

## What it covers
Contaminated or formerly contaminated land sites within a search radius of a query point. Includes site name, address, cleanup status, registry ID, and coordinates. Bedrock queries the EPA NEPAssist ArcGIS REST service (layer 13, "Brownfields") with a bounding-box envelope and computes haversine distance + cardinal direction post-query.

## What it doesn't cover
- Superfund NPL sites (tracked separately via FRS/SEMS)
- RCRA hazardous waste facilities (tracked via ECHO)
- Underground storage tank sites (state-managed LUST programs)
- Properties in brownfield programs run entirely at the state level without EPA involvement
- Sites where cleanup is complete and the property has been removed from the database

## Source
EPA NEPAssist ArcGIS REST service: `https://geopub.epa.gov/arcgis/rest/services/NEPAssist/NEPAVELayersPublic_fgdb/MapServer/13/query`. This replaces the Envirofacts FRS_PROGRAM_FACILITY table which was trimmed of lat/lng columns in 2026.

## Refresh cadence
Live API. EPA updates the brownfields layer as sites enter and exit programs. Bedrock caches for 30 days.

## Known limitations
- The ArcGIS service was returning HTTP 503 intermittently as of April 2026, causing soil scores to collapse to near-zero for affected addresses. This is the single largest source of score instability.
- Only EPA-enrolled brownfields are listed — many contaminated urban sites have never entered a formal brownfields program.
- Cleanup status descriptions vary (Active, Assessment, Cleanup, Complete) and are not normalized into a risk score — Bedrock treats any nearby brownfield as a risk signal regardless of status.
- Radius is 2 miles by default. Contamination plumes can extend further.
