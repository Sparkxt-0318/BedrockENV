# EPA Green Book — Nonattainment Areas

## What it covers
County-level designations under the Clean Air Act for six criteria pollutants where monitored levels exceed the National Ambient Air Quality Standards (NAAQS):
- PM2.5 (annual and 24-hour standards)
- PM10
- Ozone (8-hour standard)
- Carbon monoxide (CO)
- Lead
- Sulfur dioxide (SO2)

Includes classification severity (Marginal, Moderate, Serious, Severe, Extreme for ozone; Moderate, Serious for PM2.5).

## What it doesn't cover
- Air toxics (HAPs) — no NAAQS, separate program
- Indoor air quality
- States and territories in full attainment (no violation)
- Sub-county variation in pollutant levels

## How we use it
Loaded from a static JSON bundle (`data/nonattainment.json`) at startup — no network call at assessment time. Maps 5-digit county FIPS codes to pollutant arrays and classification. Used in the Air layer as a binary/categorical signal: a county in nonattainment receives a scoring penalty proportional to the severity class and number of pollutants.

Built by `scripts/build-nonattainment-data.ts` from EPA's Green Book machine-readable data.

## Refresh cadence
EPA updates nonattainment designations irregularly — when areas are newly designated (violating NAAQS) or redesignated (attaining). Major updates follow new or revised NAAQS rules. The bundle should be rebuilt at least annually or after any EPA NAAQS rulemaking.

Check: https://www.epa.gov/green-book

The `generatedAt` field in the bundle records when it was last built.

## Known limitations
- County-level designation — a county can be in nonattainment even if most of it is rural and the violation is concentrated in an urban core.
- Classification (Serious, Moderate, etc.) is a regulatory determination, not a real-time concentration level.
- Bundle staleness risk — must be manually rebuilt after EPA updates.
- A county just redesignated to attainment may still carry an old designation if the bundle isn't refreshed.
