# NASA POWER — Precipitation & Temperature (Soil Moisture Proxy)

## What it covers
Monthly mean climate reanalysis data from NASA's POWER (Prediction Of Worldwide Energy Resources) project. Covers the entire Earth at ~50 km grid resolution:
- `PRECTOTCORR` — bias-corrected precipitation (mm/day)
- `T2M` — 2-meter air temperature (°C)

We compute from these:
- Mean annual precipitation (mm)
- Mean annual temperature (°C)
- Aridity index (De Martonne formula: P / (T+10)) — diagnostic indicator
- Surface moisture proxy (0–100) — simple precipitation scaling
- Drying/wetting trend (early window vs. late window comparison)

## What it doesn't cover
- Actual in-situ soil moisture measurements (SMAP satellite product is separate)
- Soil contamination (this is a climate input, not a contamination source)
- Sub-50km spatial variation (reanalysis grid)
- Current-year data (typically lags by ~2 months)

## How we use it
NASA POWER API (`https://power.larc.nasa.gov/api/temporal/monthly/point`) queried with lat/lng for the last 10 years of monthly precipitation and temperature. Used in the Soil layer as a climate baseline indicator — wet soils mobilize different contaminants, and drought conditions concentrate pollutants. This is a supporting signal, not a primary contamination indicator.

Community pinned to `AG` (agroclimatology) rather than `RE` (renewable energy) to ensure appropriate post-processing.

## Refresh cadence
POWER data lags ~2 months. The default query end year is the last completed full calendar year. Live API at assessment time.

## Known limitations
- ~50 km reanalysis grid — not a local measurement. Two neighboring cities can share a grid cell.
- POWER uses -999 as a fill value for missing months (rare on land, common over ocean). The adapter filters these before averaging.
- The aridity index is a diagnostic indicator only — not a property-level soil measurement. Treat as climate context.
- File labeled `nasa-smap.ts` in the codebase but uses POWER reanalysis data, not the NASA SMAP (Soil Moisture Active Passive) satellite product. The naming is a legacy artifact.
