# USGS Water Quality Portal (WQP)

## What it covers
Ambient water quality monitoring data from thousands of federal, state, tribal, and local monitoring programs. Queried via a ~7-mile bounding box around the query point for PFAS-related characteristic names (PFOA, PFOS, PFBS, PFHxS, PFNA, PFDA, HFPO-DA/GenX). Returns detection events with measured concentrations and detection limits. Used by the water scorer as a supplemental PFAS source for addresses not served by a PWSID or in areas with ambient monitoring (rivers, groundwater).

## What it doesn't cover
- **No VOCs, metals, or other contaminants** — The current query is PFAS-only. TCE, PCE, lead, nitrate, and other WQP-monitored analytes are not queried.
- **No real-time data** — WQP reflects historical monitoring events; the most recent samples are typically weeks to months old.
- **No tap water** — WQP monitors ambient water bodies (rivers, lakes, groundwater wells), not treated tap water. UCMR 5 is the tap water PFAS source.
- **No coverage guarantee** — Many rural areas have no WQP monitoring stations within 7 miles.

## Refresh cadence
WQP is continuously updated as agencies submit data. Queries are live (no local bundle). The query uses the WQP v3 (`/wqx3/Result/search`) endpoint — the legacy `/data/` endpoint does not reliably support JSON.

## Known limitations
- **7-mile bbox**: The bounding box approximation can include/exclude stations at the corners vs. a true radius. For point sources near the query location, this is imprecise.
- **CSV parsing**: WQP returns CSV, parsed in-process. Header variations between agency submissions can cause field mismatch.
- **Concentration units**: WQP reports in various units (ng/L, µg/L, ppt, ppb). The code normalizes to ppt but unit string parsing is fragile — unrecognized unit strings default to 0.
- **Empty results** do not mean the area is clean — they may mean no monitoring stations exist within the bbox. WQP coverage is sparse outside the Northeast and Pacific states.

## Source
USGS Water Quality Portal v3: https://www.waterqualitydata.us/wqx3/Result/search  
Implementation: `lib/data-sources/usgs-wqp.ts`
