# EPA Superfund — National Priorities List (NPL) Sites

## What it covers
Sites on the National Priorities List (NPL) — the most contaminated sites in the US identified for long-term cleanup under CERCLA (the Superfund law). Bedrock queries the EPA FRS (Facility Registry Service) REST API for NPL sites within a radius of a query point, filtered to SEMS (Superfund Enterprise Management System) program records.

NPL sites represent the highest-severity contaminated land in the US: former chemical plants, smelters, mine tailings, military bases, landfills. Being near an active NPL site is one of the strongest predictors of environmental health risk.

## What it doesn't cover
- **CERCLIS sites** (sites under investigation but not yet listed on NPL)
- **State Superfund programs** — most states have their own lists of contaminated sites; only EPA NPL sites appear here
- **Proposed sites** (in the NPL proposal process) — Bedrock filters for active/final NPL listing
- **Archived/deleted NPL sites** — sites removed from NPL after successful remediation may appear or not depending on FRS record status
- **RCRA Corrective Action facilities** — separately tracked hazardous waste sites (some equally severe)

## Refresh cadence
The FRS REST API serves current EPA facility records. NPL additions/deletions are reflected as EPA publishes rule changes (typically quarterly). Bedrock queries live per assessment.

## Known limitations
1. **Critical coverage gap — static bundle needed**: The FRS radius search misses known active NPL sites including Camp Lejeune, NC and Picher/Tar Creek, OK. This is a confirmed, persistent bug. The recommended fix (a static bundle of ~1,300 NPL sites with coordinates) is in the ROADMAP under "In Progress" but not yet implemented. Until fixed, major contamination events at military bases and some mining Superfunds return a score of 0 on the Superfund component.
2. **FRS timeout risk**: The FRS API frequently times out (5-8s average; worse on congested infrastructure). When it times out, the Superfund component returns null.
3. **Geographic mismatch**: Contaminated plumes from an NPL site can extend miles beyond the site boundary. A 3-mile radius around a site perimeter is a proxy, not a plume model.
4. **Remediation status ignored**: A site at 100% containment and a site leaking actively into groundwater both appear with equal weight. The scoring doesn't distinguish remediation progress.
