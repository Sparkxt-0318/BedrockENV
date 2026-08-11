# Pending Decisions

Judgment calls that need human input before action is taken. Each entry includes context, options, and a recommendation.

---

## PD-001 — UCMR5 Data Bundle Rebuild

**Date raised**: 2026-08-11
**Area**: Data accuracy / Operational

### Context
The UCMR5 PFAS bundle (`data/ucmr5-by-pwsid.json`) was built from an EPA release dated 2026-02-12, making it 180 days old. The staleness threshold in `lib/data-sources/epa-ucmr5.ts` is 100 days. A `console.warn` fires on every cold start in production warning that the bundle is stale.

EPA typically issues quarterly updates to UCMR5 occurrence data as additional water systems report results. A rebuild would pull the most current data and potentially add new systems and update detection values.

### Impact
Stale PFAS data understates risk for:
- Systems that have reported new detections since February 2026
- Systems that exceeded the new 4 ppt MCL (enforceable since April 2024) and may have taken remediation steps

A rebuild is low-risk (additive data, no scoring formula change) but requires running the build script and committing the resulting JSON file.

### Options
1. **Rebuild now** — run `pnpm tsx scripts/build-ucmr5-data.ts --release-date <latest>`, commit updated `data/ucmr5-by-pwsid.json`. Straightforward if the EPA Envirofacts/SDWIS endpoints are accessible.
2. **Schedule quarterly rebuild** — set up a cron trigger to rebuild on a schedule (e.g., 1st of each quarter). Requires infrastructure work but removes the manual step.
3. **Accept current state** — the UCMR5 sampling cycle (2021–2023) is complete; no new *sampling* data will be added, only reporting lag. The staleness may be less impactful than the warning implies.

### Recommendation
**Option 1** — rebuild now using the latest EPA release. The sampling cycle is complete but reporting lag means late reporters' data appeared in 2024–2026 releases. The 2026-02-12 release likely missed some of those. The rebuild script exists and the data commitment is ~1.5MB JSON. Low effort, high data quality improvement.

Action required: confirm which EPA release date to target, then Claude Code can run the build script and open a PR with the updated bundle.

---

## PD-002 — Coverage Thresholds May Break CI on First Run

**Date raised**: 2026-08-11
**Area**: Code health / CI

### Context
PR #82 adds vitest coverage thresholds (70% lines/functions/statements, 60% branches). The last measured coverage was 71.22% line coverage (2026-04-17 session). If coverage has drifted below 70% since then, PR #82 will cause `pnpm test:coverage` to fail in CI on merge.

### Options
1. **Accept the risk** — merge PR #82 and fix any coverage gaps it exposes. This is the point of thresholds.
2. **Lower thresholds temporarily** — set 65% initially, raise after the next coverage audit.
3. **Run coverage check first** — before merging PR #82, run `pnpm test:coverage` and confirm current coverage meets the thresholds.

### Recommendation
**Option 3** then **Option 1** — verify first, then merge. The user should run `pnpm test:coverage` to confirm current numbers before merging PR #82.

---
