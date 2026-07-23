# EPA Green Book — NAAQS Nonattainment and Maintenance Areas

## What it covers
Designation status of US counties and metropolitan statistical areas (MSAs) under the National Ambient Air Quality Standards (NAAQS). Tracks whether a county is in attainment, nonattainment, or maintenance status for six criteria pollutants: PM2.5, PM10, ozone (O3), lead (Pb), sulfur dioxide (SO2), nitrogen dioxide (NO2), and carbon monoxide (CO).

## What it does NOT cover
- Air quality at a specific address (only county-level designation)
- Hazardous Air Pollutants (HAPs) — cancer-causing chemicals from stationary sources (tracked separately via TRI and AQS)
- Indoor air quality
- Wildfire smoke (managed under AQI, not NAAQS designations)
- Attainment designations updated with a lag of 1–3 years after EPA rulemaking

## Bundled data
Bedrock pre-processes the Green Book into `data/nonattainment-counties.json` — a map from county FIPS (5-digit) to an array of pollutants with nonattainment/maintenance classification and severity level.

**Last rebuilt**: 2026-03-10 (from EPA Green Book downloadable CSVs)
**Source URL**: https://www.epa.gov/green-book

## Refresh cadence
EPA updates the Green Book continuously as designations change via federal rulemaking. Major designation rounds typically happen every 3–5 years after new NAAQS reviews. Rebuild the bundle when EPA publishes new designation rounds or amendments.

**2024 PM2.5 NAAQS**: EPA revised the annual PM2.5 standard from 12 µg/m³ to 9 µg/m³ in February 2024. This will result in a new nonattainment designation round in 2025–2026, significantly expanding the number of nonattainment counties. Bundle rebuild required after new designations are finalized.

## Known limitations
- County-level granularity: A county designated nonattainment may have significant air quality variation within it (urban core vs. rural fringe)
- Maintenance status: Counties that improved from nonattainment to maintenance still have elevated historical burden; Bedrock scores these as partial-credit
- Lead (Pb) nonattainment: Very few counties; primarily areas with active smelters or battery manufacturers
- Multi-county MSA designations: Some nonattainment areas span multiple counties; all counties in the MSA receive the designation regardless of their individual monitor readings
