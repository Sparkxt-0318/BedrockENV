# USGS Water Quality Portal (WQP)

## What it covers
Ambient water quality monitoring data from federal, state, tribal, and local monitoring programs. WQP aggregates results from USGS NWIS (stream gauges), EPA STORET (state monitoring data), and USDA AMS. Bedrock queries WQP v3 for PFAS-related characteristic names within a bounding box (~7 miles) around a query point.

Key strengths:
- Covers surface water (streams, rivers, lakes) and groundwater (wells, springs)
- Critical for addresses not served by a public water system (private wells, rural areas)
- Captures contamination not in UCMR 5 because the site isn't a regulated PWS
- Covers monitoring sites with historical data going back to the 1970s

Bedrock uses WQP to supplement the water layer when UCMR 5 data is absent or when an address has no associated PWSID.

## What it doesn't cover
- **Tap water at a specific address** — WQP data is from ambient monitoring stations, not tap samples.
- **Private well water quality** — unless the well was specifically sampled and submitted to a WQP partner.
- **Treatment efficacy** — a downstream detection at a river station doesn't mean tap water at a nearby address is contaminated.
- **All contaminants** — Bedrock queries PFAS-specific characteristic names. Other contaminants (nitrates, coliform, heavy metals) are in WQP but not queried by default.

## Refresh cadence
Live API (https://www.waterqualitydata.us/wqx3/Result/search). WQP is updated continuously as partner agencies submit new results. Bedrock fetches live per assessment with a 30-second timeout.

## Known limitations
1. **Sparse monitoring in rural/western US**: WQP coverage reflects where monitoring programs exist. Many rural counties have few or no monitoring stations. Absence of data ≠ absence of contamination.
2. **Station-to-address distance**: Bedrock uses a ~7-mile bounding box. A detection 5 miles upstream doesn't necessarily affect a nearby tap; interpretation requires hydrological context we don't provide.
3. **Data quality varies**: WQP aggregates from many partners with different QA standards. Some historical records have incomplete metadata.
4. **PFAS characteristic names are inconsistent**: Different labs use different naming conventions for the same PFAS analyte. Bedrock queries broad patterns but may miss some records.
