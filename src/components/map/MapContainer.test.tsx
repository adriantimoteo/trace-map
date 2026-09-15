import { render, screen } from '../../test/utils'
import { vi } from 'vitest'
import { MapContainer } from './MapContainer'

// Stable mock map instance — must not be recreated on every render or MapContext
// will enter an infinite update loop (setMap triggers re-render → new mock → setMap…)
const mockMap = {
  fitBounds: vi.fn(),
  removeLayer: vi.fn(),
  addLayer: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  getBounds: vi.fn(() => ({
    getNorth: () => 52,
    getSouth: () => 51,
    getEast: () => 0.5,
    getWest: () => -1,
  })),
}

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="leaflet-map">{children}</div>
  ),
  TileLayer: ({ url, attribution }: { url: string; attribution: string }) => (
    <div data-testid="tile-layer" data-url={url} data-attribution={attribution} />
  ),
  useMap: () => mockMap,
}))

vi.mock('leaflet/dist/leaflet.css', () => ({}))

vi.mock('leaflet.heat', () => ({}))

vi.mock('leaflet', () => ({
  default: {
    heatLayer: vi.fn(() => ({ addTo: vi.fn() })),
    latLngBounds: vi.fn(() => ({})),
  },
}))

describe('MapContainer', () => {
  it('renders without error', () => {
    render(<MapContainer />)
    expect(screen.getByTestId('leaflet-map')).toBeInTheDocument()
  })

  it('renders the tile layer', () => {
    render(<MapContainer />)
    expect(screen.getByTestId('tile-layer')).toBeInTheDocument()
  })

  it('uses a tile source that renders labels in Latin script (Esri World Street Map)', () => {
    render(<MapContainer />)
    const tileLayer = screen.getByTestId('tile-layer')
    expect(tileLayer.dataset.url).toContain('server.arcgisonline.com')
    expect(tileLayer.dataset.attribution).toContain('Esri')
  })
})
