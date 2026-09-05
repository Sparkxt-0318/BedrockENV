# FEMA NFHL — National Flood Hazard Layer

## What it covers
FEMA's authoritative national flood map, derived from Flood Insurance Rate Maps (FIRMs). The NFHL provides:
- Special Flood Hazard Area (SFHA) designations: Zone A (100-year floodplain), Zone AE (with base flood elevation), Zone V (coastal), Zone X (500-year), Zone X-shaded (moderate risk)
- Floodway boundaries (zero-rise encroachment areas)
- Base Flood Elevation (BFE) where surveyed

Bedrock queries NFHL via FEMA's REST API for a point geometry. The soil scorer uses flood zone designation as an exposure factor (Zone A/AE/V = high risk, Zone X-shaded = moderate, Zone X = low).

The CFCI (Compound Flood-Contamination Index) uses FEMA NFIP residential penetration rates at the county level — the fraction of residential structures within the SFHA boundary — as the flood exposure component of the compound index.

## What it does NOT cover
- Unmapped or provisionally unmapped areas (many rural and developing counties have outdated maps)
- Future flood risk under climate change (NFHL maps current regulatory floodplain only)
- Pluvial flooding (urban stormwater flooding not connected to a mapped floodway)
- Inland flooding from sea-level rise not yet reflected in current FIRMs

## Refresh cadence
FEMA updates individual FIRMs on a rolling basis as counties complete map revisions. The national layer is updated quarterly by FEMA. Bedrock queries the live FEMA REST API (no static bundle). Map effective dates vary by county — some maps are >20 years old.

## Known limitations
- **Outdated maps**: FEMA estimates 30–40% of FIRM maps are outdated. Areas that developed since the last map revision may have incorrect flood zone designations.
- **Unmapped areas**: Some rural counties have no FIRM. These return null and are marked as `unmapped` coverage.
- **No climate adjustment**: NFHL represents the current regulatory floodplain based on historical rainfall and storm surge data. Future risk from sea-level rise and intensifying storms is not reflected.
- **SFHA boundary precision**: Point-in-polygon queries have ±50 meter positional uncertainty due to map scale limitations.
