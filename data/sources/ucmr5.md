# EPA UCMR 5 — Unregulated Contaminant Monitoring Rule, 5th Occurrence

## What it covers
PFAS detections in community water systems (CWS) and non-transient non-community water systems (NTNCWS) serving ≥3,300 people. Covers 29 PFAS analytes mandated under UCMR 5 (2021–2023 sampling cycle). Keyed by PWSID (public water system ID).

- **Bundle file**: `data/ucmr5-by-pwsid.json`
- **Bundle EPA release**: 2026-02-12
- **Bundle generated**: 2026-04-13
- **PWS count**: 3,539 systems
- **Row count**: 37,546 detection records

## What it doesn't cover
- Systems serving <3,300 people (~90% of US water systems by count, covering ~9% of US population)
- Private wells — UCMR covers only public water systems
- PFAS compounds not on the UCMR 5 analyte list (e.g., GenX, PFHxA not individually listed)
- Post-2023 contamination events — snapshot is from 2021–2023 sampling cycle
- Systems that tested below detection limits appear in the bundle with zero detections, not absent

## Refresh cadence
**Stale threshold**: 100 days from EPA release date. The staleness warning (`console.warn`) fires on first load when this threshold is exceeded.

EPA typically releases UCMR 5 data updates quarterly as additional systems report results. Check: https://www.epa.gov/dwucmr/occurrence-data-unregulated-contaminant-monitoring-rule

To rebuild: `pnpm tsx scripts/build-ucmr5-data.ts --release-date YYYY-MM-DD`

**Current status (as of 2026-08-11)**: STALE — bundle is 180 days past EPA release date (threshold: 100 days). Staleness warning actively firing in production on every cold start.

## Known limitations
- Utility-level data only — a positive PFAS detection applies to all addresses served by that system, which may be thousands of households
- Zero detection ≠ no contamination — some systems weren't required to test (too small), and some PFAS compounds are below instrument detection limits
- The WQP ambient monitoring fallback is used for addresses with no PWSID match; it is less precise (bbox-based area-level, not system-specific)
- MCL enforcement (4 ppt individual PFAS) began after the UCMR 5 sampling window — the bundle predates enforcement and may not reflect post-MCL utility responses (treatment upgrades, source changes)
