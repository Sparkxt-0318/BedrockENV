# EPA Superfund — National Priorities List (NPL)

## What it covers
EPA's National Priorities List of the most contaminated hazardous waste sites in the United States (~1,300 active NPL sites as of 2026). Includes:
- Active NPL sites (current cleanup priority)
- NPL-proposed sites (proposed but not yet listed)
- Deleted NPL sites (cleanup completed)

Returns sites within a configurable radius (default: 5 miles) of a query point with distance calculations.

## What it doesn't cover
- State-led Superfund programs (separate state lists, not in FRS)
- RCRA corrective action sites (tracked separately in ECHO/RCRA data)
- Brownfields (less-contaminated sites on a separate EPA program)
- Informal dumps, abandoned mines, or contamination without a formal listing

## How we use it
EPA FRS (Facility Registry Service) REST API (`https://ofmpub.epa.gov/frs_public2/frs_rest_services.get_facilities`) with lat/lng + radius, filtered by program system acronym `SEMS` (Superfund). Used in the Proximity layer scoring.

**Known gap:** FRS SEMS API misses some NPL sites — particularly older sites and some where the FRS record is incomplete. A static bundle of all active NPL coordinates (`data/npl-sites.json`) would be more reliable. See ROADMAP.md (Superfund static bundle — In Progress).

## Refresh cadence
Live FRS API — updated as EPA adds/removes/modifies site records. No local bundle currently (static bundle planned).

## Known limitations
- FRS API can time out (5–8 second responses are common).
- FRS may return proposed or deleted NPL sites alongside active ones — the adapter filters by status, but status field naming is inconsistent.
- The 5-mile default radius is conservative; Superfund plumes can extend much farther for groundwater contamination.
- No API key required.
- **Coverage gap** confirmed: Picher/Tar Creek (Oklahoma) and similar legacy contamination sites are not reliably returned by FRS SEMS queries. Static bundle would address this.
