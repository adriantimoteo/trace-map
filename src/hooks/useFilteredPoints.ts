import { useMemo } from 'react'
import { useDataState } from '../contexts/DataContext'
import { useFilterState } from '../contexts/FilterContext'
import { applyFilters, computeMaxDensity } from '../utils/filterPipeline'
import type { LocationPoint } from '../types'

export interface UseFilteredPointsResult {
  filteredPoints: LocationPoint[]
  filteredCount: number
  maxDensity: number
}

/**
 * Derives the filtered point set and max density from DataContext and FilterContext.
 *
 * Both filteredPoints and maxDensity are memoised on [dataState.points, filterState]
 * so they only recompute when the data or filter state changes.
 */
export function useFilteredPoints(): UseFilteredPointsResult {
  const { points } = useDataState()
  const filterState = useFilterState()

  const filteredPoints = useMemo(() => applyFilters(points, filterState), [points, filterState])

  const maxDensity = useMemo(() => computeMaxDensity(filteredPoints), [filteredPoints])

  return {
    filteredPoints,
    filteredCount: filteredPoints.length,
    maxDensity,
  }
}
