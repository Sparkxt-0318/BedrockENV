# USGS Water Quality Portal (WQP)

## What it covers
Water quality monitoring results from streams, rivers, lakes, and groundwater near the query point. Aggregates data from EPA STORET, USGS NWIS, and state/tribal databases. Returns detection results for a wide range of analytes: nutrients, metals, pesticides, pathogens. Used in the Water layer as a supplemental signal when SDWIS/UCMR data is sparse.

## What it does NOT cover
- Drinking water tap quality (this is surface/groundwater monitoring, not treated water at point of use)
- PFAS (not yet systematically reported to WQP; UCMR 5 covers drinking water PFAS separately)
- Comprehensive coverage — monitoring is done by many agencies with different analytes and frequencies; gaps are common in rural areas

## Resolution
Station-level — monitoring stations are geolocated points; Bedrock queries within a configurable radius and aggregates results.

## Refresh cadence
Live REST API query. The WQP aggregates data from participating agencies in near-real-time. No local bundle.

## Known limitations
1. WQP data is highly heterogeneous — different analytes, detection limits, sampling methods, and temporal frequencies across contributing databases. Comparisons across stations require careful normalization.
2. Many rural areas have no monitoring stations within a reasonable radius.
3. WQP response time can be slow for large geographic queries (>5 seconds for radius queries with high station density).
4. Monitoring frequency is variable — a station may have data from 1970 and nothing recent. Bedrock uses recency filters but old data may still influence results.

## Authoritative source
https://www.waterqualitydata.us — REST API: https://www.waterqualitydata.us/data/
