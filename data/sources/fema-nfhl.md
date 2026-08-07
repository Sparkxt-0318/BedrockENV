# FEMA NFHL — National Flood Hazard Layer

## What it covers
Official FEMA flood zone designations for a given location. Returns the flood zone type (AE, AH, AO, VE, X, etc.) and whether the location is in a Special Flood Hazard Area (SFHA, i.e., "100-year flood zone").

**Key data points**:
- Flood zone designation (AE = 1% annual chance with base flood elevation)
- SFHA status (true/false)
- FIRM panel date (when the flood map was last updated)
- BFE (Base Flood Elevation) where available

**API endpoint**: FEMA Map Service Center REST API

## What it doesn't cover
- Unincorporated areas without FIRM maps (many rural and tribal areas)
- Areas with outdated maps (some FIRMs are 20-30 years old and don't reflect current development or climate change)
- Flash flood risk not captured in static flood zones
- Post-flood contamination (flood + contamination compound risk is modeled in CFCI, not NFHL itself)

## Refresh cadence
FEMA updates individual FIRM panels on a rolling basis as counties request remaps. There is no national refresh date. Some panels are from the 1980s-1990s; others are recent.

**Live API**: `lib/data-sources/fema-nfhl.ts`
**Timeout**: 10 seconds.

## Known limitations
1. **Map age**: Outdated FIRMs underestimate flood risk in areas with increased development or sea level rise. Many coastal communities have maps that are 10-20 years out of date.
2. **Unmapped areas**: Rural and tribal areas without FIRM coverage return no flood zone data. The CFCI uses county-level NFIP penetration rates (from FEMA NFIP database) as a proxy for these areas.
3. **Climate change gap**: FEMA flood zones represent historical 1% annual chance flooding; they do not incorporate future climate projections.

## Scoring integration
Layer: Soil (15% weight). Sub-component: flood zone risk. Also used at county level for CFCI scoring (SFHA residential penetration rate). Formula in `lib/scoring/soil-scorer.ts`.
