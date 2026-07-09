# Bedrock Autonomous Improvement Routine

Read this file at the start of every session before doing assigned work. Run the routine when you have spare cycles (waiting on test runs, between pushes, when assigned task is complete and awaiting next instruction).

Every cycle covers six areas. Open one PR per area when you find something worth changing — never bundle improvements from different areas into one PR.

## 1. Data accuracy
- Pick three canonical test addresses at random and run a full live assessment.
- Compare each sub-component score against ground truth (EPA reports, news, academic studies).
- If a sub-score is off by >20 points from defensible ground truth, file an issue with the address, the score, the source you cross-checked against, and a hypothesis for the bug.
- Quarterly: rebuild the UCMR 5 bundle from EPA's latest release. Check release dates for SSURGO, EJScreen, TRI, Mapping Inequality.
- Monthly: scan for new federal datasets that could fill coverage gaps (search EPA Envirofacts, data.gov, USGS APIs).

## 2. Design quality
- Pick one page and one component each cycle. Compare against reference: apple.com/iphone-17-pro, nytimes.com long-form features, stripe.com/payments. Note specific gaps in typography, spacing, motion, hierarchy.
- Run axe-core and Lighthouse against the live URL. If accessibility drops below 95 or performance below 80 (mobile), open a fix PR.
- Verify every page renders correctly at 375px, 768px, 1024px, 1440px viewport widths.
- Check dark mode parity if dark mode exists.

## 3. New features and capabilities
- Read the original master prompt and Push schedule. Identify the most impactful unfinished item that fits in <2 days of work.
- Survey the competitive landscape monthly: First Street, ClimateCheck, EWG, Cotality. What did they ship that we don't have? What did we ship that they don't?
- Maintain a `docs/ROADMAP.md` with three columns: shipped, in-progress, considering. Update it every cycle.

## 4. Market and competitive intelligence
- Monthly: search for "[competitor name] climate risk" and "environmental exposure platform" news. Summarize findings to `docs/MARKET_INTEL.md`.
- Track regulatory changes: new EPA MCLs, state PFAS standards, mandatory disclosure laws. These affect both our recommendation templates and our market positioning.
- If a regulatory change requires updating a recommendation template, do it immediately and bump SCORING_VERSION.

## 5. Code health
- Run `pnpm test:coverage` weekly. Any file under 70% coverage gets tests added.
- Audit dependencies monthly: `pnpm outdated`, security advisories. Patch security issues immediately, defer non-security updates to monthly.
- Refactor any file over 400 lines into smaller modules.
- Delete dead code and unused exports.

## 6. Documentation and credibility
- Methodology page must stay current with every scoring change. If SCORING_VERSION bumps, methodology page gets an update in the same PR.
- README must build cleanly from a fresh clone — test this monthly by cloning to a temp directory and running setup.
- Every data source needs a `data/sources/<name>.md` file documenting: what it covers, what it doesn't, refresh cadence, known limitations.

## Hard rules
- Never silently change scoring formulas — always bump SCORING_VERSION and update methodology in the same commit.
- Never push directly to main — always PR.
- Never commit secrets, ever (gitleaks pre-commit catches this but stay vigilant).
- Never disable a test to make CI pass — fix the underlying bug.
- If you find something that requires a judgment call (pricing, branding, scope), write it up in `docs/PENDING_DECISIONS.md` with options and your recommendation, and surface it next time the user appears.
- One PR per concern. No mega-PRs.

## Reporting
- Maintain `docs/IMPROVEMENT_LOG.md` — append-only log of every routine cycle. Format: date, area, finding, action taken, PR link.
- When the user returns, summarize what changed since their last session in three bullets max.
