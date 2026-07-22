# FEMA NFHL — National Flood Hazard Layer

## What it covers
Flood hazard zone designations for properties across the US, drawn from Flood Insurance Rate Maps (FIRMs) produced by FEMA. Bedrock queries the ArcGIS REST service to determine the flood zone(s) at a given point:

- **Zone AE** — 1% annual chance flood (100-year floodplain), base flood elevations determined
- **Zone VE** — 1% annual chance flood with wave action (coastal)
- **Zone A** — 1% annual chance flood, no BFE determined
- **Zone AO/AH** — shallow flooding areas
- **Zone X (shaded)** — 0.2% annual chance flood (500-year floodplain)
- **Zone X (unshaded)** — minimal flood hazard; most of the US

Also queries FEMA NFIP residential SFHA penetration rates at the county level (used in the CFCI national index).

## What it doesn't cover
- **Flash floods and stormwater flooding** — NFHL is based on riverine and coastal hydrology. Urban stormwater flooding (common in cities) is often not captured.
- **Dam failure inundation zones** — not in NFHL.
- **Future climate projections** — NFHL maps current (historical) flood risk. First Street Foundation provides forward-looking flood risk; NFHL does not.
- **Inland flooding from hurricanes** — partially captured (riverine AE zones) but storm surge mapping is separate (coastal VE zones).
- **Properties in undigitized counties** — NFHL digitization is done county-by-county. Unmapped areas return empty results, which Bedrock interprets as Zone X (minimal hazard) but cannot confirm.

## Refresh cadence
FEMA updates FIRM maps on a rolling basis as communities complete map revision projects (Letter of Map Amendment, LOMR processes). The ArcGIS service reflects current effective FIRM data. Map vintages vary widely by county — some are 30+ years old.

No API key required. Bedrock queries the ArcGIS REST service live per assessment.

## Known limitations
1. **Zone X is ambiguous**: An empty polygon response could mean Zone X (no flood hazard) or simply that the county has no FIRM digitized. Bedrock cannot distinguish these cases from a point query alone.
2. **Map age**: Many FIRMs predate current climate conditions. A property in Zone X on a 1980s FIRM may face meaningful flood risk today.
3. **Coastal vs riverine**: A coastal parcel can legitimately intersect both VE (wave action) and AE (still water) zones. Bedrock returns the most hazardous zone as the headline but retains all intersecting zones.
4. **Not a substitute for a flood certificate**: Actual flood insurance determination requires a FEMA Elevation Certificate, not a GIS query.
