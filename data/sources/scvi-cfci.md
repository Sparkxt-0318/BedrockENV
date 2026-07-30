# SCVI / CFCI — Bedrock Intelligence Indices (Derived)

## What they are
Bedrock-computed national indices at the county level, derived from public
federal data sources. Not sourced from external APIs — computed and bundled.

### Soil Contamination Vulnerability Index (SCVI)
`SCVI = normalize(sqrt(SVS × CPI))` where:
- **SVS** (Soil Vulnerability Score): SSURGO organic matter, drainage class, pH,
  texture, climate erosivity proxy, urban data gap penalty
- **CPI** (Contamination Pressure Index): legacy industrial sites (EPA FRS),
  active industrial density (ECHO), compliance violations, TRI toxic releases

Scores all 3,140 US counties, 0–100. Quartile 4 = top 25% contamination risk.

### Compound Flood-Contamination Index (CFCI)
`CFCI = normalize(sqrt(FloodExposureScore × CPI))` where:
- **FloodExposureScore** = NFIP residential penetration rate × 100
- **CPI** = same contamination pressure component as SCVI

Scores 3,131 US counties (9 CT planning regions unmatched). Identifies counties
where flood water can mobilize soil contaminants — the compound risk.

## Source files
- `data/scvi-national.json` — 3,140 county SCVI records
- `data/cfci-national.json` — 3,131 county CFCI records
- `data/flood-by-county.json` — county-level NFIP penetration rates

## Refresh cadence
These are static bundles. They should be rebuilt when:
- SSURGO undergoes a major national refresh (every ~3–5 years)
- EPA releases significantly updated TRI or ECHO data (annually)
- FEMA updates flood zone coverage materially
- A scoring formula change bumps SCORING_VERSION

Scripts for rebuilding are in `data/scvi-build/`.

## Known limitations
- **County resolution**: Both indices average across entire counties. An
  industrial facility in one corner of a large rural county elevates the county
  CPI for all residents, including those far from the facility.
- **Urban SSURGO gap**: SCVI SVS scores are less reliable for heavily urban
  counties because SSURGO returns "urban land" with no soil data.
- **Static snapshot**: CFCI flood exposure from NFIP penetration rates reflects
  the 2022 NFIP policy dataset. Rapidly changing flood insurance take-up rates
  in at-risk coastal areas may not be current.
- **CPI is not contamination presence**: A high CPI county has *pressure* from
  industrial activity and violation history. It does not necessarily mean
  measured contamination is present or exceeds health thresholds.
