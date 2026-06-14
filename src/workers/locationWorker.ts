// Web Worker: handles WorkerInboundMessage events
import { JSONParser } from '@streamparser/json'
import type { LocationPoint, WorkerInboundMessage, WorkerOutboundMessage } from '../types/index'

// ---------------------------------------------------------------------------
// Helper: equirectangular distance approximation (metres)
// ---------------------------------------------------------------------------

export function haversineApprox(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000
  const toRad = Math.PI / 180
  const dLat = (lat2 - lat1) * toRad
  const dLng = (lng2 - lng1) * toRad
  const x = dLng * Math.cos(((lat1 + lat2) / 2) * toRad)
  return Math.sqrt(dLat * dLat + x * x) * R
}

// ---------------------------------------------------------------------------
// Helper: parse a raw location object's timestamp → Unix ms
// ---------------------------------------------------------------------------

interface RawLocationObject {
  timestamp?: string
  timestampMs?: number | string
  latitudeE7?: number
  longitudeE7?: number
  accuracy?: number
  [key: string]: unknown
}

export function parseTimestamp(point: RawLocationObject): number {
  if (point.timestampMs !== undefined) {
    const ms = Number(point.timestampMs)
    if (!isNaN(ms)) return ms
  }
  if (point.timestamp !== undefined && typeof point.timestamp === 'string') {
    const ms = Date.parse(point.timestamp)
    if (!isNaN(ms)) return ms
  }
  throw new Error('No valid timestamp field found on location point')
}

// ---------------------------------------------------------------------------
// Stage 1: spatial-temporal deduplication
// ---------------------------------------------------------------------------

const DEDUP_TIME_MS = 60_000 // 60 seconds
const DEDUP_DIST_M = 50 // 50 metres
const SPEED_GAP_THRESHOLD_MS = 30 * 60_000 // 30 minutes
const ACCURACY_SPEED_THRESHOLD = 200 // metres

export interface DedupPoint {
  lat: number
  lng: number
  timestamp: number
  accuracy?: number
}

export function dedup(points: DedupPoint[]): LocationPoint[] {
  const result: LocationPoint[] = []
  let prevKept: DedupPoint | null = null
  // Tracks the timestamp of the last kept point; always set when prevKept !== null.
  let prevKeptTimestamp = 0

  for (const pt of points) {
    if (prevKept === null) {
      // First point is always kept, speed is null
      result.push({
        lat: pt.lat,
        lng: pt.lng,
        timestamp: pt.timestamp,
        speed: null,
      })
      prevKept = pt
      prevKeptTimestamp = pt.timestamp
      continue
    }

    const timeDeltaMs = pt.timestamp - prevKeptTimestamp
    const dist = haversineApprox(prevKept.lat, prevKept.lng, pt.lat, pt.lng)

    // Discard stationary drift: time < 60s AND dist < 50m
    if (timeDeltaMs < DEDUP_TIME_MS && dist < DEDUP_DIST_M) {
      continue
    }

    // Compute speed
    let speed: number | null
    if (
      timeDeltaMs > SPEED_GAP_THRESHOLD_MS ||
      (pt.accuracy !== undefined && pt.accuracy > ACCURACY_SPEED_THRESHOLD) ||
      (prevKept.accuracy !== undefined && prevKept.accuracy > ACCURACY_SPEED_THRESHOLD)
    ) {
      speed = null
    } else {
      // km/h: (metres / ms) * 3_600_000 / 1000
      speed = (dist / timeDeltaMs) * 3_600
    }

    result.push({
      lat: pt.lat,
      lng: pt.lng,
      timestamp: pt.timestamp,
      speed,
    })

    prevKept = pt
    prevKeptTimestamp = pt.timestamp
  }

  return result
}

// ---------------------------------------------------------------------------
// Stage 2: stride sampling
// ---------------------------------------------------------------------------

const STAGE2_THRESHOLD = 1_500_000

export function strideSample(points: LocationPoint[]): LocationPoint[] {
  if (points.length <= STAGE2_THRESHOLD) return points
  const n = Math.ceil(points.length / STAGE2_THRESHOLD)
  return points.filter((_, i) => i % n === 0)
}

// ---------------------------------------------------------------------------
// Main pipeline
// ---------------------------------------------------------------------------

// Cancellation is threaded via a { cancelled: boolean } object reference so
// the type-checker cannot reduce the guard reads to constants.
export interface CancelToken {
  cancelled: boolean
}

export function runPipeline(
  _format: 'auto' | 'records',
  buffer: ArrayBuffer,
  _options: { dedupDistance: number; dedupTime: number },
  token: CancelToken,
): void {
  // Both 'auto' and 'records' route to the Records.json parser in v1.
  // Additional branches (e.g. Semantic History in v3+) will be added here.

  const emit = (msg: WorkerOutboundMessage) => {
    ;(self as unknown as Worker).postMessage(msg)
  }

  const CHUNK_SIZE = 1024 * 1024 // 1 MB
  const PROGRESS_INTERVAL = 5_000
  const BATCH_INTERVAL = 5_000

  const parser = new JSONParser({ paths: ['$.locations.*'], keepStack: false })

  const stage1Input: DedupPoint[] = []
  let totalParsed = 0
  let rawLocationsFound = 0
  let parseError: string | null = null

  parser.onValue = ({ value, key: _key, stack }) => {
    if (token.cancelled) return

    // Track raw items received from the locations path filter.
    // With paths: ['$.locations.*'], onValue fires only for array elements,
    // so stack.length === 1 means we are at the element level.
    if (stack.length === 1) rawLocationsFound++

    // We only care about individual location objects (depth 2: root.locations[i])
    // stack.length === 1 means we are at the array element level
    if (stack.length !== 1 || typeof value !== 'object' || value === null) {
      return
    }

    const raw = value as RawLocationObject

    let ts: number
    try {
      ts = parseTimestamp(raw)
    } catch {
      return // skip malformed points
    }

    const lat =
      typeof raw.latitudeE7 === 'number' ? raw.latitudeE7 / 1e7 : (raw.latitudeE7 as number) / 1e7
    const lng =
      typeof raw.longitudeE7 === 'number'
        ? raw.longitudeE7 / 1e7
        : (raw.longitudeE7 as number) / 1e7

    if (isNaN(lat) || isNaN(lng)) return

    const accuracy = typeof raw.accuracy === 'number' ? raw.accuracy : undefined

    stage1Input.push({ lat, lng, timestamp: ts, accuracy })
    totalParsed++

    if (totalParsed % PROGRESS_INTERVAL === 0) {
      emit({
        type: 'PROGRESS',
        payload: {
          stage: 'parsing',
          percent: 0, // total point count not known upfront from the stream
          pointsProcessed: totalParsed,
        },
      })
    }
  }

  parser.onError = (err: Error) => {
    parseError = err.message
  }

  // Stream the buffer in 1 MB chunks
  const bytes = new Uint8Array(buffer)
  const totalBytes = bytes.byteLength

  for (let offset = 0; offset < totalBytes; offset += CHUNK_SIZE) {
    if (token.cancelled) return
    const chunk = bytes.subarray(offset, offset + CHUNK_SIZE)
    try {
      parser.write(chunk)
    } catch (err) {
      emit({
        type: 'ERROR',
        payload: { message: err instanceof Error ? err.message : String(err) },
      })
      return
    }
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (parseError !== null) {
      emit({ type: 'ERROR', payload: { message: parseError } })
      return
    }
  }

  try {
    parser.end()
  } catch (err) {
    emit({
      type: 'ERROR',
      payload: { message: err instanceof Error ? err.message : String(err) },
    })
    return
  }

  if (token.cancelled) return

  if (rawLocationsFound === 0) {
    emit({ type: 'ERROR', payload: { message: 'No locations array found in file' } })
    return
  }

  // Stage 1: deduplication
  emit({
    type: 'PROGRESS',
    payload: { stage: 'deduplicating', percent: 50, pointsProcessed: totalParsed },
  })

  const stage1Output = dedup(stage1Input)
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (token.cancelled) return

  // Stage 2: stride sampling (only if over threshold)
  let finalPoints: LocationPoint[]

  if (stage1Output.length > STAGE2_THRESHOLD) {
    emit({
      type: 'PROGRESS',
      payload: { stage: 'sampling', percent: 75, pointsProcessed: stage1Output.length },
    })
    const sampled = strideSample(stage1Output)
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (token.cancelled) return
    emit({ type: 'STAGE2_APPLIED', payload: { sampledCount: sampled.length } })
    finalPoints = sampled
  } else {
    finalPoints = stage1Output
  }

  // Emit batches
  for (let i = 0; i < finalPoints.length; i += BATCH_INTERVAL) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (token.cancelled) return
    emit({ type: 'BATCH', payload: { points: finalPoints.slice(i, i + BATCH_INTERVAL) } })
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (token.cancelled) return

  // Compute minDate / maxDate
  let minMs = Infinity
  let maxMs = -Infinity
  for (const pt of finalPoints) {
    if (pt.timestamp < minMs) minMs = pt.timestamp
    if (pt.timestamp > maxMs) maxMs = pt.timestamp
  }

  const minDate = finalPoints.length > 0 ? new Date(minMs).toISOString() : new Date(0).toISOString()
  const maxDate = finalPoints.length > 0 ? new Date(maxMs).toISOString() : new Date(0).toISOString()

  emit({
    type: 'COMPLETE',
    payload: { totalCount: finalPoints.length, minDate, maxDate },
  })
}

// ---------------------------------------------------------------------------
// Worker message handler
// ---------------------------------------------------------------------------

const workerCancelToken: CancelToken = { cancelled: false }

self.onmessage = (event: MessageEvent<WorkerInboundMessage>) => {
  const msg = event.data

  if (msg.type === 'CANCEL') {
    workerCancelToken.cancelled = true
    return
  }

  // msg.type === 'LOAD_FILE' (only remaining union member)
  workerCancelToken.cancelled = false
  const { buffer, format, dedupDistance, dedupTime } = msg.payload
  try {
    runPipeline(format, buffer, { dedupDistance, dedupTime }, workerCancelToken)
  } catch (err) {
    ;(self as unknown as Worker).postMessage({
      type: 'ERROR',
      payload: { message: err instanceof Error ? err.message : String(err) },
    } satisfies WorkerOutboundMessage)
  }
}
