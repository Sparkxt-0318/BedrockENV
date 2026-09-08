# EPA SDWIS — Safe Drinking Water Information System

## What it covers
Violation history for US public drinking-water systems (PWS). Each record includes violation type, contaminant, violation date, return-to-compliance date, and severity. Also used to look up PWSID by geographic identifier (state + county FIPS).

## What it does NOT cover
- Private wells
- Violations more than 10 years old (they age off Envirofacts)
- Contaminants not regulated under the Safe Drinking Water Act (e.g., PFAS prior to April 2024 MCL rule — UCMR 5 covers those)
- Water quality at the tap (SDWIS tracks system-level violations, not household-level sampling)

## Resolution
Area-level — Public Water System (PWSID). One water system may serve many addresses.

## Refresh cadence
Near real-time via Envirofacts REST API. No local bundle — queried live per assessment. EPA updates the database as violations are entered and resolved.

## Known limitations
1. Historical violations (pre-2015 for many systems) have been purged from the accessible API records, which can understate cumulative burden for cities with legacy issues (e.g., Flint's 2015–2019 lead crisis violations have aged off).
2. Violations that were resolved quickly may not appear if they were administratively withdrawn.
3. PWSID lookup by county can return multiple systems; the largest-population system is selected, which may miss smaller/private systems serving the exact query address.
4. Military bases and tribal nations often have separate EPA Program IDs and may not appear in standard SDWIS queries.

## Authoritative source
https://www.epa.gov/enviro/sdwis-search — Envirofacts REST API: https://data.epa.gov/efservice/
