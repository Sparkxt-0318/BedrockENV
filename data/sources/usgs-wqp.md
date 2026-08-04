# USGS WQP — Water Quality Portal

## What it covers
Ambient water quality monitoring data aggregated from USGS, EPA, and state environmental agencies. Includes chemical detections in surface water and groundwater: PFAS, metals, nutrients, VOCs, pesticides. Data comes from discrete sampling events at monitoring stations, not continuous monitoring.

## What it doesn't cover
- Tap water (WQP monitors ambient surface and groundwater, not treated drinking water)
- Private wells that weren't part of monitoring programs
- Areas without monitoring stations (significant coverage gaps, especially rural)
- Continuous real-time data (discrete sample events only)

## How Bedrock uses it
Queried via USGS WQP REST API with bounding box around the assessment coordinates. Searches for PFAS analytes in samples within the last 5 years. Used as a supplemental water layer sub-component (ambient PFAS signal, not tied to a PWSID). If no PWSID is resolved and WQP also returns no results, the water layer coverage is marked as 'unmapped' (not 'partial').

## Refresh cadence
Live API reflecting ongoing USGS/EPA/state monitoring programs. New monitoring results are submitted by agencies on varying schedules.

## Known limitations
- Monitoring station coverage is uneven — urban/industrial areas have more stations, many rural areas have none
- Ambient water quality at a monitoring station may not reflect conditions at a private or public well drawing from the same aquifer
- Sample data can be years old if no recent monitoring program covered the area
- PFAS parameters in WQP vary by reporting format — the query uses a fixed list of analyte names that may miss some PFAS under alternative naming conventions
- WQP PFAS coverage is limited compared to UCMR 5 (which covers all community water systems)
