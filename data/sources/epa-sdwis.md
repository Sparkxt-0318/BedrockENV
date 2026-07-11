# EPA SDWIS — Safe Drinking Water Information System

## What it covers
Drinking water violations for regulated contaminants in public water systems. Includes Maximum Contaminant Level (MCL) violations, treatment technique violations, and monitoring/reporting violations. Each violation record includes contaminant name, begin/end date, PWS name, and enforcement action.

## What it doesn't cover
- Private wells (not regulated under SDWIS)
- Contaminants not yet regulated (PFAS were not regulated until April 2024 EPA rule; violations under the new rule take time to appear)
- State-only violations (some states track additional violations not reported to federal SDWIS)
- Historical violations that have been "resolved" and aged out of the active violations feed

## How we use it
Live REST API call to EPA Envirofacts SDWIS endpoint, filtered by PWSID. We count violations in the last 5 years by severity tier (MCL > treatment technique > monitoring). Recent MCL violations carry heavier weight. PWSID is resolved during geocoding.

## Refresh cadence
SDWIS is updated monthly by EPA as states report new violations and close old ones. We query live on every assessment — no bundled copy. Response time: 200–800ms typical; times out at 10s.

## Known limitations
1. **Aging**: Historical violations (pre-2020 for a 5-year window) drop out of the scoring window even if contamination persists. Flint MI is the canonical example — lead crisis violations from 2015–2019 are partially aged off.
2. **Regulatory lag**: New MCLs (PFAS, April 2024) produce new violations only after the compliance date — systems had until 2027 to comply. Early scoring may under-count PFAS burden.
3. **API reliability**: SDWIS Envirofacts REST API has had intermittent availability issues during peak hours.
4. **Monitoring violations ≠ contamination**: A monitoring violation means a system failed to test, not that contamination was found. We weight these lower but they still inflate scores slightly for non-contaminated systems with reporting problems.

## Source
EPA Envirofacts SDWIS: https://enviro.epa.gov/facts/sdwis/
