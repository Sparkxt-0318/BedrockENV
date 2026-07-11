# EPA UCMR 5 — Unregulated Contaminant Monitoring Rule (5th Edition)

## What it covers
PFAS (per- and polyfluoroalkyl substances) occurrence data in US public water systems. 29 analytes monitored including PFOA, PFOS, PFBS, HFPO-DA (GenX), and PFHxS. Covers ~70,000 public water systems required to test; results are reported per PWSID (Public Water System ID).

## What it doesn't cover
- Private wells
- Volatile organic compounds (TCE, PCE, benzene, vinyl chloride) — these require AQS/SDWIS queries
- Military base water systems (not civilian PWS)
- Agricultural irrigation water
- Historical contamination that predates the monitoring period

## How we use it
Bundled as `data/ucmr5-by-pwsid.json` — keyed by PWSID for O(1) lookup. The geocoder resolves an address to a PWSID via SDWIS, then we look up the PFAS record. Detection above any MCL (4 ppt PFOA/PFOS per 2024 EPA rule) contributes to water layer scoring.

## Refresh cadence
EPA releases UCMR 5 data quarterly. Full dataset released March 2026 (11th round). The bundled JSON was last rebuilt from EPA's March 2026 release.

**Next rebuild due:** September 2026 (when EPA publishes next quarterly update).

To rebuild: `pnpm tsx scripts/build-ucmr5-data.ts`

## Known limitations
1. UCMR 5 only covers PFAS. The 29 analytes are a subset of the PFAS universe — newer PFAS compounds not yet on the monitoring list are invisible.
2. Coverage gap for systems that serve <10,000 people: small systems tested less frequently.
3. A "non-detect" result only means the analyte was below the reporting limit — it doesn't mean zero contamination.
4. PWSID resolution can fail for addresses served by multiple systems or private wells; we fall back to 'unmapped' coverage.

## Source
EPA Envirofacts: https://www.epa.gov/dwucmr/occurrence-data-unregulated-contaminant-monitoring-rule
