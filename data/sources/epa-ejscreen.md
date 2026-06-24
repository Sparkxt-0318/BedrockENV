# EPA EJScreen — Environmental Justice Screening Tool

## What it covers
- EJ Index: combined environmental and demographic burden score (national percentile, 0–100)
- 11 environmental indicators: PM2.5, ozone, NATA air toxics, traffic proximity, lead paint, Superfund proximity, RMP facility proximity, hazardous waste proximity, underground storage tanks, wastewater discharge, drinking water non-compliance
- Demographic indicators: % people of color, % low income, % unemployed, % limited English, % less than high school, % low life expectancy, % low linguistic isolation
- Block-group level resolution

## What it doesn't cover
- Individual contaminant concentrations — EJScreen uses proxies and modeled estimates, not measurements
- Property-specific risk — block-group averages may smooth over hyper-local variation
- PFAS and emerging contaminants — not yet incorporated into EJScreen indicators
- Cumulative burden beyond the 11 indicators (e.g., noise, heat island)

## Refresh cadence
- EPA releases EJScreen annual updates (typically Q2); current version: EJScreen 2.3 (2024)
- Access requires EPA EJScreen API or bulk download from `https://www.epa.gov/ejscreen/download-ejscreen-data`
- Bedrock queries via API at assessment time

## Known limitations
- **Currently non-functional in Bedrock** — EJScreen API requires credentials that are not configured; EJ layer returns 0* for all addresses. This is the highest-priority API integration gap.
- EJScreen percentiles are national — a location at the 70th percentile has elevated burden relative to the national distribution, but may be typical within its state
- Some EJScreen indicators are modeled estimates (NATA air toxics, traffic proximity) that carry their own uncertainties
- EJScreen does not capture cumulative or synergistic effects — the EJ Index is additive, not multiplicative
- Tribal lands are included but have less complete data in some indicator categories
