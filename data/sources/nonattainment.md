# EPA Green Book — Nonattainment Areas

## What it covers
Counties (and partial-county areas) designated as nonattainment for the National Ambient Air Quality Standards (NAAQS). Tracks six criteria pollutants: PM2.5 (fine particulate matter), PM10, Ozone, CO, SO2, and Lead. Each designation includes the pollutant, classification (Marginal/Moderate/Serious/Severe/Extreme for ozone/PM), and the NAAQS standard being violated.

## What it doesn't cover
- Air toxics (HAPs — Hazardous Air Pollutants like benzene, formaldehyde) — these are regulated separately under Section 112 of the CAA
- Point-source emissions (covered by ECHO/TRI)
- Indoor air quality
- Attainment areas (counties not in violation, which is ~90% of the country)

## How we use it
Bundled as `data/nonattainment.json` — keyed by 5-digit FIPS county code. O(1) lookup after geocoding resolves the county FIPS. Classified counties contribute to the air layer score weighted by pollutant severity (SO2 > PM2.5/Ozone > PM10 > CO) and classification tier (Extreme > Severe > Serious > Moderate > Marginal).

## Refresh cadence
EPA updates the Green Book when EPA finalizes new designations and redesignations. This happens roughly annually. The bundled JSON was built from the Green Book as of approximately Q1 2026.

**Next rebuild due:** Q1 2027, or whenever EPA announces significant redesignations.

To rebuild: Check `scripts/` for a nonattainment build script, or manually extract from the Green Book shapefile/API.

## Known limitations
1. **County-level resolution**: Nonattainment designations apply to whole counties (with some partial-county exceptions). A clean suburb in a nonattainment county scores the same as an industrial district in the same county.
2. **Attainment ≠ clean air**: A county can be in attainment for PM2.5 while still having significant industrial air pollution from point sources (ECHO captures these). Nonattainment is a regulatory status, not a continuous measurement.
3. **No air toxics**: The most health-relevant air pollutants for cancer risk (benzene, formaldehyde, 1,3-butadiene) are not covered. RSEI (Risk-Screening Environmental Indicators) would fill this gap.
4. **Lag in redesignations**: A county cleaned up years ago may still appear in our bundle if we haven't rebuilt from the latest Green Book release.

## Source
EPA Green Book: https://www.epa.gov/green-book
