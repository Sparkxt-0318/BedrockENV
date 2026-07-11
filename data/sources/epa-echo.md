# EPA ECHO — Enforcement and Compliance History Online

## What it covers
Regulated industrial and municipal facilities under Clean Air Act, Clean Water Act, and RCRA (hazardous waste). Includes facility location, SIC/NAICS code, compliance status, significant non-compliance (SNC) flags, and TRI (Toxic Release Inventory) annual releases. Used in two layers: proximity (facility density/compliance) and air (TRI air releases).

## What it doesn't cover
- Unregulated facilities (small businesses below reporting thresholds)
- Agricultural sources (separate USDA/state programs)
- Non-permitted emissions
- Mobile sources (vehicles, aircraft)

## How we use it
Live REST API (ECHO FRS search by lat/lng radius). We fetch up to 100 facilities within a configurable radius, classify them by SIC code into TRI/SNC/other buckets, and compute a proximity burden score based on count, distance, and compliance status. For the air layer, TRI air release quantities (lbs/year) contribute to a sub-score.

## Refresh cadence
ECHO data is updated continuously as facilities submit reports. TRI data for a given year is usually available in the following calendar year (e.g., 2025 releases available mid-2026). We query live — no bundled copy.

## Known limitations
1. **Radius sensitivity**: A 10-mile radius in a rural area may return 0 facilities; same radius in Chicago returns hundreds. Score is sensitive to this threshold.
2. **API timeout**: ECHO REST API has been observed timing out during high-traffic periods (30s timeout). This caused the soil/proximity drops documented in IMPROVEMENT_LOG.md (Brownfields 503 incidents).
3. **TRI voluntary reporters**: Some industries self-report to TRI voluntarily. Coverage is uneven across sectors.
4. **No air dispersion modeling**: We count facility proximity, not actual air pathway from stack to receptor. A facility 5 miles upwind is treated identically to one 5 miles downwind.

## Source
EPA ECHO: https://echo.epa.gov/tools/web-services
