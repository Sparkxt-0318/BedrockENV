# Data Source: EPA Green Book Nonattainment Bundle (`nonattainment.json`)

## What it covers
County-level EPA NAAQS nonattainment designations for six criteria pollutants:
PM2.5, PM10, Ozone, SO2, NO2, Lead. Maps county FIPS → array of active nonattainment
designations with pollutant, classification (Marginal/Moderate/Serious/Severe/Extreme),
and applicable standard. Used by the air scorer to identify counties where ambient air
exceeds federal health standards.

## What it does NOT cover
- Current air quality readings (real-time or historical averages) — that requires AQS
- Near-road or point-source dispersion — nonattainment is a regional county-level designation
- Counties in attainment (they simply don't appear in the bundle)
- Tribal air quality programs (some tribal lands have separate designations)
- Carbon monoxide (CO) — an older standard now rarely violated

## Refresh cadence
EPA updates the Green Book (nonattainment designations) continuously as counties
achieve or lose attainment following EPA rulemaking. The bundle is a snapshot.

**Recommended refresh**: Annually, or when a major EPA rulemaking is announced
(e.g., new PM2.5 NAAQS finalized in 2024, new ozone standards under review).

Source: https://www.epa.gov/green-book

## Known limitations
- Reflects designation status at time of bundle build — does not track reclassifications
  within the current year.
- County-level granularity: a county may be in nonattainment due to an industrial zone
  while most residential neighborhoods are cleaner.
- Nonattainment does not directly measure human exposure — it indicates systemic
  air quality failure in the region.

## Build script
No automated build script. Bundle was manually compiled from EPA Green Book CSV export.
Rebuild when nonattainment records change significantly.
