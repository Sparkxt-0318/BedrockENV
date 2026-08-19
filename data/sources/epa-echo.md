# EPA ECHO — Enforcement and Compliance History Online

## What it covers
Regulated facilities under the Clean Air Act, Clean Water Act, and RCRA (hazardous waste). Includes facility location, industry type, inspection history, violation status, and enforcement actions. Sub-databases:

- **ECHO Facility Search**: lat/lng radius queries returning regulated facilities
- **TRI (Toxics Release Inventory)**: Annual pounds of listed toxic chemicals released to air, water, land by facility
- **SNC (Significant Non-Compliance)**: Facilities with ongoing or recent serious violations

## What it does NOT cover
- Unregulated sources (farms below CAFO thresholds, small auto shops)
- Sites under state-only programs not reported to EPA
- Historical facilities that have closed and been delisted

## Refresh cadence
ECHO data is queried live at assessment time via the ECHO Facility Search API. TRI data lags by approximately 18 months (annual reporting cycle; 2024 TRI reflects 2023 releases). SNC status is updated quarterly.

## How we use it
- Proximity scorer: count of ECHO facilities within 5-mile radius, weighted by SNC status and TRI release volume
- Facility popup data in ContaminationMap (ECHO and TRI markers)
- Up to 30 nearest facilities fetched, filtered to SNC=amber, TRI=amber, other=gray

## Known limitations
- **API timeout**: ECHO radius queries can time out for urban areas with 100+ facilities. We cap results at 30 and retry once.
- **TRI lag**: Chemical releases in the current year are not yet in TRI. A recently-discovered contamination event won't appear until the following year's report.
- **No dose modeling**: We count facility presence and TRI tonnage but do not model actual exposure pathways or cancer risk (that would require EPA RSEI integration).
- **Agricultural gap**: Large CAFOs and agricultural chemical users may not be in ECHO if they fall below federal reporting thresholds.
