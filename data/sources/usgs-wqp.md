# USGS Water Quality Portal (WQP) — Ambient Water Quality Monitoring

## What it covers
PFAS and other contaminant detections in surface water, groundwater, and ambient monitoring sites within a bounding box around the query point. Critical complement to UCMR 5 because WQP captures monitoring data from locations not served by a public water system PWSID.

**Runtime module:** `lib/data-sources/usgs-wqp.ts`  
**API:** USGS/EPA Water Quality Portal v3  
`https://www.waterqualitydata.us/wqx3/Result/search`

## Data sources aggregated by WQP
- USGS National Water Information System (NWIS)
- EPA STORET (legacy) and WQX
- USDA Agricultural Research Service
- State environmental agency monitoring programs
- Tribal monitoring programs
- Academic/research monitoring networks

## What it covers (detail)
- Surface water: rivers, streams, lakes, reservoirs
- Groundwater: monitoring wells, springs
- Treated drinking water (some systems report to WQP separately from SDWIS)
- Ambient sediment sampling
- Biological tissue sampling (fish, macroinvertebrates)

## What it doesn't cover
- Drinking water system compliance data (that's SDWIS)
- Private wells — no federal requirement to report private well test results
- Comprehensive PFAS coverage — WQP contains whatever monitoring organizations have submitted; rural areas with no monitoring programs have no data
- Real-time or near-real-time readings (WQP data is typically months to years old by submission)

## Refresh cadence
Live API — no local bundle. WQP is updated continuously as monitoring organizations submit new data. Turnaround from sampling to WQP availability varies from weeks to years.

## Known limitations
- **Bounding box approach**: The runtime client queries a ~7-mile bounding box around the query point (not a radius). Results include detections from the entire box, not necessarily near the specific address.
- **Variable data density**: Well-monitored areas (near major rivers, urban watersheds) return many results. Rural areas with no monitoring programs return nothing, which does not mean the water is clean.
- **CSV parsing**: The v3 endpoint returns CSV, not JSON. The runtime client parses this in-process. Malformed CSV rows are silently skipped.
- **PFAS characteristic names**: WQP uses inconsistent naming for PFAS analytes across contributing databases. The runtime client normalizes the most common variants but may miss some.
- **Historical data**: Some WQP records date to the 1970s. The scorer weights more recent detections more heavily.

## Scoring integration
WQP detections supplement the UCMR 5 data in the water layer. Used primarily for locations without a PWSID match (remote/rural areas, surface water-dependent communities). Detection of PFAS above reporting limits at any nearby monitoring point contributes to the water sub-score.
