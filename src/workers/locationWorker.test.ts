import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  haversineApprox,
  parseTimestamp,
  parseDegreesPoint,
  dedup,
  strideSample,
  runPipeline,
} from './locationWorker'
import type { CancelToken } from './locationWorker'
import type { WorkerOutboundMessage } from '../types'

// ---------------------------------------------------------------------------
// haversineApprox
// ---------------------------------------------------------------------------

describe('haversineApprox', () => {
  it('returns ~0 for identical coordinates', () => {
    expect(haversineApprox(51.5, -0.1, 51.5, -0.1)).toBeCloseTo(0, 0)
  })

  it('returns ~10m for two points ~10m apart', () => {
    // 0.0001° latitude ≈ 11.1m
    const dist = haversineApprox(51.5, -0.1, 51.5001, -0.1)
    expect(dist).toBeGreaterThan(9)
    expect(dist).toBeLessThan(13)
  })

  it('returns ~50m for two points ~50m apart', () => {
    // 0.00045° latitude ≈ 50m
    const dist = haversineApprox(51.5, -0.1, 51.50045, -0.1)
    expect(dist).toBeGreaterThan(47)
    expect(dist).toBeLessThan(53)
  })

  it('returns ~100m for two points ~100m apart (within 5%)', () => {
    // 0.0009° latitude ≈ 100m
    const dist = haversineApprox(51.5, -0.1, 51.5009, -0.1)
    expect(dist).toBeGreaterThan(95)
    expect(dist).toBeLessThan(105)
  })

  it('returns ~1km for two points ~1km apart (within 5%)', () => {
    // 0.009° latitude ≈ 1000m
    const dist = haversineApprox(51.5, -0.1, 51.509, -0.1)
    expect(dist).toBeGreaterThan(950)
    expect(dist).toBeLessThan(1050)
  })

  it('accounts for longitude convergence at high latitudes', () => {
    // Longitude degrees are shorter at higher latitudes
    const distLow = haversineApprox(10.0, 0.0, 10.0, 0.01)
    const distHigh = haversineApprox(60.0, 0.0, 60.0, 0.01)
    expect(distLow).toBeGreaterThan(distHigh)
  })
})

// ---------------------------------------------------------------------------
// parseTimestamp
// ---------------------------------------------------------------------------

describe('parseTimestamp', () => {
  it('parses an ISO 8601 string in the timestamp field', () => {
    const ms = parseTimestamp({ timestamp: '2023-06-15T10:30:00.000Z' })
    expect(ms).toBe(Date.parse('2023-06-15T10:30:00.000Z'))
  })

  it('parses a Unix ms integer in the timestampMs field', () => {
    const ms = parseTimestamp({ timestampMs: 1686825000000 })
    expect(ms).toBe(1686825000000)
  })

  it('parses a Unix ms string in the timestampMs field', () => {
    const ms = parseTimestamp({ timestampMs: '1686825000000' })
    expect(ms).toBe(1686825000000)
  })

  it('prefers timestampMs over timestamp when both are present', () => {
    const ms = parseTimestamp({ timestampMs: 1686825000000, timestamp: '2023-06-15T10:30:00.000Z' })
    expect(ms).toBe(1686825000000)
  })

  it('throws when neither field is present', () => {
    expect(() => parseTimestamp({})).toThrow()
  })

  it('throws when timestamp is not a valid date string', () => {
    expect(() => parseTimestamp({ timestamp: 'not-a-date' })).toThrow()
  })
})

// ---------------------------------------------------------------------------
// parseDegreesPoint
// ---------------------------------------------------------------------------

describe('parseDegreesPoint', () => {
  it('parses a positive lat/lng degree string', () => {
    expect(parseDegreesPoint('14.5668195°, 121.0167644°')).toEqual({
      lat: 14.5668195,
      lng: 121.0167644,
    })
  })

  it('parses negative latitude coordinate', () => {
    expect(parseDegreesPoint('-33.8688197°, 151.2092955°')).toEqual({
      lat: -33.8688197,
      lng: 151.2092955,
    })
  })

  it('parses negative longitude coordinate', () => {
    expect(parseDegreesPoint('51.5074°, -0.1278°')).toEqual({ lat: 51.5074, lng: -0.1278 })
  })

  it('returns null for missing degree symbol', () => {
    expect(parseDegreesPoint('14.5668195, 121.0167644')).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(parseDegreesPoint('')).toBeNull()
  })

  it('returns null for non-numeric latitude', () => {
    expect(parseDegreesPoint('abc°, 121.0167644°')).toBeNull()
  })

  it('returns null for non-numeric longitude', () => {
    expect(parseDegreesPoint('14.5668195°, xyz°')).toBeNull()
  })

  it('returns null for a string with only one degree symbol', () => {
    // Only one °, so parts.length < 3 — no valid lng
    expect(parseDegreesPoint('14.5668195°')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// dedup (Stage 1)
// ---------------------------------------------------------------------------

describe('dedup', () => {
  const BASE_TIME = 1_686_825_000_000 // 2023-06-15T10:30:00Z

  it('keeps the first point with speed = null', () => {
    const result = dedup([{ lat: 51.5, lng: -0.1, timestamp: BASE_TIME }])
    expect(result).toHaveLength(1)
    expect(result[0].speed).toBeNull()
  })

  it('returns empty array for empty input', () => {
    expect(dedup([])).toHaveLength(0)
  })

  it('discards a stationary point (distance < 50m AND time < 60s)', () => {
    const pts = [
      { lat: 51.5, lng: -0.1, timestamp: BASE_TIME },
      // Only 0.0001° away ≈ 11m and only 30s later → should be discarded
      { lat: 51.50001, lng: -0.1, timestamp: BASE_TIME + 30_000 },
    ]
    const result = dedup(pts)
    expect(result).toHaveLength(1)
  })

  it('keeps a point that moved > 50m even within 60 seconds', () => {
    const pts = [
      { lat: 51.5, lng: -0.1, timestamp: BASE_TIME },
      // 0.001° away ≈ 111m, only 30s later → keep (distance > 50m)
      { lat: 51.501, lng: -0.1, timestamp: BASE_TIME + 30_000 },
    ]
    const result = dedup(pts)
    expect(result).toHaveLength(2)
  })

  it('keeps a point after > 60 seconds even if very close', () => {
    const pts = [
      { lat: 51.5, lng: -0.1, timestamp: BASE_TIME },
      // Only 1m away but 90s later → keep (time > 60s)
      { lat: 51.500009, lng: -0.1, timestamp: BASE_TIME + 90_000 },
    ]
    const result = dedup(pts)
    expect(result).toHaveLength(2)
  })

  it('computes speed = null for the first point', () => {
    const pts = [
      { lat: 51.5, lng: -0.1, timestamp: BASE_TIME },
      { lat: 51.51, lng: -0.1, timestamp: BASE_TIME + 120_000 },
    ]
    const result = dedup(pts)
    expect(result[0].speed).toBeNull()
  })

  it('computes speed = null after a gap > 30 minutes', () => {
    const pts = [
      { lat: 51.5, lng: -0.1, timestamp: BASE_TIME },
      // 31 minutes later → speed should be null
      { lat: 51.51, lng: -0.1, timestamp: BASE_TIME + 31 * 60_000 },
    ]
    const result = dedup(pts)
    expect(result).toHaveLength(2)
    expect(result[1].speed).toBeNull()
  })

  it('computes speed = null when previous point has accuracy > 200m', () => {
    const pts = [
      { lat: 51.5, lng: -0.1, timestamp: BASE_TIME, accuracy: 250 },
      { lat: 51.51, lng: -0.1, timestamp: BASE_TIME + 120_000, accuracy: 10 },
    ]
    const result = dedup(pts)
    expect(result[1].speed).toBeNull()
  })

  it('computes speed = null when current point has accuracy > 200m', () => {
    const pts = [
      { lat: 51.5, lng: -0.1, timestamp: BASE_TIME, accuracy: 10 },
      { lat: 51.51, lng: -0.1, timestamp: BASE_TIME + 120_000, accuracy: 250 },
    ]
    const result = dedup(pts)
    expect(result[1].speed).toBeNull()
  })

  it('computes correct speed in km/h for a known pair', () => {
    // Move 1000m in 60 seconds = ~60 km/h
    // 0.009° latitude ≈ 1000m
    const pts = [
      { lat: 51.5, lng: -0.1, timestamp: BASE_TIME },
      { lat: 51.509, lng: -0.1, timestamp: BASE_TIME + 60_000 },
    ]
    const result = dedup(pts)
    expect(result[1].speed).not.toBeNull()
    const speed = result[1].speed as number
    // ~60 km/h, within 5%
    expect(speed).toBeGreaterThan(57)
    expect(speed).toBeLessThan(63)
  })

  it('keeps all non-stationary points in sequence', () => {
    const pts = [
      { lat: 51.5, lng: -0.1, timestamp: BASE_TIME },
      { lat: 51.51, lng: -0.1, timestamp: BASE_TIME + 120_000 },
      { lat: 51.52, lng: -0.1, timestamp: BASE_TIME + 240_000 },
      { lat: 51.53, lng: -0.1, timestamp: BASE_TIME + 360_000 },
    ]
    const result = dedup(pts)
    expect(result).toHaveLength(4)
  })

  it('speed is null for exactly 30 minutes gap (threshold is > 30 min)', () => {
    // Exactly 30 minutes — should NOT trigger the gap → speed should be computed
    const pts = [
      { lat: 51.5, lng: -0.1, timestamp: BASE_TIME },
      { lat: 51.51, lng: -0.1, timestamp: BASE_TIME + 30 * 60_000 },
    ]
    const result = dedup(pts)
    expect(result[1].speed).not.toBeNull()
  })
})

// ---------------------------------------------------------------------------
// strideSample (Stage 2)
// ---------------------------------------------------------------------------

describe('strideSample', () => {
  it('returns the input unchanged when count <= 1,500,000', () => {
    const points = Array.from({ length: 1_000_000 }, (_, i) => ({
      lat: 51.5,
      lng: -0.1,
      timestamp: i,
      speed: null,
    }))
    const result = strideSample(points)
    expect(result).toBe(points) // same reference — no copy
    expect(result).toHaveLength(1_000_000)
  })

  it('produces ≤ 1,500,000 points from 2,000,000 input', () => {
    const points = Array.from({ length: 2_000_000 }, (_, i) => ({
      lat: 51.5,
      lng: -0.1,
      timestamp: i,
      speed: null,
    }))
    const result = strideSample(points)
    expect(result.length).toBeLessThanOrEqual(1_500_000)
  })

  it('does not sample when count is exactly 1,500,000', () => {
    const points = Array.from({ length: 1_500_000 }, (_, i) => ({
      lat: 51.5,
      lng: -0.1,
      timestamp: i,
      speed: null,
    }))
    const result = strideSample(points)
    expect(result).toBe(points)
    expect(result).toHaveLength(1_500_000)
  })

  it('samples when count is 1,500,001', () => {
    const points = Array.from({ length: 1_500_001 }, (_, i) => ({
      lat: 51.5,
      lng: -0.1,
      timestamp: i,
      speed: null,
    }))
    const result = strideSample(points)
    expect(result.length).toBeLessThanOrEqual(1_500_000)
  })

  it('keeps every N-th point starting at index 0', () => {
    // 3,000,000 points → N = ceil(3M / 1.5M) = 2 → keep every 2nd
    const points = Array.from({ length: 3_000_000 }, (_, i) => ({
      lat: 51.5,
      lng: -0.1,
      timestamp: i,
      speed: null,
    }))
    const result = strideSample(points)
    expect(result[0].timestamp).toBe(0)
    expect(result[1].timestamp).toBe(2)
    expect(result[2].timestamp).toBe(4)
  })
})

// ---------------------------------------------------------------------------
// runPipeline — integration tests against real JSON buffers
// These tests caught a bug where stack.length was checked as 1 instead of 2,
// causing every valid file to fail with "No locations array found in file".
// ---------------------------------------------------------------------------

function makeBuffer(json: string): ArrayBuffer {
  return new TextEncoder().encode(json).buffer
}

function collectMessages(
  buffer: ArrayBuffer,
  token: CancelToken,
  format: 'auto' | 'records' | 'semantic' = 'auto',
): WorkerOutboundMessage[] {
  const messages: WorkerOutboundMessage[] = []
  const postMessageSpy = vi.fn((msg: WorkerOutboundMessage) => {
    messages.push(msg)
  })
  vi.stubGlobal('self', { postMessage: postMessageSpy })
  runPipeline(format, buffer, { dedupDistance: 50, dedupTime: 60_000 }, token)
  return messages
}

describe('runPipeline', () => {
  beforeEach(() => {
    vi.stubGlobal('self', { postMessage: vi.fn() })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('emits COMPLETE with correct totalCount for a valid locations file', () => {
    const json = JSON.stringify({
      locations: [
        { timestamp: '2023-01-01T00:00:00.000Z', latitudeE7: 515000000, longitudeE7: -1000000 },
        { timestamp: '2023-01-01T00:05:00.000Z', latitudeE7: 516000000, longitudeE7: -1000000 },
        { timestamp: '2023-01-01T00:10:00.000Z', latitudeE7: 517000000, longitudeE7: -1000000 },
      ],
    })
    const token: CancelToken = { cancelled: false }
    const messages = collectMessages(makeBuffer(json), token)

    const complete = messages.find((m) => m.type === 'COMPLETE')
    expect(complete).toBeDefined()
    expect(complete?.type === 'COMPLETE' && complete.payload.totalCount).toBeGreaterThan(0)

    const error = messages.find((m) => m.type === 'ERROR')
    expect(error).toBeUndefined()
  })

  it('emits ERROR when the file has no locations array', () => {
    const json = JSON.stringify({ foo: 'bar' })
    const token: CancelToken = { cancelled: false }
    const messages = collectMessages(makeBuffer(json), token)

    const error = messages.find((m) => m.type === 'ERROR')
    expect(error).toBeDefined()
    expect(messages.find((m) => m.type === 'COMPLETE')).toBeUndefined()
  })

  it('emits ERROR for a file with neither locations nor semanticSegments', () => {
    const json = JSON.stringify({ foo: 'bar', unrelated: [1, 2, 3] })
    const token: CancelToken = { cancelled: false }
    const messages = collectMessages(makeBuffer(json), token)

    const error = messages.find((m) => m.type === 'ERROR')
    expect(error).toBeDefined()
    expect(messages.find((m) => m.type === 'COMPLETE')).toBeUndefined()
  })

  it('emits COMPLETE for a Timeline.json buffer with valid timelinePath points', () => {
    const json = JSON.stringify({
      semanticSegments: [
        {
          startTime: '2023-01-01T00:00:00.000Z',
          endTime: '2023-01-01T01:00:00.000Z',
          timelinePath: [
            { point: '51.5°, -0.1°', time: '2023-01-01T00:00:00.000Z' },
            { point: '51.51°, -0.1°', time: '2023-01-01T00:10:00.000Z' },
            { point: '51.52°, -0.1°', time: '2023-01-01T00:20:00.000Z' },
          ],
        },
      ],
    })
    const token: CancelToken = { cancelled: false }
    const messages = collectMessages(makeBuffer(json), token)

    expect(messages.find((m) => m.type === 'ERROR')).toBeUndefined()
    const complete = messages.find((m) => m.type === 'COMPLETE')
    expect(complete).toBeDefined()
    expect(complete?.type === 'COMPLETE' && complete.payload.totalCount).toBeGreaterThan(0)
  })

  it('emits BATCH with valid LocationPoint objects for a Timeline.json buffer', () => {
    const json = JSON.stringify({
      semanticSegments: [
        {
          timelinePath: [
            { point: '51.5°, -0.1°', time: '2023-06-01T00:00:00.000Z' },
            { point: '51.51°, -0.1°', time: '2023-06-01T00:10:00.000Z' },
          ],
        },
      ],
    })
    const token: CancelToken = { cancelled: false }
    const messages = collectMessages(makeBuffer(json), token)

    const batches = messages.filter((m) => m.type === 'BATCH')
    expect(batches.length).toBeGreaterThan(0)
    const pt = batches[0].payload.points[0]
    expect(pt).toHaveProperty('lat')
    expect(pt).toHaveProperty('lng')
    expect(pt).toHaveProperty('timestamp')
    expect(pt).toHaveProperty('speed')
    expect(pt.lat).toBeCloseTo(51.5, 3)
    expect(pt.lng).toBeCloseTo(-0.1, 3)
  })

  it('silently skips segments with only a visit (no timelinePath)', () => {
    const json = JSON.stringify({
      semanticSegments: [
        {
          visit: { topCandidate: { placeId: 'some-place' } },
        },
        {
          timelinePath: [{ point: '51.5°, -0.1°', time: '2023-06-01T00:00:00.000Z' }],
        },
      ],
    })
    const token: CancelToken = { cancelled: false }
    const messages = collectMessages(makeBuffer(json), token)

    expect(messages.find((m) => m.type === 'ERROR')).toBeUndefined()
    const complete = messages.find((m) => m.type === 'COMPLETE')
    expect(complete).toBeDefined()
    expect(complete?.type === 'COMPLETE' && complete.payload.totalCount).toBe(1)
  })

  it('Records.json regression: still emits COMPLETE correctly after Timeline.json support added', () => {
    const json = JSON.stringify({
      locations: [
        { timestamp: '2023-03-01T00:00:00.000Z', latitudeE7: 515000000, longitudeE7: -1000000 },
        { timestamp: '2023-03-01T00:10:00.000Z', latitudeE7: 520000000, longitudeE7: -1000000 },
        { timestamp: '2023-03-01T00:20:00.000Z', latitudeE7: 525000000, longitudeE7: -1000000 },
      ],
    })
    const token: CancelToken = { cancelled: false }
    const messages = collectMessages(makeBuffer(json), token)

    expect(messages.find((m) => m.type === 'ERROR')).toBeUndefined()
    const complete = messages.find((m) => m.type === 'COMPLETE')
    expect(complete).toBeDefined()
    expect(complete?.type === 'COMPLETE' && complete.payload.totalCount).toBeGreaterThan(0)
  })

  it('emits BATCH messages containing valid LocationPoint objects', () => {
    const json = JSON.stringify({
      locations: [
        { timestamp: '2023-06-01T00:00:00.000Z', latitudeE7: 515000000, longitudeE7: -1000000 },
        { timestamp: '2023-06-01T00:10:00.000Z', latitudeE7: 520000000, longitudeE7: -1000000 },
      ],
    })
    const token: CancelToken = { cancelled: false }
    const messages = collectMessages(makeBuffer(json), token)

    const batches = messages.filter((m) => m.type === 'BATCH')
    expect(batches.length).toBeGreaterThan(0)
    // firstBatch is defined because we asserted batches.length > 0 above

    const firstBatch = batches[0]
    expect(firstBatch.payload.points.length).toBeGreaterThan(0)
    const pt = firstBatch.payload.points[0]
    expect(pt).toHaveProperty('lat')
    expect(pt).toHaveProperty('lng')
    expect(pt).toHaveProperty('timestamp')
    expect(pt).toHaveProperty('speed')
  })

  describe('format routing', () => {
    it('format "records" on a Timeline.json buffer emits ERROR (no locations array)', () => {
      const json = JSON.stringify({
        semanticSegments: [
          {
            timelinePath: [
              { point: '51.5°, -0.1°', time: '2023-06-01T00:00:00.000Z' },
              { point: '51.51°, -0.1°', time: '2023-06-01T00:10:00.000Z' },
            ],
          },
        ],
      })
      const token: CancelToken = { cancelled: false }
      const messages = collectMessages(makeBuffer(json), token, 'records')

      const error = messages.find((m) => m.type === 'ERROR')
      expect(error).toBeDefined()
      expect(messages.find((m) => m.type === 'COMPLETE')).toBeUndefined()
    })

    it('format "semantic" on a Records.json buffer emits ERROR (no semanticSegments)', () => {
      const json = JSON.stringify({
        locations: [
          { timestamp: '2023-06-01T00:00:00.000Z', latitudeE7: 515000000, longitudeE7: -1000000 },
          { timestamp: '2023-06-01T00:10:00.000Z', latitudeE7: 520000000, longitudeE7: -1000000 },
        ],
      })
      const token: CancelToken = { cancelled: false }
      const messages = collectMessages(makeBuffer(json), token, 'semantic')

      const error = messages.find((m) => m.type === 'ERROR')
      expect(error).toBeDefined()
      expect(messages.find((m) => m.type === 'COMPLETE')).toBeUndefined()
    })

    it('format "semantic" on a Timeline.json buffer emits COMPLETE', () => {
      const json = JSON.stringify({
        semanticSegments: [
          {
            timelinePath: [
              { point: '51.5°, -0.1°', time: '2023-06-01T00:00:00.000Z' },
              { point: '51.51°, -0.1°', time: '2023-06-01T00:10:00.000Z' },
              { point: '51.52°, -0.1°', time: '2023-06-01T00:20:00.000Z' },
            ],
          },
        ],
      })
      const token: CancelToken = { cancelled: false }
      const messages = collectMessages(makeBuffer(json), token, 'semantic')

      expect(messages.find((m) => m.type === 'ERROR')).toBeUndefined()
      const complete = messages.find((m) => m.type === 'COMPLETE')
      expect(complete).toBeDefined()
      expect(complete?.type === 'COMPLETE' && complete.payload.totalCount).toBeGreaterThan(0)
    })

    it('format "records" on a Records.json buffer emits COMPLETE', () => {
      const json = JSON.stringify({
        locations: [
          { timestamp: '2023-06-01T00:00:00.000Z', latitudeE7: 515000000, longitudeE7: -1000000 },
          { timestamp: '2023-06-01T00:10:00.000Z', latitudeE7: 520000000, longitudeE7: -1000000 },
          { timestamp: '2023-06-01T00:20:00.000Z', latitudeE7: 525000000, longitudeE7: -1000000 },
        ],
      })
      const token: CancelToken = { cancelled: false }
      const messages = collectMessages(makeBuffer(json), token, 'records')

      expect(messages.find((m) => m.type === 'ERROR')).toBeUndefined()
      const complete = messages.find((m) => m.type === 'COMPLETE')
      expect(complete).toBeDefined()
      expect(complete?.type === 'COMPLETE' && complete.payload.totalCount).toBeGreaterThan(0)
    })

    it('format "auto" accepts both Records.json and Timeline.json', () => {
      const recordsJson = JSON.stringify({
        locations: [
          { timestamp: '2023-06-01T00:00:00.000Z', latitudeE7: 515000000, longitudeE7: -1000000 },
        ],
      })
      const timelineJson = JSON.stringify({
        semanticSegments: [
          {
            timelinePath: [{ point: '51.5°, -0.1°', time: '2023-06-01T00:00:00.000Z' }],
          },
        ],
      })

      const token1: CancelToken = { cancelled: false }
      const msgs1 = collectMessages(makeBuffer(recordsJson), token1, 'auto')
      expect(msgs1.find((m) => m.type === 'ERROR')).toBeUndefined()
      expect(msgs1.find((m) => m.type === 'COMPLETE')).toBeDefined()

      const token2: CancelToken = { cancelled: false }
      const msgs2 = collectMessages(makeBuffer(timelineJson), token2, 'auto')
      expect(msgs2.find((m) => m.type === 'ERROR')).toBeUndefined()
      expect(msgs2.find((m) => m.type === 'COMPLETE')).toBeDefined()
    })
  })
})
