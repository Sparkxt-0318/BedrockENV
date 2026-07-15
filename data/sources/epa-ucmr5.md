# EPA UCMR 5 — Unregulated Contaminant Monitoring Rule (Round 5)

## What it covers
PFAS occurrence in US public drinking-water systems. ~4,900 community water systems (CWSs) and non-transient non-community water systems (NTNCWSs) serving ≥3,300 people tested for 29 PFAS analytes from 2023–2025. Results include analyte concentrations (ppt/ng/L), sample dates, and a precomputed flag for whether results exceed EPA's April 2024 final MCLs (PFOA 4 ppt, PFOS 4 ppt, PFHxS/PFNA/HFPO-DA 10 ppt).

## What it doesn't cover
- Small water systems (<3,300 people served)
- Private wells — no federal monitoring program covers these
- Contaminants outside PFAS: VOCs (TCE, PCE, benzene), heavy metals, nitrates, etc.
- Post-remediation systems where PFAS has been filtered but detection records persist

## Source
EPA publishes quarterly ZIP bundles at https://www.epa.gov/dwucmr/occurrence-data-unregulated-contaminant-monitoring-rule (UCMR5_All.txt). Bedrock preprocesses this file into `data/ucmr5-by-pwsid.json` via `scripts/build-ucmr5-data.ts`. Queries are O(1) PWSID lookup.

## Refresh cadence
EPA releases updated bundles quarterly. As of January 2026, this is the most recent release. Rebuild script: `pnpm tsx scripts/build-ucmr5-data.ts`.

## Known limitations
- Coverage is ~4,900 systems out of ~50,000 US CWSs — large systems only.
- Results depend on PWSID resolution: addresses not matched to a water system return no PFAS data.
- The PFOA/PFOS 4 ppt MCL is very low — a detection does not automatically indicate a health emergency, but Bedrock flags it per EPA's regulatory threshold.
- Some systems with PFAS detections have since installed treatment; the bundle reflects historical sample results, not current tap concentration.
