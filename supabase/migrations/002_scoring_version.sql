-- Bedrock: coverage-aware scoring pipeline
--
-- Step 1 of Issue 1 (data accuracy). The scoring pipeline now distinguishes
-- "no data" from "clean data" and emits a coverage fraction alongside every
-- score. Cached rows must carry the pipeline version they were computed
-- under so we can invalidate them when the pipeline changes.
--
--   scoring_version  — monotonic integer; matches SCORING_VERSION in
--                      lib/scoring/version.ts. Rows with a mismatched
--                      version are skipped by the cache reader and the
--                      assessment is recomputed.
--   coverage         — 0..1 reweighted-weighted-mean fraction of the
--                      layers actually populated for this address.
--   sufficient       — coverage >= INSUFFICIENT_COVERAGE_THRESHOLD; when
--                      false, clients show "Insufficient data" instead
--                      of the headline number.
--
-- All three columns are nullable so the migration is non-breaking for
-- pre-existing rows. The cache reader treats NULL scoring_version as
-- "version 0" (always stale).

ALTER TABLE public.exposure_assessments
  ADD COLUMN IF NOT EXISTS scoring_version INTEGER,
  ADD COLUMN IF NOT EXISTS coverage NUMERIC(4,3),
  ADD COLUMN IF NOT EXISTS sufficient BOOLEAN;

-- Widen the composite_confidence check to allow the new 'insufficient' tier.
ALTER TABLE public.exposure_assessments
  DROP CONSTRAINT IF EXISTS exposure_assessments_composite_confidence_check;

ALTER TABLE public.exposure_assessments
  ADD CONSTRAINT exposure_assessments_composite_confidence_check
  CHECK (composite_confidence IN ('high', 'moderate', 'low', 'insufficient'));

CREATE INDEX IF NOT EXISTS idx_exposure_scoring_version
  ON public.exposure_assessments(scoring_version);
