/**
 * Turn an API percentile into a "Top N%" label.
 *
 * The API sends an integer 0-100: the share of products that emit more than
 * this one (higher is better). The pages used to treat it as a 0-1 fraction,
 * so 76 rendered as "Top -7500%". Returns null when there is no percentile.
 */
export function formatTopPercent(percentile) {
  if (typeof percentile !== "number" || Number.isNaN(percentile)) return null;
  const top = Math.min(100, Math.max(1, Math.round(100 - percentile)));
  return `Top ${top}%`;
}
