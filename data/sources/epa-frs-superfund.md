# EPA FRS / SEMS — Facility Registry Service & CERCLIS/Superfund Database

## What it covers
Active NPL (National Priorities List) Superfund sites via EPA's Facility Registry Service and SEMS (Superfund Enterprise Management System). Used in the proximity layer to detect Superfund NPL sites within a radius of the assessed address.

FRS unifies facility records across EPA programs; SEMS contains Superfund-specific status data (active, deleted, proposed).

## What it doesn't cover
- Non-NPL Superfund sites (CERCLIS sites that were assessed but not listed)
- Sites proposed for NPL but not yet formally listed
- State-only cleanup programs (VSPs, state Superfund equivalents) — federal NPL only
- Historical sites that have been deleted from the NPL following cleanup (shown as "deleted" in SEMS, may not appear in radius queries)

## Refresh cadence
Live API — queries EPA FRS REST endpoint in real time per assessment. No local bundle.

FRS API: `https://ofmpub.epa.gov/frs_public2/frs_rest_services.get_facilities`

## Known limitations
- **Coverage gaps confirmed**: radius-based queries time out or return incomplete results for some geographies, particularly when the Superfund site's registered coordinates are imprecise or the FRS API is slow. Notable known misses: Picher/Tar Creek (OK), Camp Lejeune (NC) Superfund proximity was missed in ground-truth tests.
- API latency is high (2–5s per request); timeout settings may prematurely drop valid results
- PCB Superfund sites (e.g., Anniston AL) may not appear if their PFAS/chemical type doesn't trigger a detectable flag in the radius query
- **Planned fix**: A static bundle of ~1,300 active NPL sites with lat/lon is in progress (`docs/ROADMAP.md → In Progress: Superfund static bundle`) to supplement FRS SEMS for reliable proximity detection
