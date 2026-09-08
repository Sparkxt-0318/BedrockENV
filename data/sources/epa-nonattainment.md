# EPA Green Book — NAAQS Nonattainment Designations

## What it covers
County-level air quality designations under the Clean Air Act's National Ambient Air Quality Standards (NAAQS). Records which counties are in "nonattainment" for each criteria pollutant: PM2.5, PM10, ozone (O3), sulfur dioxide (SO2), nitrogen dioxide (NO2), carbon monoxide (CO), and lead. Includes classification severity (Marginal, Moderate, Serious, Severe, Extreme for ozone; and similar tiering for PM2.5). Used in the Air layer.

## What it does NOT cover
- Attainment areas (the majority of US counties not on this list)
- Air toxics not regulated under NAAQS (e.g., benzene, formaldehyde, PFAS in air) — those are tracked separately through TRI
- Real-time or hourly air quality data (this is a regulatory designation, not monitoring data)
- Intrastate nonattainment areas smaller than a county

## Resolution
Area-level — county FIPS code. Applies uniformly to all addresses in a designated nonattainment county regardless of proximity to the actual pollution source.

## Refresh cadence
The static bundle (`data/nonattainment.json`) is generated from EPA's Green Book by `scripts/build-nonattainment-data.ts`. EPA updates nonattainment designations after new NAAQS rulemaking (sometimes years apart). The bundle should be rebuilt annually or after any EPA NAAQS revision. The build script fetches directly from EPA's Green Book web service.

## Known limitations
1. County-level granularity overstates risk in rural parts of large nonattainment counties and understates it near point sources in attainment counties just across a county line.
2. Nonattainment designations lag behind actual air quality improvements by years — EPA must follow a multi-year review process to reclassify a county to attainment.
3. New pollutant designations (e.g., fine PM from wildfire smoke) may not be reflected until after a full rulemaking cycle.
4. Multi-county nonattainment areas are registered by their MSA or CBSA, not individual counties — the build script must map back to county FIPS correctly.

## Authoritative source
https://www.epa.gov/green-book — Green Book API: https://www.epa.gov/airquality/greenbook/
