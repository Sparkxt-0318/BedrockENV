# USGS WQP — Water Quality Portal

## What it covers
Physical, chemical, and biological water quality measurements from thousands of monitoring stations across the US, aggregated from USGS NWIS, EPA STORET, and state databases. Bedrock queries for recent surface water detections (past 5 years) near a query point, with primary focus on contaminants that signal contamination pressure (nitrates, metals, specific organic compounds).

## What it doesn't cover
- Drinking water supply quality (use SDWIS/UCMR 5 for that)
- Groundwater aquifers — WQP surface water results do not imply groundwater quality
- Monitoring gaps: rural areas and small streams often have no monitoring stations within the query radius
- Interpretation: whether a detected concentration is above a health-based standard depends on the contaminant and context

## Source
USGS Water Quality Portal REST API: `https://www.waterqualitydata.us/data/Result/search`. Query parameters: lat/lng, within radius, activity type "Field Msr/Obs", characteristic group. Returns CSV-style JSON rows.

## Refresh cadence
Live API. WQP aggregates data from partner agencies on varying schedules — USGS NWIS results are near-real-time; state STORET submissions may lag by months. Bedrock caches for 30 days.

## Known limitations
- Data density is highly uneven geographically. Urban areas near universities or active remediation sites have hundreds of nearby measurements; rural areas may have none within 10 miles.
- No monitoring infrastructure → Bedrock reports `coverage: 'unmapped'` rather than 'clean'. This is the correct interpretation (absence of monitoring ≠ absence of contamination).
- WQP does not label each result with a health risk level — Bedrock treats any detection of certain analytes as a signal, not a verdict.
- WQP results include quality-controlled data from some agencies and raw field measurements from others; quality flags are available but not currently used by Bedrock.
