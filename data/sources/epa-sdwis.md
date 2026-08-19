# EPA SDWIS — Safe Drinking Water Information System

## What it covers
Federal database of public water system (PWS) violations and enforcement actions. Covers health-based violations (MCL exceedances for lead, arsenic, nitrates, coliform, etc.), monitoring violations (failure to test), and treatment technique violations.

We use SDWIS to:
1. Resolve the serving PWSID from a geocoded address
2. Fetch violation history for that water system (past 10 years)
3. Score systems by violation count, severity, and recency

## What it does NOT cover
- Private wells (estimated 13M households in the US)
- PFAS under UCMR 5 — those are in our separate UCMR 5 bundle
- Systems serving fewer than 25 people in some states
- Violations resolved via informal enforcement (no formal NOV issued)

## Refresh cadence
SDWIS data is queried live via EPA Envirofacts REST API at assessment time. No bundled snapshot. Data lags EPA enforcement actions by approximately 30–90 days.

## How we use it
- PWSID resolution: `GET /SDWIS/facilities` with geocoordinates bounding box
- Violation query: `GET /SDWIS/violations` filtered by PWSID, health-based violations, last 10 years
- Water scorer sub-component: violation count × recency weight, capped at 100

## Known limitations
- **Abandoned towns / military bases**: No PWSID → no SDWIS data. Addressed by fallback to census lead-risk proxy only.
- **Historical violations age off**: Violations older than the reporting window may not appear. Flint (2015–2019 lead crisis) violations may be partially aged out.
- **API reliability**: Envirofacts REST API experiences intermittent 503s and timeouts. We retry up to 3× with 1s backoff; failures degrade to coverage='partial'.
- **Violation severity varies**: We do not currently weight by contaminant toxicity (an arsenic MCL exceedance is treated the same as a monitoring violation).
