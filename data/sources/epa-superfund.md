# EPA FRS/SEMS — Superfund National Priorities List (NPL) Sites

## What it covers
Active NPL (Superfund) sites within a radius of a query point. Bedrock queries the EPA Facility Registry System (FRS) with a SEMS (Superfund Enterprise Management System) program filter for `CERCLIS/NPL`. Returns site name, coordinates, NPL listing status, and distance.

## What it doesn't cover
- Proposed NPL sites (listed but not yet finalized)
- CERCLIS sites that were assessed but NOT listed on the NPL (may still be contaminated)
- State Superfund programs — each state maintains its own list which is not in FRS
- Historical Superfund sites that have been delisted after cleanup

## Source
EPA FRS facility radius API: `https://frs.epa.gov/fii/rest/facilitySearch`. Program filter: `CERCLIS/NPL`.

## Refresh cadence
Live API. EPA updates FRS as sites are listed, delisted, or have status changes. Bedrock caches for 90 days.

## Known limitations
- **Critical gap**: FRS radius search misses some active NPL sites. Confirmed misses include Tar Creek Superfund (Picher, OK) and Camp Lejeune, NC. The root cause is unclear — large multi-parcel sites may be registered as a single centroid outside the query radius, or SEMS program codes may not match the filter.
- API response times vary. The SEMS filter appears to add latency; Bedrock applies a 10-second timeout.
- Military base Superfund sites (Camp Lejeune, Fort McClellan) often have no civilian address and may be registered with imprecise coordinates.
- **Recommended fix**: Add a static `data/superfund-npl.json` bundle of ~1,300 active NPL sites with coordinates as a supplement to the live API query. See ROADMAP.md "In Progress."
