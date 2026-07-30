# EPA SDWIS — Safe Drinking Water Information System

## What it covers
Federal database of public water system (PWS) compliance with the Safe Drinking
Water Act (SDWA). Contains:
- Health-based violations (MCL exceedances, treatment technique failures)
- Monitoring and reporting violations
- Formal enforcement actions (administrative orders, penalties)
- PWS service area population estimates

## What it doesn't cover
- Private wells (not regulated under SDWA)
- State-only violations not reported to federal SDWIS
- Water systems outside the US (territories vary)
- Source water quality (SDWIS tracks treated water at the tap)

## How Bedrock uses it
`lib/data-sources/epa-sdwis.ts` queries the EPA Envirofacts REST API at
`https://data.epa.gov/efservice/` to fetch recent violations for the PWSID
resolved from the address. The scorer weights health-based violations 3×
more heavily than monitoring/reporting violations.

## Refresh cadence
EPA updates SDWIS continuously as states submit data. Historical violations
remain in the database; Bedrock queries all violations in the most recent
5-year window. No local bundle — live API call per assessment.

## Known limitations
- **Reporting lag**: States have up to 90 days to submit violations to EPA.
  Recent violations may not yet appear.
- **Historical dropout**: Flint, MI water crisis violations from 2015–2019
  may no longer appear as "current" violations if EPA has closed them.
- **PWSID resolution gap**: If the property's water system can't be identified
  from address geocoding, SDWIS contributes 0 (not a clean score — a gap).
- **State programs differ**: Some states have stricter MCLs than federal
  standards; SDWIS only tracks federal violations.
