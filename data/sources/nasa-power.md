# NASA POWER — Prediction Of Worldwide Energy Resources

## What it covers
Global reanalysis climate data (~50 km grid, 1981-present) derived from NASA satellite observations and model assimilation. Bedrock uses the POWER API to fetch monthly mean precipitation and 2-m air temperature for a query point, then computes:

- **Mean annual precipitation** (mm) — climate baseline
- **Mean annual temperature** (°C) — climate baseline
- **Aridity index** (De Martonne: P / (T + 10)) — diagnostic climate indicator
- **Surface-moisture proxy** (0-100) — simple precipitation-based scaling
- **Trend** (early vs. late window) — drying vs. wetting signal over the data period

These climate indicators feed the soil scoring layer as part of the soil vulnerability assessment. Higher precipitation combined with poor soil drainage increases leaching risk; dry climates reduce leaching but may concentrate surface contamination.

## What it doesn't cover
- **Actual soil moisture at depth**: POWER precipitation is a climate input, not a direct soil moisture measurement. Actual soil water content depends on soil texture, evapotranspiration, and land cover.
- **Weather events** (individual storms, droughts): POWER provides monthly climatological averages, not event data. A 100-year storm doesn't appear as a spike.
- **Microclimate variation**: The ~50 km grid averages over urban heat islands, local topography, and mesoscale variation. A specific property in a valley may have very different precipitation than the grid cell suggests.
- **Snowmelt dynamics**: Precipitation is aggregated; the timing of spring snowmelt (important for northern flooding) isn't directly captured.

## Refresh cadence
NASA POWER updates its data archive monthly with a 6-8 month lag (e.g., January 2025 data available ~July-August 2025). Bedrock queries live per assessment using community `AG` (agroclimatology) parameters.

No API key required.

## Known limitations
1. **50 km resolution is coarse**: Adequate for regional climate classification but inadequate for neighborhood-level differentiation within a city.
2. **Missing values (fill = -999)**: POWER uses -999 for missing months, most common over ocean cells near coastlines. Bedrock filters these before averaging and reports fill fraction.
3. **Climate ≠ contamination**: High precipitation scores don't mean a property is more contaminated — only that soil structure may allow contamination to leach more readily if contamination is present.
4. **Aridity index is diagnostic only**: The De Martonne aridity index is a rough climate classification tool, not a precise soil-water balance model. Treat it as context, not a primary risk factor.
