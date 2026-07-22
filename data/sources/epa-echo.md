# EPA ECHO — Enforcement and Compliance History Online

## What it covers
Regulated industrial and municipal facilities within a configurable radius of a query point. Bedrock queries facilities within 3 miles, returning up to 25 results with metadata including:

- Facility name and type (CAA, CWA, RCRA regulated)
- Significant non-compliance (SNC) flag — facilities with unresolved major violations
- TRI reporter flag — facilities reporting to the Toxics Release Inventory
- Compliance status and recent inspection history

Used in the proximity scoring layer to measure industrial facility density and compliance quality near an address.

## What it doesn't cover
- **Facilities outside federal jurisdiction** — some state-only regulated facilities don't appear in ECHO.
- **Decommissioned facilities** — inactive/closed facilities may or may not remain in ECHO depending on deactivation status.
- **Release quantities** — ECHO proximity doesn't include actual release volumes (use TRI for that).
- **Underground Storage Tanks (UST)** — tracked separately (LUST/UST databases, not in this query).
- **Non-point source pollution** — agricultural runoff, stormwater not from permitted facilities.

## Refresh cadence
Live API (https://echodata.epa.gov/echo/echo_rest_services). ECHO data is updated monthly by EPA. No build-time bundle — fetched live per assessment with a two-step flow (get_facilities → get_qid) and a 15-second timeout.

## Known limitations
1. **No longitude in facility rows**: ECHO's proximity API does not return longitude in facility detail rows. Distances cannot be computed via haversine; Bedrock reports distance as "within radius" only.
2. **Radius cap**: Results are capped at 25 facilities. Dense industrial corridors (Port Arthur TX, Gary IN, Newark NJ) may have 100+ facilities within 3 miles — the cap understates the true burden.
3. **API timeout risk**: ECHO has a two-step query flow; the second step (`get_qid`) can timeout for large result sets. When this happens, ECHO data is marked partial.
4. **SNC flag lag**: Significant non-compliance designation lags behind actual violations by 1-2 reporting quarters.
