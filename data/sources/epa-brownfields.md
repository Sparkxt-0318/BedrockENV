# EPA Brownfields

## What it covers
Contaminated or potentially contaminated properties that are candidates for cleanup
and redevelopment under the EPA Brownfields Program. Includes former industrial sites,
gas stations, dry cleaners, and other commercial/industrial properties with known or
perceived contamination.

## What it doesn't cover
- Properties that have been fully remediated and removed from the database
- Properties with contamination below reportable thresholds
- Agricultural contamination (pesticides, fertilizers)
- Active industrial sites (these are in ECHO / Superfund, not Brownfields)

## Refresh cadence
Live API: EPA NEPAssist ArcGIS REST service (layer 13 — "Brownfields").
No local bundle. Data is updated as EPA processes new assessment grants.
Cache: 7 days per query point.

API: `https://geodata.epa.gov/arcgis/rest/services/OEI/NEPAVELayersPublic_fgdb/MapServer/13`

## Known limitations
- **API instability**: The Brownfields ArcGIS endpoint has a pattern of returning
  HTTP 503 errors, causing soil scores to drop to near-zero (2 instead of 50+).
  This is the single largest source of score volatility in the system. All flagged
  score drops in the canonical test suite trace back to this API outage.
- The ArcGIS endpoint was chosen over Envirofacts FRS because FRS trimmed its lat/lng
  columns (confirmed 2026-04). If ArcGIS becomes unavailable, a static bundle would
  be required.
- Coverage is dependent on EPA grant funding — not all potentially contaminated
  properties have been assessed.

## Bedrock usage
Soil layer sub-component. Distance-weighted score based on nearest brownfield(s).
Resolution: PROPERTY-LEVEL (within specified radius). Cache: 7-day TTL.
