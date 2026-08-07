# USGS WQP — Water Quality Portal

## What it covers
Water quality measurements from federal, state, tribal, and local monitoring programs. Aggregates data from USGS NWIS (National Water Information System), EPA STORET, and state databases. Covers streams, rivers, lakes, and groundwater near a given location.

**Key contaminants detected**: Heavy metals (lead, arsenic, mercury, cadmium), nitrates, pesticides, bacteria, pH, dissolved oxygen, conductance.

**Query**: Radius search by lat/lng returning recent detections within ~10km.

## What it doesn't cover
- Public water system tap water (that's SDWIS/UCMR)
- Private well contamination (no federal data)
- PFAS in surface water (WQP collects some PFAS measurements but coverage is sparse)
- Industrial discharge concentrations (WQP is monitoring, not discharge reporting)

## Refresh cadence
WQP is updated continuously as agencies submit data. However, many state monitoring programs operate on quarterly or annual schedules.

**API endpoint**: `https://www.waterqualitydata.us/data/Result/search`
**Live API**: `lib/data-sources/usgs-wqp.ts`
**Timeout**: 12 seconds (WQP API can be slow for dense queries).

## Known limitations
1. **Sparse coverage**: WQP coverage is dense near USGS stream gauges and monitoring programs but absent in many areas. Rural addresses may find no monitoring stations within radius.
2. **Detection methods vary**: Different agencies use different analytical methods; comparing values across monitoring programs requires care.
3. **Lag time**: Some state data submissions to WQP are delayed 6-18 months.
4. **Surface water ≠ drinking water**: A detection in a nearby stream does not mean the local water system is affected.

## Scoring integration
Layer: Water (25% weight). Sub-component: surface water quality score (contributes when SDWIS/UCMR data is absent or incomplete). Formula in `lib/scoring/water-scorer.ts`.
