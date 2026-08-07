# EPA TRI — Toxics Release Inventory

## What it covers
Annual releases of toxic chemicals to air, water, and land from manufacturing and other industrial facilities. Facilities with >10 employees that manufacture or process >25,000 lbs (or use >10,000 lbs) of listed chemicals must report annually. ~22,000 facilities nationwide.

**Chemicals tracked**: 770+ listed chemicals including PFAS (added 2020), dioxins, heavy metals (lead, mercury, arsenic), solvents (benzene, toluene), and carcinogens.

**Data points**: Facility name, address, chemical name, release quantity (lbs) to air/water/land/underground, transfer to disposal.

## What it doesn't cover
- Facilities below reporting thresholds (small emitters, distributors, service businesses)
- Spills and accidental releases (those go to NRC/CERCLA emergency notification)
- Agricultural chemical use (pesticides are excluded from TRI)
- Some PFAS compounds below de minimis threshold

## Refresh cadence
Annual reporting; data typically available in October for the prior calendar year (1-year lag). Bedrock queries via ECHO API filtered by TRI flag.

**Live API**: `lib/data-sources/epa-tri.ts` (queries via ECHO facility search with TRI flag)

## Known limitations
1. **1-year reporting lag**: TRI data is always at least one year behind. A facility that began heavy emissions last year won't appear in the current TRI dataset.
2. **Self-reported**: Facilities self-report their own releases. Underreporting is possible; enforcement relies on periodic EPA audits.
3. **Threshold gap**: Facilities below TRI thresholds (e.g., small industrial operations, dry cleaners, gas stations) are not captured. ECHO/RCRA captures some of these.
4. **Aggregate radius**: Bedrock uses TRI facility count within radius as a signal; the quantity of releases is not currently weighted by volume or toxicity.

## Scoring integration
Layer: Proximity (20% weight) and Air (25% weight, air-emitter sub-component). TRI reporters in radius increase both proximity and air layer scores. Formula in `lib/scoring/proximity-scorer.ts` and `lib/scoring/air-scorer.ts`.
