# EPA SDWIS — Safe Drinking Water Information System

## What it covers
Health-based and monitoring violations for all regulated public water systems in the US. Covers Maximum Contaminant Level (MCL) violations, Treatment Technique (TT) violations, and monitoring/reporting violations. Also provides water system metadata: PWSID, system name, population served, primary source type (groundwater/surface water).

## What it doesn't cover
- Unregulated contaminants (those are UCMR 5)
- Private wells
- Violations that have been resolved and aged off (EPA generally retains ~5 years of active violations)
- State-only violations (some states run separate programs)
- Lead-specific service line violations (tracked separately in LCR)

## How Bedrock uses it
Queried via EPA Envirofacts REST API (`/SDWA_VIOLATIONS_ENFORCEMENT`) by PWSID at assessment time. Returns violation records including contaminant code, violation begin date, and compliance status. Also used during geocoding to associate an address with its serving PWSID. Violations weighted in the water layer sub-scorer by recency and severity.

## Refresh cadence
Live API — data reflects EPA's current Envirofacts database (updated continuously by states). No local bundle; queried per assessment.

## Known limitations
- Violations from 5+ years ago may not appear (enforcement records pruned)
- State reporting lag: states have up to 60 days to report violations to EPA
- PWSID resolution depends on address geocoding accuracy — rural addresses sometimes match the wrong system
- "No violations" can mean a clean system or a gap in reporting
- The Flint MI lead crisis: many historical SDWIS violations from 2015–2019 have aged off the enforcement database, causing Flint to appear cleaner than it should
