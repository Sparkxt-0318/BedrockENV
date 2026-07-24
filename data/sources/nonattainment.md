# EPA Green Book — Nonattainment Area Designations

## What it covers
Counties designated as "nonattainment" for NAAQS (National Ambient Air Quality Standards)
pollutants: PM2.5, PM10, ozone (O3), lead (Pb), NO2, SO2, CO.

Nonattainment means the county's measured ambient air quality violates the EPA health
standard. Classifications: Marginal, Moderate, Serious, Severe, Extreme (for ozone/PM2.5).

## What it doesn't cover
- Indoor air quality
- Air quality in attainment counties that have localized pollution hotspots
- Air toxic emissions (HAPs — handled by TRI/ECHO, not Green Book)
- Sub-county variation (nonattainment applies to the entire county even if pollution
  is concentrated in one industrial corridor)

## How Bedrock uses it
Bundled at `data/nonattainment.json` — a county-level lookup keyed by FIPS code.
Runtime client at `lib/data-sources/nonattainment.ts`.

Used in the **air layer** only. The FIPS code for the queried address is resolved from
geocoding, then looked up in the bundle.

Scoring: nonattainment status (yes/no) and classification severity → air sub-score.
PM2.5 Serious = higher weight than Ozone Marginal.

## Refresh cadence
EPA updates the Green Book when new designations or reclassifications are published
(typically 1-3 times per year, tied to NAAQS review cycles).
The committed bundle must be manually rebuilt from the EPA Green Book CSV download.
**Last bundle refresh**: April 2026.
**Next recommended check**: October 2026 (after expected PM2.5 redesignation cycle).

## Known limitations
1. **County-level only**: Cannot distinguish a clean suburb from a polluted industrial
   corridor in the same county.
2. **Data vintage**: The bundle is a snapshot. Recent designations may not be in the
   committed JSON until the next manual refresh.
3. **Attainment ≠ clean**: A county in attainment may still have significant localized
   air pollution from industrial sources not captured by the monitoring network.

## Source
- URL: https://www.epa.gov/green-book
- CSV download: EPA Green Book Nonattainment Counties
- Format: CSV → preprocessed to `data/nonattainment.json`
