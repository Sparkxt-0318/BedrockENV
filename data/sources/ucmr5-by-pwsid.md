# Data Source: UCMR 5 PFAS Bundle (`ucmr5-by-pwsid.json`)

## What it covers
EPA's 5th Unregulated Contaminant Monitoring Rule (UCMR 5), covering 29 PFAS analytes
detected in public water systems. Maps PWSID → array of analytes with sample counts,
detection rates, and maximum concentrations. Used by the water scorer to flag PFAS
contamination in drinking water.

## What it does NOT cover
- PFAS in private wells (not monitored by UCMR)
- VOCs, heavy metals, nitrates, or any non-PFAS contaminants
- Water systems serving fewer than 3,300 people (small systems had optional reporting)
- Tribal systems and some non-transient non-community water systems
- Point-of-use sources (only the distribution system is sampled)

## Refresh cadence
EPA publishes UCMR 5 data quarterly at:
https://www.epa.gov/dwucmr/occurrence-data-unregulated-contaminant-monitoring-rule

The monitoring cycle runs 2023–2025; quarterly updates add newly reported results.
After the monitoring cycle closes (~2026), updates become infrequent.

**Current bundle**: Generated 2026-04-13 from EPA release dated 2026-02-12.
**Next refresh due**: Check EPA's page quarterly. A Q2 2026 release may now be available.
See `docs/PENDING_DECISIONS.md` PD-004.

## Known limitations
- Small systems (<3,300 served) had optional reporting — gaps in rural areas.
- Detection does not mean violation; PFAS MCLs only took effect in April 2024.
  The bundle records raw detections, not violation status.
- PWS coverage for tribal nations is incomplete.

## Build script
`scripts/build-ucmr5-data.ts` — accepts the EPA quarterly ZIP's `.txt` file.
Run: `pnpm tsx scripts/build-ucmr5-data.ts path/to/UCMR5_All.txt --release-date YYYY-MM-DD`
