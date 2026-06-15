import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { LocationPoint } from '../types'

// Mock leaflet before importing mapUtils
vi.mock('leaflet', () => {
  const latLngBounds = vi.fn((sw: [number, number], ne: [number, number]) => ({
    _southWest: { lat: sw[0], lng: sw[1] },
    _northEast: { lat: ne[0], lng: ne[1] },
    getSouthWest: () => ({ lat: sw[0], lng: sw[1] }),
    getNorthEast: () => ({ lat: ne[0], lng: ne[1] }),
  }))
  return { default: { latLngBounds } }
})

const makePoint = (lat: number, lng: number): LocationPoint => ({
  lat,
  lng,
  timestamp: 0,
  speed: null,
})

describe('computeBounds', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null for an empty array', async () => {
    const { computeBounds } = await import('./mapUtils')
    expect(computeBounds([])).toBeNull()
  })

  it('returns valid bounds for a single point', async () => {
    const { computeBounds } = await import('./mapUtils')
    const result = computeBounds([makePoint(51.5, -0.1)])
    expect(result).not.toBeNull()
    expect(result?.getSouthWest()).toEqual({ lat: 51.5, lng: -0.1 })
    expect(result?.getNorthEast()).toEqual({ lat: 51.5, lng: -0.1 })
  })

  it('returns correct min/max lat/lng for a known point set', async () => {
    const { computeBounds } = await import('./mapUtils')
    const points = [makePoint(10, 20), makePoint(30, -5), makePoint(-10, 50), makePoint(5, 10)]
    const result = computeBounds(points)
    expect(result).not.toBeNull()
    // SW = min lat, min lng; NE = max lat, max lng
    expect(result?.getSouthWest()).toEqual({ lat: -10, lng: -5 })
    expect(result?.getNorthEast()).toEqual({ lat: 30, lng: 50 })
  })
})
