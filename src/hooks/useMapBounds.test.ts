import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import React from 'react'
import { useMapBounds } from './useMapBounds'
import type { BoundsTrackableMap } from './useMapBounds'
import { useFilterState, useFilterDispatch } from '../contexts/FilterContext'
import { FilterProvider } from '../contexts/FilterContext'
import { UIProvider } from '../contexts/UIContext'
import { DataProvider } from '../contexts/DataContext'
import { DisplayProvider } from '../contexts/DisplayContext'
import { MapProvider } from '../contexts/MapContext'

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
        React.createElement(
          DisplayProvider,
          null,
          React.createElement(MapProvider, null, children),
        ),
      ),
    ),
  )
}

const renderOptions = { wrapper: AllProviders }

// ---------------------------------------------------------------------------
// Mock map factory
//
// Implements BoundsTrackableMap with spy references exposed for assertions.
// ---------------------------------------------------------------------------

type EventCallback = () => void

interface MockMap extends BoundsTrackableMap {
  /** Fire a registered event listener (test helper) */
  fire: (event: string) => void
  /** Spy references for assertions */
  onSpy: ReturnType<typeof vi.fn>
  offSpy: ReturnType<typeof vi.fn>
  getBoundsSpy: ReturnType<typeof vi.fn>
}

function makeMockMap(boundsOverride?: {
  north: number
  south: number
  east: number
  west: number
}): MockMap {
  const bounds = boundsOverride ?? { north: 52, south: 51, east: 0.5, west: -1 }
  // Use a Map for listeners to avoid indexed-object undefined-condition issues
  const listenerMap = new Map<string, EventCallback[]>()

  const onSpy = vi.fn((event: string, cb: EventCallback) => {
    const existing = listenerMap.get(event) ?? []
    listenerMap.set(event, [...existing, cb])
    return mockMap
  })

  const offSpy = vi.fn((event: string, cb: EventCallback) => {
    const existing = listenerMap.get(event) ?? []
    listenerMap.set(
      event,
      existing.filter((fn) => fn !== cb),
    )
    return mockMap
  })

  const getBoundsSpy = vi.fn(() => ({
    getNorth: () => bounds.north,
    getSouth: () => bounds.south,
    getEast: () => bounds.east,
    getWest: () => bounds.west,
  }))

  const mockMap: MockMap = {
    on: onSpy,
    off: offSpy,
    getBounds: getBoundsSpy,
    onSpy,
    offSpy,
    getBoundsSpy,
    fire: (event: string) => {
      const cbs = listenerMap.get(event) ?? []
      for (const cb of cbs) {
        cb()
      }
    },
  }

  return mockMap
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useMapBounds', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('attaches a moveend listener to the map on mount', () => {
    const map = makeMockMap()
    renderHook(() => {
      useMapBounds(map, false)
    }, renderOptions)
    expect(map.onSpy).toHaveBeenCalledWith('moveend', expect.any(Function))
  })

  it('removes the moveend listener on unmount', () => {
    const map = makeMockMap()
    const { unmount } = renderHook(() => {
      useMapBounds(map, false)
    }, renderOptions)
    unmount()
    expect(map.offSpy).toHaveBeenCalledWith('moveend', expect.any(Function))
  })

  it('dispatches SET_VIEWPORT_BOUNDS when enabled=true and moveend fires', () => {
    const expectedBounds = { north: 52, south: 51, east: 0.5, west: -1 }
    const map = makeMockMap(expectedBounds)

    const { result } = renderHook(() => {
      const dispatch = useFilterDispatch()
      useMapBounds(map, true)
      const state = useFilterState()
      return { dispatch, state }
    }, renderOptions)

    // Enable viewport so the reducer will store the dispatched bounds
    act(() => {
      result.current.dispatch({ type: 'SET_VIEWPORT_ENABLED', payload: true })
    })

    // Simulate map moveend event
    act(() => {
      map.fire('moveend')
    })

    expect(result.current.state.viewportBounds).toEqual(expectedBounds)
  })

  it('does not dispatch SET_VIEWPORT_BOUNDS when enabled=false and moveend fires', () => {
    const map = makeMockMap()

    const { result } = renderHook(() => {
      useMapBounds(map, false)
      const state = useFilterState()
      return { state }
    }, renderOptions)

    act(() => {
      map.fire('moveend')
    })

    // viewportBounds should remain null (hook is no-op when disabled)
    expect(result.current.state.viewportBounds).toBeNull()
  })

  it('does nothing when map is null — no listener attached and no throw', () => {
    expect(() => {
      const { unmount } = renderHook(() => {
        useMapBounds(null, true)
      }, renderOptions)
      unmount()
    }).not.toThrow()
  })

  it('re-attaches listener when map instance changes', () => {
    const map1 = makeMockMap()
    const map2 = makeMockMap()

    const { rerender } = renderHook(
      ({ map }: { map: MockMap }) => {
        useMapBounds(map, false)
      },
      { ...renderOptions, initialProps: { map: map1 } },
    )

    expect(map1.onSpy).toHaveBeenCalledWith('moveend', expect.any(Function))
    expect(map1.offSpy).not.toHaveBeenCalled()

    rerender({ map: map2 })

    // Old listener cleaned up, new one attached
    expect(map1.offSpy).toHaveBeenCalledWith('moveend', expect.any(Function))
    expect(map2.onSpy).toHaveBeenCalledWith('moveend', expect.any(Function))
  })
})
