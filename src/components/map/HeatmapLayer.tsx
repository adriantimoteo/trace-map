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
      // intensityFactor maps the intensity slider [0,1] to a max-value multiplier
      // [1.0, 0.1]. Leaflet.heat computes alpha = weight / max, so a smaller max
      // means less accumulated weight is needed to reach full colour (hotter).
      // At intensity=1.0 → factor=0.1 (everything looks hot)
      // At intensity=0.0 → factor=1.0 (only the densest cluster is red)
      //
      // Interpolated geometrically (10^-intensity), not linearly: since alpha is
      // proportional to 1/max, a linear ramp in max makes alpha grow hyperbolically
      // — barely changing at low intensity, then blowing up over the last bit of the
      // slider. A geometric ramp makes alpha grow at a constant relative rate per
      // unit of slider movement, which reads as smooth given perceived brightness is
      // itself roughly logarithmic (Weber–Fechner).
      const intensityFactor = 10 ** -intensity

      let heatPoints: [number, number, number][]
      let effectiveMax: number
      if (weightedPoints !== null) {
        // Log-scale density path: pre-computed log-weighted bins, pass directly.
        // maxDensity here is the 95th-percentile *weight* (same log1p scale as
        // weightedPoints), so scaling it by intensityFactor stays in the same units.
        heatPoints = weightedPoints
        effectiveMax = maxDensity * intensityFactor
      } else {
        // Standard path: count points per 0.001° cell, then normalise each point's
        // weight to [0, ~1] relative to maxDensity (the densest cell count, or the
        // hotspot-smoothing percentile ceiling when enabled — cells at/above it
        // saturate to full colour). Weights are on this [0,1]-ish scale, so
        // effectiveMax must stay on the same scale too: multiplying it by the raw
        // maxDensity (a cell count, often in the tens/hundreds) would crush alpha
        // toward zero and make the intensity slider barely perceptible.
        const cellCounts = new Map<string, number>()
        for (const p of filteredPoints) {
          const key = `${String(Math.floor(p.lat / 0.001))},${String(Math.floor(p.lng / 0.001))}`
          cellCounts.set(key, (cellCounts.get(key) ?? 0) + 1)
        }
        heatPoints = filteredPoints.map(({ lat, lng }) => {
          const key = `${String(Math.floor(lat / 0.001))},${String(Math.floor(lng / 0.001))}`
          return [lat, lng, (cellCounts.get(key) ?? 1) / maxDensity]
        })
        effectiveMax = intensityFactor
      }

      const layer = L.heatLayer(heatPoints, { radius, max: effectiveMax })
      layer.addTo(map)
      heatLayerRef.current = layer
    }
  }, [map, filteredPoints, status, radius, intensity, maxDensity, weightedPoints])

  return null
}
