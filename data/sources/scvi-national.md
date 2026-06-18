# Data Source: SCVI National County Scores (`scvi-national.json`)

## What it covers
Soil Contamination Vulnerability Index (SCVI) scores for all 3,140 US counties,
computed as SCVI = √(SVS × CPI) normalized 0–100. Each record includes:
- SVS (Soil Vulnerability Score): SSURGO organic matter, drainage, pH, texture,
  climate erosivity, and urban data gap proxy
- CPI (Contamination Pressure Index): legacy industrial sites, active industrial
  density, SDWIS compliance violations, TRI toxic releases
- Merged Census ACS 5-year (2022) demographics: median income, poverty rate,
  race/ethnicity (3,131/3,140 matched; 9 CT planning regions unmatched)
- USDA SVI (Social Vulnerability Index, if applicable)

Used by the `/intelligence/soil-crisis` page and the individual report's soil chapter.

## What it does NOT cover
- Sub-county or neighborhood-level variation (county-level aggregation only)
- Real-time contamination events (static snapshot)
- Private land contamination not captured by ECHO/TRI/brownfields registries
- Connecticut: 9 planning regions replace counties in Census 2020 ACS — unmatched

## Refresh cadence
Input datasets have different refresh schedules:
- SSURGO: Annual (USDA publishes yearly updates)
- EJScreen (CPI component): Annual
- TRI: Annual (reporting year data released ~18 months later)
- Census ACS 5-year: Annual rolling

**Recommended rebuild**: Annually, or when any major input dataset releases a new year.

**Current data vintage**: SSURGO + EJScreen ~2023, TRI 2022 reporting year, ACS 2022 5-year.

## Known limitations
- 9 Connecticut planning regions are unmatched (0.3% of US counties) — they receive
  no SCVI score.
- Urban data gap: SSURGO surveys do not cover dense urban cores, so SVS
  underestimates contamination vulnerability in cities.
- FIPS 51515 (Bedford City, VA) and Virginia independent cities with tiny land area
  are excluded from the top-10 table due to outlier scores from small denominator effects.

## Build script
`scripts/build-scvi-national.ts`
Run: `pnpm tsx scripts/build-scvi-national.ts`
Requires: USDA SDA API access, ECHO API access, TRI CSV download, ACS API key.
