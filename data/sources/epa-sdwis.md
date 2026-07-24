# EPA SDWIS — Safe Drinking Water Information System

## What it covers
Violations and enforcement actions for ~150,000 public water systems in the US.
Covers health-based violations (Maximum Contaminant Level exceedances, Treatment Technique
violations) and monitoring & reporting violations.

## What it doesn't cover
- Private wells
- Violations older than ~5 years (older records age out or are superseded)
- Contaminants not regulated under SDWA (e.g. PFAS prior to MCL finalization in April 2024)
- State primacy violations filed only in state systems (not yet reported to federal SDWIS)

## How Bedrock uses it
Runtime API calls to EPA Envirofacts SDWIS REST endpoint.
The PWSID is resolved from the geocoded address via a two-step: Census → SDWIS geographic
lookup. Client at `lib/data-sources/epa-sdwis.ts`.

Scoring: health-based violation count → water sub-score component. Recent violations
(within 5 years) weighted more heavily than older ones.

## Refresh cadence
Live API — Envirofacts SDWIS data is updated weekly by EPA.
No local bundle; every assessment queries the live API.

## Known limitations
1. **Historical violations age off**: Flint's 2015-2019 lead violations are no longer
   reflected in current SDWIS returns, causing Flint to score lower than its historical
   crisis would warrant.
2. **State primacy lag**: Some states (TX, WY, others) self-administer primacy and
   report to SDWIS on a delay. Violations may be missed for 30-90 days.
3. **API rate limits**: Envirofacts enforces rate limits. Timeouts are retried but
   contribute to partial coverage when they persist.
4. **PWSID lookup failures**: Rural areas and very small systems sometimes lack a
   geospatially-resolvable PWSID.

## Source
- URL: https://ofmpub.epa.gov/enviro/sdw_report_v3.get_default?state_code=&sys_num=
- Envirofacts API: https://data.epa.gov/efservice/
- Format: REST/JSON
