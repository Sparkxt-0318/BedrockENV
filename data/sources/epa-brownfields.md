# EPA Brownfields — Brownfield Sites Database

## What it covers
Properties contaminated by hazardous substances, pollutants, or contaminants where expansion, redevelopment, or reuse may be complicated by the potential presence of a hazardous substance. Includes both EPA-assessed and state-assessed brownfields tracked in the EPA Brownfields Assessment, Cleanup, and Reuse (ACRES) database.

## What it does NOT cover
- Active Superfund NPL sites (those are tracked separately in FRS SEMS)
- RCRA corrective-action facilities (tracked under ECHO)
- Underground storage tank (UST) sites below brownfield threshold
- Privately-remediated sites that were never in the federal tracking system

## Refresh cadence
Queried live via the EPA ACRES REST API at assessment time. EPA updates ACRES as grants are awarded and site assessments are completed. No bundled snapshot.

## How we use it
Soil scorer sub-component: brownfield sites within a 2-mile radius add contamination pressure to the soil score. We use count × distance-weighted score, capped at 100.

## Known limitations
**This is currently our most unreliable data source at runtime.**

The EPA ACRES API (`https://bfassessment.epa.gov`) returns **HTTP 503** with high frequency (observed in >60% of production assessments as of April 2026). When 503 occurs:
- Soil scores drop to near-minimum (brownfield sub-component = 0)
- Addresses like Parkersburg WV (DuPont C8 area), Newark NJ, and South LA that should score 40–60 on soil drop to single digits

This is a **transient infrastructure issue on EPA's side**, not a code bug. Mitigation options (from PENDING_DECISIONS):
1. Bundle the ACRES database as a static JSON (similar to nonattainment) — eliminates API dependency but requires ~50MB file and monthly refresh
2. Add brownfield sub-component result to Redis cache keyed by bounding box — reduces live API calls by ~80% for urban areas
3. Fallback: use ECHO brownfield-adjacent facility types as a proxy when ACRES is unavailable

Until fixed, the IMPROVEMENT_LOG documents score drops as "brownfields API degradation" rather than scoring bugs.
