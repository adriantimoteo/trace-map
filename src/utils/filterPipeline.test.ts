import { describe, it, expect } from 'vitest'
import {
  applyDateFilter,
  applyVelocityFilter,
  applyViewportFilter,
  applyFilters,
  computeMaxDensity,
} from './filterPipeline'
import type { LocationPoint } from '../types'
import type { FilterState } from './filterPipeline'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePoint(overrides: Partial<LocationPoint> = {}): LocationPoint {
  return {
    lat: 51.5,
    lng: -0.1,
    timestamp: new Date('2023-06-15').getTime(),
    speed: null,
    ...overrides,
  }
}

function makeFilterState(overrides: Partial<FilterState> = {}): FilterState {
  return {
    dateRange: { start: null, end: null },
    velocityEnabled: false,
    velocityThreshold: 15,
    viewportEnabled: false,
    viewportBounds: null,
    dateBucketOverride: null,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// applyDateFilter
// ---------------------------------------------------------------------------

describe('applyDateFilter', () => {
  const jan1 = new Date('2023-01-01').getTime()
  const jun15 = new Date('2023-06-15').getTime()
  const dec31 = new Date('2023-12-31').getTime()

  const earlyPoint = makePoint({ timestamp: jan1 })
  const midPoint = makePoint({ timestamp: jun15 })
  const latePoint = makePoint({ timestamp: dec31 })
  const points = [earlyPoint, midPoint, latePoint]

  it('returns all points when both bounds are null', () => {
    const state = makeFilterState()
    expect(applyDateFilter(points, state)).toEqual(points)
  })

  it('includes only points on or after start bound', () => {
    const state = makeFilterState({ dateRange: { start: '2023-06-01', end: null } })
    const result = applyDateFilter(points, state)
    expect(result).toContain(midPoint)
    expect(result).toContain(latePoint)
    expect(result).not.toContain(earlyPoint)
  })

  it('includes only points on or before end bound', () => {
    const state = makeFilterState({ dateRange: { start: null, end: '2023-06-30' } })
    const result = applyDateFilter(points, state)
    expect(result).toContain(earlyPoint)
    expect(result).toContain(midPoint)
    expect(result).not.toContain(latePoint)
  })

  it('includes only points within start and end bounds (inclusive)', () => {
    const state = makeFilterState({
      dateRange: { start: '2023-01-01', end: '2023-06-15' },
    })
    const result = applyDateFilter(points, state)
    // earlyPoint is exactly on start — included
    expect(result).toContain(earlyPoint)
    // midPoint is exactly on end — included
    expect(result).toContain(midPoint)
    // latePoint is after end — excluded
    expect(result).not.toContain(latePoint)
  })

  it('excludes all points when range covers none of them', () => {
    const state = makeFilterState({
      dateRange: { start: '2024-01-01', end: '2024-12-31' },
    })
    expect(applyDateFilter(points, state)).toHaveLength(0)
  })

  it('uses dateBucketOverride instead of dateRange when set', () => {
    const state = makeFilterState({
      dateRange: { start: '2024-01-01', end: '2024-12-31' }, // would exclude all
      dateBucketOverride: {
        start: new Date('2023-01-01'),
        end: new Date('2023-06-15'),
        label: 'H1 2023',
      },
    })
    const result = applyDateFilter(points, state)
    expect(result).toContain(earlyPoint)
    expect(result).toContain(midPoint)
    expect(result).not.toContain(latePoint)
  })

  it('does not mutate the input array', () => {
    const state = makeFilterState({ dateRange: { start: '2023-06-01', end: null } })
    const original = [...points]
    applyDateFilter(points, state)
    expect(points).toEqual(original)
  })
})

// ---------------------------------------------------------------------------
// applyVelocityFilter
// ---------------------------------------------------------------------------

describe('applyVelocityFilter', () => {
  const slowPoint = makePoint({ speed: 5 })
  const thresholdPoint = makePoint({ speed: 15 })
  const fastPoint = makePoint({ speed: 60 })
  const nullSpeedPoint = makePoint({ speed: null })
  const points = [slowPoint, thresholdPoint, fastPoint, nullSpeedPoint]

  it('returns all points when velocityEnabled is false', () => {
    const state = makeFilterState({ velocityEnabled: false, velocityThreshold: 15 })
    expect(applyVelocityFilter(points, state)).toEqual(points)
  })

  it('excludes points above the threshold when enabled', () => {
    const state = makeFilterState({ velocityEnabled: true, velocityThreshold: 15 })
    const result = applyVelocityFilter(points, state)
    expect(result).not.toContain(fastPoint)
  })

  it('includes points at exactly the threshold', () => {
    const state = makeFilterState({ velocityEnabled: true, velocityThreshold: 15 })
    const result = applyVelocityFilter(points, state)
    expect(result).toContain(thresholdPoint)
  })

  it('includes points below the threshold when enabled', () => {
    const state = makeFilterState({ velocityEnabled: true, velocityThreshold: 15 })
    const result = applyVelocityFilter(points, state)
    expect(result).toContain(slowPoint)
  })

  it('always includes points with speed === null', () => {
    const state = makeFilterState({ velocityEnabled: true, velocityThreshold: 0 })
    const result = applyVelocityFilter(points, state)
    expect(result).toContain(nullSpeedPoint)
  })

  it('does not mutate the input array', () => {
    const state = makeFilterState({ velocityEnabled: true, velocityThreshold: 15 })
    const original = [...points]
    applyVelocityFilter(points, state)
    expect(points).toEqual(original)
  })
})

// ---------------------------------------------------------------------------
// applyViewportFilter
// ---------------------------------------------------------------------------

describe('applyViewportFilter', () => {
  const bounds = { north: 52.0, south: 51.0, east: 0.5, west: -0.5 }

  const insidePoint = makePoint({ lat: 51.5, lng: 0.0 })
  const outsideNorth = makePoint({ lat: 53.0, lng: 0.0 })
  const outsideSouth = makePoint({ lat: 50.0, lng: 0.0 })
  const outsideEast = makePoint({ lat: 51.5, lng: 1.0 })
  const outsideWest = makePoint({ lat: 51.5, lng: -1.0 })
  // On the boundary — should be included (inclusive)
  const onNorthEdge = makePoint({ lat: 52.0, lng: 0.0 })
  const onSouthEdge = makePoint({ lat: 51.0, lng: 0.0 })
  const onEastEdge = makePoint({ lat: 51.5, lng: 0.5 })
  const onWestEdge = makePoint({ lat: 51.5, lng: -0.5 })

  const points = [
    insidePoint,
    outsideNorth,
    outsideSouth,
    outsideEast,
    outsideWest,
    onNorthEdge,
    onSouthEdge,
    onEastEdge,
    onWestEdge,
  ]

  it('returns all points when viewportEnabled is false', () => {
    const state = makeFilterState({ viewportEnabled: false, viewportBounds: bounds })
    expect(applyViewportFilter(points, state)).toEqual(points)
  })

  it('returns all points when viewportBounds is null', () => {
    const state = makeFilterState({ viewportEnabled: true, viewportBounds: null })
    expect(applyViewportFilter(points, state)).toEqual(points)
  })

  it('excludes points outside the bounding box', () => {
    const state = makeFilterState({ viewportEnabled: true, viewportBounds: bounds })
    const result = applyViewportFilter(points, state)
    expect(result).not.toContain(outsideNorth)
    expect(result).not.toContain(outsideSouth)
    expect(result).not.toContain(outsideEast)
    expect(result).not.toContain(outsideWest)
  })

  it('includes points inside the bounding box', () => {
    const state = makeFilterState({ viewportEnabled: true, viewportBounds: bounds })
    const result = applyViewportFilter(points, state)
    expect(result).toContain(insidePoint)
  })

  it('includes points exactly on the boundary edges (inclusive)', () => {
    const state = makeFilterState({ viewportEnabled: true, viewportBounds: bounds })
    const result = applyViewportFilter(points, state)
    expect(result).toContain(onNorthEdge)
    expect(result).toContain(onSouthEdge)
    expect(result).toContain(onEastEdge)
    expect(result).toContain(onWestEdge)
  })

  it('does not mutate the input array', () => {
    const state = makeFilterState({ viewportEnabled: true, viewportBounds: bounds })
    const original = [...points]
    applyViewportFilter(points, state)
    expect(points).toEqual(original)
  })
})

// ---------------------------------------------------------------------------
// applyFilters (combined pipeline)
// ---------------------------------------------------------------------------

describe('applyFilters', () => {
  // Point that passes all three filters
  const goodPoint = makePoint({
    lat: 51.5,
    lng: 0.0,
    timestamp: new Date('2023-06-15').getTime(),
    speed: 10,
  })
  // Fails date filter — too early
  const tooEarlyPoint = makePoint({
    lat: 51.5,
    lng: 0.0,
    timestamp: new Date('2022-01-01').getTime(),
    speed: 10,
  })
  // Fails velocity filter — too fast
  const tooFastPoint = makePoint({
    lat: 51.5,
    lng: 0.0,
    timestamp: new Date('2023-06-15').getTime(),
    speed: 100,
  })
  // Fails viewport filter — outside bounding box
  const outOfBoundsPoint = makePoint({
    lat: 60.0,
    lng: 0.0,
    timestamp: new Date('2023-06-15').getTime(),
    speed: 10,
  })

  const state = makeFilterState({
    dateRange: { start: '2023-01-01', end: '2023-12-31' },
    velocityEnabled: true,
    velocityThreshold: 50,
    viewportEnabled: true,
    viewportBounds: { north: 52.0, south: 51.0, east: 0.5, west: -0.5 },
  })

  const allPoints = [goodPoint, tooEarlyPoint, tooFastPoint, outOfBoundsPoint]

  it('applies all three filters in sequence', () => {
    const result = applyFilters(allPoints, state)
    expect(result).toContain(goodPoint)
    expect(result).not.toContain(tooEarlyPoint)
    expect(result).not.toContain(tooFastPoint)
    expect(result).not.toContain(outOfBoundsPoint)
  })

  it('returns all points when no filters are active', () => {
    const passAll = makeFilterState()
    expect(applyFilters(allPoints, passAll)).toEqual(allPoints)
  })

  it('returns empty array when no points survive the pipeline', () => {
    const strictState = makeFilterState({
      dateRange: { start: '2050-01-01', end: '2050-12-31' },
    })
    expect(applyFilters(allPoints, strictState)).toHaveLength(0)
  })

  it('does not mutate the input array', () => {
    const original = [...allPoints]
    applyFilters(allPoints, state)
    expect(allPoints).toEqual(original)
  })
})

// ---------------------------------------------------------------------------
// computeMaxDensity
// ---------------------------------------------------------------------------

describe('computeMaxDensity', () => {
  it('returns 1 for an empty array', () => {
    expect(computeMaxDensity([])).toBe(1)
  })

  it('returns 1 for a single point', () => {
    expect(computeMaxDensity([makePoint()])).toBe(1)
  })

  it('returns the cell count for a cluster of points in the same 0.001° cell', () => {
    // All within the same 0.001° cell — lat 51.500–51.5009, lng 0.000–0.0009
    const cluster = Array.from({ length: 10 }, (_, i) =>
      makePoint({ lat: 51.5 + i * 0.00001, lng: 0.0 + i * 0.00001 }),
    )
    expect(computeMaxDensity(cluster)).toBe(10)
  })

  it('returns the max of two clusters, not their sum', () => {
    // Cluster A: 7 points in one cell
    const clusterA = Array.from({ length: 7 }, () => makePoint({ lat: 51.5, lng: 0.0 }))
    // Cluster B: 3 points in a different cell (> 0.001° away)
    const clusterB = Array.from({ length: 3 }, () => makePoint({ lat: 52.0, lng: 1.0 }))
    const result = computeMaxDensity([...clusterA, ...clusterB])
    expect(result).toBe(7)
  })

  it('returns a higher value for a denser cluster', () => {
    const sparse = Array.from({ length: 2 }, () => makePoint({ lat: 51.5, lng: 0.0 }))
    const dense = Array.from({ length: 20 }, () => makePoint({ lat: 52.0, lng: 1.0 }))
    const result = computeMaxDensity([...sparse, ...dense])
    expect(result).toBe(20)
    expect(result).toBeGreaterThan(2)
  })

  it('returns 1 when all points are in different cells with count 1', () => {
    const scattered = [
      makePoint({ lat: 51.0, lng: 0.0 }),
      makePoint({ lat: 52.0, lng: 1.0 }),
      makePoint({ lat: 53.0, lng: 2.0 }),
    ]
    expect(computeMaxDensity(scattered)).toBe(1)
  })
})
