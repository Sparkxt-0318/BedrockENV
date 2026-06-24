# USGS Water Quality Portal (WQP) — Ambient PFAS Monitoring

## What it covers
- Ambient water quality measurements from streams, lakes, groundwater, and ambient drinking water samples
- PFAS detections from monitoring stations operated by USGS, EPA, state agencies, and universities
- Bounding-box spatial query: returns all stations within a geographic window around the address
- Used as a fallback when no PWSID-matched UCMR 5 data is available

## What it doesn't cover
- Treated tap water (WQP is ambient/source water, not finished drinking water)
- Systems not physically near a monitoring station — coverage is highly uneven
- Real-time or recent data — many WQP PFAS records are from research studies (2016–2022 window)
- Private groundwater (only monitored if a study targeted that area)

## Refresh cadence
- WQP is continuously updated as agencies submit data; no fixed release schedule
- Bedrock queries live at assessment time via bbox spatial query
- API: Water Quality Portal v3 (`https://www.waterqualitydata.us/data/Result/search`)

## Known limitations
- Area-level confidence only — WQP detections are not correlated to a specific water system serving the address
- Station density is highly variable: PFAS-focused monitoring is concentrated in NJ, MI, CO, MA; large rural areas have no coverage
- "No detections" may mean "no monitoring stations" rather than "clean water" — scoring treats this distinction via presence factor
- WQP analyte names are non-standardized; PFAS mapping to UCMR analyte list requires string normalization that may miss some variants
- Scoring uses WQP only as fallback; UCMR 5 bundle takes precedence when a PWSID match is found
