import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act } from 'react'
import { render } from '../../test/utils'
import { useDataDispatch } from '../../contexts/DataContext'
import { useDisplayDispatch } from '../../contexts/DisplayContext'
import { useRef, useEffect } from 'react'
import type { LocationPoint } from '../../types'

// ---------------------------------------------------------------------------
// Mock leaflet.heat (side-effect import — attaches L.heatLayer)
// ---------------------------------------------------------------------------
vi.mock('leaflet.heat', () => ({}))

// ---------------------------------------------------------------------------
// Mock leaflet
// ---------------------------------------------------------------------------
const mockAddTo = vi.fn()
const mockRemoveLayer = vi.fn()
const mockHeatLayer = vi.fn(() => ({ addTo: mockAddTo }))

vi.mock('leaflet', () => ({
  default: {
    heatLayer: mockHeatLayer,
  },
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const makePoint = (lat: number, lng: number): LocationPoint => ({
  lat,
  lng,
  timestamp: Date.now(),
  speed: null,
})

// A mock map object to pass as the `map` prop
const mockMap = {
  removeLayer: mockRemoveLayer,
  addLayer: vi.fn(),
} as unknown as import('leaflet').Map

// ---------------------------------------------------------------------------
// Dispatch capture — same pattern as DataContext.test.tsx
// ---------------------------------------------------------------------------
type DataDispatch = ReturnType<typeof useDataDispatch>
const dispatchRef = { current: null as DataDispatch | null }

function getDispatch(): DataDispatch {
  if (dispatchRef.current === null) throw new Error('DispatchCapture has not rendered')
  return dispatchRef.current
}

function DispatchCapture() {
  const dispatch = useDataDispatch()
  const stableRef = useRef(dispatch)
  useEffect(() => {
    stableRef.current = dispatch
    dispatchRef.current = dispatch
  })
  dispatchRef.current = dispatch
  return null
}

// ---------------------------------------------------------------------------
// DisplayDispatch capture — for seeding radius/intensity
// ---------------------------------------------------------------------------
type DisplayDispatch = ReturnType<typeof useDisplayDispatch>
const displayDispatchRef = { current: null as DisplayDispatch | null }

function getDisplayDispatch(): DisplayDispatch {
  if (displayDispatchRef.current === null)
    throw new Error('DisplayDispatchCapture has not rendered')
  return displayDispatchRef.current
}

function DisplayDispatchCapture() {
  const dispatch = useDisplayDispatch()
  displayDispatchRef.current = dispatch
  return null
}

// ---------------------------------------------------------------------------
// Import component under test — after mocks are set up
// ---------------------------------------------------------------------------
const { HeatmapLayer } = await import('./HeatmapLayer')

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('HeatmapLayer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    dispatchRef.current = null
    displayDispatchRef.current = null
  })

  it('does not call L.heatLayer when points is empty', () => {
    render(
      <>
        <DispatchCapture />
        <DisplayDispatchCapture />
        <HeatmapLayer map={mockMap} />
      </>,
    )
    // Default state: status=idle, points=[]
    expect(mockHeatLayer).not.toHaveBeenCalled()
  })

  it('does not call L.heatLayer when status is idle even with points', () => {
    render(
      <>
        <DispatchCapture />
        <DisplayDispatchCapture />
        <HeatmapLayer map={mockMap} />
      </>,
    )

    act(() => {
      getDispatch()({
        type: 'APPEND_BATCH',
        payload: [makePoint(51.5, -0.1), makePoint(48.8, 2.3)],
      })
    })

    // Status is still idle after APPEND_BATCH — no heatmap yet
    expect(mockHeatLayer).not.toHaveBeenCalled()
  })

  it('calls L.heatLayer with [lat, lng, 1] tuples when status becomes ready', () => {
    render(
      <>
        <DispatchCapture />
        <DisplayDispatchCapture />
        <HeatmapLayer map={mockMap} />
      </>,
    )

    act(() => {
      getDispatch()({
        type: 'APPEND_BATCH',
        payload: [makePoint(51.5, -0.1), makePoint(48.8, 2.3)],
      })
    })

    act(() => {
      getDispatch()({
        type: 'SET_COMPLETE',
        payload: {
          totalCount: 2,
          minDate: '2024-01-01T00:00:00.000Z',
          maxDate: '2024-12-31T23:59:59.000Z',
        },
      })
    })

    expect(mockHeatLayer).toHaveBeenCalledOnce()
    // Two points in separate grid cells → maxDensity = 1
    // Default intensity = 0.5 → effectiveMax = 1 * (1.0 - 0.5 * 0.9) = 0.55
    // Default radius = 20
    expect(mockHeatLayer).toHaveBeenCalledWith(
      [
        [51.5, -0.1, 1],
        [48.8, 2.3, 1],
      ],
      { radius: 20, max: 0.55 },
    )
    expect(mockAddTo).toHaveBeenCalledWith(mockMap)
  })

  it('does not call L.heatLayer when points is empty after RESET', () => {
    render(
      <>
        <DispatchCapture />
        <DisplayDispatchCapture />
        <HeatmapLayer map={mockMap} />
      </>,
    )

    // Load data and go ready
    act(() => {
      getDispatch()({
        type: 'APPEND_BATCH',
        payload: [makePoint(51.5, -0.1)],
      })
    })
    act(() => {
      getDispatch()({
        type: 'SET_COMPLETE',
        payload: {
          totalCount: 1,
          minDate: '2024-01-01T00:00:00.000Z',
          maxDate: '2024-12-31T23:59:59.000Z',
        },
      })
    })

    expect(mockHeatLayer).toHaveBeenCalledOnce()
    vi.clearAllMocks()

    // Now reset — points becomes empty, status returns to idle
    act(() => {
      getDispatch()({ type: 'RESET' })
    })

    // After reset, L.heatLayer must NOT be called again
    expect(mockHeatLayer).not.toHaveBeenCalled()
    // The old layer should have been removed
    expect(mockRemoveLayer).toHaveBeenCalled()
  })

  // ---------------------------------------------------------------------------
  // effectiveMax formula tests
  // ---------------------------------------------------------------------------

  it('effectiveMax: intensity=1.0 + maxDensity=100 → effectiveMax=10', () => {
    render(
      <>
        <DispatchCapture />
        <DisplayDispatchCapture />
        <HeatmapLayer map={mockMap} />
      </>,
    )

    // Seed 100 points in the same cell so maxDensity = 100
    const points: LocationPoint[] = Array.from({ length: 100 }, () => makePoint(51.5, -0.1))

    act(() => {
      getDispatch()({ type: 'APPEND_BATCH', payload: points })
    })

    // Set intensity to 1.0 before going ready
    act(() => {
      getDisplayDispatch()({ type: 'SET_INTENSITY', payload: 1.0 })
    })

    act(() => {
      getDispatch()({
        type: 'SET_COMPLETE',
        payload: {
          totalCount: 100,
          minDate: '2024-01-01T00:00:00.000Z',
          maxDate: '2024-12-31T23:59:59.000Z',
        },
      })
    })

    expect(mockHeatLayer).toHaveBeenCalledOnce()
    const callArgs = mockHeatLayer.mock.calls[0] as [
      [number, number, number][],
      { radius: number; max: number },
    ]
    // effectiveMax = 100 * (1.0 - 1.0 * 0.9) = 100 * 0.1 = 10
    expect(callArgs[1].max).toBeCloseTo(10, 10)
  })

  it('effectiveMax: intensity=0.0 + maxDensity=100 → effectiveMax=100', () => {
    render(
      <>
        <DispatchCapture />
        <DisplayDispatchCapture />
        <HeatmapLayer map={mockMap} />
      </>,
    )

    // Seed 100 points in the same cell so maxDensity = 100
    const points: LocationPoint[] = Array.from({ length: 100 }, () => makePoint(51.5, -0.1))

    act(() => {
      getDispatch()({ type: 'APPEND_BATCH', payload: points })
    })

    // Set intensity to 0.0
    act(() => {
      getDisplayDispatch()({ type: 'SET_INTENSITY', payload: 0.0 })
    })

    act(() => {
      getDispatch()({
        type: 'SET_COMPLETE',
        payload: {
          totalCount: 100,
          minDate: '2024-01-01T00:00:00.000Z',
          maxDate: '2024-12-31T23:59:59.000Z',
        },
      })
    })

    expect(mockHeatLayer).toHaveBeenCalledOnce()
    const callArgs = mockHeatLayer.mock.calls[0] as [
      [number, number, number][],
      { radius: number; max: number },
    ]
    // effectiveMax = 100 * (1.0 - 0.0 * 0.9) = 100 * 1.0 = 100
    expect(callArgs[1].max).toBe(100)
  })

  it('effectiveMax: intensity=0.5 + maxDensity=100 → effectiveMax=55', () => {
    render(
      <>
        <DispatchCapture />
        <DisplayDispatchCapture />
        <HeatmapLayer map={mockMap} />
      </>,
    )

    // Seed 100 points in the same cell so maxDensity = 100
    const points: LocationPoint[] = Array.from({ length: 100 }, () => makePoint(51.5, -0.1))

    act(() => {
      getDispatch()({ type: 'APPEND_BATCH', payload: points })
    })

    // Default intensity is 0.5 — no need to set it explicitly

    act(() => {
      getDispatch()({
        type: 'SET_COMPLETE',
        payload: {
          totalCount: 100,
          minDate: '2024-01-01T00:00:00.000Z',
          maxDate: '2024-12-31T23:59:59.000Z',
        },
      })
    })

    expect(mockHeatLayer).toHaveBeenCalledOnce()
    const callArgs = mockHeatLayer.mock.calls[0] as [
      [number, number, number][],
      { radius: number; max: number },
    ]
    // effectiveMax = 100 * (1.0 - 0.5 * 0.9) = 100 * 0.55 = 55
    expect(callArgs[1].max).toBeCloseTo(55, 10)
  })

  it('radius option updates when SET_RADIUS is dispatched via DisplayContext', () => {
    render(
      <>
        <DispatchCapture />
        <DisplayDispatchCapture />
        <HeatmapLayer map={mockMap} />
      </>,
    )

    act(() => {
      getDispatch()({
        type: 'APPEND_BATCH',
        payload: [makePoint(51.5, -0.1)],
      })
    })

    // Set custom radius before going ready
    act(() => {
      getDisplayDispatch()({ type: 'SET_RADIUS', payload: 40 })
    })

    act(() => {
      getDispatch()({
        type: 'SET_COMPLETE',
        payload: {
          totalCount: 1,
          minDate: '2024-01-01T00:00:00.000Z',
          maxDate: '2024-12-31T23:59:59.000Z',
        },
      })
    })

    expect(mockHeatLayer).toHaveBeenCalledOnce()
    const callArgs = mockHeatLayer.mock.calls[0] as [
      [number, number, number][],
      { radius: number; max: number },
    ]
    expect(callArgs[1].radius).toBe(40)
  })
})
