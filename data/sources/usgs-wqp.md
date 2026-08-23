# USGS Water Quality Portal (WQP)

## What it covers
Ambient water quality monitoring data from thousands of federal, state, tribal, and local monitoring programs. Covers surface water, groundwater, and ambient monitoring sites not tied to a public water system. Relevant to Bedrock primarily for PFAS detection data:
- PFOA, PFOS, PFBS, PFHxS, PFNA, PFDA, and related compounds
- Detection dates, concentration values, and reporting units
- Site type (stream, groundwater, lake, etc.)

## What it doesn't cover
- Public drinking water systems (use UCMR 5 / SDWIS for those)
- All PFAS compounds — limited to what monitoring programs have tested for
- Real-time monitoring (data reflects historical monitoring campaigns)

## How we use it
WQP v3 Result endpoint (`https://www.waterqualitydata.us/wqx3/Result/search`) queried by bounding box (~7-mile radius around the assessment point). Critical for locations where UCMR 5 data is absent — rural areas, private wells, contaminated groundwater not tied to a PWS (e.g., Hoosick Falls NY, Yellowstone, military base communities).

Returns CSV, parsed in-process. Used as a supplemental water data source when UCMR 5 / SDWIS provide no coverage.

## Refresh cadence
Live API — WQP aggregates from partner agencies continuously. No local bundle. Queries execute at assessment time.

## Known limitations
- 7-mile bounding box is an approximation; groundwater plumes don't respect this geometry.
- Monitoring site density is uneven — rural areas are rarely monitored.
- Concentration values are in varying units (ng/L, µg/L, ppt) — the adapter normalizes to ppt.
- Legacy data from monitoring programs that used different detection thresholds may appear as false negatives.
- API response times can be slow for large bounding boxes with many results.
- The v3 endpoint (`/wqx3/`) is required — the legacy `/data/` endpoint does not support JSON reliably.
