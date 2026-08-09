# EPA Superfund NPL — National Priorities List (FRS/SEMS)

## What it covers
National Priorities List (NPL) Superfund sites within a 5-mile radius. Per-site: site ID, facility name, NPL status (hardcoded `'listed'`), coordinates, and distance in kilometers from the query point. Results sorted by distance ascending.

## What it doesn't cover
- Non-NPL SEMS entries (proposed, removed, deleted sites) — these are returned and marked `'listed'`, which is inaccurate for proposed/deleted sites
- Remediation progress or cleanup status beyond the binary listed/not-listed
- Sites in the CERCLIS archive not in FRS/SEMS
- Off-site contamination plumes extending beyond the site boundary

## How it works
Live EPA FRS public REST API:
`https://ofmpub.epa.gov/frs_public2/frs_rest_services.get_facilities`
Parameters: `pgm_sys_acrnm=SEMS`, `latitude83`, `longitude83`, `search_radius`.
Default timeout: 8 s, no retry.

## Refresh cadence
Live API calls on every request. FRS is updated as EPA designates, proposes, or deletes NPL sites.

## Known limitations
- FRS returns all SEMS facilities, not only listed NPL sites — proposed/deleted sites are incorrectly marked `'listed'`
- 5–8 s response times noted as common; single 8 s timeout with no retry means a slow response can fail the request
- Distance is in km (note: brownfields module uses miles — be careful when comparing proximity scores)
- Facilities without valid coordinates are silently dropped
- No API key required (public endpoint)
- See roadmap: a static bundle of ~1,300 active NPL sites with verified coordinates would be more reliable than this API
