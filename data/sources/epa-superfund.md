# EPA Superfund (FRS/SEMS) — National Priorities List Sites

## What it covers
National Priorities List (NPL) Superfund sites within a search radius. Queries the EPA Facility Registry Service (FRS) filtered to SEMS (Superfund Enterprise Management System) program records. Returns site names, coordinates, NPL status, and cleanup phase.

**Runtime module:** `lib/data-sources/epa-superfund.ts`  
**API:** EPA FRS REST  
`https://ofmpub.epa.gov/frs_public2/frs_rest_services.get_facilities`

## What it covers (detail)
- Active NPL sites (currently listed)
- Proposed NPL sites (not yet finalized)
- NPL deletions (cleaned up; still returned by FRS for historical context)
- Sites where EPA has invoked Superfund response authority

## What it doesn't cover
- RCRA corrective action sites (separate program, not in SEMS)
- Brownfields (separate EPA program — see `epa-brownfields.md`)
- State Superfund analog sites (each state runs its own program independently)
- Sites that are Superfund-adjacent but not formally listed (e.g., many military installations)
- Mining districts with no registered facility centroid (Tar Creek/Picher is an example — the 40-square-mile site has no single FRS record)

## Refresh cadence
Live API — no local bundle. FRS is updated when EPA adds, proposes, or deletes NPL sites. NPL updates are relatively infrequent (a few per year).

## Known limitations
- **Critical coverage gap**: FRS radius search misses some well-known NPL sites including Tar Creek Superfund (Picher, OK) and historically Camp Lejeune. The site boundary geometry may not have a matching FRS facility record, or the site may be registered under a different program acronym.
- **Military base gap**: Many military Superfund sites are on DOD land with restricted FRS records.
- **API latency**: FRS responses commonly take 5–8 seconds and occasionally time out. The runtime client uses a 10-second timeout.
- **Static bundle planned**: The ROADMAP includes a static bundle of ~1,300 active NPL sites with coordinates to supplement the FRS API for the sites it misses.
- **Distance imprecision**: FRS site coordinates are often the administrative center of the site, not the nearest contaminated parcel boundary. A 1-mile distance to a large Superfund site does not mean the nearest contaminated area is 1 mile away.

## Scoring integration
Superfund sites are the highest-weight proximity signal. Sites within 0.5 miles receive a score of 100 on the Superfund sub-component; weight decays with distance up to 5 miles. NPL status and site phase (remedial investigation, cleanup, deletion) are used to contextual the score.
