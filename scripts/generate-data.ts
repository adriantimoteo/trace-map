/**
 * Synthetic Google Takeout Records.json generator for TraceMap development.
 *
 * Usage:
 *   npx ts-node scripts/generate-data.ts [options]
 *   npm run generate-data -- [options]
 *
 * Options:
 *   --points <n>          Total number of location points to generate (default: 50000)
 *   --start <YYYY-MM-DD>  Start date (default: 2 years before today)
 *   --end <YYYY-MM-DD>    End date (default: today)
 *   --out <path>          Output file path (default: ./records-synthetic.json)
 *   --seed <n>            Random seed for reproducible output (default: 42)
 *   --home <lat,lng>      Centre of the home cluster (default: 41.8781,-87.6298)
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

// ---------------------------------------------------------------------------
// Pure utility functions (exported for unit tests)
// ---------------------------------------------------------------------------

/**
 * Mulberry32 seeded PRNG. Returns a function that produces uniform floats in [0, 1).
 */
export function mulberry32(seed: number): () => number {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Convert a distance in metres to degrees of latitude. */
export function metersToDegreesLat(meters: number): number {
  return meters / 111320
}

/** Convert a distance in metres to degrees of longitude at a given latitude. */
export function metersToDegreesLng(meters: number, lat: number): number {
  return meters / (111320 * Math.cos((lat * Math.PI) / 180))
}

/**
 * Generate a single lat/lng point sampled from a Gaussian distribution
 * centred on (centerLat, centerLng) with the given radius in metres (1σ).
 *
 * Uses the Box-Muller transform to produce normally distributed values.
 */
export function gaussianPoint(
  centerLat: number,
  centerLng: number,
  radiusMeters: number,
  rng: () => number,
): { lat: number; lng: number } {
  // Box-Muller transform
  const u1 = rng()
  const u2 = rng()
  const mag = Math.sqrt(-2 * Math.log(u1 + Number.EPSILON))
  const z0 = mag * Math.cos(2 * Math.PI * u2)
  const z1 = mag * Math.sin(2 * Math.PI * u2)

  const lat = centerLat + z0 * metersToDegreesLat(radiusMeters)
  const lng = centerLng + z1 * metersToDegreesLng(radiusMeters, centerLat)
  return { lat, lng }
}

/**
 * Generate a timestamp (milliseconds since epoch) that falls within [startMs, endMs]
 * and whose hour-of-day (UTC) is in [hourMin, hourMax].
 */
export function generateTimestampInWindow(
  startMs: number,
  endMs: number,
  hourMin: number,
  hourMax: number,
  rng: () => number,
): number {
  // Pick a random day within the range
  const dayMs = 24 * 60 * 60 * 1000
  const totalDays = Math.floor((endMs - startMs) / dayMs)
  // totalDays (not totalDays+1): max day index is totalDays-1 so adding hourMax still lands before endMs
  const dayOffset = Math.floor(rng() * totalDays) * dayMs

  // Pick a random hour within the window
  const hourRangeMs = (hourMax - hourMin) * 60 * 60 * 1000
  const hourOffset = Math.floor(rng() * hourRangeMs) + hourMin * 60 * 60 * 1000

  const ts = startMs + dayOffset + hourOffset
  // Clamp to range
  return Math.min(Math.max(ts, startMs), endMs)
}

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

interface LocationEntry {
  timestamp: string
  latitudeE7: number
  longitudeE7: number
  accuracy: number
  velocity?: number
}

interface ClusterDef {
  lat: number
  lng: number
  radiusMeters: number
  label: string
}

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

interface CliArgs {
  points: number
  start: Date
  end: Date
  out: string
  seed: number
  homeLat: number
  homeLng: number
}

function parseArgs(argv: string[]): CliArgs {
  const today = new Date()
  const twoYearsAgo = new Date(today)
  twoYearsAgo.setFullYear(today.getFullYear() - 2)

  const defaults: CliArgs = {
    points: 50000,
    start: twoYearsAgo,
    end: today,
    out: './records-synthetic.json',
    seed: 42,
    homeLat: 41.8781,
    homeLng: -87.6298,
  }

  const result = { ...defaults }

  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i]
    const value = argv[i + 1]

    switch (flag) {
      case '--points':
        result.points = parseInt(value, 10)
        i++
        break
      case '--start':
        result.start = new Date(value)
        i++
        break
      case '--end':
        result.end = new Date(value)
        i++
        break
      case '--out':
        result.out = value
        i++
        break
      case '--seed':
        result.seed = parseInt(value, 10)
        i++
        break
      case '--home': {
        const parts = value.split(',')
        result.homeLat = parseFloat(parts[0])
        result.homeLng = parseFloat(parts[1])
        i++
        break
      }
    }
  }

  return result
}

// ---------------------------------------------------------------------------
// Cluster generation helpers
// ---------------------------------------------------------------------------

/**
 * Place a cluster centre offset from home by `distanceMeters` in the given
 * bearing (degrees from north).
 */
function offsetLatLng(
  lat: number,
  lng: number,
  distanceMeters: number,
  bearingDeg: number,
): { lat: number; lng: number } {
  const bearing = (bearingDeg * Math.PI) / 180
  const newLat = lat + Math.cos(bearing) * metersToDegreesLat(distanceMeters)
  const newLng = lng + Math.sin(bearing) * metersToDegreesLng(distanceMeters, lat)
  return { lat: newLat, lng: newLng }
}

/** Build cluster definitions from the home coordinate using the seeded RNG. */
function buildClusters(
  homeLat: number,
  homeLng: number,
  rng: () => number,
): {
  home: ClusterDef
  work: ClusterDef
  spots: ClusterDef[]
} {
  const home: ClusterDef = {
    lat: homeLat,
    lng: homeLng,
    radiusMeters: 75,
    label: 'home',
  }

  // Work: 3–8 km from home in a random direction
  const workDist = 3000 + rng() * 5000
  const workBearing = rng() * 360
  const workPos = offsetLatLng(homeLat, homeLng, workDist, workBearing)
  const work: ClusterDef = {
    lat: workPos.lat,
    lng: workPos.lng,
    radiusMeters: 75,
    label: 'work',
  }

  // 3–5 recurring spots, each 1–5 km from home
  const numSpots = 3 + Math.floor(rng() * 3) // 3, 4, or 5
  const spots: ClusterDef[] = []
  for (let i = 0; i < numSpots; i++) {
    const dist = 1000 + rng() * 4000
    const bearing = rng() * 360
    const pos = offsetLatLng(homeLat, homeLng, dist, bearing)
    spots.push({
      lat: pos.lat,
      lng: pos.lng,
      radiusMeters: 60,
      label: `spot_${i}`,
    })
  }

  return { home, work, spots }
}

// ---------------------------------------------------------------------------
// Point generation per segment type
// ---------------------------------------------------------------------------

/** Generate a point in the home cluster. */
function generateHomePoint(
  cluster: ClusterDef,
  startMs: number,
  endMs: number,
  rng: () => number,
  isWeekend: boolean,
): LocationEntry {
  const pos = gaussianPoint(cluster.lat, cluster.lng, cluster.radiusMeters, rng)

  // Home: evening 18–23, or if weekend 10–23
  const hourMin = isWeekend ? 10 : 18
  const hourMax = 23
  const ts = generateTimestampInWindow(startMs, endMs, hourMin, hourMax, rng)

  return {
    timestamp: new Date(ts).toISOString(),
    latitudeE7: Math.round(pos.lat * 1e7),
    longitudeE7: Math.round(pos.lng * 1e7),
    accuracy: Math.floor(rng() * 20) + 5,
  }
}

/** Generate a point in the work cluster. */
function generateWorkPoint(
  cluster: ClusterDef,
  startMs: number,
  endMs: number,
  rng: () => number,
): LocationEntry {
  const pos = gaussianPoint(cluster.lat, cluster.lng, cluster.radiusMeters, rng)
  // Work: weekday 9–17
  const ts = generateTimestampInWindow(startMs, endMs, 9, 17, rng)

  return {
    timestamp: new Date(ts).toISOString(),
    latitudeE7: Math.round(pos.lat * 1e7),
    longitudeE7: Math.round(pos.lng * 1e7),
    accuracy: Math.floor(rng() * 25) + 5,
  }
}

/** Generate a point in a recurring spot cluster. */
function generateSpotPoint(
  cluster: ClusterDef,
  startMs: number,
  endMs: number,
  rng: () => number,
): LocationEntry {
  const pos = gaussianPoint(cluster.lat, cluster.lng, cluster.radiusMeters, rng)
  // Recurring spots: any time 8–22
  const ts = generateTimestampInWindow(startMs, endMs, 8, 22, rng)

  return {
    timestamp: new Date(ts).toISOString(),
    latitudeE7: Math.round(pos.lat * 1e7),
    longitudeE7: Math.round(pos.lng * 1e7),
    accuracy: Math.floor(rng() * 30) + 5,
  }
}

/**
 * Generate a transit point along the straight-line path from `from` to `to`.
 * The timestamp implies travel at 30–60 km/h between the two endpoints.
 */
function generateTransitPoint(
  from: ClusterDef,
  to: ClusterDef,
  startMs: number,
  endMs: number,
  rng: () => number,
): LocationEntry {
  // Random position along the corridor (0–1)
  const t = rng()

  // Interpolate position and add a small perpendicular jitter (~20 m)
  const baseLat = from.lat + t * (to.lat - from.lat)
  const baseLng = from.lng + t * (to.lng - from.lng)
  const jitterLat = (rng() - 0.5) * 2 * metersToDegreesLat(20)
  const jitterLng = (rng() - 0.5) * 2 * metersToDegreesLng(20, baseLat)

  const lat = baseLat + jitterLat
  const lng = baseLng + jitterLng

  // Transit: rush hours 7–9 and 17–19
  const morning = rng() < 0.5
  const hourMin = morning ? 7 : 17
  const hourMax = morning ? 9 : 19
  const ts = generateTimestampInWindow(startMs, endMs, hourMin, hourMax, rng)

  // Implied velocity: 30–60 km/h → 8–17 m/s
  const velocity = Math.floor(rng() * 9) + 8

  return {
    timestamp: new Date(ts).toISOString(),
    latitudeE7: Math.round(lat * 1e7),
    longitudeE7: Math.round(lng * 1e7),
    accuracy: Math.floor(rng() * 15) + 10,
    velocity,
  }
}

// ---------------------------------------------------------------------------
// Main generation function
// ---------------------------------------------------------------------------

function generateLocations(args: CliArgs): LocationEntry[] {
  const rng = mulberry32(args.seed)
  const startMs = args.start.getTime()
  const endMs = args.end.getTime()
  const n = args.points

  const { home, work, spots } = buildClusters(args.homeLat, args.homeLng, rng)

  // Distribution: home 40%, work 30%, spots 15%, transit 15%
  const nHome = Math.round(n * 0.4)
  const nWork = Math.round(n * 0.3)
  const nSpots = Math.round(n * 0.15)
  const nTransit = n - nHome - nWork - nSpots

  const locations: LocationEntry[] = []

  // Home points
  for (let i = 0; i < nHome; i++) {
    const isWeekend = rng() < 0.4
    locations.push(generateHomePoint(home, startMs, endMs, rng, isWeekend))
  }

  // Work points
  for (let i = 0; i < nWork; i++) {
    locations.push(generateWorkPoint(work, startMs, endMs, rng))
  }

  // Recurring spot points — distribute across all spots
  for (let i = 0; i < nSpots; i++) {
    const spotIdx = Math.floor(rng() * spots.length)
    locations.push(generateSpotPoint(spots[spotIdx], startMs, endMs, rng))
  }

  // Transit points — corridors: home↔work plus home↔each spot
  const corridors: [ClusterDef, ClusterDef][] = [
    [home, work],
    ...spots.map((s): [ClusterDef, ClusterDef] => [home, s]),
  ]
  for (let i = 0; i < nTransit; i++) {
    const corridor = corridors[Math.floor(rng() * corridors.length)]
    locations.push(generateTransitPoint(corridor[0], corridor[1], startMs, endMs, rng))
  }

  // Sort by timestamp ascending (realistic output ordering)
  locations.sort((a, b) => a.timestamp.localeCompare(b.timestamp))

  return locations
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

function main() {
  const args = parseArgs(process.argv.slice(2))

  console.log(`Generating ${args.points.toLocaleString()} synthetic location points...`)
  console.log(`  Home: ${args.homeLat}, ${args.homeLng}`)
  console.log(`  Range: ${args.start.toISOString().slice(0, 10)} → ${args.end.toISOString().slice(0, 10)}`)
  console.log(`  Seed: ${args.seed}`)

  const t0 = Date.now()
  const locations = generateLocations(args)
  const elapsed = ((Date.now() - t0) / 1000).toFixed(2)

  const output = { locations }
  const outPath = path.resolve(args.out)
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf-8')

  console.log(`Done. ${locations.length.toLocaleString()} points written to ${outPath} in ${elapsed}s`)
}

// ESM-safe entry point guard: runs main() only when this file is the direct entry point.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
}
