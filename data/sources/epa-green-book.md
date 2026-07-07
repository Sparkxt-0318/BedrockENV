# EPA Green Book — NAAQS Nonattainment Areas

## What it covers
EPA's Green Book tracks which counties are in "nonattainment" for National Ambient Air Quality Standards (NAAQS). A county is in nonattainment when it exceeds the standard for one or more criteria pollutants: PM2.5, PM10, ozone (O3), CO, NO2, SO2, or lead. Nonattainment status triggers additional regulatory requirements for facilities in those counties.

Bedrock bundles county-level nonattainment designations including: pollutant, classification (Marginal, Moderate, Serious, Severe, Extreme), and designation date.

## What it doesn't cover
- Air quality in attainment counties (many have pollution below NAAQS but still above health-protective levels)
- Non-criteria air pollutants (HAPs, VOCs, toxics — use TRI/ECHO for those)
- Tribal lands (separate designation process)

## How Bedrock uses it
Bundled as `data/nonattainment.json` (keyed by state FIPS + county FIPS). Looked up synchronously by county in `lib/data-sources/nonattainment.ts`. Contributes to the air layer score — nonattainment counties receive elevated air scores proportional to the classification severity and number of pollutants.

## Refresh cadence
EPA updates the Green Book as new designations are finalized or revoked. Should be rebuilt at minimum annually, or when EPA announces a major reclassification. Current bundle reflects designations through mid-2025.

## Known limitations
- County-level granularity only — a county is either in or out of nonattainment regardless of intra-county variation
- Some nonattainment areas span multiple counties or partial counties; boundary precision varies
- A county that recently came into attainment may still show elevated pollution in monitoring data

## Source
EPA Green Book: https://www.epa.gov/green-book
EPA NAAQS: https://www.epa.gov/naaqs
