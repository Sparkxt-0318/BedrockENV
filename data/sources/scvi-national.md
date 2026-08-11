# SCVI — Soil Contamination Vulnerability Index (Bedrock Original)

## What it covers
Bedrock-computed composite index scoring all 3,140 US counties on soil contamination vulnerability. Formula: `SCVI = √(SVS × CPI)` normalized 0–100.

- **SVS** (Soil Vulnerability Score): SSURGO organic matter, drainage class, pH, texture, climate erosivity, NLCD urban cover
- **CPI** (Contamination Pressure Index): legacy industrial sites (RCRA/Brownfields density), active industrial density (ECHO facility count), compliance violations (ECHO SNC rate), toxic releases (TRI lbs/sq mi)
- Census ACS 5-year (2022) demographics overlaid: median income, poverty rate, race/ethnicity

Coverage: 3,131/3,140 counties matched (9 Connecticut planning regions unmatched due to 2022 redistricting).

- **Bundle file**: `data/scvi-national.json`
- **Bundle generated**: 2026-04-19
- **Quartile distribution**: Q1–Q4, 785 counties each

## What it doesn't cover
- Property-level or neighborhood-level variation within counties — county-level resolution only
- Native American tribal lands (sovereign land boundaries may cross county lines)
- Contamination that postdates the input data vintages (TRI 2022, SSURGO 2023, ECHO 2023)
- PFAS-specific soil contamination — SSURGO does not contain PFAS measurements; contamination pressure comes from facility emissions proxies only

## Refresh cadence
Rebuild when any input dataset has a major release:
- SSURGO: Annual (USDA NRCS, typically Q2)
- ECHO facility data: Quarterly
- TRI: Annual (calendar year data released ~18 months later)
- Census ACS: Annual (5-year estimates)

Rebuild script: `pnpm tsx scripts/build-scvi-data.ts`

## Known limitations
- SVS urban-land gap: SSURGO does not cover impervious surfaces or urban fill, so dense urban counties have estimated SVS scores (flagged as `urbanGap: true` in the bundle)
- CPI uses facility density as a proxy for contamination pressure — a closed and remediated facility still appears in the RCRA count
- The geometric mean formula (`√(SVS × CPI)`) suppresses counties where one component is very low — a county with very vulnerable soil but no industrial pressure scores lower than a county with moderate soil vulnerability and moderate industrial pressure
- Academic preprint available at `docs/preprint/scvi-preprint.md`
