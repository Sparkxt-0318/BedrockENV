# FEMA NFHL — National Flood Hazard Layer

## What it covers
FEMA's official flood zone designations for all mapped areas of the US. Flood zones indicate the probability of flooding: Special Flood Hazard Areas (SFHA, 1% annual chance = "100-year flood") and 0.2% annual chance zones (500-year flood). Zone designations drive flood insurance requirements under the National Flood Insurance Program (NFIP).

Bedrock also uses FEMA NFIP data in the CFCI national model — specifically residential SFHA penetration rates (what fraction of residential properties in a county are in SFHA) as the flood exposure component.

## What it doesn't cover
- Unmapped areas (many rural communities lack FEMA flood mapping)
- Coastal storm surge beyond the mapped SFHA
- Flash flood risk in unmapped areas
- Future flood risk under climate change projections (use First Street for that)

## How Bedrock uses it
Live query against the FEMA Flood Map Service Center API in `lib/data-sources/fema-nfhl.ts`. Returns the flood zone designation for the geocoded address. Also bundled in `data/flood-by-county.json` for the CFCI national analysis.

## Refresh cadence
FEMA NFHL is updated continuously as new Flood Insurance Studies (FIS) are completed. The bundled county-level NFIP data was current as of mid-2025. Rebuild annually.

## Known limitations
- Flood maps are outdated in many areas — FIS completion can lag by 10-20 years
- Maps do not reflect climate change (FEMA uses historical rainfall data)
- Unmapped areas get no flood zone designation even if at risk
- A property not in SFHA may still flood

## Source
FEMA Flood Map Service Center: https://msc.fema.gov/
FEMA NFIP: https://www.fema.gov/flood-insurance
FEMA Flood Zone Definitions: https://www.fema.gov/glossary/flood-zones
