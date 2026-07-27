# USGS WQP — Water Quality Portal

**Bedrock adapter**: `lib/data-sources/usgs-wqp.ts`
**Scoring layer**: Water
**API**: `https://www.waterqualitydata.us/` (USGS, EPA, USDA joint portal)

## What it covers
- 370+ million water quality results from 600,000+ monitoring locations
- Aggregates data from EPA STORET, USGS NWIS, USDA ARS, and state/tribal/local agencies
- Surface water and groundwater measurements
- Hundreds of parameters: metals, nutrients, bacteria, pesticides, VOCs, radionuclides
- Data from 1940s to present

## What it does NOT cover
- Private wells — primarily monitors public streams, rivers, lakes, and USGS monitoring stations
- Drinking water at the tap — WQP measures source water, not treated water distributed to consumers (see SDWIS for tap-water violations)
- Real-time conditions — most WQP data is discrete samples, not continuous monitoring
- Small tributaries and ephemeral streams in many areas

## Refresh cadence
- WQP is continuously updated as contributing agencies submit new monitoring data
- USGS NWIS data typically has a 1-month lag; STORET can have longer delays
- Bedrock queries WQP live per assessment with a bounding box around the address
- No static bundle; results are current to the API's last data submission

## Known limitations
- **Monitoring station density varies dramatically**: Urban and agricultural areas have dense monitoring; remote areas may have no WQP stations within 5 miles. In these cases WQP returns empty and water sub-score falls to UCMR5 + SDWIS only
- **Station-to-address mapping**: WQP data is keyed to stream/lake monitoring stations, not to water distribution systems. Bedrock queries within a 5km radius and normalizes; the nearest station may not supply the address's water system
- **Parameter heterogeneity**: Monitoring stations don't all measure the same parameters. A station with extensive VOC data exists because VOCs were historically a concern at that location — the absence of VOC data elsewhere doesn't mean VOCs are absent
- **When PWSID is missing**: If Bedrock cannot resolve a PWSID from geocoding (rural address, military base, private well area), WQP is the primary water quality fallback. Empty WQP + no PWSID correctly triggers `coverage: unmapped` (as of SCORING_VERSION 4)
