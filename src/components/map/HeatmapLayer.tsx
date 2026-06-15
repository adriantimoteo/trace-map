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
  const { filteredPoints, maxDensity } = useFilteredPoints()
  const heatLayerRef = useRef<L.Layer | null>(null)

  useEffect(() => {
    if (map === null) return

    // Remove existing layer whenever points or map change
    if (heatLayerRef.current !== null) {
      map.removeLayer(heatLayerRef.current)
      heatLayerRef.current = null
    }

    // Only add heatmap when data is ready and there are points
    if (status === 'ready' && filteredPoints.length > 0) {
      const heatPoints: [number, number, number][] = filteredPoints.map(({ lat, lng }) => [
        lat,
        lng,
        1,
      ])
      const layer = L.heatLayer(heatPoints, { max: maxDensity })
      layer.addTo(map)
      heatLayerRef.current = layer
    }
  }, [map, filteredPoints, maxDensity, status])

  return null
}
