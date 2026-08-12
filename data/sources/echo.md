# EPA ECHO — Enforcement and Compliance History Online

## What it covers
Regulated industrial and commercial facilities within a configurable radius (default 3 miles) of the query point. Returns facility name, location, compliance status across Clean Air Act (CAA), Clean Water Act (CWA), RCRA (hazardous waste), and Safe Drinking Water Act (SDWA) programs, significant non-compliance (SNC) flag, TRI (Toxic Release Inventory) reporting flag, and air permit flag. Used by both the proximity scorer (facility density, SNC count) and the air scorer (TRI emitters within radius).

## What it doesn't cover
- **No concentration data** — ECHO reports facility presence and compliance status, not actual pollutant concentrations or quantities released (see TRI for release quantities).
- **No facility longitude** — The ECHO `get_qid` endpoint omits longitude from facility rows; distance cannot be computed per-facility. Distance is bounded by the search radius.
- **Closed/historical facilities** — Active flag filters are applied but decommissioned sites may still appear.
- **Small sources** — Facilities below permit thresholds (e.g. dry cleaners, gas stations) are not in ECHO.

## Refresh cadence
ECHO is updated quarterly by EPA. Queries are live (no local bundle). Results are filtered to `FacActiveFlag = 'Y'` to exclude inactive entries.

## Known limitations
- Two-step API flow (get_facilities → get_qid) adds latency; the second call can timeout in ~3% of requests.
- Results are capped at 25 facilities; dense industrial zones (Newark, Port Arthur) may have hundreds of regulated facilities within 3 miles.
- SNC (Significant Non-Compliance) definition changed in 2022; historical SNC comparisons are not apples-to-apples.
- Facilities that report to TRI but are not ECHO-regulated (e.g. federal facilities, small TRI reporters) may not appear.

## Source
EPA ECHO REST Services: https://echodata.epa.gov/echo/echo_rest_services  
Implementation: `lib/data-sources/epa-echo.ts`
