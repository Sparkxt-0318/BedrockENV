# FEMA NFHL — National Flood Hazard Layer

## What it covers
Flood insurance rate maps (FIRMs) digitized as GIS layers. Special Flood Hazard Areas (SFHAs) — "100-year flood zones" — are the primary data product. Includes flood zone designations (AE, AH, AO, VE, X, etc.) and base flood elevation where available.

## What it doesn't cover
- Areas without FEMA mapping (roughly 30% of US land area, including many rural counties)
- Unmapped but flood-prone areas — FEMA maps are often based on studies from the 1970s–1990s and do not reflect current development or climate change
- Stormwater flooding (street flooding, basement flooding) from heavy rain events
- Levee-protected areas may be incorrectly shown as protected when levees are not certified

## Refresh cadence
Maps are updated on a rolling basis by county as FEMA completes Risk MAP studies. The NFHL is the authoritative federal source and updates continuously, though many counties have maps that are decades old.

## Known limitations
- A property outside a SFHA still has a 26% chance of flooding over a 30-year mortgage (per FEMA)
- NFHL does not incorporate sea level rise projections or riverine changes from climate change
- First Street Foundation's flood model consistently identifies more at-risk properties than NFHL, particularly in coastal areas

## How BedrockENV uses it
`lib/data-sources/fema-nfhl.ts` queries the FEMA NFHL WFS API for flood zone polygons containing the input coordinates. Zone designation (AE/AH/AO = high risk, VE = coastal high risk, X = moderate/low risk) feeds into the soil layer flood sub-component. The CFCI (`data/cfci-national.json`) uses NFIP policy penetration data at the county level to measure residential exposure.

## Source
FEMA NFHL: https://www.fema.gov/flood-maps/national-flood-hazard-layer
NFHL WFS: https://hazards.fema.gov/gis/nfhl/services/public/NFHL/MapServer/WFSServer
