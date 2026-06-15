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
 * Bins points into 0.001° grid cells and returns the count of the most-populated cell.
 * Returns 1 (not 0) for an empty array to avoid Leaflet.heat misbehaviour.
 */
export function computeMaxDensity(points: LocationPoint[]): number {
  if (points.length === 0) return 1

  const cellCounts = new Map<string, number>()

  for (const point of points) {
    const cellLat = Math.floor(point.lat / 0.001)
    const cellLng = Math.floor(point.lng / 0.001)
    const key = `${String(cellLat)},${String(cellLng)}`
    cellCounts.set(key, (cellCounts.get(key) ?? 0) + 1)
  }

  let max = 1
  for (const count of cellCounts.values()) {
    if (count > max) max = count
  }
  return max
}
