# NASA POWER — Prediction of Worldwide Energy Resource (Climate/Meteorological Data)

## What it covers
Gridded climatological and meteorological data derived from NASA satellite and reanalysis products. Covers precipitation, temperature, solar radiation, humidity, and wind. Used by Bedrock for monthly average precipitation and precipitation trend analysis (stable / wetting / drying) at 0.5° × 0.5° grid resolution.

## What it doesn't cover
- Hourly or daily weather events (30-year monthly averages and recent annual data only)
- Local microclimate variation within a grid cell (~50 km × 50 km)
- Hydrological runoff or flooding (FEMA NFHL covers flooding)
- Air quality or contamination (separate data sources)

## How Bedrock uses it
Queried via NASA POWER REST API by latitude/longitude for a bounding box. Returns climatological monthly averages and recent annual precipitation data. Used in the soil layer moisture sub-component to identify areas with increasing precipitation (wetting trend increases leaching and runoff risk) or drought conditions (drying trend increases dust and soil erosion risk).

## Refresh cadence
NASA POWER updates its reanalysis products with a delay of several months. Long-term climatological averages (30-year normals) are stable; recent-year data is updated as NASA completes quality assurance.

## Known limitations
- Coarse spatial resolution (0.5° ≈ 50 km): cannot distinguish precipitation variation within a county
- Trend analysis is based on comparison of recent 5-year average vs. long-term 30-year average — short-term variability may produce spurious trend signals
- Precipitation trend is one input signal in a multi-factor soil scorer; it does not independently determine soil risk
