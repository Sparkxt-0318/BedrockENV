# EPA SDWIS — Safe Drinking Water Information System

## What it covers
Federal registry of all ~150,000 public water systems (PWS) in the US. Tracks violations of National Primary Drinking Water Regulations (NPDWRs) including Maximum Contaminant Level (MCL) exceedances, treatment technique violations, and monitoring/reporting failures. Updated continuously by states that report to EPA.

## What it does NOT cover
- Private wells (≈43M Americans on private wells)
- Water systems below 25 people served (not regulated as PWS)
- Contaminants without an EPA MCL (most PFAS until April 2024)
- Historical violations that have been resolved and "aged off" (state discretion varies)
- Source water quality — only treated water delivered to customers

## Key fields used
- `PWSID` — unique system identifier for cross-referencing UCMR 5, ECHO
- `PWS_TYPE_CODE` — CWS (community), TNCWS (transient non-community), NTNCWS
- `VIOLATION_CATEGORY_CODE` — MCL, TT, MR, PN, Other
- `CONTAMINANT_CODE`, `CONTAMINANT_NAME` — which rule was violated
- `COMPLIANCE_STATUS_CODE`, `COMPL_PER_BEGIN_DATE`, `COMPL_PER_END_DATE`

## API used
Bedrock queries EPA Envirofacts SDWIS REST API at runtime:
- Violation query: `/data/SDWIS/VIOLATION/ROWS/0:100/JSON` filtered by PWSID
- PWS info query: `/data/SDWIS/LCR_SAMPLE_RESULT` and `/data/SDWIS/WATER_SYSTEM`

## Refresh cadence
Real-time API — no bundled data. States report to EPA on rolling basis; violation records may lag 1–6 months after regulatory action. MCL violations that are resolved may be removed by the state after a compliance period (typically 1 year).

## Known limitations
- **Violation aging**: Flint MI water crisis violations (2015–2019) may have aged off; current SDWIS may show 0 active violations despite known historical contamination
- **Reporting lag**: Some states are significantly behind in reporting to EPA; rural states especially
- **PWSID resolution**: Bedrock resolves PWSID from address via city + state lookup, which may match the wrong water system for addresses near service area boundaries
- **Lead and copper**: Lead Rule violations reflect monitoring failures, not necessarily high lead levels; actual lead exposure depends on pipe material at individual premise
