# FEMA NFHL — National Flood Hazard Layer

## What it covers
FEMA Flood Insurance Rate Map (FIRM) flood zone designations for a geographic point:
- Zone A, AE, AO, AH, AR (Special Flood Hazard Areas — 100-year floodplain)
- Zone X (500-year floodplain / shaded X)
- Zone X (minimal flood hazard / unshaded X)
- Zone V, VE (coastal high-velocity zones)
- Zone D (undetermined)

Also used to estimate flood zone penetration rates at the county level for CFCI scoring
(via FEMA NFIP residential policy data).

## What it doesn't cover
- Future flood risk under climate change (FEMA maps reflect historical rainfall, not projections)
- Pluvial flooding (stormwater overwhelms drainage) — FEMA maps focus on riverine and coastal
- Properties in unmapped areas (Zone D) where no FIRM data exists
- First Street Foundation's property-level flood factor (a different model)

## Refresh cadence
Live API: FEMA NFHL via ArcGIS REST service or direct FIRM panel queries.
FEMA updates maps on an ongoing basis by county. No single "refresh" date.
Cache: 30 days per point.

## Known limitations
- Many FIRM maps are outdated — some counties haven't been remapped in 20+ years
- FEMA remapping has historically under-mapped flood risk in non-coastal areas
- Does not capture compound flood risk (simultaneous riverine + storm surge)
- Zone boundaries have ±50-100 meter accuracy — a parcel near a zone boundary may
  be misclassified

## Bedrock usage
Soil layer sub-component (flood zone presence). Also primary input to CFCI national dataset
(flood exposure rate = NFIP residential policies in SFHA / total housing units at county level).
Resolution: PROPERTY-LEVEL (point-in-polygon). Cache: 30-day TTL.
