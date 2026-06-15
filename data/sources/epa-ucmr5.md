# EPA UCMR 5 — Unregulated Contaminant Monitoring Rule (5th Edition)

## What it covers
PFAS occurrence data for US public water systems (PWS). Contains max detected concentrations per analyte and MCL exceedance flags for 29 PFAS compounds including PFOA, PFOS, PFNA, PFHxS, HFPO-DA (GenX), and PFBS. Covers ~8,000+ water systems that serve ≥3,300 people.

**Runtime module:** `lib/data-sources/epa-ucmr5.ts`  
**Bundled data:** `data/ucmr5-by-pwsid.json` (keyed by PWSID)  
**Build script:** `scripts/build-ucmr5-data.ts`

## What it doesn't cover
- Water systems serving <3,300 people (small systems) — these are not required to test under UCMR 5
- Private wells — no federal monitoring program covers private drinking water
- Surface water at non-PWS sampling points (covered separately by USGS WQP)
- Contaminants outside the UCMR 5 analyte list: TCE, PCE, benzene, vinyl chloride, lead, nitrate, DBPs
- Post-treatment variability — UCMR 5 samples at the entry point, not the tap

## Refresh cadence
EPA publishes quarterly updates to the UCMR 5 dataset (typically Jan, Apr, Jul, Oct). The bundled file records `epaReleaseDate`; the runtime client logs a warning when the bundle is >100 days old (`UCMR5_STALE_DAYS`).

**Upstream URL:** https://www.epa.gov/dwucmr/occurrence-data-unregulated-contaminant-monitoring-rule  
**Last confirmed release:** Jan 2026

## Known limitations
- Data lag: EPA typically publishes UCMR 5 results 6–12 months after sampling. The most recent monitoring cycle (2023–2025) is not yet fully published.
- Coverage gap by geography: rural small systems are exempt. Areas where the dominant water supply is private wells (much of rural Appalachia, Midwest) show no UCMR 5 data.
- Not a real-time feed — requires manual bundle rebuild when EPA releases a new quarter.
- One PWSID can serve multiple addresses across different risk profiles; the score reflects the system-level average, not tap-level variation.

## MCL values encoded
EPA final PFAS MCLs (April 2024, 89 FR 32532) in ppt (ng/L):
- PFOA: 4 ppt
- PFOS: 4 ppt
- PFHxS: 10 ppt
- PFNA: 10 ppt
- HFPO-DA (GenX): 10 ppt
- PFBS: 2,000 ppt
- Mixtures (PFHxS + PFNA + HFPO-DA + PFBS): Hazard Index ≤ 1.0
