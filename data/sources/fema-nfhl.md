# FEMA NFHL — National Flood Hazard Layer

## What it covers
- Flood zone designations for US properties: SFHA (Special Flood Hazard Area), Zone A/V, Moderate (Zone X shaded), Minimal (Zone X unshaded)
- Used in Bedrock for two purposes: (1) flood risk sub-score in soil layer, (2) compound flood-contamination risk amplifier when brownfields are nearby
- Property-level resolution when NFHL has been digitized for the county

## What it doesn't cover
- Areas with no DFIRM (Digital Flood Insurance Rate Map) — some rural counties have not been studied
- Pluvial flooding (surface runoff, overwhelmed storm drains) — NFHL only covers fluvial (riverine) and coastal flooding
- Climate-adjusted flood risk — FEMA maps are based on historical hydrology; they do not project future flood probabilities under climate change
- Compound flooding from storm surge + riverine interaction is not always captured

## Refresh cadence
- FEMA updates DFIRM panels on a rolling basis as communities complete flood studies; no fixed national refresh cycle
- Major remapping projects (post-Harvey, post-Sandy) have updated large areas
- API: FEMA NFHL WFS endpoint (`https://hazards.fema.gov/gis/nfhl/services/`)
- Bedrock queries live at assessment time using property coordinates

## Known limitations
- Many FEMA maps are 10–20+ years old and do not reflect recent channel changes or new development
- Zone X "outside 500-year" designations may be re-mapped to SFHA as new studies complete; current scoring treats Zone X as minimal risk
- SFHA boundaries are political (affect insurance rates) and may not reflect actual flood probability accurately
- Compound risk amplifier in Bedrock fires when SFHA + brownfield within 2 miles; this is a heuristic, not a hydrological model
- No coverage in some US territories and tribal lands with limited FEMA mapping
