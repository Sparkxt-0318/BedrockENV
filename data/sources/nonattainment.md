# EPA Green Book — Nonattainment Area Designations

## What it covers
Counties designated as "nonattainment" under the Clean Air Act for one or more NAAQS (National Ambient Air Quality Standards) pollutants. Includes the pollutant and classification (e.g., Moderate, Serious, Extreme for ozone and PM2.5).

**Runtime module:** `lib/data-sources/nonattainment.ts`  
**Bundled data:** `data/nonattainment.json` (keyed by 5-digit county FIPS)  
**Build script:** `scripts/build-nonattainment-data.ts`  
**Upstream:** EPA Green Book at https://www.epa.gov/green-book

## Pollutants covered
- **Ozone (O3)**: 8-hour standard (70 ppb, 2015 rule)
- **PM2.5**: Annual (12 µg/m³) and 24-hour (35 µg/m³) standards
- **PM10**: 24-hour standard (150 µg/m³)
- **CO**: 8-hour standard (9 ppm)
- **SO2**: 1-hour standard (75 ppb)
- **NO2**: Annual standard (53 ppb)
- **Lead**: Quarterly rolling average (0.15 µg/m³)

## What it doesn't cover
- Individual monitoring station readings — this is a county-level designation, not point-level concentration data
- Short-term exceedances that haven't triggered a formal nonattainment designation
- Air toxics (HAPs) — regulated separately under CAA Section 112, not under NAAQS
- Wildfire smoke events — these affect monitored concentrations but counties retain attainment status unless the rolling average fails
- EPA's "maintenance" areas (formerly nonattainment, now meeting standards with a maintenance plan)

## Refresh cadence
EPA updates nonattainment designations on a rolling basis as new monitoring data and review cycles are completed. Major revision rounds occur every 5 years when EPA reviews the NAAQS standards. The bundled JSON should be rebuilt when EPA publishes major designation changes.

**Rebuild command:**
```bash
pnpm tsx scripts/build-nonattainment-data.ts
```

## Known limitations
- **County-level resolution**: One county designation applies to all addresses in the county. A property near the edge of a nonattainment county boundary may be in a cleaner airshed than the county average.
- **Designation lag**: EPA nonattainment designations lag monitoring data by 1–3 years due to the regulatory review process. Counties that recently started failing standards may not yet be designated.
- **California complexity**: California has separate NAAQS attainment tracking under SIP (State Implementation Plan) with finer geographic subdivisions (air basins, not counties). The bundle uses county FIPS for consistency.
- **Bundle staleness**: The `generatedAt` field in the JSON should be checked against EPA Green Book updates quarterly.

## Scoring integration
Nonattainment designation is one of two sub-components of the air layer score (the other being monitored concentrations from OpenAQ/AQS). Counties in nonattainment receive a base air score based on the pollutant severity and classification. PM2.5 Serious + Ozone Extreme (e.g., San Bernardino County, CA) is the highest-weighted combination.
