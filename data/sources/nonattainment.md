# EPA Nonattainment Areas — Green Book

## What it covers
County-level Clean Air Act nonattainment and maintenance designations for six criteria pollutants: Ozone (O3), Particulate Matter (PM2.5 and PM10), Carbon Monoxide (CO), Lead (Pb), Nitrogen Dioxide (NO2), and Sulfur Dioxide (SO2). Also includes classification (Marginal, Moderate, Serious, Severe, Extreme for ozone; Moderate/Serious for PM2.5). Used by the air scorer to compute nonattainment burden.

## What it doesn't cover
- **No concentration data** — Designation indicates whether a county meets standards, not the actual measured concentrations.
- **No sub-county variation** — The entire county is designated, even if only part of it violates the standard.
- **No air toxics** — HAPs (Hazardous Air Pollutants) like benzene, formaldehyde, and diesel PM are not criteria pollutants and are not in the Green Book.
- **No real-time AQI** — Static designations based on 3-year rolling averages (see OpenAQ/AQS for current measurements).

## Refresh cadence
EPA updates nonattainment designations as states submit SIPs and EPA acts on them — typically multiple times per year. The local bundle (`data/nonattainment.json`) was built from the Green Book as of the last scripts run. **Must be rebuilt when new designations are finalized.** Suggested cadence: quarterly.

## Known limitations
- **Bundle staleness**: New nonattainment designations (or redesignations to attainment) are not reflected until the bundle is rebuilt.
- **County FIPS mismatch**: The Green Book uses county FIPS codes. Recent Connecticut planning region reorganization (2022) and Virginia independent cities require FIPS mapping care.
- **Attainment with conditions**: Some areas are in "maintenance" (formerly nonattainment, now attaining). These are scored more leniently than full nonattainment but still carry some weight.

## Source
EPA Green Book: https://www.epa.gov/green-book  
Bundle path: `data/nonattainment.json`  
Implementation: `lib/data-sources/nonattainment.ts`
