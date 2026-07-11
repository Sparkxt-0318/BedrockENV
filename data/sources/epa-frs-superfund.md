# EPA FRS / SEMS — Facility Registry System / Superfund Enterprise Management System

## What it covers
National Priorities List (NPL) Superfund sites — contaminated sites where EPA has authority under CERCLA to compel cleanup. ~1,300 active NPL sites nationwide plus hundreds of deleted (cleaned up) sites. FRS provides facility-level spatial coordinates; SEMS tracks cleanup status.

## What it doesn't cover
- State Superfund programs (separate from federal NPL)
- RCRA corrective action sites (a separate cleanup program)
- Brownfields (tracked separately via EPA Brownfields API)
- Sites under emergency response authority that haven't been listed on NPL yet (East Palestine OH is the canonical example)
- Sites registered at a different spatial scale than our radius query (see Known Limitations)

## How we use it
Live REST API call to FRS lat/lng radius search, filtered to SEMS program. We count NPL sites within a 10-mile radius, weighted by distance. An NPL site within 1 mile contributes much more than one at 8 miles.

## Refresh cadence
NPL is updated when EPA finalizes new listings (typically 1–3 additions/deletions per year). FRS coordinates are updated continuously. We query live.

**Known data gap requiring a static bundle:** The FRS API has been observed missing several high-profile NPL sites in radius queries — including Tar Creek (Picher OK) and Camp Lejeune NC. A static `data/superfund-npl.json` bundle of all ~1,300 active sites with verified coordinates is planned (ROADMAP.md, "in-progress").

## Known limitations
1. **FRS API spatial gap**: Some NPL sites span hundreds of square miles (mining districts, military installations). FRS registers a point location that may not be within the query radius even when the address is inside the contamination zone. This is the Picher OK and Camp Lejeune failure mode.
2. **Deleted sites**: Cleaned-up sites remain on the deleted NPL list but should not score as high. We filter to active NPL only.
3. **Emergency response lag**: Acute events (train derailments, industrial accidents) are handled via CERCLA emergency response authority before NPL listing. There's typically a 1–3 year lag before an event site appears in FRS.
4. **Military installations**: DoD installations on the NPL (Camp Lejeune, McClellan AFB) have restricted facility records in FRS.

## Source
EPA FRS: https://www.epa.gov/frs
EPA SEMS: https://cumulis.epa.gov/supercpad/cursites/srchsites.cfm
