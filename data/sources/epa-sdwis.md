# EPA SDWIS — Safe Drinking Water Information System

## What it covers
Drinking water violations and enforcement actions for US public water systems (PWS). Returns violation history including health-based violations (MCL exceedances, treatment technique failures), monitoring/reporting violations, and public notification failures. Also resolves PWSID from county FIPS for the water scoring pipeline.

**Runtime module:** `lib/data-sources/epa-sdwis.ts`  
**API:** EPA Envirofacts REST  
`https://enviro.epa.gov/efservice/`

## What it doesn't cover
- Private wells
- Violations that have been administratively closed or dismissed
- Contaminants not regulated under the SDWA (PFAS was unregulated before 2024; UCMR 5 data is separate)
- Historical violations that have been purged from the Envirofacts database (some violations from the 1980s–90s are no longer queryable)

## Refresh cadence
Near-real-time API — no local bundle. Envirofacts is updated on a rolling basis as states report violations to EPA. No manual rebuild needed.

**Rate limits:** No API key required; public endpoint. Recommends throttling to avoid 503s.

## Known limitations
- **Data lag from states:** States have up to 60 days to report violations to EPA after the violation occurs. Acute events may not appear for 2–3 months.
- **Historical violations age off:** Some pre-2000 violations are no longer in the Envirofacts database. Flint, MI's 2015–2019 lead violations may show only partial records.
- **Non-health violations dominate counts:** Monitoring and reporting violations (e.g., missed sampling deadlines) are much more common than health-based violations. The scorer down-weights non-health violations.
- **Rural area coverage:** Very small community water systems (CWS) and non-community systems (NTNCWS) may have incomplete records.
- **System boundaries:** SDWIS data is water-system-level, not neighborhood-level. One PWSID can cover a large multi-county area.

## Scoring integration
The water scorer uses violation recency (violations in last 5 years weight more than older ones), violation type (health-based vs. monitoring), and severity tier to produce a water sub-score.
