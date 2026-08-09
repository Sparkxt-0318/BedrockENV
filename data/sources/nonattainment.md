# EPA Green Book — Nonattainment Areas

## What it covers
EPA Clean Air Act nonattainment area designations at the county level (5-digit FIPS). Per-county record: list of pollutants for which the county is designated nonattainment, and a classification string (e.g. "Serious" for PM2.5). Returns `isNonattainment: false` for counties in attainment.

## What it doesn't cover
- Sub-county nonattainment boundaries (some designations follow county lines, others don't)
- Historical attainment status (only current designations)
- Maintenance areas (counties that achieved attainment but remain under monitoring)
- Pollutants not covered by a NAAQS (e.g. PFAS, dioxins)

## How it works
No live API call. Reads a static JSON bundle at `data/nonattainment.json` built by `scripts/build-nonattainment-data.ts`. Bundle is loaded once and cached in memory for the process lifetime. All lookups are O(1) dictionary lookups by county FIPS.

## Refresh cadence
Baked into build. EPA Green Book is updated continuously as designations change. Must be rebuilt manually whenever the EPA Green Book has significant changes. No automated staleness detection (unlike UCMR 5, which warns after 100 days).

## Known limitations
- Bundle staleness is tracked via a `generatedAt` field but no automated staleness check or warning is implemented
- Counties not in the bundle are returned as attainment (clean) — could mask bundle incompleteness
- County-level resolution — a single county may contain both attainment and nonattainment areas (particularly for sub-county boundary revisions)
- No staleness warning compared to UCMR 5's 100-day threshold
