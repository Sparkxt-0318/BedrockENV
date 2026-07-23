# EPA UCMR 5 — Unregulated Contaminant Monitoring Rule (5th Cycle)

## What it covers
Nationwide monitoring data for 29 PFAS (per- and polyfluoroalkyl substances) and lithium in public water systems (PWS) serving >3,300 people. Collected 2023–2025 under Safe Drinking Water Act authority. ~6,600 PWS sampled (~70M people served).

## What it does NOT cover
- PFAS < reporting minimum reporting level (MRL) are not detected — a "not detected" result does not mean zero PFAS
- Does not cover volatile organic compounds (VOCs): TCE, PCE, benzene, vinyl chloride
- Does not cover heavy metals (lead, arsenic) beyond existing MCL monitoring
- Private wells are excluded
- Water systems serving <3,300 people are excluded (UCMR 3 covered smaller systems)
- Post-treatment blended water — some systems blend contaminated sources below detection; final tap may still contain PFAS

## Key fields used
- `PWSID` — links to EPA SDWIS water system registry for geocoding
- `AnalyteCode`, `AnalyteName` — PFAS compound identification (e.g., PFOA, PFOS, PFBS)
- `AnalyticalResultValue`, `AnalyticalResultUnitCode` — concentration in ng/L (ppt)
- `SampleCollectionBeginDate` — for filtering to latest monitoring period

## Bundled data
Rather than hitting the live API per request, Bedrock pre-processes UCMR 5 into `data/ucmr5-pfas-by-pwsid.json`. This bundle maps PWSID → max PFAS concentration across the monitoring period.

**Last rebuilt**: 2026-04-15 (from EPA Envirofacts UCMR5 endpoint)
**Source URL**: https://www.epa.gov/dwucmr/occurrence-data-unregulated-contaminant-monitoring-rule

## Refresh cadence
EPA releases updated UCMR 5 data quarterly as monitoring progresses. The monitoring period ends 2025; final dataset expected Q1 2026. Rebuild the bundle when EPA publishes new releases.

## Known limitations
- "Not detected" ≠ "zero" — MRLs vary by compound (0.53 ng/L for PFOA, higher for others)
- Some PWS have only one sampling event; others have multiple — bundle uses max detection
- UCMR 5 MCLs were proposed in 2023 (4 ng/L for PFOA/PFOS combined); finalized April 2024. Bedrock scores against MCL where available.
- Geographic coverage: PWSID-to-address linkage relies on SDWIS geocoding, which has known inaccuracies for systems serving multiple service areas
