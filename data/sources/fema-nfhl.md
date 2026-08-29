# FEMA NFHL — National Flood Hazard Layer

## What it covers
Official FEMA flood zone designations at the parcel level. Special Flood Hazard Areas (SFHA) = zones beginning with A or V — the 1%-annual-chance (100-year) floodplain. Used for National Flood Insurance Program (NFIP) mandatory purchase requirements. Also provides FEMA NFIP residential penetration rates (FER) at the county level, which feed the CFCI index.

## What it doesn't cover
- Flooding outside the SFHA boundary (the 0.2%/500-year floodplain) unless explicitly mapped
- Pluvial (surface water/rain) flooding — NFHL maps riverine and coastal flood only
- Climate-adjusted future flood risk (First Street, FEMA's own Flood Factor are better for this)
- Areas with no FEMA flood study (shown as Zone D — indeterminate)

## Refresh cadence
FEMA updates NFHL continuously as new flood studies are completed. The FIRM (Flood Insurance Rate Map) effective date varies by county; some rural counties haven't been restudied since the 1990s. Bedrock queries the FEMA NFHL REST API at assessment time.

## Known limitations
- **Stale maps**: ~30% of NFHL panels are based on studies >20 years old. Urbanization, climate change, and infrastructure changes may not be reflected.
- **Zone D ambiguity**: Areas with insufficient data to determine flood risk show as Zone D — we treat these as partial coverage.
- **Coastal vs. riverine**: Zone V (coastal wave action) is higher-risk than Zone A (riverine), but both count as SFHA. We do not currently differentiate.
- **API rate limits**: FEMA's public REST API is rate-limited and occasionally unavailable. Failures degrade soil layer coverage.

## Scoring use
Soil layer sub-component (flood exposure). SFHA presence adds score; X/C zones (minimal flood hazard) contribute zero. Also feeds CFCI scorer via county-level FER from `data/flood-by-county.json`.
