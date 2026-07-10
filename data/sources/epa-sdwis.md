# EPA SDWIS — Safe Drinking Water Information System

**What it covers**: Public water system violations, enforcement actions, and health-based monitoring for community water systems (CWS) and non-community water systems (NTCWS) across the United States. Covers MCL (Maximum Contaminant Level) violations, treatment technique (TT) violations, and monitoring/reporting (M/R) violations.

**What it doesn't cover**: Private wells. Systems serving fewer than 25 people or used fewer than 60 days/year. State primacy violations that are not reported to federal EPA. Lead service line counts are not in SDWIS (those are reported under LCRR separately).

**Used for**: Water layer — counts health-based violations at the PWSID matched to the target address's water system. Violation severity weighting: health-based violations (MCL, TT, MRDL) score highest; M/R violations score lower.

**Refresh cadence**: SDWIS is updated continuously as states report violations and enforcement actions. The scoring engine queries the Envirofacts SDWIS REST API live. Historical violations may age off the active violations endpoint — the engine queries violations from the past 10 years.

**Known limitations**:
- Violations "age off" the active database after resolution. A water system with a major historical violation (e.g., Flint, MI lead crisis 2015-2019) may show few or no current violations if the enforcement action was resolved.
- State reporting lag: states have up to 90 days to report violations to federal EPA. Recent violations may not appear.
- PWSID matching to a home address requires an intermediate lookup step (EPA SDWIS service area queries). Addresses in unincorporated areas or served by small systems may not match.
- Health advisory violations (e.g., PFAS above advisory level but below MCL) are NOT included in SDWIS. Only formal MCL violations are captured.
- Some CWS boundaries cross county lines, so a PWSID may serve addresses in multiple counties with different exposure profiles.

**Source**: EPA Envirofacts SDWIS API — https://enviro.epa.gov/enviro/ef_metadata_html.ef_search?p_table_name=VIOLATION
