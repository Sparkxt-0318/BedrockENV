# EPA Superfund NPL — National Priorities List Sites

## What it covers
Active and proposed NPL (National Priorities List) Superfund sites within a radius of the query point. Queried via EPA FRS SEMS (Facility Registry Service / CERCLIS). Returns site name, status, and proximity.

## What it does NOT cover
- State-listed Superfund equivalents that have not been enrolled in the federal NPL
- Deleted NPL sites (remediated and removed from the list)
- RCRA corrective action sites (those are tracked separately)
- Sites where cleanup is state-led without federal NPL designation (e.g., Tittabawassee River dioxin cleanup in Michigan)

## Resolution
Radius-based proximity query around lat/lng. Default radius: 5 miles.

## Refresh cadence
Live FRS SEMS API query. EPA publishes NPL updates on an ongoing basis; new sites are proposed quarterly and formally listed after public comment periods. The static nonattainment bundle (data/nonattainment.json) supplements this for air quality but no equivalent static Superfund bundle exists yet.

## Known limitations
1. **Critical gap**: FRS SEMS radius query misses some large-footprint NPL sites. Camp Lejeune (active NPL) and Tar Creek/Picher (active NPL) both returned 0 results in testing. The issue appears to be that large mining districts and military bases are registered with facility-level records that don't fall within the standard radius of a centroid point query.
2. API timeouts are common for radius queries that intersect multiple sites.
3. A static NPL bundle (coordinates for all ~1,300 active sites) would be more reliable and faster than the FRS API. This is listed in ROADMAP as "in-progress."
4. Deleted NPL sites (remediated sites that graduated off the list) are not returned; some of these areas still have residual contamination.

## Authoritative source
https://www.epa.gov/superfund/national-priorities-list-npl — FRS SEMS API: https://frs.epa.gov/frs-public-ui/home
