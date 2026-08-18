# EPA Green Book — NAAQS Nonattainment Areas

## What it covers
Counties designated as nonattainment or maintenance for one or more National Ambient
Air Quality Standards (NAAQS):
- PM2.5 (fine particulate matter, 24-hour and annual)
- PM10 (coarse particulate matter)
- Ozone (8-hour)
- CO (carbon monoxide)
- NO2 (nitrogen dioxide)
- SO2 (sulfur dioxide)
- Lead (Pb)

Designation severity (Marginal, Moderate, Serious, Severe, Extreme for ozone;
Moderate, Serious for PM) is captured.

## What it doesn't cover
- Attainment counties (the baseline, no score contribution)
- Short-term exceedances that haven't triggered nonattainment designation
- Air toxic concentrations (benzene, formaldehyde, etc.) — not covered by NAAQS
- Tribal land designations (handled separately by EPA)

## Refresh cadence
**Bundled** — preprocessed from EPA Green Book into `data/nonattainment.json` (county FIPS → designations).
EPA updates nonattainment designations several times per year as states submit plans.

Check: https://www.epa.gov/green-book
Rebuild: Update `data/nonattainment.json` from the Green Book API when designations change.

## Known limitations
- County-level granularity — a nonattainment county may have clean air in suburban areas
  and heavily polluted air near industrial corridors
- Designation lag: EPA can take 1–2 years to officially designate an area after
  monitoring data shows violations
- Does not capture wildfire smoke events (transient, not part of NAAQS attainment tracking)

## Bedrock usage
Air layer sub-component. Bundled into build at county FIPS level.
Resolution: COUNTY-LEVEL. Cache: baked into build.
