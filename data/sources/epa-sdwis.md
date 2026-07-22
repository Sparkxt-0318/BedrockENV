# EPA SDWIS — Safe Drinking Water Information System

## What it covers
Compliance history for all ~50,000 US public water systems (PWS). Bedrock queries two capabilities via the EPA Envirofacts REST API:

1. **System lookup**: resolve (state FIPS, county FIPS) → PWSID and system name.
2. **Violation history**: pull violation records for a known PWSID, including contaminant code, violation type (MCL, monitoring, reporting), severity, and whether it's been resolved.

Used in the water scoring layer to compute a violation severity score and flag current unresolved violations.

## What it doesn't cover
- **Private wells** — only regulated public water systems (serving >25 people or >15 connections).
- **Water quality** — SDWIS tracks *compliance events*, not measured concentrations. A system can have zero violations while still having elevated (but below-MCL) contamination.
- **Non-contaminant violations** — some violations are paperwork/monitoring failures, not actual contamination detections; Bedrock scores these lower than MCL exceedances.
- **Historical contamination pre-database** — violations before ~1993 are sparsely represented.
- **Military bases and tribal systems** — some have incomplete SDWIS records.

## Refresh cadence
Live API (https://data.epa.gov/efservice/SDWA_VIOLATIONS_ENFORCEMENT). Data is updated by EPA as states report. Bedrock does not cache SDWIS results at build time — fetched live per assessment with a 15-second timeout.

## Known limitations
1. **Aged-off violations**: Some historical violations (including Flint, MI lead crisis violations from 2014-2016) roll off the default query window. Scores for historically contaminated systems may understate true risk.
2. **County-to-PWSID resolution is imprecise**: An address may be served by a water system that serves multiple counties; we resolve to the largest PWSID in the county. Rural addresses may be on a well.
3. **503 / API outage risk**: The Envirofacts REST API has intermittent outages. When it fails, the water layer falls back to UCMR 5 + WQP only.
4. **Reporting lag**: States have 30-60 days to report violations to EPA. Recent violations may not appear.
