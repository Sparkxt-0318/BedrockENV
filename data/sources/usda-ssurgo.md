# USDA SSURGO — Soil Survey Geographic Database

## What it covers
- Soil map unit data for the contiguous US (with gaps — see limitations)
- Key properties used in scoring: pH, organic matter percentage, drainage class, texture
- Coverage tracking: mapped / partial / unmapped status per query
- Resolution: map unit polygons, typically 1:24,000 scale (county-level surveys)

## What it doesn't cover
- Contamination — SSURGO describes natural soil properties, not anthropogenic contamination levels
- Urban fill and disturbed soils — urban map units (code "UD", "UE", etc.) have generic entries with no measured pH/OM
- Subsurface contamination at depth (SSURGO profiles typically cover 0–150cm)
- Recent land use changes — surveys may be 10–30 years old in some counties

## Refresh cadence
- SSURGO is updated as USDA completes new county surveys; updates are rolling, not fixed-cycle
- Some counties have not been re-surveyed since the 1980s
- API: Soil Data Access (SDA) REST endpoint (`https://sdmdataaccess.nrcs.usda.gov/Tabular/SDMTabularService.asmx`)
- Bedrock queries live; no local bundle (data is large and county-specific)

## Known limitations
- Urban "undifferentiated" map units return no pH/OM data — these are the locations most likely to have lead-contaminated soils from historical industry and paint, yet SSURGO cannot surface that
- Map unit component percentages: a map unit may be 60% one soil type and 40% another; Bedrock uses the dominant component
- Some western counties have "not mapped" status — returns unmapped coverage flag, contributing 0 to soil layer
- SSURGO does not include brownfield-specific contamination profiles; those are captured separately via EPA Brownfields
- Drainage class is a categorical field with qualitative definitions that vary slightly by survey area
