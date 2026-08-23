# EPA Brownfields

## What it covers
Formerly contaminated properties that EPA's Brownfields program has assessed, cleaned up, or is actively managing. These are less severely contaminated than NPL Superfund sites but represent real exposure risk. Data includes:
- Registry ID and facility name
- Location (address + coordinates)
- City and state
- Distance from query point

Returned within a configurable radius (default: 2 miles) of a query point.

## What it doesn't cover
- Active NPL Superfund sites (use epa-superfund for those)
- Contaminated sites not enrolled in the Brownfields program
- Properties assessed privately without EPA program involvement
- Contamination levels or specific contaminants (registry records, not measurement data)

## How we use it
EPA NEPAssist ArcGIS REST service (`https://geopub.epa.gov/arcgis/rest/services/NEPAssist/NEPAVELayersPublic_fgdb/MapServer/13/query`) with a spatial envelope query. Returns up to 50 facilities within the search radius with haversine-computed distances.

**Note:** The Envirofacts FRS_PROGRAM_FACILITY table is not used here — it no longer carries reliable lat/lng columns (confirmed 2026-04; schema was trimmed and returns cross-state records). The ArcGIS NEPAssist service is the correct endpoint.

## Refresh cadence
Live ArcGIS query at assessment time. Brownfields registry is updated by EPA's Office of Brownfields and Land Revitalization as sites enter or exit the program. Cache 30 days.

## Known limitations
- Program participation is voluntary for states and municipalities — many brownfields are never enrolled.
- No contamination-level data in registry records (presence/absence only).
- 2-mile radius is conservative; brownfield plumes can extend farther depending on site history and soil type.
- ArcGIS error envelopes return HTTP 200 with `{error:{code,message}}` body — treated as failures by the adapter.
