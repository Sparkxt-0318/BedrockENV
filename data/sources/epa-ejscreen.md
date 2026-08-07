# EPA EJScreen — Environmental Justice Screening and Mapping Tool

## What it covers
Block-group-level percentile rankings for 13 environmental indicators and 6 demographic indicators. Combines exposure/burden indicators with demographic indicators to identify environmental justice communities.

**EJ Indices reported at census block group level**:
- Particulate Matter (PM2.5)
- Ozone
- NATA Air Toxics Cancer Risk
- NATA Respiratory Hazard
- Traffic Proximity
- Lead Paint (pre-1960 housing percentage)
- Superfund Proximity
- RMP Facility Proximity (chemical facilities)
- Hazardous Waste Proximity
- Underground Storage Tanks
- Wastewater Discharger Indicator
- Drinking Water Non-Compliance
- Demographic Index (poverty × minority population)

## What it doesn't cover
- PFAS specifically (bundled in Drinking Water sub-index only if SDWIS violations exist)
- Individual-level data (block-group aggregates only)
- Real-time or recent industrial releases (typically 1-2 year data lag)

## Refresh cadence
Annual updates (EJScreen version bumps each spring). Version 2.3 (2024 data) is current as of 2026.

**API endpoint**: `https://ejscreen.epa.gov/mapper/ejscreenRESTbroker.aspx`
**Live API**: `lib/data-sources/epa-ejscreen.ts`

## Known limitations
1. **Currently non-functional (CRITICAL)**: EJ layer returns score=0 for all addresses. EJScreen API requires a Census block-group FIPS code; our current geocoding enrichment does not reliably return block-group FIPS. This is the top priority EJ fix. See ROADMAP.md "In Progress: EJ layer".
2. **Block-group resolution requires Census coordinate lookup**: The Census geocoder returns tract+block-group; if that step fails (network timeout), EJScreen query has no FIPS key.
3. **API rate limits**: EJScreen is public but may throttle heavy use.
4. **15% weight gap**: Because EJ returns 0, all address scores are effectively computed on 85% of available signal, understating risk for EJ communities.

## Scoring integration
Layer: EJ (15% weight). The EJ scorer (`lib/scoring/ej-scorer.ts`) uses EJScreen + CDC SVI. Currently broken — both return 0.
