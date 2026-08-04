# EPA Green Book — NAAQS Nonattainment Areas

## What it covers
County-level designation of areas that do not meet National Ambient Air Quality Standards (NAAQS) for criteria pollutants: ozone (O3), particulate matter (PM2.5 and PM10), carbon monoxide (CO), nitrogen dioxide (NO2), sulfur dioxide (SO2), and lead. Designations include attainment classification severity (Marginal, Moderate, Serious, Severe, Extreme for ozone).

## What it doesn't cover
- Property-level air quality variation within a county
- Air toxics (NAAQS only covers 6 criteria pollutants)
- Areas that are in violation but not yet formally designated as nonattainment
- Tribes and territories (limited coverage)

## How Bedrock uses it
Preprocessed from EPA Green Book data into a compact county-FIPS lookup at `data/nonattainment.json`. Lookup is O(1) by county FIPS code. County is resolved from the geocoded address. Used in the air layer sub-scorer to provide a baseline air quality signal even when AQS API data is unavailable.

## Refresh cadence
EPA publishes Green Book updates when designations change (EPA rulemaking process — changes may happen multiple times per year). Current bundle reflects data as of the last script run (`scripts/build-nonattainment-data.ts`). Check EPA Green Book at https://www.epa.gov/green-book for updated designations.

## Known limitations
- County-level resolution only — a single county may include both industrial and rural areas under the same designation
- Nonattainment designations lag reality by years (EPA rulemaking is slow)
- Attainment does not mean clean air — it means air meets minimum federal standards
- Some of the most polluted counties (e.g., LA County for PM2.5, ozone, and lead) have the most severe classifications, but the severity multiplier in the scorer is the same for all levels
