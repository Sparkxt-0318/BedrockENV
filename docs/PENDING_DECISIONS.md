# Pending Decisions

Items here require a judgment call from the user before action can be taken. Each entry includes the question, the options, and a recommendation.

---

## PD-001: Dead route — `/api/intelligence/scvi` (2026-07-11)

**Status**: Awaiting decision

**Context**: `app/api/intelligence/scvi/route.ts` is a well-implemented REST endpoint that serves the national SCVI (Soil Contamination Vulnerability Index) dataset with filtering by state, quartile, and limit. It is not called by any UI component. The three sibling intelligence pages (`/intelligence/soil-crisis`, `/intelligence/flood-contamination`, `/intelligence/redlining`) all load their data server-side at build/request time, not via this API. The `/api/intelligence/cfci` and `/api/intelligence/holc` routes are called client-side by their respective context panel components; `/api/intelligence/scvi` has no parallel component.

**Options**:
1. **Keep as planned external API** — The route is clean, filterable, and could be documented as a public API for researchers or embedding partners. Wire up an API docs page or README entry. No code changes.
2. **Wire into the SCVI client** — Add a client-side data fetch to `SoilCrisisClient.tsx` that optionally calls this endpoint (e.g., for dynamic filtering/pagination by state). This would make the route active and enable interactive filtering on the intelligence page.
3. **Delete the route** — If there's no plan to expose a public API or add client-side filtering, delete the file to reduce surface area.

**Recommendation**: Option 1. The route is well-written and serves a useful purpose for future embeddable widget or API access. Mark it as "planned public API" in the ROADMAP and add a one-line doc comment to the route file noting the intent.

---

## PD-002: Billing portal route accessibility (2026-07-11)

**Status**: Awaiting decision

**Context**: `app/api/billing-portal/route.ts` creates a Stripe customer portal session (allows users to manage subscription, update payment method, cancel). It is not reachable from any current UI — no button, link, or hook calls it. This aligns with the current access model ("All features free. No paywall. Stripe infrastructure retained but gating removed" per MARKET_INTEL.md), but it means paying customers (if any) have no way to manage their subscription through the app.

**Options**:
1. **Add a "Manage subscription" link** in the account/settings area that calls this endpoint. Simple UI addition (~30 min). Appropriate if any users are still on paid plans.
2. **Leave as standby infrastructure** — If no users are currently paying, the route being unreachable is fine. Document this as intentional in a code comment.
3. **Delete the route** — Only appropriate if Stripe is being fully removed from the product.

**Recommendation**: Option 2 for now. Add a `// Retained for future use when payments are re-enabled` comment to the route file so future developers don't wonder. If the product re-enables payments, Option 1 becomes necessary.

---

## PD-003: SCORING_VERSION not surfaced on methodology page (2026-07-11)

**Status**: Awaiting decision

**Context**: `lib/scoring/version.ts` exports `SCORING_VERSION = 4`. The methodology page (`app/methodology/page.tsx`) does not display this version number anywhere. Users and researchers cannot tell which scoring pipeline version produced their report.

**Options**:
1. **Add version badge to methodology page** — Import `SCORING_VERSION` and display "Scoring Pipeline v4" in the methodology page header. ~10 min change. Small credibility improvement.
2. **Add version to individual reports** — Show "Computed with scoring engine v4" in the `MethodologyFootnotes` component of the showcase report. More visible to users reviewing their report.
3. **Both** — Show the version in both places.
4. **Leave as-is** — The version is an internal implementation detail, not user-facing. Only relevant if someone is cross-referencing a cached score with a future pipeline update.

**Recommendation**: Option 2. The report footer (`MethodologyFootnotes.tsx`) is the most natural place — it's already where the methodology link lives. The methodology *page* is fine without it since the page itself doesn't change version-by-version.
