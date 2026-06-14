import { MapContainer as LeafletMapContainer, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

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
    </LeafletMapContainer>
  )
}
