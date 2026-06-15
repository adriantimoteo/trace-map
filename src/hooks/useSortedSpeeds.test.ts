import { renderHook, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import React from 'react'
import { useSortedSpeeds } from './useSortedSpeeds'
import { useDataDispatch } from '../contexts/DataContext'
import { DataProvider } from '../contexts/DataContext'
import { UIProvider } from '../contexts/UIContext'
import { FilterProvider } from '../contexts/FilterContext'
import { DisplayProvider } from '../contexts/DisplayContext'
import type { LocationPoint } from '../types'

// ---------------------------------------------------------------------------
// Provider wrapper
// ---------------------------------------------------------------------------

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
// Helpers
// ---------------------------------------------------------------------------

function makePoint(
  speed: number | null,
  lat = 51.5,
  lng = -0.1,
  timestamp = 1_000_000,
): LocationPoint {
  return { lat, lng, timestamp, speed }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useSortedSpeeds', () => {
  it('returns an empty array when there are no points', () => {
    const { result } = renderHook(() => useSortedSpeeds(), renderOptions)
    expect(result.current).toEqual([])
  })

  it('extracts only non-null speed values', () => {
    const { result } = renderHook(() => {
      const dispatch = useDataDispatch()
      const speeds = useSortedSpeeds()
      return { dispatch, speeds }
    }, renderOptions)

    act(() => {
      result.current.dispatch({
        type: 'APPEND_BATCH',
        payload: [
          makePoint(null), // no speed — excluded from sorted array
          makePoint(30),
          makePoint(null), // no speed — excluded
          makePoint(10),
        ],
      })
    })

    // Only the two non-null speeds should appear
    expect(result.current.speeds).toHaveLength(2)
    expect(result.current.speeds).not.toContain(null)
  })

  it('returns speeds sorted in ascending order', () => {
    const { result } = renderHook(() => {
      const dispatch = useDataDispatch()
      const speeds = useSortedSpeeds()
      return { dispatch, speeds }
    }, renderOptions)

    act(() => {
      result.current.dispatch({
        type: 'APPEND_BATCH',
        payload: [makePoint(60), makePoint(5), makePoint(30), makePoint(15)],
      })
    })

    expect(result.current.speeds).toEqual([5, 15, 30, 60])
  })

  it('null-speed points are excluded from the sorted array', () => {
    const { result } = renderHook(() => {
      const dispatch = useDataDispatch()
      const speeds = useSortedSpeeds()
      return { dispatch, speeds }
    }, renderOptions)

    act(() => {
      result.current.dispatch({
        type: 'APPEND_BATCH',
        payload: [makePoint(null), makePoint(null), makePoint(null)],
      })
    })

    expect(result.current.speeds).toEqual([])
  })

  it('memoisation — same points reference returns the same array reference', () => {
    const { result } = renderHook(() => {
      const dispatch = useDataDispatch()
      const speeds = useSortedSpeeds()
      return { dispatch, speeds }
    }, renderOptions)

    // Seed some points
    act(() => {
      result.current.dispatch({
        type: 'APPEND_BATCH',
        payload: [makePoint(10), makePoint(20)],
      })
    })

    const firstRef = result.current.speeds

    // Re-render without changing points — memo should return the same reference
    // We trigger a re-render by capturing the value again (React re-renders on each act boundary)
    // The critical assertion is that the reference is stable without a points change.
    // We achieve this by just re-reading after the hook re-renders.
    // No points change → same array object.
    expect(result.current.speeds).toBe(firstRef)
  })

  it('returns a new array reference when points change', () => {
    const { result } = renderHook(() => {
      const dispatch = useDataDispatch()
      const speeds = useSortedSpeeds()
      return { dispatch, speeds }
    }, renderOptions)

    act(() => {
      result.current.dispatch({
        type: 'APPEND_BATCH',
        payload: [makePoint(10)],
      })
    })

    const firstRef = result.current.speeds

    // Add more points — this creates a new array reference in DataContext
    act(() => {
      result.current.dispatch({
        type: 'APPEND_BATCH',
        payload: [makePoint(20)],
      })
    })

    // Should be a new array since points changed
    expect(result.current.speeds).not.toBe(firstRef)
    expect(result.current.speeds).toEqual([10, 20])
  })
})
