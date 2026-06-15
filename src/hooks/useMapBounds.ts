import { useEffect } from 'react'
import { useFilterDispatch } from '../contexts/FilterContext'

/** Minimal Leaflet map surface required by this hook. */
export interface BoundsTrackableMap {
  on(event: string, fn: () => void): this
  off(event: string, fn: () => void): this
  getBounds(): {
    getNorth(): number
    getSouth(): number
    getEast(): number
    getWest(): number
  }
}

/**
 * Attaches a Leaflet `moveend` listener to the map. When `enabled` is true and
 * `moveend` fires, dispatches SET_VIEWPORT_BOUNDS to FilterContext with the
 * current map bounds. The listener stays attached even when `enabled` is false
 * (avoids add/remove churn on toggle — it simply no-ops when disabled).
 */
export function useMapBounds(map: BoundsTrackableMap | null, enabled: boolean): void {
  const dispatch = useFilterDispatch()

  useEffect(() => {
    if (map === null) return

    const capturedMap = map

    function handleMoveEnd() {
      if (!enabled) return
      const bounds = capturedMap.getBounds()
      dispatch({
        type: 'SET_VIEWPORT_BOUNDS',
        payload: {
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
        },
      })
    }

    capturedMap.on('moveend', handleMoveEnd)
    return () => {
      capturedMap.off('moveend', handleMoveEnd)
    }
  }, [map, enabled, dispatch])
}
