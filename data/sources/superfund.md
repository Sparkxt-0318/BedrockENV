# EPA FRS / SEMS — Superfund National Priorities List (NPL) Sites

## What it covers
Active NPL (Superfund) sites within a 5-mile radius of the query address, queried from the EPA Facility Registry Service (FRS) REST API filtered by program system acronym `SEMS` (Superfund Enterprise Management System). Returns site name, address, and computed distance.

## What it doesn't cover
- Proposed NPL sites (not yet listed) and deleted NPL sites
- RCRA corrective action sites (different program, different API)
- State-equivalent Superfund programs (many states have parallel programs with additional sites)
- Smaller contamination sites not elevated to NPL status
- The ~1,300 NPL sites in total — the FRS radius query may miss some due to coordinate precision issues or API filtering

## Refresh cadence
FRS is updated continuously as EPA publishes NPL actions. Bedrock caches Superfund queries for **7 days** per coordinate/radius.

## Known limitations
- **Known coverage gap**: The FRS SEMS radius search misses some NPL sites due to coordinate precision inconsistencies in FRS. A static bundle of all ~1,300 active NPL sites with coordinates is listed as in-progress in the roadmap to supplement this source.
- FRS API can be slow (5–8s response times are common). Timeout risk on this source is higher than most others.
- The FRS query returns any SEMS-linked facility record, including some non-NPL SEMS records. The client filters to NPL-flagged status, but classification data in FRS can be inconsistent.
- **Picher/Tar Creek case**: Abandoned mining towns where contamination predates monitoring infrastructure have no active NPL entry (the site was delisted in some cases or never properly geocoded). The scoring pipeline has no mechanism to flag this class of historical contamination.
