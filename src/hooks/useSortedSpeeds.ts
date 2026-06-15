import { useMemo } from 'react'
import { useDataState } from '../contexts/DataContext'

/**
 * Extracts non-null speed values from DataContext.points, sorts them ascending,
 * and memoises the result on the points array reference.
 *
 * Used by the velocity threshold slider to compute live exclusion counts via binary search
 * without re-running the full filter pipeline on every drag frame.
 */
export function useSortedSpeeds(): number[] {
  const { points } = useDataState()

  return useMemo(() => {
    const speeds: number[] = []
    for (const point of points) {
      if (point.speed !== null) {
        speeds.push(point.speed)
      }
    }
    speeds.sort((a, b) => a - b)
    return speeds
  }, [points])
}
