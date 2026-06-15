import { useMemo } from 'react'
import { useDataState } from '../contexts/DataContext'
import { useFilterState } from '../contexts/FilterContext'
import { useDisplayState } from '../contexts/DisplayContext'
import { applyFilters, computeMaxDensity } from '../utils/filterPipeline'
import type { LocationPoint } from '../types'

export interface UseFilteredPointsResult {
  filteredPoints: LocationPoint[]
  filteredCount: number
  maxDensity: number
}

/**
 * Derives the filtered point set and max density from DataContext, FilterContext,
 * and DisplayContext.
 *
 * filteredPoints and maxDensity are memoised so they only recompute when the data,
 * filter state, or hotspotSmoothing setting changes.
 */
export function useFilteredPoints(): UseFilteredPointsResult {
  const { points } = useDataState()
  const filterState = useFilterState()
  const { hotspotSmoothing } = useDisplayState()

  const filteredPoints = useMemo(() => applyFilters(points, filterState), [points, filterState])

  const maxDensity = useMemo(
    () => computeMaxDensity(filteredPoints, hotspotSmoothing ? 0.95 : 1.0),
    [filteredPoints, hotspotSmoothing],
  )

  return {
    filteredPoints,
    filteredCount: filteredPoints.length,
    maxDensity,
  }
}
