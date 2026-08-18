# EPA Superfund / FRS SEMS — Federal Facilities and National Priorities List

## What it covers
Active and proposed National Priorities List (NPL) Superfund sites queried via the
EPA Facility Registration System (FRS) SEMS program filter. Returns sites within
a geographic radius with site name, status, and contamination types.

## What it doesn't cover
- Delisted NPL sites (sites removed after cleanup is complete)
- State-listed Superfund equivalents (managed separately by state environmental agencies)
- RCRA corrective action sites (a separate cleanup program)
- Voluntary cleanup sites not on the NPL

## Refresh cadence
Live API: EPA FRS (Facility Registration System) with SEMS program filter.
No local bundle. Cache: 7 days.

## Known limitations
- **Critical gap**: FRS radius search fails to return some active NPL sites. Confirmed
  misses: Tar Creek / Picher, OK (one of the largest Superfund sites in US history)
  and Camp Lejeune, NC. The issue appears to be that large area-based Superfund sites
  are registered differently in FRS than point-based industrial facilities.
- API intermittently times out, which drops the proximity score even when real sites exist.
- A static bundle of ~1,300 NPL sites with coordinates would be more reliable
  (tracked in ROADMAP.md as "In Progress: Superfund static bundle").

## Bedrock usage
Proximity layer sub-component. Resolution: PROPERTY-LEVEL (within specified radius).
Cache: 7-day TTL.
