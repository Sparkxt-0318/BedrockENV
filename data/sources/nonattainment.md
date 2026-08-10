# EPA Green Book — NAAQS Nonattainment Areas

## What it covers
Counties designated as nonattainment for National Ambient Air Quality Standards (NAAQS). Covers six criteria pollutants: ozone (O3), particulate matter (PM2.5 and PM10), carbon monoxide (CO), sulfur dioxide (SO2), nitrogen dioxide (NO2), and lead (Pb). Designation status: Nonattainment, Maintenance, Attainment.

## What it doesn't cover
- Air toxics (benzene, formaldehyde, dioxins) — regulated separately under CAA Section 112
- Indoor air quality
- State ambient standards that are stricter than federal NAAQS
- Sub-county variation: a county in nonattainment may have clean areas within it

## How Bedrock uses it
Bundled as `data/nonattainment.json` keyed by county FIPS. The air scorer reads the designation for the target county and applies a penalty based on pollutant severity (PM2.5 Serious > PM2.5 Moderate > Ozone Serious > etc.) and number of pollutants in violation.

## Refresh cadence
EPA updates nonattainment designations after each NAAQS review cycle (every 5 years per schedule, but often delayed). The bundled data should be refreshed when EPA issues new designations. Last verified: 2024 standards (PM2.5 lowered from 12 to 9 µg/m³ — may trigger new nonattainment designations).

## Known limitations
1. **County resolution only**: Nonattainment status is assigned to entire counties, but air quality varies significantly within a county (urban vs. rural, prevailing wind direction, industrial point sources).
2. **Designation lag**: The process from exceeding a standard to official nonattainment designation takes 3–5 years. New pollution problems are invisible in the Green Book.
3. **Attainment ≠ clean**: An attainment county still has air pollution — it just doesn't exceed federal thresholds. Many attainment areas have PM2.5 at 8–10 µg/m³, well above the WHO guideline of 5 µg/m³.
4. **Air toxics not included**: Industrial corridor risks from benzene, vinyl chloride, or dioxins are NOT captured by nonattainment designations. This requires RSEI or TRI chemical-specific analysis.

## Source
- EPA Green Book: https://www.epa.gov/green-book
- NAAQS standards: https://www.epa.gov/criteria-air-pollutants/naaqs-table
