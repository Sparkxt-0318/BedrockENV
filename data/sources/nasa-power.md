# NASA POWER — Prediction Of Worldwide Energy Resources

## What it covers
Climate parameters derived from satellite and reanalysis data at ~0.5° resolution (~55 km grid). Bedrock uses NASA POWER for two purposes: (1) annual precipitation as a soil contamination mobility proxy (wetter = higher leaching), and (2) temperature data. Parameters accessed: `PRECTOTCORR` (precipitation), `T2M` (2m air temperature).

## What it doesn't cover
- Air quality — NASA POWER is a climate dataset, not an air pollution measurement system
- Soil moisture at field scale (satellite SM data from NASA SMAP is available but distinct)
- Localized microclimates — 0.5° resolution is a large grid cell; a valley bottom and a hillside in the same cell share the same value
- Weather extremes or storm events — POWER provides long-term averages

## Source
NASA POWER API: `https://power.larc.nasa.gov/api/temporal/climatology/point`. Parameters: PRECTOTCORR, T2M. Community: SB (Sustainable Buildings).

## Refresh cadence
NASA POWER climatologies are recomputed annually from 30-year data. API responses reflect the current climatological period. Bedrock caches for 90 days.

## Known limitations
- 0.5° spatial resolution is far coarser than parcel scale. Two addresses 30 km apart could receive identical precipitation values.
- Bedrock uses annual precipitation as a contamination mobility proxy — higher annual precipitation is treated as higher leaching risk. This is a rough approximation. The actual relationship between precipitation and contaminant transport depends on soil type, topography, and contaminant chemistry.
- API latency is typically 2–5 seconds for single-point climatology queries.
