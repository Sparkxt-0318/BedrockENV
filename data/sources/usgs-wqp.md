# USGS WQP — Water Quality Portal

## What it covers
Ambient PFAS monitoring data from surface water, groundwater, and non-PWSID monitoring sites within a ~7-mile bounding box. Per-detection: characteristic name (PFAS compound), raw value, unit, value normalized to ng/L (ppt), sample date, monitoring location ID, and organization name. Derived: `maxDetectionPpt`, `monitoringLocationCount`, `exceedsMcl` (any detection > 4 ppt).

Nine PFAS characteristics are queried: PFOA, PFOS, PFBS, PFHxS, PFNA, PFDA, HFPO-DA/GenX.

## What it doesn't cover
- Private wells not reported to WQP
- Samples older than 5 years (5-year lookback applied)
- Sites outside the ~7-mile bounding box (rectangular, not circular)
- PFAS compounds beyond the 9 queried characteristics
- Treated drinking water (UCMR 5 and SDWIS cover those)

## How it works
Live USGS WQP v3 API call returning CSV:
`https://www.waterqualitydata.us/wqx3/Result/search?bBox={minLon,minLat,maxLon,maxLat}&characteristicName={…}&startDateLo={5yearsAgo}&dataProfile=narrow&mimeType=csv`
Multiple `characteristicName` values delimited by literal `;` (not URL-encoded) per WQP convention.
Custom lightweight CSV parser. Default timeout: 8 s, no retry.

## Refresh cadence
Live API calls on every request. WQP aggregates data from EPA, USGS, state agencies, and tribes on varying submission schedules.

## Known limitations
- WQP returns HTTP 200 with an error message in the CSV body for overly broad queries (`ERROR:...INCOMPLETE DATA`); detected and surfaced
- Custom CSV parser handles quoted fields but is not full RFC 4180 compliant — edge cases may fail
- Unit normalization covers ng/L, µg/L, and mg/L; unrecognized units are assumed ng/L
- Bounding box is rectangular — corner areas slightly outside the true 7-mile circle are included
- Data not real-time; monitoring programs submit data on varying schedules
- Particularly valuable for locations without UCMR 5 coverage (private wells, non-PWS sites)
