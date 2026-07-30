# UCMR 5 — Unregulated Contaminant Monitoring Rule, Round 5 (PFAS)

## What it covers
EPA's UCMR 5 required public water systems serving >3,300 people to monitor for
29 PFAS compounds during 2023–2025. Coverage includes:
- PFOA, PFOS (subject to new MCLs as of April 2024)
- PFNA, PFHxS, HFPO-DA (GenX), PFBS
- 23 additional PFAS variants

## What it doesn't cover
- Private wells (no federal monitoring requirement)
- Water systems serving <3,300 people (some states have separate programs)
- Contaminants not on the UCMR 5 list (e.g., 1,4-dioxane, chromium-6)
- Historical contamination that preceded 2023

## Coverage
~10,000 public water systems (PWS) tested. Indexed in this repo by PWSID.
Bundled as `data/ucmr5-by-pwsid.json` (~1.1 MB) for offline scoring.

## Refresh cadence
EPA released final UCMR 5 results March 2026. Next round (UCMR 6) expected
to cover different contaminants; monitoring begins 2027. Check
https://www.epa.gov/dwucmr for new releases.

## Known limitations
- A non-detection does not mean "clean" — it means below the reporting level
  for the specific compounds monitored. Emerging PFAS not on the list go undetected.
- Results represent the monitoring period (2023–2025), not current conditions.
- Some large systems serve multiple counties; PWSID-to-county mapping may assign
  detections to the wrong county if the service area is multi-county.
- EPA's reporting level for PFOA/PFOS (4 ppt) is the same as the new MCL —
  systems with levels below this threshold appear as non-detects.
