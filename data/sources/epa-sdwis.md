# EPA SDWIS — Safe Drinking Water Information System

## What it covers
- **Violation history**: drinking-water violations for a given PWSID — violation category (MCL, MRDL, TT, etc.), contaminant code/name, compliance period dates, health-based indicator, and compliance status. Returns up to 100 records sorted newest-first.
- **PWSID lookup**: resolves a state/county/city/ZIP combination to the serving public water system PWSID, system name, population served, and primary source code.
- **Violation stats**: total violations, last 5/10 years, health-based violations in past 5 years, active violations, and unique contaminant set.

## What it doesn't cover
- Source water quality (only distribution system compliance violations)
- UCMR monitoring results (handled separately by `epa-ucmr5`)
- Private wells or non-community water systems (CWS filter applied)
- More than 100 violation records per system (truncated)

## How it works
Live EPA Envirofacts REST API calls on every request:
- Violations: `https://data.epa.gov/efservice/VIOLATION/PWSID/{pwsid}/ROWS/0:100/JSON`
- PWSID by city: Envirofacts `WATER_SYSTEM` table, filtered by state + city name + active CWS
- Fallback chain: city name → ZIP → largest CWS in state

## Refresh cadence
Live API — no caching layer in this module. SDWIS is continuously updated as violations are entered and resolved.

## Known limitations
- Violations capped at 100 rows; very large systems may be truncated
- City name matching depends on Envirofacts conventions; mismatches fall through to ZIP or state fallback
- State fallback returns the largest CWS in the state, which may be a different utility than the one serving the address
- `fipsCounty` parameter is accepted but not used in Envirofacts queries (county is not a filter parameter in the WATER_SYSTEM table)
- Field names returned in lowercase by the API; accessed via a case-insensitive `field()` helper
