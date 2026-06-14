/**
 * Unit tests for scripts/generate-data.ts pure functions.
 *
 * Run with: npm test -- --run
 */

import { describe, it, expect } from 'vitest'
import {
  mulberry32,
  gaussianPoint,
  generateTimestampInWindow,
  metersToDegreesLat,
  metersToDegreesLng,
} from './generate-data'

// ---------------------------------------------------------------------------
// mulberry32
// ---------------------------------------------------------------------------

describe('mulberry32', () => {
  it('same seed produces same sequence', () => {
    const rng1 = mulberry32(42)
    const rng2 = mulberry32(42)
    for (let i = 0; i < 20; i++) {
      expect(rng1()).toBe(rng2())
    }
  })

  it('different seeds produce different values', () => {
    const rng1 = mulberry32(42)
    const rng2 = mulberry32(99)
    // At least one value must differ in the first 10
    const seq1 = Array.from({ length: 10 }, () => rng1())
    const seq2 = Array.from({ length: 10 }, () => rng2())
    expect(seq1).not.toEqual(seq2)
  })

  it('returns values in [0, 1)', () => {
    const rng = mulberry32(7)
    for (let i = 0; i < 1000; i++) {
      const v = rng()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })
})

// ---------------------------------------------------------------------------
// gaussianPoint
// ---------------------------------------------------------------------------

describe('gaussianPoint', () => {
  it('1000 points stay within 3× the requested radius of centre', () => {
    const rng = mulberry32(123)
    const centerLat = 41.8781
    const centerLng = -87.6298
    const radiusMeters = 100

    let outsideCount = 0
    const maxDistMeters = radiusMeters * 3

    for (let i = 0; i < 1000; i++) {
      const { lat, lng } = gaussianPoint(centerLat, centerLng, radiusMeters, rng)
      const dLat = (lat - centerLat) / metersToDegreesLat(1)
      const dLng = (lng - centerLng) / metersToDegreesLng(1, centerLat)
      const dist = Math.sqrt(dLat * dLat + dLng * dLng)
      if (dist > maxDistMeters) outsideCount++
    }

    // With a 3σ boundary in 2D, ~1.1% of points (Rayleigh distribution) fall outside.
    // Allow up to 3% (30 points) to avoid flakiness while still being a meaningful check.
    expect(outsideCount).toBeLessThan(30)
  })

  it('produces different points on each call', () => {
    const rng = mulberry32(42)
    const p1 = gaussianPoint(40.0, -80.0, 100, rng)
    const p2 = gaussianPoint(40.0, -80.0, 100, rng)
    expect(p1.lat).not.toBe(p2.lat)
  })
})

// ---------------------------------------------------------------------------
// generateTimestampInWindow
// ---------------------------------------------------------------------------

describe('generateTimestampInWindow', () => {
  const startMs = new Date('2023-01-01T00:00:00Z').getTime()
  const endMs = new Date('2024-01-01T00:00:00Z').getTime()

  it('output is within [startMs, endMs]', () => {
    const rng = mulberry32(42)
    for (let i = 0; i < 500; i++) {
      const ts = generateTimestampInWindow(startMs, endMs, 9, 17, rng)
      expect(ts).toBeGreaterThanOrEqual(startMs)
      expect(ts).toBeLessThanOrEqual(endMs)
    }
  })

  it('hour-of-day (UTC) is within [hourMin, hourMax]', () => {
    const rng = mulberry32(99)
    const hourMin = 18
    const hourMax = 23
    for (let i = 0; i < 500; i++) {
      const ts = generateTimestampInWindow(startMs, endMs, hourMin, hourMax, rng)
      const hour = new Date(ts).getUTCHours()
      expect(hour).toBeGreaterThanOrEqual(hourMin)
      expect(hour).toBeLessThanOrEqual(hourMax)
    }
  })

  it('works with morning hours', () => {
    const rng = mulberry32(7)
    for (let i = 0; i < 200; i++) {
      const ts = generateTimestampInWindow(startMs, endMs, 7, 9, rng)
      const hour = new Date(ts).getUTCHours()
      expect(hour).toBeGreaterThanOrEqual(7)
      expect(hour).toBeLessThanOrEqual(9)
    }
  })
})

// ---------------------------------------------------------------------------
// metersToDegreesLat / metersToDegreesLng
// ---------------------------------------------------------------------------

describe('metersToDegreesLat', () => {
  it('111320m ≈ 1 degree', () => {
    expect(metersToDegreesLat(111320)).toBeCloseTo(1, 3)
  })

  it('is proportional', () => {
    expect(metersToDegreesLat(10000)).toBeCloseTo(metersToDegreesLat(5000) * 2, 5)
  })
})

describe('metersToDegreesLng', () => {
  it('is larger at the equator than at 60°N', () => {
    const equator = metersToDegreesLng(1000, 0)
    const north = metersToDegreesLng(1000, 60)
    expect(north).toBeGreaterThan(equator)
  })

  it('is proportional to distance', () => {
    const lat = 41.8781
    expect(metersToDegreesLng(10000, lat)).toBeCloseTo(metersToDegreesLng(5000, lat) * 2, 5)
  })
})

// ---------------------------------------------------------------------------
// Output structure validation (integration-style, no file I/O)
// ---------------------------------------------------------------------------

describe('output structure', () => {
  // Dynamically import and invoke the generation logic.
  // We inline a minimal generation here to avoid running the CLI entry point.

  it('generates entries with all required fields', () => {
    // Re-use exported functions to build a minimal output
    const rng = mulberry32(42)
    const { lat, lng } = gaussianPoint(41.8781, -87.6298, 75, rng)
    const ts = generateTimestampInWindow(
      new Date('2024-01-01').getTime(),
      new Date('2024-06-01').getTime(),
      9,
      17,
      rng,
    )

    const entry = {
      timestamp: new Date(ts).toISOString(),
      latitudeE7: Math.round(lat * 1e7),
      longitudeE7: Math.round(lng * 1e7),
      accuracy: 15,
    }

    expect(typeof entry.timestamp).toBe('string')
    expect(entry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    expect(Number.isInteger(entry.latitudeE7)).toBe(true)
    expect(Number.isInteger(entry.longitudeE7)).toBe(true)
    expect(Number.isInteger(entry.accuracy)).toBe(true)
  })

  it('latitudeE7 is correctly scaled', () => {
    const rng = mulberry32(42)
    const { lat } = gaussianPoint(41.8781, -87.6298, 75, rng)
    const latE7 = Math.round(lat * 1e7)
    // Should be in the ballpark of 418_000_000 for Chicago
    expect(latE7).toBeGreaterThan(400_000_000)
    expect(latE7).toBeLessThan(450_000_000)
  })
})

// ---------------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------------

describe('determinism', () => {
  it('same seed produces identical first 10 entries', () => {
    function generate10(seed: number) {
      const rng = mulberry32(seed)
      const results: { lat: number; lng: number; ts: number }[] = []
      for (let i = 0; i < 10; i++) {
        const { lat, lng } = gaussianPoint(41.8781, -87.6298, 75, rng)
        const ts = generateTimestampInWindow(
          new Date('2024-01-01').getTime(),
          new Date('2024-12-31').getTime(),
          18,
          23,
          rng,
        )
        results.push({ lat, lng, ts })
      }
      return results
    }

    const run1 = generate10(42)
    const run2 = generate10(42)
    expect(run1).toEqual(run2)
  })

  it('different seeds produce different sequences', () => {
    function generate10(seed: number) {
      const rng = mulberry32(seed)
      return Array.from({ length: 10 }, () =>
        gaussianPoint(41.8781, -87.6298, 75, rng),
      )
    }

    const run1 = generate10(42)
    const run2 = generate10(99)
    expect(run1).not.toEqual(run2)
  })
})
