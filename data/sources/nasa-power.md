# NASA POWER — Soil Moisture Proxy (Precipitation + Temperature)

## What it covers
Monthly mean precipitation (PRECTOTCORR, mm/day) and 2-m air temperature (T2M, °C)
over a 5-year window from NASA's POWER (Prediction Of Worldwide Energy Resources)
reanalysis dataset. Derived metrics:
- Mean annual precipitation (mm)
- Mean annual temperature (°C)
- Aridity index (De Martonne: P / (T + 10)) — diagnostic only
- Surface moisture proxy (0–100 scale, precipitation-based)
- Drying/wetting trend (early vs. late 5-year window)

Community: AG (Agroclimatology). Resolution: ~50 km reanalysis grid.

## What it does NOT cover
- Actual soil moisture measurements (uses precipitation as a proxy)
- Subsurface or deep soil moisture
- Short-term or episodic moisture events
- Property-scale topographic effects (run-on, run-off, shade)
- Soil type effects on moisture retention (requires SSURGO correlation)

## Refresh cadence
NASA POWER lags ~2 months. The query window targets the last completed full
calendar year. POWER data is queried live at assessment time.
Fill value: -999 (common over ocean cells, rare on land) — filtered before averaging.

## Known limitations
- ~50 km resolution is climatological, not local — two adjacent properties
  in a valley vs. hilltop receive identical scores
- The "surface moisture proxy" is a simplified precipitation-scaling formula,
  not a calibrated soil moisture model
- Aridity index (De Martonne) is reported as diagnostic only and is not used
  directly in soil scoring
- POWER occasionally has data gaps for high-latitude or island locations
- Does not capture irrigation, impervious surface runoff, or drainage infrastructure

## Layer assignment
Soil layer — climate/moisture context component.
