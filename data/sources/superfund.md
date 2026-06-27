# EPA Superfund — National Priorities List (NPL) via FRS

## What it covers
Active and proposed NPL Superfund sites near a query point.
Uses the EPA Facility Registry Service (FRS) REST API filtered by program
system acronym `SEMS` (Superfund Environmental Management System).
Query radius: 5 miles (default). Returns site name, NPL status, and
coordinates for distance calculation.

## What it does NOT cover
- Deleted NPL sites (removed after cleanup completion)
- Non-NPL Superfund response actions (emergency removals, etc.)
- State Superfund programs (VA, CA, NJ, etc. have separate lists not in FRS)
- Recent additions: FRS lag means newly listed sites may not appear for months
- Dissolved towns: geocoding fails for abandoned/incorporated communities
  (e.g., Picher, OK — Tar Creek Superfund), returning zero results

## Refresh cadence
Live FRS API — queried at assessment time (no bundle).
NPL is updated quarterly by EPA. FRS may lag by 1–3 months.
Consider bundling the ~1,300 active NPL sites as a static JSON to eliminate
API dependency (see ROADMAP: "Superfund static bundle").

## Known limitations
- FRS radius search has intermittent timeouts (5–8s common, sometimes 15s+)
- Non-NPL SEMS sites (proposed, deleted) must be filtered by status — the
  filter is applied post-fetch
- Rural areas and military bases often return zero results even when a known
  Superfund site exists (Camp Lejeune returns 0 via FRS radius search)
- FRS does not always populate coordinates — rows without Latitude83/Longitude83
  are silently skipped
- No API key required but rate limiting is applied; multiple concurrent queries
  from the same IP may be throttled

## Layer assignment
Proximity layer — Superfund site distance and count signal.
