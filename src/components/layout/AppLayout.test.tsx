import { render, screen } from '../../test/utils'
import { vi } from 'vitest'
import { AppLayout } from './AppLayout'

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="leaflet-map">{children}</div>
  ),
  TileLayer: () => <div data-testid="tile-layer" />,
  useMap: () => ({
    fitBounds: vi.fn(),
    removeLayer: vi.fn(),
    addLayer: vi.fn(),
  }),
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
    expect(screen.getByText('FilterPanel')).toBeInTheDocument()
  })

  it('renders the MapContainer region', () => {
    render(<AppLayout />)
    expect(screen.getByTestId('leaflet-map')).toBeInTheDocument()
  })
})
