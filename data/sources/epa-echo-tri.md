# EPA ECHO + TRI — Enforcement and Compliance History Online / Toxics Release Inventory

**Bedrock adapter**: `lib/data-sources/epa-echo.ts` (ECHO); EPA TRI data via ECHO API
**Scoring layer**: Proximity (ECHO facilities), Air (TRI air emissions)
**API**: `https://echo.epa.gov/tools/web-services`

## What it covers

### ECHO (Enforcement and Compliance History Online)
- ~800,000 regulated facilities: Clean Air Act, Clean Water Act, RCRA hazardous waste, SDWA
- Significant Non-Compliance (SNC) flag: facilities actively violating environmental law
- Permit records, inspection history, enforcement actions, penalties
- Facility type (NPDES, RCRA TSD, CAA major/minor, SDWA), SIC/NAICS code
- Coordinates for proximity radius queries

### TRI (Toxics Release Inventory)
- Annual self-reported releases of 800+ toxic chemicals to air, water, land, and underground injection
- ~22,000 facilities per year; threshold: >10 employees + above manufacture/process/otherwise use thresholds
- Chemical-specific data: PFAS (Form R reporting added 2020), lead, mercury, dioxins, benzene, 1,3-butadiene
- Total environmental releases and transfers to waste management

## What it does NOT cover
- Small businesses below TRI reporting thresholds
- Facilities regulated only at the state level (state RCRA programs, state air permits)
- Mining operations (TRI exempts many mining activities)
- Agriculture (farm animal operations not in ECHO; agricultural chemical use not in TRI)
- Unpermitted/illegal dumping

## Refresh cadence
- **ECHO**: Updated quarterly; enforcement actions have a 1-2 quarter lag
- **TRI**: Annual data released October each year for the prior year (2024 TRI → October 2025)
- Bedrock queries ECHO live per assessment; TRI data flows through ECHO API
- No static bundle for ECHO/TRI

## Known limitations
- **Self-reporting bias (TRI)**: Facilities self-report releases. Chronic under-reporting is documented for small facilities and facilities with weak regulatory oversight
- **API timeout**: ECHO REST endpoint returns up to 30 facilities per radius query; under load, queries time out. When timeout occurs, proximity sub-score falls to Superfund only, depressing scores for industrially dense areas
- **SNC flag lag**: ECHO's SNC flag is updated quarterly; a facility newly out of compliance may not yet carry the flag. Bedrock uses SNC as a penalty modifier in proximity scoring
- **Proximity ≠ exposure**: ECHO shows a facility exists within a given radius; it does not indicate wind direction, emission rates, receptor exposure, or whether emissions reach a specific address
