# EPA Green Book — National Ambient Air Quality Standards (NAAQS) Nonattainment

## What it covers
Counties designated as nonattainment for six criteria pollutants under the Clean Air Act: PM2.5, PM10, Ozone (O3), Carbon Monoxide (CO), Sulfur Dioxide (SO2), and Lead (Pb). Classification levels (Marginal, Moderate, Serious, Severe, Extreme) reflect the severity and how far the county exceeds the NAAQS standard.

## What it doesn't cover
- Air toxics (benzene, formaldehyde, dioxins) — regulated under the National Emission Standards for Hazardous Air Pollutants (NESHAP), not NAAQS
- Point-source emissions that don't affect the county's regional attainment status
- Indoor air quality
- Attainment areas that may still have localized hot spots near industrial facilities

## Refresh cadence
Annual (new designations effective upon EPA rulemaking). The bundled file (`data/nonattainment.json`) should be refreshed annually from the EPA Green Book.

## Known limitations
- Nonattainment designation reflects county-level averages from monitoring stations; a specific address may experience higher or lower air quality than the county average
- Newly designated nonattainment areas may not appear in the bundle until the next annual refresh
- Counties that have recently attained may still show residual air quality issues not reflected by their clean status

## How BedrockENV uses it
`lib/data-sources/nonattainment.ts` loads the bundle at startup and performs O(1) county FIPS lookup. The nonattainment classification (and pollutant count) feeds into the air layer score.

## Source
EPA Green Book: https://www.epa.gov/green-book
CSV download: https://www.epa.gov/green-book/green-book-data-download
