# USGS WQP — Water Quality Portal

## What it covers
PFAS and other contaminant detections from surface water and groundwater monitoring stations maintained by USGS, EPA, state agencies, and tribal governments. Covers over 400 million water quality result records from thousands of monitoring locations. Bedrock queries for PFAS-related detections within a geographic radius of the assessed address.

## What it doesn't cover
- Treated drinking water (use UCMR 5 for PWS)
- Sites with no monitoring stations within the search radius
- Point-of-use water quality at homes
- Private well data in most states

## How Bedrock uses it
Live radius query against the WQP REST API. Results feed into the water layer score alongside UCMR 5 and SDWIS. Implemented in `lib/data-sources/usgs-wqp.ts`. Returns whether PFAS compounds were detected and at what levels.

## Refresh cadence
Live API — data is continuously updated as monitoring agencies submit results. No local bundle required.

## Known limitations
- Coverage is highly uneven: dense urban areas have many monitoring stations; rural areas may have none within the search radius
- Detection does not mean risk — many reported detections are below health advisory levels
- API response time is slow for large radius queries; Bedrock applies a 4s timeout

## Source
USGS Water Quality Portal: https://www.waterqualitydata.us/
