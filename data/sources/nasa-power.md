# NASA POWER — Prediction of Worldwide Energy Resources

## What it covers
Precipitation- and temperature-based soil-moisture proxy at ~50 km grid resolution. Computed outputs: mean annual precipitation (mm), mean annual temperature (°C), De Martonne aridity index (P/(T+10)), a 0–100 surface-moisture proxy score, precipitation trend over the 5-year window (`'increasing'` / `'decreasing'` / `'stable'`, threshold ±10%), and `fillFraction` (fraction of months with POWER fill values = -999).

Parameters fetched: `PRECTOTCORR` (monthly mean precipitation, mm/day) and `T2M` (2-m air temperature, °C) — monthly resolution, 5-year window ending at the last completed calendar year.

## What it doesn't cover
- Property-level soil moisture (POWER is a ~50 km reanalysis grid, not a point observation)
- Real-time soil conditions
- Subsurface moisture below ~2 m
- Actual soil contamination (POWER provides climate context only)

> **Note**: The source file is named `nasa-smap.ts` but implements NASA POWER, not SMAP (Soil Moisture Active Passive satellite). This naming inconsistency is a known issue.

## How it works
Live NASA POWER temporal/monthly/point API:
`https://power.larc.nasa.gov/api/temporal/monthly/point?parameters=PRECTOTCORR,T2M&community=AG&longitude=…&latitude=…&start={startYear}&end={endYear}&format=JSON`
No API key required. Default timeout: 20 s with retries.

## Refresh cadence
Live API calls on every request. POWER data is updated monthly with approximately a 2-month lag. Queries always end on the previous completed calendar year to avoid missing data.

## Known limitations
- Source file named `nasa-smap.ts` despite implementing NASA POWER
- ~50 km resolution is coarse — results are climatological/regional, not property-level
- POWER lags ~2 months after month-end
- Fill value -999 is filtered and excluded from averages; months with fill are counted in `fillFraction`
- De Martonne aridity index returns `null` for locations with mean annual temperature ≤ -10 °C
- Trend threshold (±10%) is fixed — may classify genuine gradual trends as `'stable'`
- Surface-moisture proxy is a simple linear scaling between 200 and 1800 mm/yr; not a calibrated soil-moisture measurement
