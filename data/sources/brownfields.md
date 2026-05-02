# EPA Brownfields

## What it covers
Contaminated or formerly contaminated land enrolled in EPA's Brownfields Program within a 2-mile radius of the query address. Queries the EPA NEPAssist ArcGIS REST service (layer 13 — "Brownfields") using a spatial envelope filter, returning site name, registry ID, city, state, and coordinates.

A brownfield is a property where redevelopment is complicated by real or perceived contamination. Enrollment in EPA's program implies assessment or cleanup activity, not necessarily active contamination.

## What it doesn't cover
- State-administered brownfields programs (EPA's dataset is federally enrolled sites only; some states have far larger inventories)
- Voluntary cleanup sites not in EPA's FRS registry
- Historical industrial land that has never been assessed or enrolled
- Underground storage tanks (separate EPA/state program)
- Sites that completed remediation and were removed from the registry

## Refresh cadence
EPA updates the NEPAssist brownfields layer on an irregular schedule (approximately quarterly). Bedrock caches brownfield queries for **30 days**.

## Known limitations
- The ArcGIS spatial envelope query returns sites in a bounding-box rectangle, not a true radius. Corner sites may be slightly outside the intended 2-mile radius. Bedrock applies a haversine post-filter to enforce the actual radius.
- Enrollment in the Brownfields Program is voluntary. An unlisted parcel could still be contaminated; absence of a record is not a clean bill of health.
- The Envirofacts FRS `PROGRAM_FACILITY` table was previously used but was found (confirmed April 2026) to no longer carry reliable lat/lng coordinates — the ArcGIS service is the correct source.
- Site coordinates are centroid-level (parcel or address-matched), not boundary polygons. A very large brownfield site may have a centroid far from the edge closest to the query address.
