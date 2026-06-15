import { useEffect, useRef } from 'react'
import { MapContainer as LeafletMapContainer, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { HeatmapLayer } from './HeatmapLayer'
import { ViewportFilterOverlay } from './ViewportFilterOverlay'
import { ParseProgressOverlay } from './ParseProgressOverlay'
import { NoPointsOverlay } from './NoPointsOverlay'
import { useDataState } from '../../contexts/DataContext'
import { useFilterState } from '../../contexts/FilterContext'
import { useMapContext } from '../../contexts/MapContext'
import { useMapBounds } from '../../hooks/useMapBounds'
import { computeBounds } from '../../utils/mapUtils'

/**
 * Inner component that has access to the Leaflet map instance via react-leaflet's useMap hook.
 * Handles auto-fitting the map to loaded points, registers the map in MapContext,
 * attaches viewport-bounds tracking, and renders the HeatmapLayer.
 */
function MapInner() {
  const map = useMap()
  const { status, points } = useDataState()
  const { viewportEnabled } = useFilterState()
  const { setMap } = useMapContext()
  const prevStatusRef = useRef<string>('')

  // Register the Leaflet map instance in MapContext so other components can access it
  useEffect(() => {
    setMap(map)
    return () => {
      setMap(null)
    }
  }, [map, setMap])

  // Auto-fit to data on first load
  useEffect(() => {
    if (status === 'ready' && prevStatusRef.current !== 'ready') {
      const bounds = computeBounds(points)
      if (bounds !== null) {
        map.fitBounds(bounds)
      }
    }
    prevStatusRef.current = status
  }, [map, status, points])

  // Track map viewport bounds and dispatch to FilterContext when viewportEnabled
  useMapBounds(map, viewportEnabled)

  return <HeatmapLayer map={map} />
}

export function MapContainer() {
  const { viewportEnabled } = useFilterState()

  return (
    <div
      className={[
        'relative h-full w-full',
        viewportEnabled ? 'ring-2 ring-blue-500 ring-inset' : '',
      ]
        .join(' ')
        .trim()}
    >
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
      <ViewportFilterOverlay />
      <ParseProgressOverlay />
      <NoPointsOverlay />
    </div>
  )
}
