# UCMR 5 — Unregulated Contaminant Monitoring Rule (5th cycle)

**Bundled file:** `data/ucmr5-by-pwsid.json`
**Live API module:** `lib/data-sources/epa-ucmr5.ts`

## What it covers
- PFAS detections across ~7,200 US public water systems (2023–2025 monitoring cycle)
- 29 PFAS analytes including PFOA, PFOS, PFNA, PFHxS, HFPO-DA (GenX), and 23 others
- Keyed by PWSID (Public Water System Identifier)
- Includes detection counts, maximum detected concentrations, and exceedance flags relative to EPA MCLs

## What it doesn't cover
- Private wells (roughly 13% of US households)
- Contaminants beyond the UCMR 5 analyte list — notably PCBs, TCE, arsenic, nitrates
- Post-remediation systems that have reduced PFAS below detection limits
- Water systems with fewer than 10,000 service connections that opted out of monitoring
- Real-time or continuously updated contamination levels (snapshot from monitoring period)

## Refresh cadence
- **Full rebuild: quarterly** — EPA releases UCMR 5 data in batches as lab results are finalized
- Check for new releases at: https://www.epa.gov/dwucmr/occurrence-data-unregulated-contaminant-monitoring-rule
- Current bundle reflects the most recent EPA zip release; rebuild script in `scripts/build-ucmr5-bundle.ts`
- UCMR 6 monitoring begins 2027 — watch for dataset transition announcement

## Known limitations
- PFOA/PFOS MCLs (4 ppt) took effect June 2024; pre-enforcement detections may not trigger violation flags in SDWIS yet
- Some PWSIDs appear in UCMR 5 but not in SDWIS — PWSID resolution may fail for those systems
- Detection limits vary by lab — a "non-detect" from a less sensitive lab may still contain low-level contamination
- Blended systems (multiple source waters) show aggregate detection — individual source contamination may be masked
