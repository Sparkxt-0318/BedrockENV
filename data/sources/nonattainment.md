# EPA Green Book — NAAQS Nonattainment Designations

## What it covers
County-level Clean Air Act nonattainment designations for six criteria pollutants: PM2.5 (annual and 24-hour), PM10, ozone, carbon monoxide, sulfur dioxide, nitrogen dioxide, and lead. A nonattainment designation means a county has officially failed to meet EPA's National Ambient Air Quality Standards (NAAQS) for that pollutant.

Bedrock uses a static JSON bundle (`data/nonattainment.json`) keyed by 5-digit county FIPS. The bundle includes pollutants and classification level (Marginal, Moderate, Serious, Severe, Extreme for ozone; Moderate, Serious for PM2.5). This drives the nonattainment sub-score in the **Air layer**.

Build script: `scripts/build-nonattainment-data.ts`

## What it doesn't cover
- Maintenance areas (counties that achieved attainment but are still under enhanced monitoring)
- State Implementation Plan (SIP) actions or local ordinances
- Pollutants beyond the six NAAQS criteria (no PFAS, no VOCs, no air toxics)
- Intra-county variation — a county designated nonattainment could have clean air in one township and polluted air in an industrial zone

## Refresh cadence
EPA updates the Green Book when new nonattainment designations, redesignations to attainment, or reclassifications are published in the Federal Register. Updates happen a few times per year. The bundle should be rebuilt quarterly from `https://www.epa.gov/green-book`. Check `generatedAt` in `data/nonattainment.json` for the last rebuild date.

## Known limitations
- County-level granularity is coarse. A rural county may be in nonattainment due to a single industrial corridor while most of the county has clean air.
- Nonattainment designation lags actual air quality: a county can be in violation for years before EPA finalizes a designation, and can achieve clean air before it is formally redesignated to attainment.
- The bundle is static and will go stale between rebuilds. Stale nonattainment data may under-report newly designated counties or over-report counties that have since been redesignated to attainment.
