# USGS Water Quality Portal (WQP)

## What it covers
Ambient water quality monitoring data aggregated from EPA, USGS, state agencies, and tribal programs. Bedrock queries the WQP v3 Result endpoint for PFAS-related characteristic names (PFOA, PFOS, PFHxS, PFNA, PFDA, HFPO-DA/GenX, PFBS, and others) within a ~7-mile bounding box of the query address.

Critical for locations without UCMR 5 coverage — particularly rural wells, surface water sources, groundwater monitoring near industrial sites, and areas like Hoosick Falls NY or Yellowstone where contamination was documented outside of the SDWIS/PWSID framework.

## What it doesn't cover
- Non-PFAS contaminants (the query is PFAS-characteristic-name filtered)
- Private wells not associated with a monitoring program
- Monitoring gaps: large portions of rural US have no WQP stations within 7 miles
- Real-time or near-real-time data (results can be months old)

## Refresh cadence
WQP is a live API that aggregates continuously uploaded data from partner agencies. No bundle — queries hit the API directly. Bedrock caches responses for **7 days** per bounding box.

## Known limitations
- WQP data quality is inconsistent: different labs use different methods, detection limits, and reporting units (ng/L, µg/L, ppt). The client normalizes to ppt but unit mismatches can slip through.
- The 7-mile bounding box can pull results from across a county line or a watershed divide, potentially attributing contamination from a distant source.
- WQP v3 (WQX 3.0 endpoint) is newer and more reliable than the legacy `/data/` endpoint but occasionally returns empty CSV for valid queries during service maintenance.
- Detection at a monitoring site does not confirm contamination in the drinking water supply — it could be a surface water or groundwater study.
