/**
 * Binary-search helper for the velocity threshold slider live preview.
 *
 * Returns how many speeds in `sortedSpeeds` are STRICTLY GREATER than `threshold`.
 * Points with null speed are never included in sortedSpeeds and are never excluded.
 *
 * The filter rule is `speed > threshold` (not `>=`), so a point at exactly the threshold
 * is kept — it is NOT excluded.
 */
export function countExcludedAtThreshold(sortedSpeeds: number[], threshold: number): number {
  if (sortedSpeeds.length === 0) return 0

  // Binary search: find the first index where sortedSpeeds[i] > threshold.
  // Everything from that index to the end is excluded.
  let lo = 0
  let hi = sortedSpeeds.length

  while (lo < hi) {
    const mid = (lo + hi) >>> 1
    if (sortedSpeeds[mid] <= threshold) {
      lo = mid + 1
    } else {
      hi = mid
    }
  }

  return sortedSpeeds.length - lo
}
