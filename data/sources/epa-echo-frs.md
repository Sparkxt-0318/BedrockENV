# EPA ECHO + FRS — Enforcement and Compliance History Online / Facility Registry System

## What it covers
**ECHO**: Regulated facility database covering Clean Air Act (CAA), Clean Water Act (CWA), and RCRA (solid/hazardous waste) permitted facilities. Includes compliance history, inspection records, significant non-compliance (SNC) flags, and TRI (Toxics Release Inventory) reporters.

**FRS/SEMS**: The Superfund Enterprise Management System within FRS contains National Priorities List (NPL) Superfund sites, RCRA corrective action sites, and other cleanup sites.

## What it doesn't cover
- Unregistered or pre-regulatory-era contamination sources (e.g., historical mining operations not captured as RCRA sites)
- State-only permitted facilities that aren't in the federal ECHO system
- Some large NPL sites registered as area-wide (not point-source) facilities — these can be missed by radius queries

## How Bedrock uses it
**Proximity scorer**: Queries ECHO for regulated facilities within 1 mile, 3 miles, and 5 miles. TRI reporters and SNC facilities score higher. Queries FRS/SEMS for Superfund NPL sites within 5 miles.

**Known gap**: The radius-based SEMS query misses some large-footprint NPL sites (Tar Creek/Picher OK, Camp Lejeune NC) where the site boundary doesn't match a point-source facility record.

## Refresh cadence
ECHO is updated quarterly. FRS/SEMS updated as EPA processes site changes. Bedrock reads live from both APIs.

## Known limitations
1. **NPL radius gap**: Large area-wide Superfund sites are often not returned by point-radius queries. A static NPL bundle (all ~1,300 active sites with centroid coordinates) would fix this — this is the "Superfund static bundle" in ROADMAP.md In Progress.
2. **API reliability**: ECHO and FRS APIs experience intermittent timeouts, especially for SEMS queries. Timeout failures result in 0-facility counts and crushed proximity scores. Improvement Log documents multiple instances.
3. **Brownfields API**: EPA Brownfields API has experienced extended outages (HTTP 503). Brownfields are part of the soil scorer; outages cause soil scores to drop to near-zero for urban addresses.
4. **TRI chemical resolution**: TRI data reports total releases but doesn't distinguish between highly toxic (dioxins, mercury) and lower-concern compounds. All TRI emitters score similarly regardless of chemical toxicity.

## Source
- EPA ECHO: https://echo.epa.gov/tools/web-services
- EPA FRS/SEMS: https://www.epa.gov/enviro/frs-overview
- NPL site list: https://www.epa.gov/superfund/superfund-national-priorities-list-npl
