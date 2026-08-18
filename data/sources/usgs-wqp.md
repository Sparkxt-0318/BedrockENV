# USGS WQP — Water Quality Portal

## What it covers
Aggregated water quality monitoring data from EPA, USGS, state agencies, and tribal
nations. Includes:
- Surface water quality measurements (rivers, lakes, streams)
- Some groundwater monitoring data
- A wide range of chemical parameters (metals, nutrients, organics, physical properties)

## What it doesn't cover
- Drinking water (tap water) — WQP is environmental monitoring, not distribution system monitoring
- Real-time continuous monitoring data (WQP contains discrete samples)
- Private wells

## Refresh cadence
Live API: `https://www.waterqualitydata.us/`
Data is contributed continuously by partner agencies. No single refresh date.
Cache: 30 days per area.

## Known limitations
- Coverage is very uneven — some watersheds have dense monitoring; others have none
- Data quality varies significantly by contributor agency
- Site coordinates may be imprecise for some older monitoring records
- Empty WQP results in an area do NOT mean clean water — they mean no monitoring,
  which Bedrock correctly codes as 'unmapped' (no coverage factor) rather than 'partial'

## Bedrock usage
Water layer sub-component. Detections of regulated contaminants within watershed of
the queried address. Resolution: WATERSHED-LEVEL.
When WQP returns empty AND no PWSID exists: coverage = 'unmapped'.
Cache: 30-day TTL.
