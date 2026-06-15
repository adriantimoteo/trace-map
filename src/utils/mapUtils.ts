import L from 'leaflet'
import type { LocationPoint } from '../types'

/**
 * Computes the bounding box of a set of points.
 * Returns null for an empty array, otherwise returns L.LatLngBounds
 * covering the min/max lat and lng across all points.
 */
export function computeBounds(points: LocationPoint[]): L.LatLngBounds | null {
  if (points.length === 0) return null

  let minLat = points[0].lat
  let maxLat = points[0].lat
  let minLng = points[0].lng
  let maxLng = points[0].lng

  for (let i = 1; i < points.length; i++) {
    const { lat, lng } = points[i]
    if (lat < minLat) minLat = lat
    if (lat > maxLat) maxLat = lat
    if (lng < minLng) minLng = lng
    if (lng > maxLng) maxLng = lng
  }

  return L.latLngBounds([minLat, minLng], [maxLat, maxLng])
}
