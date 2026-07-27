# EPA SDWIS — Safe Drinking Water Information System

**Bedrock adapter**: `lib/data-sources/epa-sdwis.ts`
**Scoring layer**: Water
**API**: `https://sdwis.epa.gov/ords/sfdw_pub/r/sfdw/sdwis_fed_reports_public/`

## What it covers
- All federally-reportable violations for public water systems since 1993
- Maximum Contaminant Level (MCL) violations: lead, arsenic, nitrates, coliform, DBPs, and hundreds of regulated contaminants
- Treatment technique violations (e.g., failure to properly treat for turbidity)
- Monitoring & reporting violations (failure to test as required)
- Public notification violations
- ~150,000+ public water systems; data updated daily by EPA

## What it does NOT cover
- Private wells — not in SDWIS
- Unregulated contaminants (see UCMR 5 for PFAS)
- State-only violations below federal thresholds
- Schools' and day cares' lead in drinking water (separate Lead in School program)

## Refresh cadence
- SDWIS is a live database updated continuously as states report to EPA
- Bedrock makes live API calls per assessment; no static bundle
- Violations data is current to within 1-2 months of EPA's last state submission
- If the SDWIS API is deprecated, see EPA Enforcement and Compliance History Online (ECHO) as a fallback

## Known limitations
- **Violation lag**: States can be months or years behind in reporting to EPA. A small utility with active MCL violations may not appear if the state hasn't submitted
- **Compliance vs. detection**: A system with no violations may still have contaminants at levels just below the MCL. UCMR 5 catches these for PFAS
- **System size bias**: Large systems are more comprehensively monitored and reported. Rural small systems have higher rates of unreported violations
- **Historical only**: SDWIS captures past violations, not current contaminant levels. A system with past violations may have remediated
- **PWSID dependency**: Bedrock resolves PWSID via geocoding (lat/lng → nearest PWS service area). If PWSID resolution fails, SDWIS returns empty and water sub-score falls to Census lead-proxy only
