# EPA ECHO — Enforcement and Compliance History Online

## What it covers
Regulated facilities within a configurable radius of a query point. Returns facility counts by program (Clean Air Act, Clean Water Act, RCRA hazardous waste, SDWA), TRI (Toxic Release Inventory) reporters, and Significant Non-Compliers (SNC). Used in the Proximity layer.

## What it does NOT cover
- Unregulated industrial sites (pre-regulation legacy contamination)
- Sites smaller than EPA's regulatory thresholds (e.g., small businesses below TRI reporting cutoff)
- Contamination that has already been remediated and the facility de-listed

## Resolution
Property-level — queried by lat/lng with a configurable radius (default 3 miles).

## Refresh cadence
Live API. EPA updates ECHO quarterly. No local bundle — queried per assessment with a 24-hour server-side cache.

## Known limitations
1. API returns facility counts but not coordinates for each facility; distance calculations are not possible without a second lookup.
2. Radius queries can time out for dense urban areas with hundreds of nearby facilities; the client caps results at 25 facilities.
3. TRI data lags by ~18 months (facilities report by July 1 for the prior calendar year).
4. Significant Non-Complier (SNC) status is a point-in-time snapshot; a facility may have been SNC for years without appearing in current results if it recently returned to compliance.

## Authoritative source
https://echo.epa.gov — REST API: https://echodata.epa.gov/echo/echo_rest_services
