# NASA POWER — Prediction Of Worldwide Energy Resources

## What it covers
Monthly mean precipitation (PRECTOTCORR, mm/day) and 2-m air temperature (T2M, °C) from NASA's POWER reanalysis dataset, used as a **soil-moisture and climate baseline proxy**. Bedrock computes: mean annual precipitation (mm), mean annual temperature (°C), aridity index (De Martonne: P/(T+10)), surface-moisture proxy (0–100), and a drying/wetting trend signal from the last 5 years vs. the prior 5 years.

Community parameter: `AG` (agroclimatology), which applies NASA's agricultural-use post-processing.

## What it doesn't cover
- Actual soil moisture — this is a climatological proxy, not a field measurement
- Local topographic effects: POWER is a ~50 km reanalysis grid
- Contamination: NASA POWER is a pure climate dataset with no connection to pollutant transport

## Refresh cadence
NASA POWER lags ~2 months. The default end date is the last completed full calendar year. Data is not bundled — queries hit the POWER API directly. Bedrock caches responses for **90 days** per coordinate.

## Known limitations
- The ~50 km grid resolution means urban heat islands, coastal breezes, and valley-floor microclimates are smoothed out. Two addresses 10 miles apart in different climatic settings will receive identical POWER data.
- Fill value: POWER uses -999 for missing months (common for ocean cells, rare on land). The client filters these before averaging and reports `fillFraction`.
- The surface-moisture proxy is a simple precipitation scaling (no evapotranspiration, no soil field capacity) — it is a first-pass signal, not a validated soil moisture estimate.
- The aridity index (De Martonne) is a diagnostic indicator for the soil scorer, not a scored output in its own right.
