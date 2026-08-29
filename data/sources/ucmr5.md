# EPA UCMR 5 — Unregulated Contaminant Monitoring Rule (5th edition)

## What it covers
PFAS (per- and polyfluoroalkyl substances) detections at public water systems (PWSs) serving >3,300 people. Covers 29 PFAS compounds under EPA's 5th monitoring cycle. Bundled as `data/ucmr5-by-pwsid.json` keyed by PWSID.

## What it doesn't cover
- PWSs serving <3,300 people (not required to participate)
- Private wells
- Legacy contaminants: TCE, PCE, benzene, vinyl chloride, nitrates, heavy metals
- State-regulated contaminants beyond EPA's 29-compound list

## Refresh cadence
EPA releases UCMR 5 data in batches. Full dataset release: March 2026. The bundled file was built from that release. Next scheduled update: when EPA publishes UCMR 6 (expected ~2030).

Check `https://www.epa.gov/dwucmr/occurrence-data-unregulated-contaminant-monitoring-rule` for interim releases.

## Known limitations
- **Coverage gap**: ~10% of PWSs that were required to test did not report results by the March 2026 release date.
- **Spatial lag**: PWSID-to-address mapping relies on SDWIS service area boundaries, which can be imprecise in rural areas.
- **Point-in-time**: Reflects monitoring data collected 2023–2025. Post-treatment improvements not reflected.
- **Detection ≠ violation**: A PFAS detection below the MCL (4 ppt for PFOA/PFOS) is flagged but weighted below a regulatory violation.

## Scoring use
Water layer sub-component. Detections above EPA health advisory level (10 ppt) add significant score. Detections between 4–10 ppt add moderate score. Below 4 ppt are recorded but minimally weighted.
