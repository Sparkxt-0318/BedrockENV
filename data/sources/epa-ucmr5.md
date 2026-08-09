# EPA UCMR 5 — Unregulated Contaminant Monitoring Rule, Round 5

## What it covers
PFAS occurrence measurements for public water systems (PWS). Per-PWSID records include per-analyte maximum concentration (ppt), first/last sample dates, whether any EPA final MCL is exceeded, system name, state, and size classification. Final MCLs encoded: PFOA/PFOS = 4 ppt; PFHxS/PFNA/HFPO-DA = 10 ppt (April 2024, 89 FR 32532). Testing period: 2023–2025.

## What it doesn't cover
- Small systems not mandated to test under UCMR 5 — these return `data: null, error: null` with no indication of absence
- Tap-level variation within a distribution system (data is system-level, not building-level)
- Private wells or non-community water systems
- PFAS compounds beyond the UCMR 5 analyte list (PFOA, PFOS, PFHxS, PFNA, HFPO-DA, and others)

## How it works
No live API call. EPA publishes quarterly ZIP bundles at `https://www.epa.gov/dwucmr/occurrence-data-unregulated-contaminant-monitoring-rule`. The raw file (`UCMR5_All.txt`, ~300 MB, ~1.9M rows) is preprocessed by `scripts/build-ucmr5-data.ts` into `data/ucmr5-by-pwsid.json`, which is read at server start and cached in memory for O(1) PWSID lookups.

## Refresh cadence
Quarterly EPA releases. Bundle must be manually rebuilt with `pnpm tsx scripts/build-ucmr5-data.ts --release-date YYYY-MM-DD` after each EPA release. A console warning fires after 100 days past the `epaReleaseDate` in the bundle header (`UCMR5_STALE_DAYS`).

## Known limitations
- Bundle is baked at build time and does not auto-update
- Staleness is tracked via `epaReleaseDate` in the bundle header only
- System-level data — cannot distinguish which addresses within a service area are affected
- UCMR 5 does not go through the Envirofacts REST API so live queries are not possible
