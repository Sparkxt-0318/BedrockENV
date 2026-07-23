# EPA FRS/SEMS — Facility Registry Service / Superfund Enterprise Management System

## What it covers
National Priorities List (NPL) Superfund sites — the ~1,300 most contaminated sites in the US where EPA has authority under CERCLA (Superfund Act). FRS provides geocoded facility records; SEMS provides site status (listed, proposed, deleted, remedial action underway).

## What it does NOT cover
- State-only cleanup sites (each state has its own list; e.g., Michigan's Part 201 sites)
- RCRA corrective action sites (a separate program for hazardous waste facilities)
- Brownfields that have not reached NPL listing criteria
- Sites under CERCLA removal authority only (emergency response, not long-term NPL)
- Military base cleanups regulated under FFCA (Federal Facilities Compliance Act) — these may not appear in FRS radius searches

## API used
`https://ofmpub.epa.gov/frs_public2/frs_rest_services.get_facilities`
- Searches by lat/lng radius
- Filters to `pgm_sys_id = SEMS` for Superfund sites

## Refresh cadence
Real-time API. NPL list is updated periodically by EPA rulemaking. Site status changes (remediation complete, delisted) are reflected in SEMS on a rolling basis.

## Known limitations
- **Radius misses**: Large Superfund sites (e.g., Tar Creek/Picher OK at 40 sq mi, Camp Lejeune NC spanning a military base) may not have a facility-level centroid within a 5-mile query radius, causing false negatives
- **Military base gap**: Federal facility cleanups are often registered differently; Camp Lejeune is on the NPL but FRS radius search returns 0 for some query coordinates
- **API timeouts**: FRS occasionally times out (HTTP 504); Bedrock treats this as 0 sites found
- **Static bundle needed**: The known failure modes of the FRS radius search for high-profile NPL sites justify maintaining a static bundle of ~1,300 NPL sites with coordinates as a backup (ROADMAP: in-progress)
- **Deleted sites**: NPL sites that have been remediated and delisted are no longer returned; historical contamination may persist even after delisting
