import { useMemo } from 'react'
import { useDataState } from '../contexts/DataContext'
import { useFilterState } from '../contexts/FilterContext'
import { useDisplayState } from '../contexts/DisplayContext'
import { applyFilters, computeMaxDensity, computeLogWeightedBins } from '../utils/filterPipeline'
import type { LocationPoint } from '../types'

export interface UseFilteredPointsResult {
  filteredPoints: LocationPoint[]
  filteredCount: number
  maxDensity: number
  weightedPoints: [number, number, number][] | null // non-null when logScaleDensity && hotspotSmoothing
}

/**
 * Derives the filtered point set and max density from DataContext, FilterContext,
 * and DisplayContext.
 *
 * filteredPoints and maxDensity are memoised so they only recompute when the data,
 * filter state, or display settings change.
 *
 * When both `logScaleDensity` and `hotspotSmoothing` are enabled, returns
 * `weightedPoints` — log-weighted heat tuples ready to pass directly to Leaflet.heat.
 * Otherwise `weightedPoints` is null and the existing raw-point path is used.
 */
export function useFilteredPoints(): UseFilteredPointsResult {
  const { points } = useDataState()
  const filterState = useFilterState()
  const { hotspotSmoothing, logScaleDensity } = useDisplayState()

  const filteredPoints = useMemo(() => applyFilters(points, filterState), [points, filterState])

  const { maxDensity, weightedPoints } = useMemo(() => {
    if (logScaleDensity && hotspotSmoothing) {
      const bins = computeLogWeightedBins(filteredPoints)
      const weights = bins.map(([_lat, _lng, w]) => w).sort((a, b) => a - b)
      const pIdx = Math.floor(weights.length * 0.95)
      const md = weights[Math.min(pIdx, weights.length - 1)] ?? 1
      return { maxDensity: md, weightedPoints: bins }
    }
    return {
      maxDensity: computeMaxDensity(filteredPoints, hotspotSmoothing ? 0.95 : 1.0),
      weightedPoints: null,
    }
  }, [filteredPoints, hotspotSmoothing, logScaleDensity])

  return {
    filteredPoints,
    filteredCount: filteredPoints.length,
    maxDensity,
    weightedPoints,
  }
}
