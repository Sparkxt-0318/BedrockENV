# EPA SDWIS — Safe Drinking Water Information System

## What it covers
- All health-based violations issued to public water systems under the Safe Drinking Water Act
- Monitoring violations (failure to test) and treatment technique violations
- Significant deficiencies and sanitary survey findings
- Active violations (unresolved) and historical violations (5-year and 10-year windows)
- Covers all ~140,000 community and non-transient non-community water systems

## What it doesn't cover
- Private wells and small systems below the PWS threshold
- Boil-water advisories issued by local health departments (not all appear in SDWIS)
- Treatment plant performance metrics (only violations, not raw data)
- Lead action level exceedances at the tap (captured separately in LCR data)

## Refresh cadence
- EPA updates SDWIS continuously; Envirofacts REST API reflects near-real-time enforcement actions
- Bedrock queries live at assessment time (no cached bundle)
- API endpoint: Envirofacts SDWIS REST (`/SDWWA/search`)

## Known limitations
- Violation counts vary by PWS size — large systems have more monitoring requirements and thus more opportunities for violations; raw counts are not normalized by system size
- Violations can be in "resolving" status long after the actual contamination event ended
- Enforcement response varies by state primacy agency — some states are more aggressive reporters
- Historical violations older than 10 years are not captured in the 10-year window
- Some PWS records are duplicated or have stale data due to state reporting lag
