# EPA Superfund — FRS/SEMS National Priorities List

**Live API module:** `lib/data-sources/epa-superfund.ts`
**In progress:** `data/superfund-npl-static.json` (static bundle for ~1,300 NPL sites)
**Used in:** Proximity layer, CPI sub-score

## What it covers
- Active and deleted NPL (National Priorities List) Superfund sites (~1,300 active as of 2026)
- Facility coordinates, site name, EPA site ID, and operable unit status
- Queried via EPA FRS (Facility Registry Service) and SEMS (Superfund Enterprise Management System) APIs
- Distance from target address to nearest NPL site

## What it doesn't cover
- CERCLIS proposed sites that never made the NPL — ~50,000 sites investigated but not listed
- State Superfund programs (many states have their own lists with non-NPL sites)
- Brownfields (addressed separately via EPA Brownfields API)
- Contamination plume extent — proximity is measured to the site boundary point, not the full contamination footprint
- Sites where contamination has migrated to groundwater beyond the official site boundary (e.g., Camp Lejeune off-base areas)
- Dissolved or absorbed municipalities where historical contamination predates modern tracking (Picher, OK gap)

## Refresh cadence
- **Live API**: queried per assessment; FRS/SEMS updates as EPA makes listing decisions
- **Static bundle (upcoming)**: quarterly rebuild from EPA's downloadable NPL site list
- NPL additions/deletions: EPA proposes sites for listing via Federal Register; final listings occur 2–4 times per year
- Source: https://www.epa.gov/superfund/superfund-data-and-reports
- Static bundle build: `pnpm tsx scripts/build-superfund-bundle.ts` (once implemented)

## Known limitations
- FRS API returns up to 1,000 facilities per query — searches near large industrial cities may be truncated
- API timeout (~10s) causes Superfund to drop out of scoring for roughly 10% of assessments under load
- Site coordinates reflect the official site centroid, which may be far from the actual contamination area for large multi-operable-unit sites (e.g., Tar Creek covers ~40 square miles)
- SEMS deletion of remediated sites means some historically contaminated locations show no current NPL record
- Static bundle will address timeout issue but will lag NPL updates by up to 90 days
