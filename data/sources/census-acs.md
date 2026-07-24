# Census ACS — American Community Survey (5-Year Estimates)

## What it covers
Demographic and housing characteristics at the tract and block group level.
Bedrock uses:
- **B25034** (Year Structure Built): Pre-1950 and pre-1986 housing stock percentages
  as a proxy for lead paint and lead pipe risk.
- **B19013** (Median Household Income): Used in EJ layer social vulnerability calculations.
- **B17001** (Poverty Status): Used in EJ and SCVI demographic overlays.
- **B03002** (Race/Hispanic Origin): Used in EJ and redlining analysis.

## What it doesn't cover
- Individual household characteristics (ACS is aggregated to census geographies)
- Properties built or renovated after the survey reference year
- Direct measurement of lead paint presence or lead service lines

## How Bedrock uses it
- **Lead risk proxy**: Pre-1986 housing percentage → `LeadRiskData.pctPre1986` →
  water layer lead sub-score. Client at `lib/data-sources/epa-lead.ts`.
- **SCVI demographics**: Tract-level income/poverty/race merged into
  `data/census-tract-demographics.json` for the Intelligence page.
- **Geocoding enrichment**: Census geocoder also returns tract FIPS, block group,
  and county FIPS codes during address geocoding.

## Refresh cadence
ACS 5-year estimates are released annually (December). The 2022 5-year estimates
(covering 2018-2022) are the current baseline.
The SCVI demographics bundle should be rebuilt annually from the latest ACS release.

## Known limitations
1. **Estimation error**: ACS is a survey sample (~3M households/year), not a count.
   Margin of error can be large for small tracts or low-population subgroups.
2. **Proxy gap**: Pre-1986 housing stock is a *proxy* for lead risk, not a direct
   measurement. New construction in old neighborhoods and post-1986 renovation can
   undermine the proxy.
3. **Military base gap**: Military installations have no resident civilian population
   in ACS, so census tracts covering bases show null or zero for most fields.
   Camp Lejeune is a direct example of this failure mode.

## Source
- URL: https://data.census.gov and https://api.census.gov/data/
- Tables: B25034, B19013, B17001, B03002 (ACS 5-Year, 2022 vintage)
- Format: REST API / JSON
