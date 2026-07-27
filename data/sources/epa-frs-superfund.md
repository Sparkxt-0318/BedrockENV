# EPA FRS / SEMS — Facility Registry Service & Superfund Enterprise Management System

**Bedrock adapter**: `lib/data-sources/epa-superfund.ts` (part of proximity layer via FRS)
**Scoring layer**: Proximity
**API**: EPA FRS RESTful Services; `https://enviro.epa.gov/enviro/frs_rest_services`

## What it covers
- All active and deleted NPL (National Priorities List) Superfund sites (~1,350 active)
- Site name, coordinates, regulatory status, cleanup phase
- FRS also covers RCRA TSD facilities, NPDES permittees, Clean Air Act major sources

## What it does NOT cover
- **Former NPL sites that have been delisted** — once a Superfund site is cleaned up and delisted, it may not appear (Tar Creek, OK is a known gap)
- **Proposed NPL sites** — sites proposed but not yet formally listed
- **CERCLIS/SEMS archive** — the full historical Superfund archive requires a separate SEMS data pull
- **State Superfund programs** — many states list additional sites not on the federal NPL (NY, NJ, CA, MI all have extensive state programs)
- **Military Superfund sites** — DoD installations appear in FRS but the FUDS (Formerly Used Defense Sites) database is not integrated

## Refresh cadence
- FRS API is live; updated as EPA adds/removes/updates facilities
- No Bedrock static bundle currently (in progress: `Superfund static bundle` — see ROADMAP.md)
- API calls time out intermittently under load; proximity sub-score falls to ECHO facilities only when FRS is unavailable

## Known limitations
- **FRS SEMS misses major sites**: Tar Creek/Picher OK (dissolved town — FRS geocodes wrong), Camp Lejeune NC (military — FUDS data gap), Anniston AL (PCBs present but FRS SEMS timed out in test runs)
- **Coordinate quality**: Some FRS records have approximate coordinates (centroid of city, not site). Proximity radius checks can include or exclude sites incorrectly
- **Timeout frequency**: FRS API times out under ~5% of requests during peak hours. When timeout occurs, Superfund contribution to proximity score = 0, causing systematic underscoring for high-proximity addresses
- **Recommended fix**: Build static bundle of ~1,350 active NPL sites from EPA's downloadable NPL list (https://www.epa.gov/superfund/superfund-national-priorities-list-npl). Estimated effort: 0.5 days. See ROADMAP.md (In Progress) and PENDING_DECISIONS.md PD-001
