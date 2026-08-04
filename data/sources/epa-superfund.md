# EPA FRS/SEMS — Superfund NPL Sites

## What it covers
Active National Priorities List (NPL) Superfund sites from EPA's Facility Registry Service (FRS) and SEMS (Superfund Enterprise Management System). Includes site coordinates, cleanup status, and distance from the queried address.

## What it doesn't cover
- Proposed NPL sites (not yet officially listed)
- Removed/deleted NPL sites (post-remediation delisting)
- CERCLIS sites not on NPL
- State-managed cleanup sites that are not on the federal NPL
- Superfund Alternative Approach (SAA) sites

## How Bedrock uses it
Queried via EPA FRS REST API (`/frs/rest/facilities?pgm=SEMS`) with radius search (10 miles) around the assessment coordinates. Returns NPL sites within range. Used in the proximity layer sub-scorer.

## Refresh cadence
Live API. FRS/SEMS is updated by EPA as site status changes (typically months to years after events).

## Known limitations
**Critical gap**: FRS SEMS radius search misses some active NPL sites. Known false negatives:
- **Tar Creek, Picher OK** (Tar Creek Superfund, one of worst in US history) — returns 0 results from FRS SEMS radius search despite being on NPL since 1983. The site may be registered as a large-area polygon rather than a point facility.
- **Camp Lejeune, NC** — NPL site but FRS radius search returns 0 hits. Military base registrations may differ.

A static bundle of ~1,300 active NPL sites with centroid coordinates is planned (see ROADMAP.md) to supplement this API. Federal database latency: sites from acute events (e.g., East Palestine OH train derailment, Feb 2023) take 1–3 years to appear in SEMS.
