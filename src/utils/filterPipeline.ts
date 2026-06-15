import type { LocationPoint, MapBounds, DateBucket } from '../types'

// The filter pipeline functions accept a subset of FilterState fields.
// We define a local interface so this module has no React dependency.
export interface FilterState {
  dateRange: { start: string | null; end: string | null }
  velocityEnabled: boolean
  velocityThreshold: number
  viewportEnabled: boolean
  viewportBounds: MapBounds | null
  dateBucketOverride: DateBucket | null
}

/**
 * Filter 1 — Date Range
 *
 * Includes a point if its timestamp falls within [start, end] (inclusive).
 * If either bound is null, that side is unbounded.
 * If `dateBucketOverride` is set, its start/end are used instead of `dateRange`.
 */
export function applyDateFilter(
  points: LocationPoint[],
  filterState: FilterState,
): LocationPoint[] {
  const { dateRange, dateBucketOverride } = filterState

  let startMs: number | null
  let endMs: number | null

  if (dateBucketOverride !== null) {
    startMs = dateBucketOverride.start.getTime()
    endMs = dateBucketOverride.end.getTime()
  } else {
    startMs = dateRange.start !== null ? new Date(dateRange.start).getTime() : null
    endMs = dateRange.end !== null ? new Date(dateRange.end).getTime() : null
  }

  if (startMs === null && endMs === null) {
    return points
  }

  return points.filter((point) => {
    if (startMs !== null && point.timestamp < startMs) return false
    if (endMs !== null && point.timestamp > endMs) return false
    return true
  })
}

/**
 * Filter 2 — Velocity
 *
 * Only runs when `velocityEnabled === true`.
 * Excludes points where `point.speed > velocityThreshold`.
 * Points where `point.speed === null` are always included.
 */
export function applyVelocityFilter(
  points: LocationPoint[],
  filterState: FilterState,
): LocationPoint[] {
  if (!filterState.velocityEnabled) {
    return points
  }

  const { velocityThreshold } = filterState
  return points.filter((point) => point.speed === null || point.speed <= velocityThreshold)
}

/**
 * Filter 3 — Viewport
 *
 * Only runs when `viewportEnabled === true` and `viewportBounds !== null`.
 * Excludes points outside the bounding box.
 */
export function applyViewportFilter(
  points: LocationPoint[],
  filterState: FilterState,
): LocationPoint[] {
  const { viewportEnabled, viewportBounds } = filterState

  if (!viewportEnabled || viewportBounds === null) {
    return points
  }

  const { north, south, east, west } = viewportBounds
  return points.filter(
    (point) => point.lat >= south && point.lat <= north && point.lng >= west && point.lng <= east,
  )
}

/**
 * Runs all three filters in sequence: date → velocity → viewport.
 */
export function applyFilters(points: LocationPoint[], filterState: FilterState): LocationPoint[] {
  const afterDate = applyDateFilter(points, filterState)
  const afterVelocity = applyVelocityFilter(afterDate, filterState)
  return applyViewportFilter(afterVelocity, filterState)
}

/**
 * Bins points into 0.001° grid cells and returns log-weighted heat tuples.
 *
 * For each non-empty cell, the weight is `Math.log1p(count)`, which compresses
 * the dynamic range while preserving ordering. The centroid of each cell is
 * `(cellIndex + 0.5) * 0.001`.
 *
 * Returns an empty array for empty input.
 */
export function computeLogWeightedBins(points: LocationPoint[]): Array<[number, number, number]> {
  if (points.length === 0) return []

  const cellCounts = new Map<string, { cellLat: number; cellLng: number; count: number }>()

  for (const point of points) {
    const cellLat = Math.floor(point.lat / 0.001)
    const cellLng = Math.floor(point.lng / 0.001)
    const key = `${String(cellLat)},${String(cellLng)}`
    const existing = cellCounts.get(key)
    if (existing !== undefined) {
      existing.count += 1
    } else {
      cellCounts.set(key, { cellLat, cellLng, count: 1 })
    }
  }

  const result: Array<[number, number, number]> = []
  for (const { cellLat, cellLng, count } of cellCounts.values()) {
    const centroidLat = (cellLat + 0.5) * 0.001
    const centroidLng = (cellLng + 0.5) * 0.001
    result.push([centroidLat, centroidLng, Math.log1p(count)])
  }
  return result
}

/**
 * Bins points into 0.001° grid cells and returns a density ceiling.
 *
 * When `percentile === 1.0` (default): returns the absolute max bin count (fast path).
 * When `percentile < 1.0`: returns the value at that percentile of bin counts, sorted
 * ascending — bins at or above this value saturate to the hottest colour, giving the
 * bottom (percentile * 100)% of bins the full colour range.
 *
 * Returns 1 (not 0) for an empty array to avoid Leaflet.heat misbehaviour.
 */
export function computeMaxDensity(points: LocationPoint[], percentile = 1.0): number {
  if (points.length === 0) return 1

  const cellCounts = new Map<string, number>()

  for (const point of points) {
    const cellLat = Math.floor(point.lat / 0.001)
    const cellLng = Math.floor(point.lng / 0.001)
    const key = `${String(cellLat)},${String(cellLng)}`
    cellCounts.set(key, (cellCounts.get(key) ?? 0) + 1)
  }

  if (percentile === 1.0) {
    let max = 1
    for (const count of cellCounts.values()) {
      if (count > max) max = count
    }
    return max
  }

  const sortedCounts = Array.from(cellCounts.values()).sort((a, b) => a - b)
  const index = Math.floor(sortedCounts.length * percentile)
  return sortedCounts[Math.min(index, sortedCounts.length - 1)]
}
