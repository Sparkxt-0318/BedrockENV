# FEMA NFHL — National Flood Hazard Layer

**What it covers**: Flood zone designations for US properties, derived from FEMA's Flood Insurance Rate Maps (FIRMs). Special Flood Hazard Areas (SFHA, Zone A and Zone AE) indicate 1% annual chance (100-year) flood risk. Zone X covers areas outside the 500-year floodplain.

**What it doesn't cover**: Pluvial (stormwater) flooding, flash floods outside SFHA boundaries, flooding from uncontrolled drainage, compound flooding (riverine + coastal combined), or future climate projections. Coastal erosion is separate from flood zone designation.

**Used for**: Soil layer flood risk sub-component (presence in SFHA), and CFCI national dataset (Flood Exposure Rate = fraction of residential structures in SFHA per county via NFIP data).

**Refresh cadence**: FEMA updates FIRMs on a rolling basis as communities undergo remapping. Effective dates vary by county. The bundled NFIP penetration rates dataset (`data/flood-by-county.json`) was derived from FEMA's NFIP Open Data portal as of Q1 2026.

**Known limitations**:
- FIRM maps are based on historical data and engineering models, not climate-forward projections. Many communities have outdated maps (10–30 years old).
- Approximately 13 million people live in flood-prone areas not mapped by FEMA (GAO estimate).
- Post-Katrina and post-Sandy remapping has improved coverage but gaps persist, especially in smaller communities.
- Zone X ("minimal hazard") areas have experienced repeated flooding as climate patterns shift.
- The SFHA boundary is a regulatory line, not a risk gradient — properties just outside Zone A may have similar physical risk to those just inside.

**Source**: FEMA National Flood Hazard Layer — https://www.fema.gov/flood-maps/national-flood-hazard-layer
FEMA NFIP Open Data — https://www.fema.gov/about/reports-and-data/opendata
