/**
 * Monotonic scoring-pipeline version. Bumped manually whenever a change
 * would make previously-cached scores incomparable with freshly-computed
 * ones (new sub-components, weight reshuffles, threshold changes, …).
 *
 * The Supabase cache reader gates on this: rows whose `scoring_version`
 * column is not equal to the current constant are skipped and the
 * assessment is re-computed.
 *
 * History
 *   1 — Step 1 of Issue 1: coverage-aware scoring + insufficient-data
 *       propagation. First explicitly versioned pipeline.
 */
export const SCORING_VERSION = 1;
