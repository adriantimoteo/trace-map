import { render, screen } from '../../test/utils'
import { vi } from 'vitest'
import { AppLayout } from './AppLayout'

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
  TileLayer: () => <div data-testid="tile-layer" />,
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

describe('AppLayout', () => {
  it('renders the Header with app title', () => {
    render(<AppLayout />)
    expect(screen.getByText('TraceMap')).toBeInTheDocument()
  })

  it('renders the FilterPanel region', () => {
    render(<AppLayout />)
    expect(screen.getByText('Filters')).toBeInTheDocument()
  })

  it('renders the MapContainer region', () => {
    render(<AppLayout />)
    expect(screen.getByTestId('leaflet-map')).toBeInTheDocument()
  })
})
