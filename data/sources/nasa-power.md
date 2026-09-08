# NASA POWER / NASA SMAP — Precipitation and Soil Moisture

## What it covers
NASA POWER provides climate and meteorological data including precipitation, temperature, and humidity at ~0.5-degree resolution globally. NASA SMAP (Soil Moisture Active Passive) provides satellite-derived soil moisture estimates. Used in the Soil layer to contextualize soil erosivity and contamination transport risk (wet soils transport contaminants faster).

## What it does NOT cover
- Real-time weather (data lags by days to weeks)
- Sub-kilometer spatial resolution
- Soil contamination levels directly

## Resolution
Grid-level — approximately 55km (POWER) or 9km (SMAP) resolution. The same value applies across a large geographic area.

## Refresh cadence
Live REST API query per assessment. NASA POWER data is updated daily; SMAP Level 3 products are updated within ~7 days.

## Known limitations
1. Coarse spatial resolution means local conditions (e.g., a stream valley vs. an upland ridge within the same grid cell) are not distinguished.
2. SMAP soil moisture reflects the top 5 cm of soil; deeper contamination transport is not modeled.
3. Climate data represents long-term averages; extreme events (100-year storms) are not captured in mean precipitation values.

## Authoritative source
NASA POWER: https://power.larc.nasa.gov — NASA SMAP: https://nsidc.org/data/smap
