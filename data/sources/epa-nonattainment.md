# EPA Green Book — NAAQS Nonattainment Areas

**Bundled file:** `data/nonattainment.json`
**Live API module:** `lib/data-sources/nonattainment.ts`

## What it covers
- Counties (and partial counties) currently designated as nonattainment under the Clean Air Act
- Six criteria pollutants: PM2.5 (annual and 24-hour), PM10, Ozone (8-hour), NO2, SO2, CO, Pb
- Designation date, classification (Marginal / Moderate / Serious / Severe / Extreme for Ozone), and area name

## What it doesn't cover
- Counties in attainment — absence from list means the county meets NAAQS standards
- Localized hotspots within attainment counties (e.g., industrial corridors, ports)
- Tribal air quality designations (separate EPA database)
- Pollutants not regulated under NAAQS (e.g., air toxics, PFAS in air)
- Historical nonattainment periods (current designations only)

## Refresh cadence
- **Monthly check** — EPA updates Green Book as designations change
- Source: https://www.epa.gov/green-book
- Designations change infrequently; typical lag is 1–2 years from monitoring data to official designation
- Rebuild with: `pnpm tsx scripts/build-nonattainment-bundle.ts` (fetches EPA API)

## Known limitations
- County-level granularity understates within-county variation — a nonattainment county may have clean air pockets
- Redesignation to attainment can lag actual air quality improvement by 1–3 years (maintenance plans required)
- 2015 ozone NAAQS (70 ppb) is used; stricter proposed 2023 rule (60 ppb) not yet finalized in designations as of 2026
- PM2.5 annual standard tightened to 9 μg/m³ (2024) — many counties not yet redesignated under new standard
