# EPA Superfund / FRS SEMS — Federal Facilities / National Priorities List

## What it covers
Active NPL (National Priorities List) Superfund sites — the ~1,300 most contaminated sites in the US under long-term remediation. Queried via the EPA Facility Registry Service (FRS) SEMS program filter, which returns facilities by lat/lng radius.

## What it does NOT cover
- Proposed NPL sites (not yet listed)
- State-only cleanup sites (analogous state programs: CERCLA-equivalents, brownfields)
- Sites where remediation is complete and the site has been deleted from the NPL
- Military Superfund sites registered differently in FRS (Camp Lejeune, McClellan AFB)
- Sites where the FRS SEMS boundary polygon doesn't match the radius search centroid (e.g., Tar Creek/Picher — a 40 sq-mile mining district registered as a point)

## Refresh cadence
Queried live at assessment time via `https://ofmpub.epa.gov/frs_public2/frs_rest_services.get_facilities`. EPA updates FRS records continuously but full NPL changes (listings, deletions) are announced quarterly via Federal Register notices.

## How we use it
Proximity scorer sub-component: presence of ≥1 NPL site within 5 miles adds 30–50 proximity points depending on distance. Multiple sites compound.

## Known limitations
**This is our most significant data gap.** The FRS SEMS API radius search misses a meaningful fraction of active NPL sites:

1. **Large-area sites**: Mining districts and multi-facility Superfund complexes (Tar Creek, OK; Bunker Hill, ID) are registered with a single point centroid — a 5-mile radius search centered on a residential address may not intersect the FRS point even though the contamination surrounds the address.
2. **Military installations**: Bases registered under DOD FRS programs (e.g., Camp Lejeune) do not always appear in SEMS civilian facility searches.
3. **Proposed NPL**: Sites on the Proposed NPL (awaiting final listing) are not in SEMS.
4. **API timeouts**: FRS can timeout under load; we treat timeouts as coverage='partial' (not as 'clean').

**Recommended fix** (from ROADMAP — "In Progress"): Bundle the ~1,300 active NPL site coordinates as a static JSON file (similar to the nonattainment Green Book bundle), then do a client-side radius check rather than relying on the live FRS API. This would bring Tar Creek, Camp Lejeune, and other missed sites into scope.
