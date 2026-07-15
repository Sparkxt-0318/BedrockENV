# FEMA NFHL — National Flood Hazard Layer

## What it covers
Flood zone designations for parcels across the US. Zone A/AE/AH/AO/AR are Special Flood Hazard Areas (SFHA) — the 1% annual chance floodplain (aka "100-year floodplain"). Zone V/VE is coastal high-velocity zone. Zone X is outside the 500-year floodplain. Bedrock queries all flood polygons intersecting a point and reports the most hazardous headline zone.

## What it doesn't cover
- Unmapped areas: FEMA digitizes counties on a rolling basis. Many rural and tribal counties have never been assessed.
- Residual risk outside the SFHA — the 0.2% annual chance (500-year) floodplain can still cause significant damage.
- Nuisance flooding from local drainage that doesn't reach rivers or coasts
- Future flood risk as sea levels rise or precipitation patterns shift (FEMA maps reflect historical conditions)
- Compound flood-contamination risk — for that, see the CFCI Intelligence page

## Source
FEMA ArcGIS REST service: `https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28/query`. Bedrock queries the Flood Hazard Area layer (28) with geometry intersection.

## Refresh cadence
FEMA updates flood maps as Letter of Map Amendment (LOMA) and Letter of Map Revision (LOMR) decisions are processed. Major map revisions (FIRM updates) are periodic and county-specific. Bedrock caches for 90 days.

## Known limitations
- Empty response (`features: []`) could mean Zone X (low risk) OR unmapped (no data). Bedrock reports both as `coverage: 'unmapped'` because there is no API signal to distinguish them.
- ArcGIS returns HTTP 200 with error envelopes for invalid parameters — Bedrock inspects the body.
- FEMA flood maps are notoriously out of date in many areas. Actual flood risk often exceeds mapped risk, especially in older urban watersheds.
- NFIP maps do not account for stormwater-driven flash flooding, which is the dominant flood type in many Western cities.
- Bundled CFCI data (`data/cfci-national.json`) provides a county-level aggregate of NFIP residential SFHA penetration rates as a separate signal.
