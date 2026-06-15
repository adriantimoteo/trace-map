import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act } from 'react'
import { render } from '../../test/utils'
import { useDataDispatch } from '../../contexts/DataContext'
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
  })

  it('does not call L.heatLayer when points is empty', () => {
    render(
      <>
        <DispatchCapture />
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
    expect(mockHeatLayer).toHaveBeenCalledWith([
      [51.5, -0.1, 1],
      [48.8, 2.3, 1],
    ])
    expect(mockAddTo).toHaveBeenCalledWith(mockMap)
  })

  it('does not call L.heatLayer when points is empty after RESET', () => {
    render(
      <>
        <DispatchCapture />
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
})
