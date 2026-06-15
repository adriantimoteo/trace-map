import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet.heat'
import { useDataState } from '../../contexts/DataContext'
import { useDisplayState } from '../../contexts/DisplayContext'
import { useFilteredPoints } from '../../hooks/useFilteredPoints'

interface HeatmapLayerProps {
  map: L.Map | null
}

export function HeatmapLayer({ map }: HeatmapLayerProps) {
  const { status } = useDataState()
  const { radius, intensity } = useDisplayState()
  const { filteredPoints, maxDensity, weightedPoints } = useFilteredPoints()
  const heatLayerRef = useRef<L.Layer | null>(null)

  useEffect(() => {
    if (map === null) return

    if (heatLayerRef.current !== null) {
      map.removeLayer(heatLayerRef.current)
      heatLayerRef.current = null
    }

    if (status === 'ready' && filteredPoints.length > 0) {
      // effectiveMax: maps intensity slider [0,1] to [maxDensity*1.0, maxDensity*0.1]
      // At intensity=1.0 → effectiveMax=maxDensity*0.1 (everything looks hot)
      // At intensity=0.0 → effectiveMax=maxDensity*1.0 (only the densest cluster is red)
      const effectiveMax = maxDensity * (1.0 - intensity * 0.9)

      let heatPoints: [number, number, number][]
      if (weightedPoints !== null) {
        // Log-scale density path: pre-computed log-weighted bins, pass directly
        heatPoints = weightedPoints
      } else {
        // Standard path: count points per 0.001° cell, then normalise each point's
        // intensity to [0, 1] relative to the densest cell. Using max:1 means the
        // densest visible area always renders at full colour regardless of zoom level —
        // avoiding the washed-out appearance that occurs when max is calibrated from
        // cell counts that span many pixels at high zoom.
        const cellCounts = new Map<string, number>()
        for (const p of filteredPoints) {
          const key = `${String(Math.floor(p.lat / 0.001))},${String(Math.floor(p.lng / 0.001))}`
          cellCounts.set(key, (cellCounts.get(key) ?? 0) + 1)
        }
        let localMax = 1
        for (const count of cellCounts.values()) {
          if (count > localMax) localMax = count
        }
        heatPoints = filteredPoints.map(({ lat, lng }) => {
          const key = `${String(Math.floor(lat / 0.001))},${String(Math.floor(lng / 0.001))}`
          return [lat, lng, (cellCounts.get(key) ?? 1) / localMax]
        })
      }

      const layer = L.heatLayer(heatPoints, { radius, max: effectiveMax })
      layer.addTo(map)
      heatLayerRef.current = layer
    }
  }, [map, filteredPoints, status, radius, intensity, maxDensity, weightedPoints])

  return null
}
