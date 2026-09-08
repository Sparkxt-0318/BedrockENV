# EPA Brownfields — Contaminated and Formerly Contaminated Land

## What it covers
Known brownfield sites (contaminated or potentially contaminated properties) within a radius of the query point. Sourced via the EPA NEPAssist ArcGIS REST service (layer 13). Returns site name, address, and distance from query point.

## What it does NOT cover
- Active Superfund NPL sites (covered separately by `epa-superfund.ts`)
- Contaminated sites that have been fully remediated and removed from EPA databases
- Agricultural pesticide contamination or septic/LUST sites (those are state-managed)
- Brownfields in states with their own programs that haven't been enrolled in EPA's national registry

## Resolution
Property-level — radius query around lat/lng coordinates (default 2-mile radius, max 50 results).

## Refresh cadence
Live ArcGIS REST API query per assessment. EPA updates the layer as new assessments are completed and remediated sites are de-listed. No staleness guarantee — EPA GIS service updates on an irregular basis.

## Known limitations
1. The EPA Envirofacts FRS_PROGRAM_FACILITY table lost its lat/lng columns in early 2026; the ArcGIS service is the only reliable proximity query method now.
2. API reliability is inconsistent — HTTP 503 errors are common (observed across all test addresses in April 2026). Outages cause soil scores to drop artificially (soil=3 instead of realistic 40–60).
3. Not all brownfields are in the federal database. States like California and New York maintain separate brownfield inventories that are not federally indexed.
4. "Brownfield" designation is self-reported or requires EPA to initiate an assessment; contaminated sites without an assessment are invisible.

## Authoritative source
https://www.epa.gov/brownfields — ArcGIS REST: https://geodata.epa.gov/arcgis/rest/services/OEI/NEPAssistLayersPublic_fgdb/MapServer/13
