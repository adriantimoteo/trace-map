import { renderHook, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useFilteredPoints } from './useFilteredPoints'
import { useDataDispatch } from '../contexts/DataContext'
import { useFilterDispatch } from '../contexts/FilterContext'
import type { LocationPoint } from '../types'

// ---------------------------------------------------------------------------
// Helper: build a LocationPoint
// ---------------------------------------------------------------------------

function makePoint(
  lat: number,
  lng: number,
  timestamp: number,
  speed: number | null = null,
): LocationPoint {
  return { lat, lng, timestamp, speed }
}

// ---------------------------------------------------------------------------
// Helper: seed DataContext with a set of points + mark status ready
// ---------------------------------------------------------------------------

function seedData(
  dataDispatch: ReturnType<typeof useDataDispatch>,
  points: LocationPoint[],
  totalCount?: number,
) {
  act(() => {
    dataDispatch({ type: 'APPEND_BATCH', payload: points })
    dataDispatch({
      type: 'SET_COMPLETE',
      payload: {
        totalCount: totalCount ?? points.length,
        minDate: '2023-01-01T00:00:00.000Z',
        maxDate: '2024-01-01T00:00:00.000Z',
      },
    })
  })
}

// ---------------------------------------------------------------------------
// All tests use the AllProviders wrapper from the shared test/utils
// ---------------------------------------------------------------------------

// We need the providers — import the wrapper from test/utils but renderHook
// needs a React component as wrapper. Use a dynamic import trick instead:
// just import the wrapper React element factories from the contexts directly.
import { DataProvider, useDataState } from '../contexts/DataContext'
import { FilterProvider } from '../contexts/FilterContext'
import { UIProvider } from '../contexts/UIContext'
import { DisplayProvider } from '../contexts/DisplayContext'
import React from 'react'

function AllProviders({ children }: { children: React.ReactNode }) {
  return React.createElement(
    UIProvider,
    null,
    React.createElement(
      DataProvider,
      null,
      React.createElement(
        FilterProvider,
        null,
        React.createElement(DisplayProvider, null, children),
      ),
    ),
  )
}

const renderOptions = { wrapper: AllProviders }

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useFilteredPoints', () => {
  it('returns all points when no filters are active (filteredCount === totalCount)', () => {
    const points = [
      makePoint(51.5, -0.1, 1_000_000),
      makePoint(51.51, -0.11, 2_000_000),
      makePoint(51.52, -0.12, 3_000_000),
    ]

    // Render the hook + a data-seeding hook in the same provider tree
    const { result } = renderHook(() => {
      const dispatch = useDataDispatch()
      const filtered = useFilteredPoints()
      return { dispatch, filtered }
    }, renderOptions)

    seedData(result.current.dispatch, points)

    expect(result.current.filtered.filteredCount).toBe(3)
    expect(result.current.filtered.filteredPoints).toHaveLength(3)
  })

  it('filteredCount equals totalCount when no filters are active', () => {
    const points = Array.from({ length: 10 }, (_, i) =>
      makePoint(51 + i * 0.01, -0.1, 1_000_000 + i * 1000),
    )

    const { result } = renderHook(() => {
      const dispatch = useDataDispatch()
      const filtered = useFilteredPoints()
      const dataState = useDataState()
      return { dispatch, filtered, dataState }
    }, renderOptions)

    seedData(result.current.dispatch, points)

    expect(result.current.filtered.filteredCount).toBe(result.current.dataState.totalCount)
  })

  it('date filter that excludes half the points reduces filteredCount by ~half', () => {
    // 4 points: 2 before 2023-07-01, 2 after
    const points = [
      makePoint(51.5, -0.1, new Date('2023-01-15T00:00:00Z').getTime()),
      makePoint(51.51, -0.11, new Date('2023-03-20T00:00:00Z').getTime()),
      makePoint(51.52, -0.12, new Date('2023-08-10T00:00:00Z').getTime()),
      makePoint(51.53, -0.13, new Date('2023-11-25T00:00:00Z').getTime()),
    ]

    const { result } = renderHook(() => {
      const dataDispatch = useDataDispatch()
      const filterDispatch = useFilterDispatch()
      const filtered = useFilteredPoints()
      return { dataDispatch, filterDispatch, filtered }
    }, renderOptions)

    seedData(result.current.dataDispatch, points)

    // Apply date range: only include points from 2023-07-01 onwards
    act(() => {
      result.current.filterDispatch({
        type: 'SET_DATE_RANGE',
        payload: { start: '2023-07-01T00:00:00.000Z', end: null },
      })
    })

    expect(result.current.filtered.filteredCount).toBe(2)
    expect(result.current.filtered.filteredPoints).toHaveLength(2)
  })

  it('velocity filter at 0 km/h threshold excludes points with non-null speed', () => {
    const points = [
      makePoint(51.5, -0.1, 1_000_000, null), // no speed → always included
      makePoint(51.51, -0.11, 2_000_000, 5), // speed 5 > 0 → excluded
      makePoint(51.52, -0.12, 3_000_000, 10), // speed 10 > 0 → excluded
      makePoint(51.53, -0.13, 4_000_000, null), // no speed → always included
    ]

    const { result } = renderHook(() => {
      const dataDispatch = useDataDispatch()
      const filterDispatch = useFilterDispatch()
      const filtered = useFilteredPoints()
      return { dataDispatch, filterDispatch, filtered }
    }, renderOptions)

    seedData(result.current.dataDispatch, points)

    act(() => {
      // velocityThreshold minimum is 5 per the reducer, so set enabled=true at threshold=5
      // Points with speed > 5 get excluded; speed===5 is kept (≤ threshold)
      result.current.filterDispatch({ type: 'SET_VELOCITY_ENABLED', payload: true })
      result.current.filterDispatch({ type: 'SET_VELOCITY_THRESHOLD', payload: 5 })
    })

    // speed===null → kept; speed===5 → kept (≤ threshold); speed===10 → excluded
    // So 3 of 4 should remain
    expect(result.current.filtered.filteredCount).toBe(3)
  })

  it('maxDensity is a positive number for a non-empty filtered set', () => {
    const points = [
      makePoint(51.5, -0.1, 1_000_000),
      makePoint(51.5, -0.1, 2_000_000), // same cell → density 2
    ]

    const { result } = renderHook(() => {
      const dispatch = useDataDispatch()
      const filtered = useFilteredPoints()
      return { dispatch, filtered }
    }, renderOptions)

    seedData(result.current.dispatch, points)

    expect(result.current.filtered.maxDensity).toBeGreaterThan(0)
    expect(result.current.filtered.maxDensity).toBe(2)
  })

  it('maxDensity equals 1 (sensible default) for an empty filtered set', () => {
    // Start with a point from 2023, then apply a date range that excludes it
    const points = [makePoint(51.5, -0.1, new Date('2023-01-15T00:00:00Z').getTime())]

    const { result } = renderHook(() => {
      const dataDispatch = useDataDispatch()
      const filterDispatch = useFilterDispatch()
      const filtered = useFilteredPoints()
      return { dataDispatch, filterDispatch, filtered }
    }, renderOptions)

    seedData(result.current.dataDispatch, points)

    // Restrict to a future date range — nothing passes
    act(() => {
      result.current.filterDispatch({
        type: 'SET_DATE_RANGE',
        payload: { start: '2025-01-01T00:00:00.000Z', end: null },
      })
    })

    expect(result.current.filtered.filteredCount).toBe(0)
    expect(result.current.filtered.maxDensity).toBe(1)
  })

  it('recomputes when filterState changes (viewport filter)', () => {
    const points = [
      makePoint(51.5, -0.1, 1_000_000), // inside bounds
      makePoint(40.0, -74.0, 2_000_000), // New York — outside bounds
    ]

    const { result } = renderHook(() => {
      const dataDispatch = useDataDispatch()
      const filterDispatch = useFilterDispatch()
      const filtered = useFilteredPoints()
      return { dataDispatch, filterDispatch, filtered }
    }, renderOptions)

    seedData(result.current.dataDispatch, points)

    // No filters yet — both points visible
    expect(result.current.filtered.filteredCount).toBe(2)

    // Enable viewport filter restricted to London area
    act(() => {
      result.current.filterDispatch({ type: 'SET_VIEWPORT_ENABLED', payload: true })
      result.current.filterDispatch({
        type: 'SET_VIEWPORT_BOUNDS',
        payload: { north: 52.0, south: 51.0, east: 0.5, west: -1.0 },
      })
    })

    // Only the London point should remain
    expect(result.current.filtered.filteredCount).toBe(1)
    expect(result.current.filtered.filteredPoints[0]).toEqual(points[0])
  })
})
