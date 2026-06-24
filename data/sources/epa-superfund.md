# EPA FRS/SEMS — Superfund NPL Site Proximity

## What it covers
- EPA National Priorities List (NPL) sites — the most contaminated sites in the US requiring Superfund remediation
- Site coordinates and distance to the assessed address
- Used in proximity layer with distance-weighted scoring: sites <10km contribute; weight increases as distance decreases
- ~1,300–1,400 active NPL sites nationwide

## What it doesn't cover
- Proposed NPL sites (sites under consideration but not yet formally listed)
- CERCLIS sites (sites investigated but not listed on NPL)
- State Superfund equivalents (most states have parallel programs with additional sites not on the federal NPL)
- Historical contamination from sites that completed remediation and were deleted from the NPL
- Contamination extent and plume mapping — only site coordinates, not the remediation boundary

## Refresh cadence
- EPA updates the NPL as sites are proposed, listed, and deleted
- **Current implementation gap:** Bedrock queries FRS SEMS via radius search — this API has a known data gap where some NPL sites (including Tar Creek, OK and Camp Lejeune, NC) are not returned by the spatial query
- Recommended fix: build a static bundle of all ~1,300 active NPL sites with coordinates from the EPA NPL CSV download (`https://www.epa.gov/superfund/superfund-national-priorities-list-npl`)

## Known limitations
- **Critical gap:** FRS SEMS radius search misses some NPL sites. Picher, OK (Tar Creek — one of the most contaminated sites in the US) scores near 0 on proximity because the API doesn't return it. This is the highest-priority data accuracy issue in the system.
- Distance-weighted scoring uses straight-line distance; actual contamination plumes follow groundwater gradients and drainage patterns
- NPL sites can be hundreds of acres — the centroid coordinate used for distance calculation may not represent the nearest contaminated boundary
- Military base contamination (Camp Lejeune, McClellan AFB) has historical records not captured in NPL coordinates
- Deleted NPL sites (remediation complete) are not scored; areas with prior Superfund activity may have residual risk not reflected
