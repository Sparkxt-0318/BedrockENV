# EPA UCMR 5 — Unregulated Contaminant Monitoring Rule (5th edition)

## What it covers
PFAS (per- and polyfluoroalkyl substances) occurrence in public drinking-water systems
across the US. Covers 29 PFAS analytes including PFOA, PFOS, PFHxS, PFNA, HFPO-DA
(GenX), and mixtures. Includes concentrations (ppt / ng/L) and whether detections
exceeded EPA's April 2024 final MCLs (89 FR 32532).

## What it doesn't cover
- Volatile organic compounds (TCE, PCE, benzene, vinyl chloride) — not in UCMR 5
- Private wells — only public water systems with ≥10,000 service connections are required
  to monitor (systems serving 3,300–9,999 were also required; small systems <3,300 optional)
- Point-of-use concentrations (tap-level) — monitoring is at the entry point to the distribution system
- Systems outside the monitoring window (2023–2025 testing cycle)

## Refresh cadence
EPA publishes quarterly release bundles. Current bundle: January 2026 release.
Next expected update: April 2026.

Check: https://www.epa.gov/dwucmr/occurrence-data-unregulated-contaminant-monitoring-rule

Rebuild script: `scripts/build-ucmr5-data.ts` (processes UCMR5_All.txt, ~300 MB, ~1.9M rows)
Output: `data/ucmr5-by-pwsid.json` (PWSID → analyte max concentrations)

## Known limitations
- Does not capture historical PFAS contamination before UCMR 5 testing window
- Monitoring at entry point, not tap — actual exposure at fixtures may differ
- Systems that found no PFAS are indistinguishable from systems that didn't monitor
- EPA data lag: results published months after sampling

## Bedrock usage
Water layer sub-component. Linked to address via PWSID resolved from SDWIS by state + county.
Resolution: AREA-LEVEL (water system service area). Cache: baked into build.
