# EPA Green Book — National Ambient Air Quality Standards (NAAQS) Nonattainment Areas

## What it covers
Counties and partial counties designated as nonattainment for one or more NAAQS pollutants (PM2.5, PM10, Ozone, CO, SO2, NO2, Pb). Sourced from EPA's Green Book. Used in the air layer to flag addresses in areas with chronic air quality violations at the regulatory level.

- **Bundle file**: `data/nonattainment.json`
- **Coverage**: All US counties; entries only where nonattainment designation exists

## What it doesn't cover
- Real-time air quality readings — this is a regulatory designation, not a measurement
- Counties that were in nonattainment but have since been redesignated attainment (those are removed from the active list)
- Counties in "maintenance" status (formerly nonattainment, now attainment but under continued monitoring)
- Indian country areas with separate nonattainment designations not always keyed by county FIPS

## Refresh cadence
EPA updates the Green Book quarterly. Nonattainment designations can change when EPA makes formal area designations, redesignations, or reclassifications (typically following NAAQS reviews on 5-year cycles).

Check: https://www.epa.gov/green-book

To rebuild: update `data/nonattainment.json` from the EPA Green Book bulk data download. No dedicated build script — parse the CSV export.

## Known limitations
- County-level granularity only — all addresses within a nonattainment county receive the same flag regardless of local variation
- Designation lag — EPA can take 2+ years after a NAAQS review to finalize area designations, so recent air quality improvements may not be reflected
- Does not capture tribal lands or territories (Puerto Rico, Guam) consistently
