# UCMR 5 — Unregulated Contaminant Monitoring Rule 5 (PFAS)

## What it covers
Per- and polyfluoroalkyl substances (PFAS) detected in public water systems serving ≥3,300 people.
EPA's 5th Unregulated Contaminant Monitoring Rule, covering 29 PFAS analytes including PFOA, PFOS, PFNA, PFHxS, PFBS, and GenX.

## What it doesn't cover
- Systems serving <3,300 people (private wells, small community systems)
- Non-PFAS contaminants (TCE, PCE, benzene, VOCs, heavy metals outside lead)
- Historical contamination prior to the monitoring window (2021–2023)

## Refresh cadence
EPA published final UCMR 5 results in March 2026 (covering 2021–2023 monitoring). Next UCMR cycle (6) expected ~2030. The bundled file `data/ucmr5-by-pwsid.json` should be rebuilt when EPA releases updated results via EPA Envirofacts API.

## Source
- EPA Envirofacts UCMR API: https://www.epa.gov/dwucmr
- Bundled as: `data/ucmr5-by-pwsid.json` (keyed by PWSID)

## Known limitations
- ~25% of US public water systems are small (<3,300 population) and exempt from UCMR monitoring
- Measures detection levels at the system, not the tap — distribution system contamination varies
- Detection does not imply violation; MCLs for PFOA/PFOS set at 4 ppt (April 2024 rule) but enforcement phased
- Military bases and private systems not included
