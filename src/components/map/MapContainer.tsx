import { useEffect, useRef } from 'react'
import { MapContainer as LeafletMapContainer, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { HeatmapLayer } from './HeatmapLayer'
import { useDataState } from '../../contexts/DataContext'
import { computeBounds } from '../../utils/mapUtils'

/**
 * Inner component that has access to the Leaflet map instance via react-leaflet's useMap hook.
 * Handles auto-fitting the map to loaded points and renders the HeatmapLayer.
 */
function MapInner() {
  const map = useMap()
  const { status, points } = useDataState()
  const prevStatusRef = useRef<string>('')

  useEffect(() => {
    if (status === 'ready' && prevStatusRef.current !== 'ready') {
      const bounds = computeBounds(points)
      if (bounds !== null) {
        map.fitBounds(bounds)
      }
    }
    prevStatusRef.current = status
  }, [map, status, points])

  return <HeatmapLayer map={map} />
}

export function MapContainer() {
  return (
    <LeafletMapContainer
      center={[0, 0]}
      zoom={2}
      attributionControl={false}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
      />
      <MapInner />
    </LeafletMapContainer>
  )
}
