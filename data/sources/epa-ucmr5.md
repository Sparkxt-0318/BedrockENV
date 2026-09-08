# EPA UCMR 5 — Unregulated Contaminant Monitoring Rule (5th cycle)

## What it covers
PFAS (per- and polyfluoroalkyl substances) occurrence data in US public drinking-water systems. Reports max concentrations in ppt (ng/L) per analyte per Public Water System ID (PWSID), plus first/last detection dates. Covers PFOA, PFOS, PFNA, PFHxS, HFPO-DA (GenX), and related compounds as specified in 40 CFR Part 141.

## What it does NOT cover
- Private wells (no PWSID → not in UCMR 5)
- VOCs (TCE, PCE, benzene, vinyl chloride) — only PFAS
- Inorganic contaminants (lead, arsenic, nitrates)
- Small water systems serving fewer than 25 people
- Systems tested and found non-detect (they appear in the bundle but with concentration = 0)

## Resolution
Area-level — water system (PWSID) serving a census tract or county. A single water system may serve hundreds of addresses; the same result applies to all of them.

## Refresh cadence
EPA publishes new UCMR 5 occurrence ZIPs quarterly. The bundled file `data/ucmr5-by-pwsid.json` must be rebuilt using `pnpm tsx scripts/build-ucmr5-data.ts` whenever a new quarterly release is available. The runtime client logs a warning at startup when the bundle is >100 days old. The bundle currently reflects the **January 2026** EPA release.

## Known limitations
1. Covers only systems sampled under UCMR 5 (2021–2025 monitoring cycle). Some small systems and non-CWS were exempted.
2. Detections represent sample period averages; point-in-time exposures may be higher or lower.
3. Systems with no reported violations are indistinguishable from systems never tested, unless cross-referenced against the SDWIS inventory.
4. PWSID resolution depends on SDWIS lookup; if geocoding returns a county with multiple water systems, Bedrock selects the largest by population served.

## Authoritative source
https://www.epa.gov/dwucmr/occurrence-data-unregulated-contaminant-monitoring-rule
