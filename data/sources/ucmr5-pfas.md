# UCMR 5 — Unregulated Contaminant Monitoring Rule, 5th Edition

## What it covers
Per- and polyfluoroalkyl substances (PFAS) detected in US public water systems (PWS) serving ≥3,300 people. The rule required monitoring for 29 PFAS between 2021–2023. EPA published national results in 2024 and updated in March 2026 (11th release cycle). Coverage: ~10,000 large community water systems (CWS) plus non-transient non-community (NTNC) systems.

Bedrock bundles the UCMR 5 data at the PWSID (public water system ID) level. The bundle maps PWSID → max detection values for PFOA, PFOS, HFPO-DA (GenX), PFHxS, PFNA, PFBS, and sum-of-PFAS metrics used in EPA's MCLs (PFOA+PFOS joint MCL: 4 ppt; sum-of-4: 10 ppt).

## What it does NOT cover
- Small water systems (<3,300 people) — a significant rural gap
- Private wells — no federal monitoring, estimated 43M people on private wells
- Volatile organic compounds (VOCs): TCE, PCE, benzene, vinyl chloride are NOT in UCMR 5
- Heavy metals beyond what's covered by SDWIS
- Groundwater contamination that doesn't reach a monitored PWS
- Systems that applied for and received monitoring waivers

## Refresh cadence
EPA releases UCMR 5 results quarterly. Bedrock's bundle should be rebuilt from EPA's latest UCMR 5 download (EPA Envirofacts: https://www.epa.gov/dwucmr/occurrence-data-unregulated-contaminant-monitoring-rule) whenever a new quarterly release is published. Last bundle date: March 2026 (11th release).

## Known limitations
- **Lag for acute events**: UCMR 5 monitoring closed in 2023. New contamination events (e.g., East Palestine vinyl chloride derailment 2023) are not captured.
- **Not at the address level**: Detection is reported at the PWS level. Multiple neighborhoods served by the same PWS get the same water score sub-component.
- **No private wells**: Rural addresses on private wells receive no UCMR 5 data. The water scorer flags this as partial/unmapped coverage.
- **Remediated systems**: If a system detected PFAS but completed remediation, the 2021–2023 monitoring data may not reflect current conditions.
