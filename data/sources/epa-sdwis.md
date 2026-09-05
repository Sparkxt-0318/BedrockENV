# EPA SDWIS — Safe Drinking Water Information System

## What it covers
Compliance records for ~155,000 public water systems (PWS) in the US. SDWIS tracks:
- Health-based violations (maximum contaminant level violations, treatment technique violations)
- Monitoring and reporting violations
- Significant non-compliance (SNC) determinations
- PWS inventory: system name, state, population served, primary water source type (surface/ground)

Bedrock queries SDWIS for active violations for the PWSID(s) associated with a geocoded address. Violations are weighted by type (health-based > monitoring) and recency (violations within 5 years weighted more heavily).

## What it does NOT cover
- Private wells (no SDWIS record for individual wells)
- Distribution system condition (lead service lines, pipe materials not in SDWIS)
- Historical violations that aged out of the system (typically >10 years)
- Source water quality upstream of the treatment plant

## Refresh cadence
EPA updates SDWIS on a rolling basis as states report violations. Bedrock queries the live Envirofacts API (no static bundle). Coverage is real-time but subject to state reporting lag (6–12 months is common for smaller systems).

## Known limitations
- **Reporting lag**: States self-report to EPA. Violations may take 6–12 months to appear after detection.
- **Aged-off violations**: Historical violations from the Flint water crisis (2015–2019) and similar events may not appear in current SDWIS records.
- **PWSID resolution**: Not all geocoded addresses can be matched to a PWSID. Rural areas and private-well addresses return null, marked as `unmapped` coverage.
- **System size bias**: Large urban systems are better monitored and more frequently cited than small rural systems, which may have more violations that go undetected.
