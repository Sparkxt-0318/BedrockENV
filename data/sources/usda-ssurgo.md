# USDA SSURGO — Soil Survey Geographic Database

## What it covers
Nationwide soil survey data collected by the USDA Natural Resources Conservation Service (NRCS) over 100+ years. Provides soil component properties at the map unit level: texture (sand/silt/clay percentages), drainage class, organic matter content, pH, hydraulic conductivity (ksat), hydrosologic soil group (A/B/C/D), and land capability classification.

## What it does NOT cover
- Urban areas with "Made land," "Udorthents," or similar map units (contaminated fill, pavement, buildings)
- Subsurface contamination (SSURGO describes natural soil, not anthropogenic fill or leachate plumes)
- Current soil contamination levels — SSURGO describes physical/chemical soil properties, not pollution
- Soil below the survey depth (~1.5m; deeper contamination like TCE plumes is not captured)
- Areas remapped since the last survey update (survey vintage varies; some areas mapped in the 1960s–70s)

## API used
USDA Web Soil Survey REST API (Soil Data Mart):
`https://SDMDataAccess.nrcs.usda.gov/Tabular/SDMTabularService/post.rest`
- SOAP/REST query for map unit at lat/lng, then component properties
- Returns dominant component for the map unit

## Refresh cadence
Real-time API. SSURGO updates are published by NRCS on a rolling basis as counties complete resurveys. Survey vintage can be checked via the `muname` (map unit name) or `survey_date` fields.

## Known limitations
- **Urban gap**: Urban land map units (Udorthents, urban land, made land) have minimal soil property data because the original soil is buried or removed. Bedrock detects these via `muname` and applies a fixed "urban gap" penalty.
- **Survey vintage**: Some rural areas have soil maps from the 1960s–70s that predate modern analytical methods; organic matter and pH values may be outdated
- **Resolution**: Map unit boundaries are hand-drawn at 1:24,000 scale; actual soil boundaries at a specific property may differ
- **Does not detect contamination**: High SSURGO leachability scores indicate a soil *susceptible* to contamination migration, not that contamination is present
- **API throttling**: SDM API can be slow under load; Bedrock uses a 15-second timeout with 2 retries
