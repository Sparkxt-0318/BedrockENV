# Pending Decisions

Items requiring a judgment call (pricing, branding, scope, naming) that should be surfaced to the user before acting.

---

## 2026-08-23: Rename `nasa-smap.ts` to `nasa-power.ts`

**Issue:** The file `lib/data-sources/nasa-smap.ts` uses the NASA POWER (Prediction Of Worldwide Energy Resources) API, not the NASA SMAP (Soil Moisture Active Passive) satellite product. The name is a legacy artifact that creates confusion in documentation and future maintenance.

**Options:**
1. **Rename now** — `git mv lib/data-sources/nasa-smap.ts lib/data-sources/nasa-power.ts`, update all imports and the barrel `lib/data-sources/index.ts`. Low risk, small PR.
2. **Leave it** — The existing code works; rename adds churn and a PR for a cosmetic fix. The `data/sources/nasa-smap.md` file already documents the mismatch.
3. **Add real SMAP data** — If NASA SMAP satellite soil moisture data would improve scoring (higher spatial resolution than POWER), the rename could coincide with adding actual SMAP integration. Larger effort.

**Recommendation:** Option 1 — rename. It's one file + imports, and the current name actively misleads. Doing it now while the data/sources docs are fresh is the right moment.

**Raised by:** Autonomous improvement routine, cycle 1 (2026-08-23)
