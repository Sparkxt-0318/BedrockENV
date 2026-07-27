# EPA UCMR 5 — Unregulated Contaminant Monitoring Rule (5th Edition)

**Bedrock file**: `data/ucmr5-data.json` (bundled static)
**Bedrock adapter**: `lib/data-sources/epa-ucmr5.ts`
**Scoring layer**: Water

## What it covers
- PFAS (per- and polyfluoroalkyl substances) detections in public water systems
- 29 PFAS analytes including PFOA, PFOS, PFBS, PFHxS, PFNA, PFDA, GenX (HFPO-DA), and more
- All community water systems and non-transient non-community systems serving >3,300 people
- Monitoring period: 2023–2025 (phased rollout)
- ~6,900 public water systems tested, covering ~200 million people

## What it does NOT cover
- Private wells — not monitored at all
- Water systems serving <3,300 people
- Contaminants beyond the 29 PFAS analytes (no TCE, PCE, vinyl chloride, nitrates, lead)
- Post-remediation sites — if contamination was cleaned up before the monitoring period, it will not appear
- Real-time detections — this is the 5th round snapshot, not a continuous feed

## Refresh cadence
- EPA releases final UCMR 5 data as monitoring cycles complete; full dataset expected finalized by end of 2025
- Check https://www.epa.gov/dwucmr/occurrence-data-unregulated-contaminant-monitoring-rule for new releases
- Bedrock bundle should be rebuilt whenever EPA publishes new UCMR 5 occurrence data (use `scripts/build-ucmr5-data.ts`)
- Full rebuild recommended: annually or whenever EPA releases a new UCMR round

## Known limitations
- **PFOA/PFOS gap at known sites**: Post-remediation PWS entries may show clean readings even at major PFAS contamination sites (Parkersburg WV, Hoosick Falls NY) if remediation predate monitoring
- **Coverage completeness**: ~72% of US population served by monitored systems; rural/small-system coverage is sparse
- **Aggregation unit**: UCMR 5 is keyed to PWSID (public water system ID), not address. Bedrock crosswalks via SDWIS PWSID lookup for a given lat/lng; if PWSID resolution fails, water score uses WQP fallback
- **PFAS only**: TCE, PCE, 1,4-dioxane, nitrates, arsenic (the other major drinking water contaminants) are not in UCMR 5 — they appear in SDWIS violations instead
