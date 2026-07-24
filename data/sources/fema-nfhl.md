# FEMA NFHL — National Flood Hazard Layer

## What it covers
Flood Insurance Rate Map (FIRM) data showing flood zone designations for properties
across the US. Special Flood Hazard Areas (SFHA): Zone A (100-year flood), AE (with
base flood elevation), AO (sheet flow), AH (shallow ponding), V/VE (coastal high
hazard), and others. Zone X = minimal hazard (outside 500-year floodplain).

## What it doesn't cover
- Areas without a FIRM (rural counties, tribal lands — ~15% of the US by land area)
- Future flood risk under climate change scenarios
- Pluvial flooding (storm drainage overwhelm — the most common urban flood type)
- Flash flooding events not reflected in the mapped 100-year frequency
- Properties behind levees (mapped as X or AE behind levee, not reflective of
  actual risk if the levee overflows)

## How Bedrock uses it
Runtime API calls to the FEMA Flood Map Service Center (MSC) REST endpoint.
Point-in-polygon query returns all FIRM features intersecting the query location.

Client at `lib/data-sources/fema-nfhl.ts`.

Scoring: flood zone classification → soil sub-score component (SFHA = elevated risk).

## Refresh cadence
FEMA updates NFHL continuously as FIRM panels are revised (Letters of Map Revision,
LOMR). Major updates are published quarterly as cumulative shapefile releases.
Bedrock uses the live MSC API, so updates are reflected automatically.

## Known limitations
1. **Unmapped counties**: NFHL does not cover all US counties. Rural areas, some
   tribal lands, and recently-annexed areas may return 'unmapped' coverage.
2. **Levee accreditation**: Properties behind accredited levees are often shown in
   Zone X but have material residual flood risk if the levee overtops.
3. **Outdated FIRMs**: Many FIRM panels have not been updated since the 1980s,
   predating significant land-use changes and sea-level rise projections.
4. **Pluvial gap**: The largest source of flood losses in US cities is stormwater
   overwhelm, which NFHL does not map.

## Source
- URL: https://msc.fema.gov/arcgis/rest/services/public/NFHL/MapServer
- Format: ArcGIS REST API / Feature Layer query
