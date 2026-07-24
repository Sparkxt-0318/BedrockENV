# Pending Decisions

Items that require a judgment call (pricing, branding, scope, architecture).
Each item has options and a recommendation. Surface to the user at next session.

---

## 1. types/exposure.ts — Split vs. keep as monolith

**Date raised**: 2026-07-24
**Raised by**: Autonomous improvement routine (Area 5 — Code Health)

**Context**: `types/exposure.ts` is 426 lines — just over the 400-line refactor threshold.
It is a pure type-declarations file (no logic) organized into 9 logical sections
(scoring, address, water, soil, echo, air, proximity, ej, etc.) with clear section
comments. The file is imported by ~50 files across the codebase.

**Options**:
- **A (split)**: Extract each section into `types/water.ts`, `types/soil.ts`, `types/air.ts`,
  etc. Re-export everything from `types/exposure.ts` as a barrel to maintain backward
  compatibility with existing imports. Cost: update 50 import sites + test each.
- **B (keep monolith)**: Leave it at 426 lines. Document it as an intentional exception
  because it is purely declarative, already well-organized by section comments, and
  the refactoring blast radius is high relative to the benefit.

**Recommendation**: Option B. The file is already well-structured, is types-only (no
testable logic), and is just 26 lines over threshold. The 50+ import sites make this
a risky refactor without a full test run. Revisit if the file grows past 600 lines or
if there is a need to tree-shake by layer type.

---

## 2. EJ Layer — EJScreen vs. CDC SVI vs. both

**Date raised**: 2026-07-24 (carried from ROADMAP In Progress)

**Context**: The EJ layer currently returns score=0 for all addresses because EJScreen
and CDC SVI require external API access not yet configured. Two options exist for
implementation:

**Options**:
- **A (EJScreen API)**: Register for EPA's EJScreen API key. Provides block group-level
  environmental justice indices including demographic index, percentile ranks for
  environmental burden, supplemental EJ index. Coverage: US-wide, block group.
- **B (CDC SVI static bundle)**: Download CDC Social Vulnerability Index as a static
  bundle (Census tract level). No API key required. Covers 4 SVI themes: socioeconomic,
  household composition, minority status, housing/transportation. ~3 MB per 5-year release.
- **C (both)**: Use SVI static bundle for guaranteed coverage + EJScreen API for
  supplemental environmental burden indices when available.

**Recommendation**: Option C — ship SVI static bundle first (fastest, no API dependency,
solves the biggest gap), then add EJScreen API in a second PR. SVI alone covers 80%
of the EJ scoring gap for South LA, Flint, Port Arthur.

---

## 3. UCMR 5 bundle refresh — Last updated August 2023

**Date raised**: 2026-07-24

**Context**: The committed `data/ucmr5-by-pwsid.json` was built from the August 2023
EPA release. EPA has since published quarterly updates (Nov 2023, Feb 2024, May 2024,
Aug 2024, Nov 2024, Feb 2025, etc.). The runtime client has a stale-bundle warning
at >100 days, which is actively firing. Current data is ~3 years behind.

**Options**:
- **A (manual refresh)**: Follow the procedure in `data/README.md` to download the
  latest UCMR 5 ZIP, run `scripts/build-ucmr5-data.ts`, and commit the updated bundle.
  Cost: ~30 minutes.
- **B (automated refresh)**: Add a GitHub Actions workflow that fetches and rebuilds
  the bundle on a schedule (weekly/monthly). Requires the EPA download URL to remain
  stable.

**Recommendation**: Option A immediately (the data is 3 years stale), then Option B
as follow-up. The EPA download URL has been stable since 2023.

---

## 4. Superfund static bundle — Build or buy

**Date raised**: 2026-07-24 (carried from ROADMAP In Progress)

**Context**: FRS SEMS radius search misses known Superfund sites (Tar Creek, Camp Lejeune)
due to how large-area sites are registered. A static bundle of ~1,300 active NPL sites
with coordinates would fix this.

**Options**:
- **A (build from EPA downloads)**: Download the NPL site list from EPA CERCLIS/SEMS,
  geocode any sites missing lat/lng, produce a compact JSON bundle.
  Cost: ~1 day. EPA publishes NPL list as downloadable CSV.
- **B (supplement only)**: Keep the live FRS API as primary; add a handcrafted list
  of known-missed sites (Tar Creek, Camp Lejeune, ~20 others) as a static fallback.
  Cost: ~2 hours, less comprehensive.

**Recommendation**: Option A. Building a full static NPL bundle from EPA's published
data is low-cost and solves the problem systematically. The CERCLIS/SEMS data export
is available at no cost via EPA.

---

## 5. Air API keys — OpenAQ, EPA AQS, AirNow

**Date raised**: 2026-07-24 (carried from ROADMAP In Progress)

**Context**: Air layer is at ~50% coverage without registered API keys. OpenAQ v3,
EPA AQS, and AirNow all require free registration.

**Decision needed**: Which accounts to register? All three use free tiers.

**Recommendation**: Register all three. OpenAQ v3 is the fastest to integrate (existing
client code), AQS provides the most authoritative historical data, AirNow adds real-time.
Registration takes <30 minutes each. This is not a cost decision — all are free.

**Blocker**: Requires human action (account registration with email verification).
Cannot be done autonomously.
