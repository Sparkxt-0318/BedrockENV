# UCMR 5 — Unregulated Contaminant Monitoring Rule (5th cycle)

**What it covers**: PFAS detections in public water systems. Specifically 29 PFAS compounds monitored under EPA's 5th Unregulated Contaminant Monitoring Rule, including PFOA, PFOS, PFNA, PFHxS, HFPO-DA (GenX), and PFBS.

**What it doesn't cover**: VOCs (TCE, PCE, benzene, vinyl chloride), heavy metals (lead, arsenic beyond existing MCLs), disinfection byproducts, nitrates, or historical contamination pre-2023. Not all water systems are covered — only community water systems (CWS) and non-transient non-community water systems (NTNCWS) serving ≥3,300 people.

**Bundled as**: `data/ucmr5-by-pwsid.json` — PFAS detections indexed by PWSID (Public Water System ID). Each entry records the maximum detected concentration (ppt) for each PFAS compound per water system.

**Refresh cadence**: EPA releases UCMR 5 data in batches. Latest release: March 2026 (11th round). Rebuild the bundle from EPA's UCMR 5 portal when new rounds are released, typically quarterly through 2026.

**Known limitations**:
- Small water systems (<3,300 people served) are not required to monitor under UCMR 5. Rural and tribal communities may lack data entirely.
- PFAS-free results indicate no detection above laboratory reporting limits — not necessarily "no contamination."
- PWSID matching to address requires an intermediate step via SDWIS (EPA's Safe Drinking Water Information System). Addresses without a matched PWSID receive no UCMR 5 data.
- Historical PFAS contamination (pre-monitoring period) is not captured.

**Source**: EPA Envirofacts UCMR portal — https://www.epa.gov/dwucmr
