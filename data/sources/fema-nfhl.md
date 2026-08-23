# FEMA NFHL — National Flood Hazard Layer

## What it covers
Flood insurance rate maps (FIRMs) digitized at parcel scale for most US counties. Flood zone designations:
- **V/VE zones** — Coastal high-velocity wave action (highest risk)
- **AE/AO/AH zones** — Riverine 1% annual chance (100-year) flood zone
- **X (shaded)** — 0.2% annual chance (500-year) flood zone
- **X (unshaded)** — Minimal flood hazard

When a parcel intersects multiple zones (common on coastal properties), returns the full set with the highest-hazard zone flagged as the headline.

## What it doesn't cover
- Areas that have never been mapped (many rural counties, tribal lands)
- Inland flooding not tied to mapped floodplains (flash floods, urban stormwater)
- Future flood risk under climate change projections (FEMA maps reflect current conditions)
- Pluvial (rainfall-driven) flood risk not connected to mapped water bodies

## How we use it
FEMA ArcGIS REST service (`https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28/query`) with a point geometry query. Property-level resolution. Used in the Soil layer to contribute a flood-risk sub-score.

**Important:** FEMA's ArcGIS services live under `/arcgis/rest/` — not `/gis/nfhl/rest/`. The wrong path returns an IBM WebSEAL 404 HTML page. The `features: []` response is ambiguous — it could mean Zone X (no flood hazard) or "county not yet digitized." We report `coverage: 'unmapped'` in the latter case and score conservatively.

## Refresh cadence
FEMA digitizes and updates county FIRMs on an irregular schedule tied to remapping projects. Coverage is checked via FEMA's FIRM Panel metadata. No local bundle — live ArcGIS query at assessment time. Cache 90 days.

## Known limitations
- Many rural counties and tribal lands have no digital FIRM — ambiguous with Zone X.
- FEMA maps do not account for climate change or sea level rise.
- Map dates vary significantly — some counties were last mapped in the 1980s.
- No API key required. Response times are typically fast (1–2s).
- NFIP concentration rates (SFHA penetration) used in the CFCI national map are separate from point-level assessments.
