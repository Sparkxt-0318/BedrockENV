# CDC SVI — Social Vulnerability Index

## What it covers
Census tract-level social vulnerability composite (0–1 scale) across four themes:
1. **Socioeconomic status** — poverty, unemployment, income, education
2. **Household composition** — age (elderly, children), disability, single-parent households  
3. **Minority status and language** — minority population, limited English proficiency
4. **Housing type and transportation** — multi-unit housing, mobile homes, crowding, no vehicle, group quarters

Overall SVI score and per-theme percentile rankings.

**Primary use in Bedrock**: Social vulnerability amplifies environmental exposure burden — a vulnerable community facing contamination has less capacity to respond, relocate, or access healthcare.

## What it doesn't cover
- Individual-level data (census tract aggregates only)
- Environmental contamination (SVI is purely demographic)
- Real-time changes in population vulnerability

## Refresh cadence
Released every 2 years using 5-year ACS data. SVI 2022 (based on 2018-2022 ACS) is current as of 2026.

**Source**: CDC Agency for Toxic Substances and Disease Registry (ATSDR)
**API / Data**: CDC GRASP API or bulk download from ATSDR SVI page
**Live API**: `lib/data-sources/cdc-svi.ts`

## Known limitations
1. **Currently non-functional**: SVI is queried as part of the EJ layer which returns 0 for all addresses. Root cause is the same as EJScreen — requires census block-group/tract FIPS from geocoding, which is unreliable. See `epa-ejscreen.md`.
2. **Tract-level aggregation**: Intra-tract variation is lost. A wealthy enclave inside a poor census tract would show high SVI.
3. **2-year lag**: The 2022 SVI reflects 2018-2022 data; communities experiencing rapid change (gentrification, industrial closure) may be misrepresented.

## Scoring integration
Layer: EJ (15% weight). Combined with EJScreen to produce the EJ composite score. Formula in `lib/scoring/ej-scorer.ts`.
