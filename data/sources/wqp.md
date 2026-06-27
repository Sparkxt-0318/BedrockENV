# USGS Water Quality Portal (WQP)

## What it covers
Ambient water quality monitoring data for PFAS-related characteristics within
a ~7-mile bounding box of the query point. Covers surface water, groundwater,
and ambient monitoring sites not tied to a PWSID.
Queries 9 key PFAS characteristic names including PFOA, PFOS, PFBS, PFHxS,
PFNA, PFDA, HFPO-DA (GenX). Returns detection count, max concentration (ppt),
and exceedance of the EPA 4 ppt MCL for PFOS/PFOA.

API: USGS WQP v3 Result endpoint (`/wqx3/Result/search`). Returns CSV parsed
in-process.

## What it does NOT cover
- Non-PFAS contaminants (heavy metals, VOCs, nitrates — WQP covers these but
  we only query PFAS characteristics)
- Private well data (WQP covers monitoring programs, not residential wells)
- Real-time data (WQP data is submitted by monitoring programs on irregular cadences)
- Areas with no monitoring infrastructure — rural and tribal areas are dramatically
  undermonitored

## Refresh cadence
Live WQP API — queried at assessment time. WQP data is submitted by thousands of
monitoring organizations on their own schedules. Some results may be years old.
Response includes sampling dates; check `lastSampleDate` for recency.

## Known limitations
- Most critical for **gap-filling** — adds PFAS signal where UCMR 5 has no PWSID match
  (e.g., private wells, small systems, surface water near contamination sites)
- Bounding box query (~7 mile radius) may include monitoring sites in adjacent
  watersheds not hydrologically connected to the query point
- Unit normalization is complex: WQP reports in µg/L, ng/L, and mg/L; conversion
  to ppt (ng/L) must handle all three units
- Duplicate detections from multiple monitoring programs at the same site require
  deduplication by coordinate clustering
- API returns CSV not JSON; parse errors are treated as no-data

## Layer assignment
Water layer — ambient PFAS detection signal, supplementing UCMR 5.
