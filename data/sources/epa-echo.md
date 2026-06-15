# EPA ECHO — Enforcement and Compliance History Online

## What it covers
Industrial and commercial facilities regulated under the Clean Air Act (CAA), Clean Water Act (CWA), Resource Conservation and Recovery Act (RCRA), and Safe Drinking Water Act (SDWA). Within a search radius, returns facility names, regulatory program affiliations, significant non-compliance (SNC) status, TRI reporter status, and inspection/enforcement history.

**Runtime module:** `lib/data-sources/epa-echo.ts`  
**API:** EPA ECHO REST Services  
`https://echodata.epa.gov/echo/echo_rest_services`

## What it covers (detail)
- CAA: air emission sources including major sources and area sources
- CWA: point source dischargers (NPDES permits)
- RCRA: hazardous waste generators and treatment/storage/disposal facilities
- TRI: Toxics Release Inventory reporters (air, water, and land emissions)
- Significant Non-Compliance (SNC): facilities with unresolved violations
- Formal enforcement actions (notice of violation, administrative orders, penalties)

## What it doesn't cover
- Agricultural non-point source runoff (farms, CAFOs unless large enough for NPDES)
- Underground storage tanks (separate LUST database)
- Facilities that were regulated but have since closed and been delisted
- Small sources below reporting thresholds (e.g., dry cleaners, auto shops)
- State-only regulated facilities not in federal databases

## Refresh cadence
Live API — no local bundle. ECHO is updated continuously as EPA regions and states submit compliance data. Enforcement data typically lags 30–90 days from inspection.

**Rate limits:** No API key required. The two-step query (get_facilities → get_qid) imposes a timeout risk — the QueryID can expire if not retrieved promptly.

## Known limitations
- **Geocoding quality:** Some ECHO facilities have imprecise coordinates (centroid of city rather than actual site). Distance calculations for these will be inaccurate.
- **Radius search**: The API does NOT return longitude in facility rows, so haversine distances cannot be computed post-query. We rely on ECHO's own radius filter.
- **API reliability:** ECHO's `get_facilities` endpoint returns HTTP 200 with an error message on timeout. These are treated as no-data responses.
- **SNC classification lag:** Significant Non-Compliance status updates quarterly and may lag actual violation dates.
- **Historical data completeness:** Pre-1990s facilities may have incomplete records.

## Scoring integration
ECHO data feeds the proximity sub-score. TRI reporters within 3 miles receive a higher weight than non-TRI facilities. SNC facilities receive the highest individual weight. Raw facility count and density are normalized against national percentiles.
