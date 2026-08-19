# EPA Green Book — Air Quality Nonattainment Areas

## What it covers
Counties (and partial-county areas) designated by EPA as failing to meet National Ambient Air Quality Standards (NAAQS) for six criteria pollutants:
- PM2.5 (fine particulate matter, annual and 24-hour)
- PM10 (coarse particulate matter)
- Ozone (8-hour)
- SO2 (sulfur dioxide, 1-hour)
- NO2 (nitrogen dioxide, annual)
- Lead (rolling 3-month average)
- CO (carbon monoxide)

Designation severity: Marginal → Moderate → Serious → Severe → Extreme (for ozone).

## What it does NOT cover
- PFAS or any toxic air pollutants (HAPs) — those are regulated under CAA Section 112, not NAAQS
- Sub-county variation: a county designated nonattainment is treated uniformly even if one corner is clean
- Areas in attainment but with concentrations close to the standard ("maintenance areas" are partially tracked but not included here)
- Indoor air quality

## Refresh cadence
The bundled file at `data/nonattainment.json` was compiled from the EPA Green Book (https://www.epa.gov/green-book). EPA publishes designations continuously as rules are finalized; major NAAQS revisions (like the March 2024 PM2.5 tightening from 12 to 9 μg/m³) trigger new round of designation proceedings. **Rebuild this bundle annually** or when EPA finalizes a new NAAQS revision. Run `scripts/build-nonattainment.ts` (if available) or manually download the Green Book county-level data.

Last bundle update: included in initial build (covers 2024 designations under tightened PM2.5 standard).

## How we use it
Air scorer sub-component: county FIPS lookup against the bundle returns pollutants and severity classification. Scoring: Extreme/Severe=90, Serious=70, Moderate=50, Marginal=30 per pollutant, capped and averaged across pollutants present.

## Known limitations
- **County-level only**: The Green Book designates counties (or partial counties), not census tracts or addresses. A rural county might be nonattainment due to one industrial point source far from the assessed address.
- **Lag**: New designations take 1–3 years after NAAQS revision before final rule. The March 2024 PM2.5 tightening means many new nonattainment areas are pending designation — they won't appear until EPA finalizes area designations (expected 2025–2026).
- **No concentration data**: We know a county is nonattainment but not the actual pollutant concentration at the address. Integration with EPA AQS (requires API key) would improve precision.
