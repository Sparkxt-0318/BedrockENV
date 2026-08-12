# EPA Superfund — National Priorities List (NPL) Sites

## What it covers
National Priorities List (NPL) Superfund sites within 5 miles of the query point. Uses the EPA FRS (Facility Registry Service) REST API filtered to the SEMS (Superfund Enterprise Management System) program. Returns site name, address, coordinates, and computed distance. Used by the proximity scorer as a major contamination pressure indicator.

## What it doesn't cover
- **Proposed or deleted NPL sites** — The API is filtered to active/final NPL status; proposed and de-listed sites are excluded.
- **Non-NPL CERCLA sites** — Removal actions and CERCLA sites that never reached NPL listing are not included.
- **RCRA Corrective Action sites** — Hazardous waste cleanup under RCRA authority is a separate database.
- **Contamination extent** — Returns site presence, not plume boundaries or groundwater contamination radius.

## Refresh cadence
FRS is updated quarterly. Queries are live (no local bundle). Current implementation status: **this is the primary known gap** — a static NPL bundle is listed as "In Progress" in ROADMAP.md.

## Known limitations
- **FRS radius search misses some NPL sites** — Confirmed failures: Tar Creek/Picher OK, Camp Lejeune NC. Large or irregularly-registered Superfund sites (district-scale mining sites, military bases) may have facility records registered under different coordinates or SEMS program structures that don't match the radius query. The static Superfund bundle (ROADMAP in-progress) will fix this.
- **Timeout risk** — FRS API can take 5–8 seconds and occasionally times out. On timeout, the proximity scorer receives null Superfund data and scores as if no sites exist.
- **5-mile radius** — Sites beyond 5 miles (including some that are hydrologically connected) are not counted.
- **Military base gap** — Military installations (Camp Lejeune, Fort McClellan) have no or incorrect civilian SEMS registrations.

## Source
EPA FRS REST API: https://ofmpub.epa.gov/frs_public2/frs_rest_services.get_facilities  
Implementation: `lib/data-sources/epa-superfund.ts`
