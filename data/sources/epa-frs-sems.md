# EPA FRS/SEMS — Facility Registry Service & CERCLA Site Information

## What it covers
EPA's Facility Registry Service (FRS) is the authoritative source for facilities registered across all EPA programs. Bedrock uses FRS filtered to the SEMS (Superfund Enterprise Management System) program to identify National Priorities List (NPL) Superfund sites near an address. Each NPL site record includes: coordinates, site name, status (active cleanup, deleted, proposed), and proximity to the queried location.

## What it doesn't cover
- Non-NPL contaminated sites (these may be in Brownfields or state databases)
- RCRA corrective action sites (separate program)
- State-lead cleanup sites (not on the federal NPL)
- Sites that are listed on NPL but lack FRS facility-level records (a known gap)

## How Bedrock uses it
Live radius query in `lib/data-sources/epa-superfund.ts`. Returns count and proximity of NPL sites within the search radius. Contributes to the proximity layer score. Also displayed on the Mapbox contamination map in showcase reports.

## Known critical gap — Tar Creek / Picher OK
The Tar Creek Superfund NPL site does not reliably appear in FRS SEMS radius queries. The Tar Creek site is a 40-square-mile mining district — the largest type of NPL site — and may be registered differently (site boundary vs. point location). This caused Bedrock to score Picher, OK at 18/100 when the expected score is 70+. A static NPL bundle would fix this.

## Refresh cadence
Live API — FRS updated as EPA registers new facilities and updates NPL status. Final NPL list updated ~annually.

## Known limitations
- Some active NPL sites have no facility-level FRS records or have incorrect coordinates
- Radius search may miss very large sites whose center is outside the radius but whose boundary overlaps
- API timeouts are frequent; Bedrock applies a 2× timeout
- **Static NPL bundle needed**: ~1,300 active NPL sites with coordinates as fallback for API gaps (flagged in ROADMAP.md)

## Source
EPA FRS: https://www.epa.gov/frs
EPA SEMS: https://www.epa.gov/enviro/sems-overview
EPA NPL: https://www.epa.gov/superfund/superfund-national-priorities-list-npl
