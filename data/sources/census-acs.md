# US Census — American Community Survey (ACS 5-Year Estimates)

**Bundled file:** `data/census-tract-demographics.json`
**Live API module:** `lib/data-sources/geocoding.ts` (Census geocoder)
**Used in:** Geocoding, SCVI/CFCI/Redlining intelligence pages, EJ layer (pending)

## What it covers

### Bundled tract-level demographics (census-tract-demographics.json)
- ACS 5-year estimates (2018–2022 vintage) for all ~85,000 US census tracts
- Median household income, poverty rate, racial/ethnic composition
- Housing age proxy (pre-1950 housing unit percentage — lead risk indicator)
- Population counts for denominator weighting

### Census geocoder (live)
- Address-to-coordinate conversion with census tract and block FIPS codes
- PWSID-to-address matching via SDWIS state-level lookups
- Fallback to Mapbox geocoding when Census geocoder returns no match

## What it doesn't cover
- Individual household data — all estimates are aggregate at tract or larger level
- Undocumented population (ACS undercounts non-response households)
- Year-round transient populations (seasonal workers, tourists)
- Tract-level data for areas with population < 65 — suppressed for privacy

## Refresh cadence
- **Bundled data: annual** — ACS 5-year estimates are released each December (prior 5-year period)
- Next scheduled rebuild: December 2026 (2020–2024 vintage)
- Source: https://data.census.gov/
- Census geocoder API: https://geocoding.geo.census.gov/geocoder/

## Known limitations
- 5-year estimates smooth over rapid demographic changes — newly developed or gentrifying tracts may be significantly misrepresented
- 9 Connecticut Planning Regions (CPR) replaced counties in 2022 — some FIPS-based joins fail for CT tracts
- ACS margins of error are large for small tracts — poverty rate estimates in tracts under 1,000 population can vary ±10 percentage points
- The pre-1950 housing proxy for lead risk is crude — lead paint was used in newer housing too, and many pre-1950 homes have been remediated
