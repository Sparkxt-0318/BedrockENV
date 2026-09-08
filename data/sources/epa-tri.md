# EPA TRI — Toxic Release Inventory

## What it covers
Self-reported toxic chemical releases to air, water, and land from industrial facilities. Covers ~650 listed toxic chemicals and chemical categories. Facilities above reporting thresholds (typically 25,000 lbs manufactured/processed or 10,000 lbs otherwise used) must file annual Form R reports. TRI data is accessed through ECHO (facilities are tagged as TRI reporters in the ECHO API response).

## What it does NOT cover
- Releases from facilities below reporting thresholds
- Accidental spills or emergency releases (those are under CERCLA/Emergency Planning requirements)
- Historical releases from facilities that have since closed
- Fugitive emissions (self-reported estimates, not measured)

## Resolution
Facility-level — exact address of the reporting facility.

## Refresh cadence
Annual — facilities report by July 1 for the prior calendar year. TRI data lags ~18 months behind the current date.

## Known limitations
1. Self-reporting is subject to misreporting (intentional or accidental). EPA audits are infrequent.
2. The reporting threshold means many smaller industrial polluters are entirely invisible in TRI.
3. 18-month lag means a significant new polluter won't appear in TRI for over a year after beginning operations.
4. Air release estimates use EPA emission factors, not continuous monitoring. Actual emissions may be higher.

## Authoritative source
https://www.epa.gov/toxics-release-inventory-tri-program — Data: https://enviro.epa.gov/triexplorer/
