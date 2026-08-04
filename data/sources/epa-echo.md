# EPA ECHO — Enforcement and Compliance History Online

## What it covers
Regulated facility data from EPA's ECHO database, which aggregates data from Clean Air Act (CAA), Clean Water Act (CWA), Resource Conservation and Recovery Act (RCRA), and Safe Drinking Water Act (SDWA) programs. Includes facility location, industry type, Significant Non-Compliance (SNC) status, and TRI (Toxic Release Inventory) emitter flag.

## What it doesn't cover
- Facilities below reporting thresholds (small quantity generators, minor sources)
- Agricultural operations (EPA ECHO focuses on industrial/commercial)
- State-permitted facilities not reported to EPA programs
- Brownfield sites (those are in a separate EPA database)

## How Bedrock uses it
Queried via EPA ECHO REST API (`/frs/rest/facilities`) with radius search (5 miles by default) around the assessment coordinates. Returns up to 30 nearest facilities with compliance status, TRI flag, and SNC flag. Used in both the proximity layer (facility density, compliance burden) and soil layer (industrial land use context).

## Refresh cadence
Live API — reflects EPA's enforcement database in near-real-time. No local bundle.

## Known limitations
- API timeout at 10 seconds; facilities may be missed during periods of high load
- Facility counts vary by industrial density — rural areas return fewer results but this reflects reality, not a data gap
- SNC status reflects current compliance, not historical violations
- Distance calculations use straight-line distance (not travel distance or watershed relationship)
- Some facilities have outdated coordinates in the FRS (Facility Registry Service) that the ECHO API depends on
