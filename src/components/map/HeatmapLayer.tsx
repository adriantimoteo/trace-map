import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet.heat'
import { useDataState } from '../../contexts/DataContext'
import { useFilteredPoints } from '../../hooks/useFilteredPoints'

interface HeatmapLayerProps {
  map: L.Map | null
}

export function HeatmapLayer({ map }: HeatmapLayerProps) {
  const { status } = useDataState()
  const { filteredPoints } = useFilteredPoints()
  const heatLayerRef = useRef<L.Layer | null>(null)

  useEffect(() => {
    if (map === null) return

    if (heatLayerRef.current !== null) {
      map.removeLayer(heatLayerRef.current)
      heatLayerRef.current = null
    }

    if (status === 'ready' && filteredPoints.length > 0) {
      // Count points per 0.001° cell, then normalise each point's intensity to
      // [0, 1] relative to the densest cell. Using max:1 means the densest visible
      // area always renders at full colour regardless of zoom level — avoiding the
      // washed-out appearance that occurs when max is calibrated from cell counts
      // that span many pixels at high zoom.
      const cellCounts = new Map<string, number>()
      for (const p of filteredPoints) {
        const key = `${String(Math.floor(p.lat / 0.001))},${String(Math.floor(p.lng / 0.001))}`
        cellCounts.set(key, (cellCounts.get(key) ?? 0) + 1)
      }
      let localMax = 1
      for (const count of cellCounts.values()) {
        if (count > localMax) localMax = count
      }
      const heatPoints: [number, number, number][] = filteredPoints.map(({ lat, lng }) => {
        const key = `${String(Math.floor(lat / 0.001))},${String(Math.floor(lng / 0.001))}`
        return [lat, lng, (cellCounts.get(key) ?? 1) / localMax]
      })
      const layer = L.heatLayer(heatPoints, { max: 1 })
      layer.addTo(map)
      heatLayerRef.current = layer
    }
  }, [map, filteredPoints, status])

  return null
}
