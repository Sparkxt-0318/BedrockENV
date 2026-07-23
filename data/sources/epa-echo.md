# EPA ECHO — Enforcement and Compliance History Online

## What it covers
Directory of facilities regulated under Clean Air Act (CAA), Clean Water Act (CWA), Resource Conservation and Recovery Act (RCRA), and Safe Drinking Water Act (SDWA). Includes Toxics Release Inventory (TRI) reporters. Tracks significant non-compliance (SNC) status — facilities that have materially violated their permits.

## What it does NOT cover
- Facilities below reporting thresholds (TRI: >10 employee sites handling >25,000 lbs/yr threshold chemicals)
- Unregulated industries (e.g., most agricultural operations)
- Stormwater discharges below NPDES permit requirements
- Illegal dumping not captured by permit system
- Former facilities that have been demolished or delisted

## Key fields used
- `REGISTRY_ID`, `FAC_NAME`, `FAC_LAT`, `FAC_LONG` — facility identity and location
- `FAC_ACTIVE_FLAG` — filter to active facilities
- `SNC_FLAG` — significant non-compliance (Y/N); used for proximity score elevation
- `TRI_FLAG` — TRI reporter (yes/no)
- `AIR_IDS`, `NPDES_IDS`, `RCRA_IDS` — program participation
- Distance calculated via Haversine from assessment address

## API used
Bedrock queries ECHO Facility Search API at runtime:
`https://echo.epa.gov/api/facility-search/facilities`

## Refresh cadence
Real-time API. ECHO data is updated weekly from EPA program databases. SNC designations are updated quarterly.

## Known limitations
- **API timeouts**: ECHO facility search occasionally times out (HTTP 504) under load; Bedrock treats timeout as 0 facilities found, which under-scores industrial areas
- **Radius limit**: Bedrock queries 5-mile radius; very dense urban areas may exceed API result limits (capped at 100 facilities per query)
- **TRI thresholds**: Facilities below reporting minimums are invisible; small-volume chronic emitters are not captured
- **Geographic precision**: Facility coordinates are often the address centroid, not the actual emission point
