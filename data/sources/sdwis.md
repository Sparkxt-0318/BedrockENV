# EPA SDWIS — Safe Drinking Water Information System

## What it covers
Health-based and monitoring/reporting violations for regulated public water systems (PWSs) in the EPA Envirofacts database. Two capabilities: (1) PWSID resolution — given a county FIPS code, finds the primary community water system serving that area; (2) violation history — returns violation records (contaminant, rule, type, status, begin date) for a known PWSID. Violation count and severity feed the water scorer's SDWIS sub-component.

## What it doesn't cover
- **No private wells** — SDWIS only covers regulated PWSs (≥25 people or ≥15 connections).
- **No PFAS specifically** — PFAS violations appear in SDWIS but UCMR 5 is a more complete PFAS source.
- **Historical violations may age off** — Envirofacts only retains violations from approximately 1993 forward; older violations (e.g. Flint's 2015–2019 lead violations) may be marked `resolved` with low current weight in the scorer.
- **No real-time alerts** — SDWIS reflects the last quarterly Envirofacts sync, not live boil-water advisories.
- **Tribal water systems** — Coverage is incomplete for tribal PWSs; some are under state primacy, others direct federal.

## Refresh cadence
EPA Envirofacts is updated quarterly. SDWIS queries are live (no local bundle). A cached PWSID lookup is stored per session to avoid repeated API calls.

## Known limitations
- PWSID resolution by county FIPS can match the wrong system if multiple PWSs serve a county — the system selects the largest by connections.
- FRS API field names are returned lowercase; the code uses a case-insensitive `field()` helper to tolerate this.
- Envirofacts pagination caps at 100 rows per request; violation history for large systems (e.g. NYC) may require multiple pages.
- Violation severity weighting (health-based vs. monitoring/reporting) is simplified — the scorer counts violations, not their regulated contaminant risk level.

## Source
EPA Envirofacts SDWIS: https://enviro.epa.gov/envirofacts/sdwis/search  
Implementation: `lib/data-sources/epa-sdwis.ts`
