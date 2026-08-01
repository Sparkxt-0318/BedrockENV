# EPA UCMR 5 — Unregulated Contaminant Monitoring Rule (5th Occurrence)

## What it covers
PFAS (per- and polyfluoroalkyl substances) detections in public water systems (PWSs) serving 3,300+ people and a representative sample of smaller systems. Covers 29 PFAS analytes including PFOA, PFOS, and GenX compounds. Results are at the PWS level (PWSID), not at the individual tap.

## What it doesn't cover
- Private wells (~45M Americans on private wells have no UCMR 5 coverage)
- VOCs (TCE, PCE, benzene, vinyl chloride) — these were covered by earlier UCMR rounds but not UCMR 5
- Biological contaminants
- Lead — UCMR 5 does not test for lead (covered by Lead and Copper Rule, separate program)
- Systems serving fewer than 25 people unless selected in the statistical sample

## Refresh cadence
Quarterly. EPA publishes updated occurrence data at:
https://www.epa.gov/dwucmr/occurrence-data-unregulated-contaminant-monitoring-rule

The bundled file (`data/ucmr5-by-pwsid.json`) was preprocessed from EPA's ZIP file. The bundle includes the EPA release date and the runtime client warns at startup if the bundle is more than 100 days old.

## Known limitations
- PFAS detection does not imply current contamination — some results reflect historical testing periods (2023–2025)
- Detection at any concentration above the reporting minimum (4 ppt for PFOA/PFOS) is flagged, which may overweight trace detections
- Some PWSs blend multiple sources; a single PWSID detection may not affect all service connections
- Geographic coverage is at PWSID level — a single large PWSID may serve multiple ZIP codes

## How BedrockENV uses it
`lib/data-sources/epa-ucmr5.ts` loads the bundle at startup (O(1) lookup by PWSID). The PWSID is resolved for an address via SDWIS geographic lookup. Detections above EPA's MCL (PFOA: 4 ppt, PFOS: 4 ppt) contribute to the water layer score.

## Source
EPA Envirofacts / UCMR program: https://www.epa.gov/dwucmr
