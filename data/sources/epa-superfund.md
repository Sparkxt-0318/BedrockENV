# EPA FRS/SEMS — Facility Registry Service / Superfund Enterprise Management System

## What it covers
Active and proposed NPL (National Priorities List) Superfund sites. Returns Superfund sites within a configurable radius of an address. Data comes from EPA's FRS (Facility Registry Service) API, which queries SEMS (the Superfund-specific subsystem).

**Query**: Radius search by lat/lng, returns site name, status, distance, contaminants of concern.

## What it doesn't cover
- State-managed cleanup sites (not on federal NPL) — these are separate state Superfund programs
- Brownfields (different EPA program; see epa-brownfields.md)
- Sites removed from NPL after cleanup (delisted sites)
- RCRA corrective action sites (hazardous waste facilities under separate RCRA program)
- CERCLIS/SEMS sites that are "Not on NPL" (screening sites, archived, no further remedial action planned)

## Refresh cadence
EPA FRS is updated as sites are added/removed from NPL. Bedrock queries live.

**API endpoint**: `https://frs.epa.gov/frs-public-ui/api/facilities`
**Live API**: `lib/data-sources/epa-superfund.ts`
**Timeout**: 10 seconds; API is frequently slow (2-5s p50 latency).

## Known limitations
1. **CRITICAL: Radius search misses known NPL sites**: FRS SEMS radius API returned 0 results for Camp Lejeune NC (active NPL) and Picher OK/Tar Creek (active NPL) in audit runs. Root cause: unclear — may be coordinate precision, data lag, or FRS API bug. A static Superfund bundle (all ~1,300 active NPL sites with coordinates) would eliminate this gap.
2. **High latency / timeout rate**: FRS API frequently times out under load (>10s), causing proximity layer to show 0 Superfund hits even when sites exist.
3. **Dissolved towns**: Picher, OK was dissolved in 2009; the town no longer exists at a geocodable address. Historical contamination at dissolved sites is not captured.
4. **State Superfund not included**: Many contaminated sites are cleaned up under state programs and never appear in federal NPL data. Dioxin cleanup in Midland MI (Dow Chemical/Tittabawassee River) is state-managed, not NPL.

## Recommended fix
Build a static Superfund bundle (all NPL sites, coordinates, radius pre-indexed by county FIPS) as described in ROADMAP.md "In Progress" section. This is the highest-priority Proximity layer improvement.

## Scoring integration
Layer: Proximity (20% weight). Sub-component: Superfund NPL proximity score. Formula in `lib/scoring/proximity-scorer.ts`.
