# EPA ECHO — Enforcement and Compliance History Online

## What it covers
Regulated industrial and municipal facilities tracked under major federal environmental statutes:
- Clean Air Act (CAA) — major and minor stationary sources
- Clean Water Act (CWA) — NPDES permittees
- Resource Conservation and Recovery Act (RCRA) — hazardous waste handlers
- Toxics Release Inventory (TRI) reporters
- Significant Non-Compliance (SNC) designations

Returns facilities within a configurable radius (default: 3 miles) of a query point.

## What it doesn't cover
- Facilities below permitting thresholds (small dry cleaners, gas stations below TRI thresholds)
- Agricultural operations (exempt from most ECHO programs)
- Historical facilities no longer in the registry
- Actual emission or discharge quantities (use TRI for those)

## How we use it
Two-step ECHO REST API call (`https://echodata.epa.gov/echo/echo_rest_services`):
1. `get_facilities` with lat/lng/radius → returns QueryID
2. `get_qid` with QueryID → returns up to 25 paginated facility rows

The API does not return longitude in facility rows, so haversine distances cannot be computed per-facility. We report facilities as "within N miles" rather than at exact distances.

## Refresh cadence
Live API — ECHO updates continuously from EPA agency systems. No local bundle.

## Known limitations
- 3-mile default radius may miss facilities on the boundary for large industrial sites.
- No exact facility distance returned by the API (only that it's within the radius).
- SNC designations are quarterly snapshots; a facility that fell out of SNC last week may still appear flagged.
- Max 25 results per query — dense industrial corridors may be truncated.
