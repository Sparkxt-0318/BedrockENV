# EPA TRI — Toxic Release Inventory

## What it covers
Annual toxic chemical releases from manufacturing and other industrial facilities. Covers ~700 listed chemicals including lead, mercury, dioxins, VOCs, and PFAS (added 2020). Reports on-site releases to air, water, and land, plus off-site transfers to disposal/recycling facilities. Facilities are included if they meet thresholds: ≥10 employees, SIC code in covered sectors, and exceed chemical activity thresholds (generally 10,000–25,000 lbs/yr for manufactured/processed chemicals, 100–500 lbs/yr for releases).

## What it doesn't cover
- Small facilities below reporting thresholds (agriculture, utilities below threshold, etc.)
- Federal facilities (although EPA publishes a separate federal facility TRI)
- Releases that occurred but were below threshold
- Mobile sources (vehicles, aircraft)
- Historical releases from facilities that have since closed

## How Bedrock uses it
Accessed via EPA ECHO REST API (TRI data is surfaced in the ECHO facility records via the `fac_tris` flag). Facilities are tagged as TRI emitters in the proximity layer. TRI emitter status is a binary signal — a facility either meets reporting thresholds or doesn't.

## Refresh cadence
TRI reporting year data is published annually (usually September/October of the following year). ECHO updates TRI flags as new annual data is released.

## Known limitations
- Reports on *releases*, not ambient concentrations — high TRI doesn't necessarily mean high local exposure (dispersion depends on geography, meteorology)
- Threshold-based reporting misses many smaller sources
- PFAS added in 2020; pre-2020 PFAS releases are not in TRI
- Self-reported by facilities; accuracy depends on company compliance
